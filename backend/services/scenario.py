"""Synthetic flood readiness scenario simulator.

Deliberately conservative: the simulator uses simple, transparent linear
projections so the user can see exactly how inputs flow to outputs. It is NOT
an operational flood-release model.
"""
from __future__ import annotations

import uuid
from typing import Any

from backend.services import repository


def run_scenario(
    *,
    scenario_name: str,
    rainfall_forecast_mm_24h: float,
    rainfall_forecast_mm_72h: float,
    catchment_saturation_index: float,
    current_storage_percent: float,
    treatment_demand_ml_day: float,
    downstream_sensitivity: float,
) -> dict[str, Any]:
    storage_lift = (
        rainfall_forecast_mm_72h * 0.020
        + catchment_saturation_index * 6.0
        - max(treatment_demand_ml_day - 1200, 0) * 0.0015
    )
    projected = max(20.0, min(99.5, current_storage_percent + storage_lift))
    risk_score = (
        (projected / 100) * 0.35
        + catchment_saturation_index * 0.25
        + min(rainfall_forecast_mm_72h / 350, 1.0) * 0.30
        + downstream_sensitivity * 0.10
    )
    if risk_score > 0.78:
        risk_class = "Coordinate"
    elif risk_score > 0.62:
        risk_class = "Respond"
    elif risk_score > 0.45:
        risk_class = "Watch"
    else:
        risk_class = "Routine"

    risk = repository.list_asset_risk()
    affected = [r["asset_name"] for r in risk[:5]]
    quality = repository.water_quality_summary()
    if quality["elevated_count"] > 0 or rainfall_forecast_mm_72h > 200:
        wq_risk = "Elevated synthetic turbidity risk at downstream WTPs."
    elif rainfall_forecast_mm_72h > 100:
        wq_risk = "Synthetic turbidity watch at downstream WTPs."
    else:
        wq_risk = "Synthetic water quality stable."

    actions = [
        "Validate latest synthetic rainfall and inflow inputs with duty hydrologist.",
        "Confirm synthetic treatment plant operating margins with water quality lead.",
        "Pre-stage synthetic spares for top-3 risk assets identified by AquaIQ.",
        "Issue synthetic retailer customer communication aligned to protocol.",
    ]
    if risk_class in ("Respond", "Coordinate"):
        actions.insert(0, "Escalate synthetic posture to executive flood operations cell.")

    comms_checklist = [
        "Confirm synthetic facts and sources used in this draft.",
        "Confirm named human reviewer for the synthetic communication.",
        "Confirm next synthetic update cadence and channel.",
        "Document synthetic assumptions and unknowns clearly.",
    ]

    trajectory = []
    for h in range(0, 73, 6):
        v = current_storage_percent + storage_lift * (h / 72)
        trajectory.append({"hour": h, "projected_storage_percent": round(min(99.5, max(20, v)), 2)})

    return {
        "scenario_id": f"SIM-{uuid.uuid4().hex[:8]}",
        "scenario_name": scenario_name,
        "inputs": {
            "rainfall_forecast_mm_24h": rainfall_forecast_mm_24h,
            "rainfall_forecast_mm_72h": rainfall_forecast_mm_72h,
            "catchment_saturation_index": catchment_saturation_index,
            "current_storage_percent": current_storage_percent,
            "treatment_demand_ml_day": treatment_demand_ml_day,
            "downstream_sensitivity": downstream_sensitivity,
        },
        "projected_storage_percent": round(projected, 2),
        "risk_classification": risk_class,
        "assets_affected": affected,
        "water_quality_risk": wq_risk,
        "recommended_actions": actions,
        "communications_checklist": comms_checklist,
        "human_validation_required": True,
        "synthetic_demo_flag": True,
        "storage_trajectory": trajectory,
    }
