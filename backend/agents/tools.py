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


def get_current_dam_levels(dam_name: str | None = None) -> dict[str, Any]:
    """Return the live Seqwater dam-levels snapshot for one dam or the whole grid.

    Grounds the agent in the *real* published 29/05/2026 values rather than the
    synthetic time series. When ``dam_name`` is provided, the response narrows
    to that dam (case-insensitive substring match on the asset name).
    """
    rows = repository.dam_levels_current()
    snap = repository.grid_storage_snapshot()
    flood = repository.flood_storage_current()
    if not rows:
        return {"summary": "No dam-levels snapshot available.", "data": {"dams": [], "snapshot": None}}

    selected = rows
    if dam_name:
        needle = dam_name.lower()
        selected = [r for r in rows if needle in r["asset_name"].lower()]

    if dam_name and selected:
        lines = [
            f"{r['asset_name']}: {r['current_volume_ml']:,.0f}/{r['full_supply_ml']:,.0f} ML "
            f"({r['percent_full']}% full, {'spilling' if r['is_spilling'] else 'within FSV'}, "
            f"observed {r['latest_observation_local']})"
            for r in selected
        ]
        summary = "Live Seqwater dam levels (published):\n- " + "\n- ".join(lines)
    elif dam_name:
        summary = f"No published dam matches '{dam_name}'."
    else:
        spilling = [r["asset_name"] for r in rows if r["is_spilling"]]
        low = [r["asset_name"] for r in rows if r["percent_full"] < 60.0]
        pieces = [
            f"Live Seqwater grid storage: {snap['grid_storage_percent']}% "
            f"({snap['total_current_volume_ml']:,.0f} / {snap['total_full_supply_ml']:,.0f} ML) "
            f"across {snap['dam_count']} published dams." if snap else "",
            f"{len(spilling)} dams currently spilling" + (f" ({', '.join(spilling[:5])}{'…' if len(spilling) > 5 else ''})" if spilling else ".") if spilling else "",
            f"{len(low)} dams below 60% full" + (f" ({', '.join(low)})" if low else "."),
        ]
        if flood:
            pieces.append(
                "Flood storage compartments: "
                + "; ".join(
                    f"{f['asset_name']} {f['flood_storage_in_use_pct']}% in use of {f['total_flood_storage_ml']:,.0f} ML"
                    for f in flood
                )
                + "."
            )
        summary = " ".join(p for p in pieces if p)
    return {
        "summary": summary,
        "data": {
            "snapshot": snap,
            "dams": selected,
            "flood_storage": flood,
        },
    }


TOOLS = {
    "get_water_security_summary": get_water_security_summary,
    "get_top_asset_risks": get_top_asset_risks,
    "get_water_quality_alerts": get_water_quality_alerts,
    "run_flood_readiness_scenario": run_flood_readiness_scenario,
    "get_capital_priorities": get_capital_priorities,
    "get_overview": get_overview,
    "get_current_dam_levels": get_current_dam_levels,
}
