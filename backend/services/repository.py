"""Repository functions wrapping the data loader.

These functions return serialisable dicts/lists for the API layer. They merge
across multiple synthetic tables to produce executive-friendly views.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

import pandas as pd

from backend.data.loader import get_loader

LOG = logging.getLogger(__name__)


def _df(name: str) -> pd.DataFrame:
    return get_loader().load(name)


def dam_levels_current() -> list[dict[str, Any]]:
    """Live Seqwater dam-levels snapshot — the authoritative current value.

    Always served from the ``dam_levels_current`` table. Falls back to an empty
    list when the table hasn't been generated yet (e.g. fresh checkout before
    ``scripts/generate_synthetic_data.py`` has been run).
    """
    df = _df("dam_levels_current")
    if df.empty:
        return []
    return df.sort_values("asset_name").to_dict(orient="records")


def flood_storage_current() -> list[dict[str, Any]]:
    """Live snapshot of Somerset + Wivenhoe dedicated flood storage compartments."""
    df = _df("flood_storage_current")
    if df.empty:
        return []
    return df.to_dict(orient="records")


def grid_storage_snapshot() -> dict[str, Any] | None:
    """Aggregate the live dam-levels snapshot into a single grid figure.

    Returns ``None`` when no snapshot is available so callers can fall back to
    the synthetic time series.
    """
    df = _df("dam_levels_current")
    if df.empty:
        return None
    total_fsv = float(df["full_supply_ml"].sum())
    total_current = float(df["current_volume_ml"].sum())
    if total_fsv <= 0:
        return None
    spilling = df[df["is_spilling"]]
    low_dams = df[df["percent_full"] < 60.0]
    return {
        "as_at_local": df["latest_observation_local"].max(),
        "total_full_supply_ml": round(total_fsv, 1),
        "total_current_volume_ml": round(total_current, 1),
        "grid_storage_percent": round((total_current / total_fsv) * 100, 2),
        "dam_count": int(len(df)),
        "spilling_count": int(len(spilling)),
        "spilling_dam_names": spilling["asset_name"].tolist(),
        "low_dam_names": low_dams["asset_name"].tolist(),
    }


def list_assets() -> list[dict[str, Any]]:
    assets = _df("assets")
    locations = _df("asset_locations")
    if assets.empty:
        return []
    merged = assets.merge(
        locations[["asset_id", "lat", "lon"]], on="asset_id", how="left"
    )
    return merged.to_dict(orient="records")


def get_asset(asset_id: str) -> dict[str, Any] | None:
    items = [a for a in list_assets() if a["asset_id"] == asset_id]
    if not items:
        return None
    asset = items[0]
    risk = _df("asset_risk_scores")
    risk_row = risk[risk["asset_id"] == asset_id]
    if not risk_row.empty:
        asset["risk"] = risk_row.iloc[0].to_dict()
    wo = _df("maintenance_work_orders")
    wo_rows = wo[wo["asset_id"] == asset_id].head(20)
    asset["work_orders"] = wo_rows.to_dict(orient="records") if not wo_rows.empty else []
    storage = _df("dam_storage_daily")
    storage_rows = storage[storage["asset_id"] == asset_id].sort_values("date").tail(60)
    asset["storage_trend"] = (
        storage_rows[["date", "storage_percent"]].rename(
            columns={"date": "x", "storage_percent": "y"}
        ).to_dict(orient="records")
    )
    health = _df("asset_health_daily")
    health_rows = health[health["asset_id"] == asset_id].sort_values("date").tail(60)
    asset["health_trend"] = (
        health_rows[["date", "health_index"]].rename(
            columns={"date": "x", "health_index": "y"}
        ).to_dict(orient="records")
    )
    samples = _df("water_quality_samples")
    samples_rows = samples[samples["asset_id"] == asset_id].sort_values("sampled_at", ascending=False).head(20)
    asset["recent_quality_samples"] = samples_rows.to_dict(orient="records")
    return asset


def list_asset_risk() -> list[dict[str, Any]]:
    risk = _df("asset_risk_scores")
    locations = _df("asset_locations")
    if risk.empty:
        return []
    merged = risk.merge(
        locations[["asset_id", "lat", "lon"]], on="asset_id", how="left"
    )
    merged = merged.sort_values("risk_score", ascending=False)
    return merged.to_dict(orient="records")


def list_work_orders(limit: int = 200) -> list[dict[str, Any]]:
    wo = _df("maintenance_work_orders")
    if wo.empty:
        return []
    wo = wo.sort_values(["priority", "age_days"], ascending=[True, False]).head(limit)
    return wo.to_dict(orient="records")


def water_security_summary() -> dict[str, Any]:
    storage = _df("dam_storage_daily")
    rain_fc = _df("rainfall_forecast")
    demand = _df("demand_forecast")
    supply = _df("supply_forecast")
    transfers = _df("grid_transfer_recommendations")
    catchments = _df("catchment_conditions")
    snapshot = grid_storage_snapshot()
    dam_levels = dam_levels_current()
    flood_storage = flood_storage_current()

    storage_pct = 0.0
    storage_trend: list[dict[str, Any]] = []
    if not storage.empty:
        latest = storage.sort_values("date").groupby("asset_id").tail(1)
        storage_pct = float(
            (latest["current_storage_ml"].sum() / latest["full_supply_ml"].sum()) * 100
        )
        agg = (
            storage.groupby("date")
            .apply(
                lambda g: (g["current_storage_ml"].sum() / g["full_supply_ml"].sum()) * 100,
                include_groups=False,
            )
            .reset_index(name="storage_percent")
        )
        storage_trend = (
            agg.sort_values("date").tail(90)[["date", "storage_percent"]]
            .rename(columns={"date": "x", "storage_percent": "y"})
            .to_dict(orient="records")
        )

    # Prefer the live dam-levels snapshot as the authoritative figure so the
    # UI reads the same number as the public Seqwater dam-levels page.
    if snapshot:
        storage_pct = snapshot["grid_storage_percent"]

    forecast_total_72h = 0.0
    if not rain_fc.empty:
        f72 = rain_fc[rain_fc["horizon"] == "72h"]
        if not f72.empty:
            forecast_total_72h = float(f72["forecast_rainfall_mm"].mean())

    demand_today_ml = float(demand["demand_ml_day"].iloc[0]) if not demand.empty else 0.0
    treatment_capacity = float(supply["treatment_capacity_ml_day"].iloc[0]) if not supply.empty else 0.0

    return {
        "storage_percent": round(storage_pct, 2),
        "storage_trend": storage_trend,
        "snapshot": snapshot,
        "dam_levels_current": dam_levels,
        "flood_storage_current": flood_storage,
        "forecast_rainfall_mm_72h_avg": round(forecast_total_72h, 1),
        "demand_today_ml": round(demand_today_ml, 1),
        "treatment_capacity_ml_day": round(treatment_capacity, 1),
        "transfers": transfers.to_dict(orient="records") if not transfers.empty else [],
        "catchments": catchments.to_dict(orient="records") if not catchments.empty else [],
        "rainfall_forecast": rain_fc.to_dict(orient="records") if not rain_fc.empty else [],
        "demand_forecast": demand.to_dict(orient="records") if not demand.empty else [],
        "supply_forecast": supply.to_dict(orient="records") if not supply.empty else [],
    }


def water_quality_summary() -> dict[str, Any]:
    samples = _df("water_quality_samples")
    plant_ops = _df("treatment_plant_operations")
    turb_events = _df("turbidity_events")
    alerts = _df("quality_alerts")

    if samples.empty:
        return {
            "samples": [],
            "plant_operations": [],
            "turbidity_events": [],
            "alerts": [],
            "elevated_count": 0,
            "watch_count": 0,
            "turbidity_trend": [],
        }

    samples_sorted = samples.sort_values("sampled_at")
    turbidity_trend = (
        samples_sorted.groupby(samples_sorted["sampled_at"].astype(str).str[:10])["turbidity_NTU"]
        .mean()
        .reset_index()
        .rename(columns={"sampled_at": "x", "turbidity_NTU": "y"})
        .tail(14)
    )
    elevated = int((samples["alert_level"] == "Elevated").sum())
    watch = int((samples["alert_level"] == "Watch").sum())

    return {
        "samples": samples.head(60).to_dict(orient="records"),
        "plant_operations": plant_ops.to_dict(orient="records") if not plant_ops.empty else [],
        "turbidity_events": turb_events.to_dict(orient="records") if not turb_events.empty else [],
        "alerts": alerts.to_dict(orient="records") if not alerts.empty else [],
        "elevated_count": elevated,
        "watch_count": watch,
        "turbidity_trend": turbidity_trend.rename(
            columns={"sampled_at": "x", "turbidity_NTU": "y"}
        ).to_dict(orient="records"),
    }


def list_flood_scenarios() -> list[dict[str, Any]]:
    df = _df("flood_scenarios")
    return df.to_dict(orient="records") if not df.empty else []


def get_flood_scenario_detail(scenario_id: str) -> dict[str, Any] | None:
    scenarios = _df("flood_scenarios")
    if scenarios.empty:
        return None
    rows = scenarios[scenarios["scenario_id"] == scenario_id]
    if rows.empty:
        return None
    scenario = rows.iloc[0].to_dict()
    sim = _df("dam_release_simulation")
    sim_rows = sim[sim["scenario_id"] == scenario_id]
    scenario["simulation"] = sim_rows.to_dict(orient="records") if not sim_rows.empty else []
    actions = _df("incident_actions")
    action_rows = actions[actions["scenario_id"] == scenario_id]
    scenario["actions"] = action_rows.to_dict(orient="records") if not action_rows.empty else []
    return scenario


def list_capital_projects() -> list[dict[str, Any]]:
    df = _df("capital_projects")
    if df.empty:
        return []
    df = df.sort_values("risk_reduction_score", ascending=False)
    return df.to_dict(orient="records")


def list_audit() -> list[dict[str, Any]]:
    df = _df("ai_interaction_audit")
    if df.empty:
        return []
    return df.to_dict(orient="records")


def overview() -> dict[str, Any]:
    risk = _df("asset_risk_scores")
    wo = _df("maintenance_work_orders")
    samples = _df("water_quality_samples")
    storage = _df("dam_storage_daily")
    demand = _df("demand_forecast")
    supply = _df("supply_forecast")
    rain_fc = _df("rainfall_forecast")

    storage_pct = 0.0
    if not storage.empty:
        latest = storage.sort_values("date").groupby("asset_id").tail(1)
        storage_pct = float(
            (latest["current_storage_ml"].sum() / latest["full_supply_ml"].sum()) * 100
        )

    snapshot = grid_storage_snapshot()
    if snapshot:
        storage_pct = snapshot["grid_storage_percent"]

    open_critical = int(
        ((wo["status"] != "Completed") & (wo["priority"] == "P1 - Critical")).sum()
    ) if not wo.empty else 0
    quality_alerts = int((samples["alert_level"].isin(["Elevated", "Watch"])).sum()) if not samples.empty else 0
    elevated_assets = int((risk["risk_band"].isin(["Critical", "High"])).sum()) if not risk.empty else 0
    demand_ml = float(demand["demand_ml_day"].iloc[0]) if not demand.empty else 0.0
    capacity_ml = float(supply["treatment_capacity_ml_day"].iloc[0]) if not supply.empty else 0.0

    forecast_72h = 0.0
    if not rain_fc.empty:
        sub = rain_fc[rain_fc["horizon"] == "72h"]
        if not sub.empty:
            forecast_72h = float(sub["forecast_rainfall_mm"].mean())

    risk_level = "Watch" if (forecast_72h > 120 or quality_alerts > 5 or elevated_assets > 4) else "Routine"
    if forecast_72h > 200 and elevated_assets > 4:
        risk_level = "Elevated"

    headline = {
        "Routine": "Routine — operations within steady envelope (synthetic).",
        "Watch": "Watch — monitor catchment rainfall and water quality (synthetic).",
        "Elevated": "Elevated — multi-asset attention recommended (synthetic).",
    }[risk_level]

    storage_trend = []
    if not storage.empty:
        agg = (
            storage.groupby("date")
            .apply(
                lambda g: (g["current_storage_ml"].sum() / g["full_supply_ml"].sum()) * 100,
                include_groups=False,
            )
            .reset_index(name="storage_percent")
        )
        storage_trend = (
            agg.sort_values("date").tail(60)[["date", "storage_percent"]]
            .rename(columns={"date": "x", "storage_percent": "y"})
            .to_dict(orient="records")
        )

    demand_trend = (
        demand[["date", "demand_ml_day"]].rename(columns={"date": "x", "demand_ml_day": "y"})
        .to_dict(orient="records")
        if not demand.empty else []
    )
    rainfall_trend = []
    if not rain_fc.empty:
        rainfall_trend = (
            rain_fc[rain_fc["horizon"] != "7d"]
            .groupby("horizon")["forecast_rainfall_mm"]
            .mean()
            .reset_index()
            .rename(columns={"horizon": "x", "forecast_rainfall_mm": "y"})
            .to_dict(orient="records")
        )
    quality_trend = []
    if not samples.empty:
        s = samples.copy()
        s["day"] = s["sampled_at"].astype(str).str[:10]
        quality_trend = (
            s.groupby("day")["turbidity_NTU"].mean().reset_index()
            .rename(columns={"day": "x", "turbidity_NTU": "y"})
            .tail(14).to_dict(orient="records")
        )
    risk_trend = []
    if not risk.empty:
        risk_trend = [
            {"x": row["asset_name"], "y": float(row["risk_score"])}
            for _, row in risk.head(10).iterrows()
        ]

    top_assets = (
        risk.head(3)[["asset_name", "risk_band", "recommended_action"]].to_dict(orient="records")
        if not risk.empty else []
    )
    top_actions = []
    for r in top_assets:
        top_actions.append(
            f"{r['asset_name']} — {r['risk_band']} risk: {r['recommended_action']}"
        )
    if forecast_72h > 100:
        top_actions.append(
            "Validate rainfall and inflow inputs with duty hydrologist (synthetic)."
        )
    if quality_alerts > 5:
        top_actions.append(
            "Convene synthetic water quality review for elevated zones."
        )

    spilling_count = snapshot["spilling_count"] if snapshot else 0
    spilling_names = snapshot["spilling_dam_names"] if snapshot else []
    low_names = snapshot["low_dam_names"] if snapshot else []
    snapshot_context = ""
    if snapshot:
        snapshot_context = (
            f" Published Seqwater snapshot: {spilling_count} dams currently spilling"
            f"{(' (' + ', '.join(spilling_names[:3]) + (', …' if len(spilling_names) > 3 else '') + ')') if spilling_names else ''};"
            f" {len(low_names)} below 60% (e.g. " + ", ".join(low_names[:2]) + ")." if low_names else "."
        )
    summary = (
        f"Synthetic posture: {risk_level.lower()}. Storage {storage_pct:.1f}% across the "
        f"SEQ Water Grid. {open_critical} P1 work orders open. "
        f"{quality_alerts} water quality alerts active. {elevated_assets} assets in elevated risk bands."
        f"{snapshot_context}"
    )
    if spilling_count >= 3:
        top_actions.insert(
            0,
            f"Brief executive on {spilling_count} dams currently spilling — confirm downstream comms cadence.",
        )

    kpis = [
        {"label": "Water Security", "value": risk_level, "status": "watch" if risk_level == "Watch" else ("elevated" if risk_level == "Elevated" else "ok"), "sublabel": "Synthetic 72-hour posture"},
        {"label": "Total Storage", "value": f"{storage_pct:.1f}%", "status": "ok" if storage_pct > 60 else "watch", "sublabel": "Live Seqwater snapshot" if snapshot else "Across synthetic SEQ dams"},
        {"label": "Dams Spilling", "value": str(spilling_count), "status": "watch" if spilling_count >= 3 else "ok", "sublabel": "Live snapshot — flood-mitigation OK"},
        {"label": "Forecast Demand", "value": f"{demand_ml:,.0f} ML/day", "status": "ok", "sublabel": "Synthetic baseline"},
        {"label": "Treatment Capacity", "value": f"{capacity_ml:,.0f} ML/day", "status": "ok", "sublabel": "Synthetic available"},
        {"label": "Critical Work Orders", "value": str(open_critical), "status": "elevated" if open_critical > 5 else "watch" if open_critical > 0 else "ok", "sublabel": "P1 open (synthetic)"},
        {"label": "Quality Alerts", "value": str(quality_alerts), "status": "watch" if quality_alerts > 0 else "ok", "sublabel": "Watch + Elevated (synthetic)"},
        {"label": "Elevated Assets", "value": str(elevated_assets), "status": "elevated" if elevated_assets > 4 else "watch", "sublabel": "High/Critical risk band"},
        {"label": "72h Rainfall Forecast", "value": f"{forecast_72h:.0f} mm", "status": "watch" if forecast_72h > 120 else "ok", "sublabel": "Synthetic mean across catchments"},
    ]

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "synthetic_demo": True,
        "headline_status": headline,
        "seventy_two_hour_risk": risk_level,
        "storage_percent": round(storage_pct, 2),
        "forecast_demand_ml": round(demand_ml, 1),
        "treatment_capacity_ml": round(capacity_ml, 1),
        "open_critical_work_orders": open_critical,
        "quality_alerts": quality_alerts,
        "elevated_assets": elevated_assets,
        "ai_executive_summary": summary,
        "top_actions": top_actions[:5],
        "kpis": kpis,
        "trends": {
            "storage": storage_trend,
            "demand": demand_trend,
            "rainfall": rainfall_trend,
            "quality": quality_trend,
            "risk": risk_trend,
        },
    }
