"""AquaIQ tool functions.

Each tool returns a dict with both a structured payload and a textual ``summary``
suitable for embedding in an LLM prompt or for use as the body of a mock
response in local mode.
"""
from __future__ import annotations

from typing import Any

from backend.services import repository


def get_water_security_summary() -> dict[str, Any]:
    s = repository.water_security_summary()
    summary_text = (
        "Synthetic SEQ-wide storage at {storage:.1f}%. "
        "Mean 72h rainfall forecast across catchments: {rain:.0f} mm. "
        "Today's synthetic demand: {dem:.0f} ML/day. "
        "Treatment capacity: {cap:.0f} ML/day."
    ).format(
        storage=s["storage_percent"],
        rain=s["forecast_rainfall_mm_72h_avg"],
        dem=s["demand_today_ml"],
        cap=s["treatment_capacity_ml_day"],
    )
    return {"summary": summary_text, "data": s}


def get_top_asset_risks(limit: int = 5) -> dict[str, Any]:
    risks = repository.list_asset_risk()[:limit]
    if not risks:
        return {"summary": "No synthetic asset risk data available.", "data": []}
    lines = [
        f"{r['asset_name']} ({r['risk_band']}, score {r['risk_score']:.2f}) — {r['recommended_action']}"
        for r in risks
    ]
    summary = "Top synthetic asset risks:\n- " + "\n- ".join(lines)
    return {"summary": summary, "data": risks}


def get_water_quality_alerts() -> dict[str, Any]:
    q = repository.water_quality_summary()
    summary = (
        f"Synthetic water quality: {q['elevated_count']} elevated, {q['watch_count']} watch. "
        f"Latest synthetic turbidity events: {len(q['turbidity_events'])}."
    )
    return {"summary": summary, "data": q}


def run_flood_readiness_scenario(scenario_id: str = "FS-001") -> dict[str, Any]:
    s = repository.get_flood_scenario_detail(scenario_id) or {}
    if not s:
        return {"summary": "No synthetic scenario detail available.", "data": {}}
    summary = (
        f"Synthetic scenario {s.get('scenario_name')}: 72h forecast {s.get('rainfall_forecast_mm_72h')} mm; "
        f"projected storage {s.get('projected_storage_percent')}%; "
        f"release_required={s.get('release_required')}; "
        f"downstream impact {s.get('downstream_impact_score')}."
    )
    return {"summary": summary, "data": s}


def get_capital_priorities(limit: int = 5) -> dict[str, Any]:
    projects = repository.list_capital_projects()[:limit]
    if not projects:
        return {"summary": "No synthetic capital projects available.", "data": []}
    lines = [
        f"{p['project_name']} (priority {p['recommended_priority']}, "
        f"risk reduction {p['risk_reduction_score']:.2f}, ${p['estimated_cost_aud']/1_000_000:.1f}M)"
        for p in projects
    ]
    summary = "Top synthetic capital options by risk reduction:\n- " + "\n- ".join(lines)
    return {"summary": summary, "data": projects}


def get_overview() -> dict[str, Any]:
    o = repository.overview()
    summary = o["ai_executive_summary"]
    return {"summary": summary, "data": o}


TOOLS = {
    "get_water_security_summary": get_water_security_summary,
    "get_top_asset_risks": get_top_asset_risks,
    "get_water_quality_alerts": get_water_quality_alerts,
    "run_flood_readiness_scenario": run_flood_readiness_scenario,
    "get_capital_priorities": get_capital_priorities,
    "get_overview": get_overview,
}
