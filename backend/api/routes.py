"""API routes for the Seqwater AI Command Centre."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from backend import __version__
from backend.agents import aquaiq
from backend.config import get_settings
from backend.models import (
    BriefingRequest,
    BriefingResponse,
    ChatRequest,
    ChatResponse,
    HealthResponse,
    OverviewResponse,
    ScenarioRunRequest,
    ScenarioRunResult,
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
        raise HTTPException(status_code=404, detail=f"Synthetic asset {asset_id} not found")
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
        raise HTTPException(status_code=404, detail=f"Synthetic scenario {scenario_id} not found")
    return detail


@router.post("/flood-scenarios/run", response_model=ScenarioRunResult)
def run_scenario(req: ScenarioRunRequest) -> dict[str, Any]:
    return scenario_svc.run_scenario(**req.model_dump())


@router.get("/capital-projects")
def capital_projects() -> list[dict[str, Any]]:
    return repository.list_capital_projects()


@router.post("/ai/chat", response_model=ChatResponse)
def ai_chat(req: ChatRequest) -> dict[str, Any]:
    return aquaiq.answer(
        req.question,
        history=[m.model_dump() for m in req.history],
        selected_asset_id=req.selected_asset_id,
    )


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
            "summary": "Unity Catalog is the single source of truth for synthetic Seqwater data.",
            "detail": [
                "Three-level namespace `main.seqwater_demo.*`",
                "Synthetic tables: assets, dam_storage_daily, water_quality_samples, asset_risk_scores, flood_scenarios",
                "Lineage and data quality tracked in catalog views",
            ],
            "icon": "database",
            "accent": "blue",
        },
        {
            "title": "Governed AI",
            "summary": "AquaIQ runs on Databricks Foundation Model API with traceable tool calls.",
            "detail": [
                "Endpoint abstraction lets you swap Llama, Claude, or DBRX without code changes",
                "Every interaction is traced (MLflow-compatible)",
                "Document retrieval is Volume + Vector Search-ready",
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
                "Synthetic workflow stubs trigger downstream tasks safely",
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
