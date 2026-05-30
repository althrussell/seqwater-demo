"""API routes for the Seqwater AI Command Centre."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

from backend import __version__
from backend.agents import aquaiq
from backend.config import get_settings
from backend.models import (
    BriefingRequest,
    BriefingResponse,
    ChatRequest,
    ChatResponse,
    DamLevel,
    FloodStorage,
    GenieEmbedResponse,
    HealthResponse,
    OverviewResponse,
    ScenarioRunRequest,
    ScenarioRunResult,
    WarmResponse,
)
from backend.services import briefing as briefing_svc
from backend.services import repository
from backend.services import scenario as scenario_svc

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health() -> dict[str, Any]:
    s = get_settings()
    return {
        "status": "ok",
        "mode": s.app_mode,
        "synthetic_demo": True,
        "catalog": s.databricks_catalog,
        "schema": s.databricks_schema,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": __version__,
    }


@router.get("/overview", response_model=OverviewResponse)
def overview() -> dict[str, Any]:
    return repository.overview()


@router.get("/assets")
def list_assets() -> list[dict[str, Any]]:
    return repository.list_assets()


@router.get("/assets/{asset_id}")
def get_asset(asset_id: str) -> dict[str, Any]:
    asset = repository.get_asset(asset_id)
    if asset is None:
        raise HTTPException(status_code=404, detail=f"Asset {asset_id} not found")
    return asset


@router.get("/asset-risk")
def asset_risk() -> list[dict[str, Any]]:
    return repository.list_asset_risk()


@router.get("/work-orders")
def work_orders(limit: int = Query(default=200, le=500)) -> list[dict[str, Any]]:
    return repository.list_work_orders(limit=limit)


@router.get("/water-security")
def water_security() -> dict[str, Any]:
    return repository.water_security_summary()


@router.get("/dams/levels", response_model=list[DamLevel])
def dam_levels_current() -> list[dict[str, Any]]:
    """Live Seqwater dam-levels snapshot for all 25 published storages."""
    return repository.dam_levels_current()


@router.get("/dams/snapshot")
def dam_levels_snapshot() -> dict[str, Any]:
    """Aggregated grid-storage snapshot (total %, spilling count, low dams)."""
    snap = repository.grid_storage_snapshot()
    if snap is None:
        raise HTTPException(status_code=404, detail="No dam-levels snapshot available")
    return snap


@router.get("/flood/storage", response_model=list[FloodStorage])
def flood_storage_current() -> list[dict[str, Any]]:
    """Dedicated flood-storage compartment snapshot for Somerset + Wivenhoe."""
    return repository.flood_storage_current()


@router.get("/water-quality")
def water_quality() -> dict[str, Any]:
    return repository.water_quality_summary()


@router.get("/flood-scenarios")
def list_scenarios() -> list[dict[str, Any]]:
    return repository.list_flood_scenarios()


@router.get("/flood-scenarios/{scenario_id}")
def scenario_detail(scenario_id: str) -> dict[str, Any]:
    detail = repository.get_flood_scenario_detail(scenario_id)
    if detail is None:
        raise HTTPException(status_code=404, detail=f"Scenario {scenario_id} not found")
    return detail


@router.post("/flood-scenarios/run", response_model=ScenarioRunResult)
def run_scenario(req: ScenarioRunRequest) -> dict[str, Any]:
    return scenario_svc.run_scenario(**req.model_dump())


@router.get("/capital-projects")
def capital_projects() -> list[dict[str, Any]]:
    return repository.list_capital_projects()


@router.post("/ai/chat")
async def ai_chat(req: ChatRequest) -> StreamingResponse:
    """Stream the AquaIQ answer as NDJSON over a single POST.

    Each line is one JSON event:

    * ``{"event": "delta", "text": ...}``
    * ``{"event": "tool_call", "name": ..., "args": {...}}``
    * ``{"event": "tool_result", "name": ..., "summary": ...}``
    * ``{"event": "sources", "items": [...]}``
    * ``{"event": "done", ...}`` (full :class:`ChatResponse` payload)

    Clients that prefer the legacy non-streaming shape can drain the stream
    and pluck the terminal ``done`` event — its payload matches
    :class:`ChatResponse` field-for-field, including the new ``markdown``
    field.
    """

    async def gen():
        async for event in aquaiq.stream_answer(
            req.question,
            history=[m.model_dump() for m in req.history],
            selected_asset_id=req.selected_asset_id,
        ):
            yield json.dumps(event, default=str) + "\n"

    return StreamingResponse(
        gen(),
        media_type="application/x-ndjson",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/ai/chat/sync", response_model=ChatResponse)
def ai_chat_sync(req: ChatRequest) -> dict[str, Any]:
    """Backwards-compatible non-streaming endpoint.

    Drains :func:`aquaiq.stream_answer` into a single :class:`ChatResponse`.
    """
    return aquaiq.answer(
        req.question,
        history=[m.model_dump() for m in req.history],
        selected_asset_id=req.selected_asset_id,
    )


@router.get("/agent/warm", response_model=WarmResponse)
async def agent_warm() -> dict[str, Any]:
    """Pre-warm the Supervisor endpoint to mitigate cold-start latency.

    Returns immediately with a small status payload. Safe to call repeatedly;
    the underlying serving endpoint owns its own warm pool.
    """
    settings = get_settings()
    if not settings.supervisor_configured:
        return {
            "warm": True,
            "latency_ms": 0,
            "supervisor_configured": False,
            "reason": "local_mode_no_supervisor",
        }
    from backend.services.agent_bricks import prewarm_supervisor

    result = await prewarm_supervisor()
    return {
        "warm": bool(result.get("warm")),
        "latency_ms": int(result.get("latency_ms", 0)),
        "supervisor_configured": True,
        "reason": result.get("reason"),
        "status_code": result.get("status_code"),
    }


@router.get("/genie/embed", response_model=GenieEmbedResponse)
def genie_embed() -> dict[str, Any]:
    """Return the iframe URL for embedding the Seqwater Genie Space.

    The frontend embeds a Genie Space directly per the Databricks docs:
    https://docs.databricks.com/aws/en/genie/embed

    Pre-conditions (handled in Databricks, not here):

    1. Workspace admin enabled the *Embed Genie as an iframe* preview.
    2. Workspace admin added the App's deployed origin to the allowed
       embedding surfaces list.
    3. End users have ``CAN_RUN`` on the Genie Space and ``SELECT`` on the
       underlying tables (granted by ``scripts/grant_app_permissions.py``).

    Configuration:

    * ``DATABRICKS_GENIE_EMBED_URL`` (preferred) — paste the URL generated
      by Share → Embed space.
    * Fallback — constructed as ``{host}/embed/genie/{space_id}`` from
      ``DATABRICKS_HOST`` + ``DATABRICKS_GENIE_SPACE_ID``.
    """
    s = get_settings()
    embed = s.genie_embed_url_resolved
    if not embed:
        return {
            "configured": False,
            "embed_url": None,
            "space_id": s.databricks_genie_space_id,
            "workspace_host": s.databricks_host,
            "reason": (
                "Set DATABRICKS_GENIE_EMBED_URL (paste from Share → Embed "
                "space) or both DATABRICKS_HOST and DATABRICKS_GENIE_SPACE_ID."
            ),
        }
    return {
        "configured": True,
        "embed_url": embed,
        "space_id": s.databricks_genie_space_id,
        "workspace_host": s.databricks_host,
    }


@router.post("/ai/briefing", response_model=BriefingResponse)
def ai_briefing(req: BriefingRequest) -> dict[str, Any]:
    return briefing_svc.generate_board_briefing(
        audience=req.audience,
        include_sections=req.include_sections,
        scenario_id=req.scenario_id,
    )


@router.get("/governance/audit")
def governance_audit() -> list[dict[str, Any]]:
    return repository.list_audit()


@router.get("/governance/tiles")
def governance_tiles() -> list[dict[str, Any]]:
    return [
        {
            "title": "Governed data",
            "summary": "Unity Catalog is the single source of truth for Seqwater data.",
            "detail": [
                "Three-level namespace `main.seqwater_demo.*`",
                "Tables: assets, dam_storage_daily, water_quality_samples, asset_risk_scores, flood_scenarios",
                "Lineage and data quality tracked in catalog views",
            ],
            "icon": "database",
            "accent": "blue",
        },
        {
            "title": "Governed AI",
            "summary": "AquaIQ orchestrates three Agent Bricks primitives end-to-end.",
            "detail": [
                "Supervisor (seqwater_supervisor) routes to a Knowledge Assistant + Genie + 3 UC functions",
                "Streaming markdown answers, tool-call tracing, and live source citations",
                "Every interaction is logged to ai_interaction_audit and MLflow",
            ],
            "icon": "sparkles",
            "accent": "violet",
        },
        {
            "title": "Governed actions",
            "summary": "Every recommendation requires named human validation before action.",
            "detail": [
                "AquaIQ refuses operational authorisation requests",
                "Briefings include explicit assumptions and review owners",
                "Workflow stubs trigger downstream tasks safely",
            ],
            "icon": "shield-check",
            "accent": "emerald",
        },
        {
            "title": "Governed access",
            "summary": "Unity Catalog grants and Databricks Apps OAuth control who sees what.",
            "detail": [
                "Role-based access at catalog, schema, table, and column level",
                "User-on-behalf-of authentication for Databricks Apps",
                "Audit log retained for every AquaIQ interaction",
            ],
            "icon": "key",
            "accent": "amber",
        },
        {
            "title": "Governed cost",
            "summary": "Serverless SQL + Foundation Model API gives a clean cost line per workflow.",
            "detail": [
                "Serverless DBSQL Warehouse for analytics queries",
                "Pay-per-token Foundation Model API",
                "Audit log doubles as a usage trail",
            ],
            "icon": "trending-down",
            "accent": "rose",
        },
    ]
