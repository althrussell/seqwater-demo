"""Smoke tests for the Seqwater AI Command Centre backend.

These tests run against ``LocalDataLoader`` and the FastAPI ``TestClient``,
so they require only the CSVs to exist.
"""
from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from backend.main import app


@pytest.fixture(scope="session")
def client() -> TestClient:
    return TestClient(app)


def test_health_returns_ok(client: TestClient) -> None:
    res = client.get("/api/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["synthetic_demo"] is True


def test_overview_has_required_fields(client: TestClient) -> None:
    res = client.get("/api/overview")
    assert res.status_code == 200
    body = res.json()
    for key in (
        "headline_status",
        "seventy_two_hour_risk",
        "storage_percent",
        "ai_executive_summary",
        "top_actions",
        "kpis",
        "trends",
    ):
        assert key in body
    assert len(body["kpis"]) >= 4


def test_assets_endpoint(client: TestClient) -> None:
    res = client.get("/api/assets")
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 18  # the demo brief asks for at least 18 assets
    assert all("synthetic_demo_flag" in a for a in items)


def test_asset_risk_sorted_descending(client: TestClient) -> None:
    res = client.get("/api/asset-risk")
    items = res.json()
    scores = [r["risk_score"] for r in items]
    assert scores == sorted(scores, reverse=True)


def test_flood_scenarios_includes_severe_coastal(client: TestClient) -> None:
    res = client.get("/api/flood-scenarios")
    names = [s["scenario_name"] for s in res.json()]
    assert any("Severe Coastal Rainfall" in n for n in names)


def test_run_flood_scenario(client: TestClient) -> None:
    res = client.post(
        "/api/flood-scenarios/run",
        json={
            "scenario_name": "Test scenario",
            "rainfall_forecast_mm_24h": 90,
            "rainfall_forecast_mm_72h": 280,
            "catchment_saturation_index": 0.8,
            "current_storage_percent": 78.0,
            "treatment_demand_ml_day": 1280,
            "downstream_sensitivity": 0.6,
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["risk_classification"] in {"Routine", "Watch", "Respond", "Coordinate"}
    assert body["human_validation_required"] is True
    assert len(body["storage_trajectory"]) >= 5


def test_aquaiq_chat_returns_governed_structure(client: TestClient) -> None:
    res = client.post(
        "/api/ai/chat/sync",
        json={"question": "What are the top 5 operational risks over the next 72 hours?"},
    )
    assert res.status_code == 200
    body = res.json()
    for key in (
        "trace_id",
        "summary",
        "key_signals",
        "recommended_next_actions",
        "risks_assumptions",
        "sources_used",
        "human_validation_required",
        "confidence",
        "tools_used",
        "markdown",
    ):
        assert key in body
    assert body["human_validation_required"] is True
    assert body["confidence"] in {"Low", "Medium", "High"}
    assert isinstance(body["markdown"], str) and body["markdown"].strip()


def test_aquaiq_refuses_operational_authorisation(client: TestClient) -> None:
    res = client.post(
        "/api/ai/chat/sync",
        json={"question": "Open the spillway at Wivenhoe Dam"},
    )
    body = res.json()
    assert body["confidence"] == "Low"
    assert body["tools_used"] == []
    assert "will not recommend" in body["summary"].lower() or "operational" in body["summary"].lower()


def test_briefing_generates_markdown_and_html(client: TestClient) -> None:
    res = client.post("/api/ai/briefing", json={"audience": "board"})
    body = res.json()
    assert "Board Briefing" in body["markdown"]
    assert "DEMO DATA" in body["markdown"]
    assert body["human_validation_required"] is True
    assert body["html"].startswith("<article")


def test_governance_tiles_returns_five(client: TestClient) -> None:
    res = client.get("/api/governance/tiles")
    body = res.json()
    assert len(body) == 5
    for t in body:
        assert {"title", "summary", "detail", "icon", "accent"} <= set(t)
    titles = {t["title"] for t in body}
    assert "Governed AI" in titles
    governed_ai = next(t for t in body if t["title"] == "Governed AI")
    assert "Supervisor" in " ".join(governed_ai["detail"])


def test_genie_embed_returns_status_payload(client: TestClient) -> None:
    res = client.get("/api/genie/embed")
    assert res.status_code == 200
    body = res.json()
    assert {"configured", "embed_url", "space_id", "workspace_host"} <= set(body)
    if body["configured"]:
        assert isinstance(body["embed_url"], str) and body["embed_url"].startswith("http")
    else:
        assert body["embed_url"] is None
        assert isinstance(body.get("reason"), str)


def test_synthetic_data_files_exist() -> None:
    root = Path(__file__).resolve().parents[1]
    syn = root / "data" / "synthetic"
    assert (syn / "assets.csv").exists()
    assert (syn / "asset_risk_scores.csv").exists()
    assert (syn / "flood_scenarios.csv").exists()
    assert (syn / "manifest.json").exists()
