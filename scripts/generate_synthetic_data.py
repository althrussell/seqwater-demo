"""Synthetic data generator for the Seqwater AI Command Centre demo.

All values are clearly synthetic and labelled SYNTHETIC. Do NOT treat any output
as real Seqwater operational data. The generator is deterministic given a seed
so that demo runs are repeatable.

Run:
    python scripts/generate_synthetic_data.py
"""
from __future__ import annotations

import json
import math
import os
import random
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterable

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "data" / "synthetic"
OUT_DIR.mkdir(parents=True, exist_ok=True)

SEED = int(os.environ.get("DEMO_SEED", "20260529"))
random.seed(SEED)
np.random.seed(SEED)

TODAY = datetime(2026, 5, 29, tzinfo=timezone.utc)
START_DATE = TODAY - timedelta(days=180)
HOURLY_START = TODAY - timedelta(days=7)
SYNTHETIC_TAG = "SYNTHETIC"


@dataclass(frozen=True)
class AssetSpec:
    asset_id: str
    name: str
    asset_type: str
    region: str
    lat: float
    lon: float
    capacity_ml: float | None = None
    criticality: str = "Medium"
    commissioned_year: int = 1990


# Approximate, clearly synthetic coordinates for South East Queensland landmarks.
# These are demo coordinates only.
ASSETS: list[AssetSpec] = [
    AssetSpec("DAM-001", "Wivenhoe Dam", "Dam", "Brisbane West", -27.391, 152.609, 1165000, "Critical", 1985),
    AssetSpec("DAM-002", "Somerset Dam", "Dam", "Brisbane West", -27.116, 152.560, 379850, "Critical", 1959),
    AssetSpec("DAM-003", "North Pine Dam", "Dam", "Brisbane North", -27.272, 152.939, 215000, "Critical", 1976),
    AssetSpec("DAM-004", "Hinze Dam", "Dam", "Gold Coast", -28.054, 153.286, 310730, "Critical", 1976),
    AssetSpec("DAM-005", "Baroon Pocket Dam", "Dam", "Sunshine Coast", -26.700, 152.875, 61000, "High", 1989),
    AssetSpec("WTP-001", "Mount Crosby Water Treatment Plant", "Water Treatment Plant", "Brisbane West", -27.541, 152.808, 800, "Critical", 1985),
    AssetSpec("WTP-002", "North Pine Water Treatment Plant", "Water Treatment Plant", "Brisbane North", -27.275, 152.940, 220, "High", 1990),
    AssetSpec("WTP-003", "Landers Shute Water Treatment Plant", "Water Treatment Plant", "Sunshine Coast", -26.706, 152.882, 130, "High", 1988),
    AssetSpec("WTP-004", "Molendinar Water Treatment Plant", "Water Treatment Plant", "Gold Coast", -28.013, 153.357, 240, "High", 1986),
    AssetSpec("DES-001", "Gold Coast Desalination Plant", "Desalination Plant", "Gold Coast", -27.985, 153.421, 133, "Critical", 2009),
    AssetSpec("RWS-001", "Western Corridor Recycled Water Scheme", "Recycled Water Plant", "Brisbane West", -27.605, 152.953, 232, "Critical", 2008),
    AssetSpec("RES-001", "Capalaba Reservoir", "Reservoir", "Bayside", -27.526, 153.198, 38, "Medium", 1994),
    AssetSpec("RES-002", "Mount Coot-tha Reservoir", "Reservoir", "Brisbane Inner", -27.477, 152.952, 25, "High", 1972),
    AssetSpec("PIP-001", "Scenic Rim Pipeline Segment", "Pipeline Segment", "Scenic Rim", -28.030, 152.870, None, "Medium", 2002),
    AssetSpec("PIP-002", "Sunshine Coast Trunk Main", "Pipeline Segment", "Sunshine Coast", -26.683, 153.063, None, "High", 1998),
    AssetSpec("PMP-001", "Brisbane North Pump Station", "Pump Station", "Brisbane North", -27.378, 153.020, None, "High", 2001),
    AssetSpec("PMP-014", "Caboolture Pump Station", "Pump Station", "Brisbane North", -27.084, 152.951, None, "Critical", 1996),
    AssetSpec("CMS-001", "Lockyer Catchment Monitoring Site", "Catchment Monitoring Site", "Lockyer Valley", -27.555, 152.252, None, "Medium", 2010),
    AssetSpec("CMS-002", "Stanley River Catchment Monitoring Site", "Catchment Monitoring Site", "Sunshine Coast", -26.872, 152.703, None, "Medium", 2010),
    AssetSpec("REC-001", "Lake Wivenhoe Recreation Site", "Recreation Site", "Brisbane West", -27.395, 152.617, None, "Low", 1995),
]


# ---------- helpers ----------

def _date_range(start: datetime, end: datetime, freq: str = "D") -> pd.DatetimeIndex:
    return pd.date_range(start=start, end=end, freq=freq, tz="UTC", inclusive="left")


def _save(df: pd.DataFrame, name: str) -> None:
    csv_path = OUT_DIR / f"{name}.csv"
    parquet_path = OUT_DIR / f"{name}.parquet"
    df.to_csv(csv_path, index=False)
    try:
        df.to_parquet(parquet_path, index=False)
    except Exception:
        pass
    print(f"  wrote {name:32s} rows={len(df):>6d}  ->  {csv_path.relative_to(ROOT)}")


def _seasonal_rainfall(day_of_year: int, base: float = 3.0) -> float:
    # Bias rainfall toward Australian summer (Dec-Mar) without claiming realism.
    seasonal = math.sin(2 * math.pi * (day_of_year + 30) / 365.0)
    return max(0.0, base + 4.0 * seasonal + np.random.normal(0, 1.8))


# ---------- assets ----------

def gen_assets() -> pd.DataFrame:
    rows = []
    for a in ASSETS:
        rows.append({
            "asset_id": a.asset_id,
            "name": a.name,
            "asset_type": a.asset_type,
            "region": a.region,
            "criticality": a.criticality,
            "capacity_ml": a.capacity_ml,
            "commissioned_year": a.commissioned_year,
            "synthetic_demo_flag": True,
        })
    return pd.DataFrame(rows)


def gen_asset_locations() -> pd.DataFrame:
    rows = []
    for a in ASSETS:
        rows.append({
            "asset_id": a.asset_id,
            "lat": a.lat,
            "lon": a.lon,
            "region": a.region,
            "synthetic_demo_flag": True,
        })
    return pd.DataFrame(rows)


# ---------- demo moments ----------

DEMO_MOMENTS = {
    "rainfall_event_assets": ["DAM-001", "DAM-002", "DAM-003", "DAM-005"],
    "turbidity_plants": ["WTP-002", "WTP-003"],
    "rising_failure_pump": "PMP-014",
    "attention_dam": "DAM-003",
    "risk_reducing_project_asset": "PMP-014",
}


# ---------- dam storage ----------

def gen_dam_storage_daily(assets: pd.DataFrame) -> pd.DataFrame:
    dams = assets[assets["asset_type"] == "Dam"]
    dates = _date_range(START_DATE, TODAY + timedelta(days=1))
    rows = []
    # per-dam baseline so values feel like a credible synthetic SEQ snapshot.
    baselines = {
        "DAM-001": 0.78,  # Wivenhoe
        "DAM-002": 0.74,  # Somerset
        "DAM-003": 0.69,  # North Pine
        "DAM-004": 0.81,  # Hinze
        "DAM-005": 0.72,  # Baroon Pocket
    }
    for _, dam in dams.iterrows():
        full = float(dam["capacity_ml"])
        base_level = baselines.get(dam["asset_id"], 0.75)
        seasonal = 0.06 * np.sin(np.linspace(0, 1.4 * math.pi, len(dates)))
        noise = np.random.normal(0, 0.010, len(dates))
        traj = np.clip(base_level + seasonal + noise, 0.40, 0.99)
        # Demo moment: attention dam approaches threshold near "today".
        if dam["asset_id"] == DEMO_MOMENTS["attention_dam"]:
            tail = np.linspace(0, 0.18, 30)
            traj[-30:] = np.clip(traj[-30:] + tail, 0.40, 0.99)
        for i, d in enumerate(dates):
            storage_pct = float(traj[i])
            current_ml = full * storage_pct
            inflow = max(0.0, np.random.normal(180, 90))
            outflow = max(0.0, np.random.normal(160, 70))
            rows.append({
                "asset_id": dam["asset_id"],
                "asset_name": dam["name"],
                "date": d.date().isoformat(),
                "current_storage_ml": round(current_ml, 1),
                "full_supply_ml": full,
                "storage_percent": round(storage_pct * 100, 2),
                "inflow_ml": round(inflow, 1),
                "outflow_ml": round(outflow, 1),
                "synthetic_demo_flag": True,
            })
    return pd.DataFrame(rows)


# ---------- rainfall ----------

def gen_rainfall_observations(assets: pd.DataFrame) -> pd.DataFrame:
    catchment_assets = assets[assets["asset_type"].isin(["Catchment Monitoring Site", "Dam"])]
    dates = _date_range(START_DATE, TODAY + timedelta(days=1))
    rows = []
    for _, a in catchment_assets.iterrows():
        for d in dates:
            mm = _seasonal_rainfall(d.dayofyear)
            rows.append({
                "asset_id": a["asset_id"],
                "asset_name": a["name"],
                "region": a["region"],
                "date": d.date().isoformat(),
                "rainfall_mm": round(mm, 2),
                "synthetic_demo_flag": True,
            })
    return pd.DataFrame(rows)


def gen_rainfall_forecast(assets: pd.DataFrame) -> pd.DataFrame:
    catchment_assets = assets[assets["asset_type"].isin(["Catchment Monitoring Site", "Dam"])]
    horizons = [
        ("24h", 1),
        ("48h", 2),
        ("72h", 3),
        ("7d", 7),
    ]
    rows = []
    for _, a in catchment_assets.iterrows():
        bump = 1.0
        if a["asset_id"] in DEMO_MOMENTS["rainfall_event_assets"]:
            bump = 2.4
        base = max(2.0, np.random.normal(8, 4))
        for label, days in horizons:
            mm = round(base * days * bump * np.random.uniform(0.8, 1.2), 1)
            rows.append({
                "asset_id": a["asset_id"],
                "asset_name": a["name"],
                "region": a["region"],
                "horizon": label,
                "horizon_hours": days * 24,
                "forecast_rainfall_mm": mm,
                "issued_at": TODAY.isoformat(),
                "synthetic_demo_flag": True,
            })
    return pd.DataFrame(rows)


# ---------- demand and supply ----------

def gen_demand_forecast() -> pd.DataFrame:
    rows = []
    for offset in range(0, 14):
        d = TODAY + timedelta(days=offset)
        base = 1280 + 30 * math.sin(offset / 3.0)
        weather_bump = 40 if offset in (3, 4) else 0
        ml = base + weather_bump + np.random.normal(0, 12)
        rows.append({
            "date": d.date().isoformat(),
            "demand_ml_day": round(float(ml), 1),
            "scenario_name": "Synthetic baseline forecast",
            "synthetic_demo_flag": True,
        })
    return pd.DataFrame(rows)


def gen_supply_forecast() -> pd.DataFrame:
    rows = []
    for offset in range(0, 14):
        d = TODAY + timedelta(days=offset)
        # treatment_capacity_ml_day across the synthetic grid.
        capacity = 1900 + np.random.normal(0, 8)
        rows.append({
            "date": d.date().isoformat(),
            "treatment_capacity_ml_day": round(float(capacity), 1),
            "scenario_name": "Synthetic baseline supply",
            "synthetic_demo_flag": True,
        })
    return pd.DataFrame(rows)


def gen_grid_transfer_recommendations() -> pd.DataFrame:
    rows = [
        {"from_region": "Sunshine Coast", "to_region": "Brisbane North", "grid_transfer_ml_day": 38.5,
         "rationale": "Synthetic: balance treatment headroom ahead of forecast rainfall window.",
         "confidence": "Medium", "synthetic_demo_flag": True},
        {"from_region": "Gold Coast", "to_region": "Brisbane West", "grid_transfer_ml_day": 22.0,
         "rationale": "Synthetic: maintain Mount Crosby blend ratios during turbidity watch.",
         "confidence": "Medium", "synthetic_demo_flag": True},
        {"from_region": "Brisbane West", "to_region": "Bayside", "grid_transfer_ml_day": 14.5,
         "rationale": "Synthetic: pre-position storage at Capalaba ahead of demand peak.",
         "confidence": "High", "synthetic_demo_flag": True},
    ]
    return pd.DataFrame(rows)


# ---------- asset health, work orders, risk ----------

def gen_asset_health_daily(assets: pd.DataFrame) -> pd.DataFrame:
    dates = _date_range(START_DATE, TODAY + timedelta(days=1))
    rows = []
    for _, a in assets.iterrows():
        base_health = {
            "Critical": 0.86,
            "High": 0.83,
            "Medium": 0.81,
            "Low": 0.78,
        }.get(a["criticality"], 0.80)
        drift = np.linspace(0, -0.04, len(dates))
        noise = np.random.normal(0, 0.012, len(dates))
        traj = np.clip(base_health + drift + noise, 0.55, 0.99)
        if a["asset_id"] == DEMO_MOMENTS["rising_failure_pump"]:
            extra = np.linspace(0, -0.18, len(dates))
            traj = np.clip(traj + extra, 0.40, 0.99)
        for i, d in enumerate(dates):
            rows.append({
                "asset_id": a["asset_id"],
                "date": d.date().isoformat(),
                "health_index": round(float(traj[i]), 3),
                "synthetic_demo_flag": True,
            })
    return pd.DataFrame(rows)


def gen_maintenance_work_orders(assets: pd.DataFrame) -> pd.DataFrame:
    rows = []
    statuses = ["Open", "In Progress", "Awaiting Parts", "Completed"]
    priorities = ["P1 - Critical", "P2 - High", "P3 - Medium", "P4 - Low"]
    descriptions = [
        "Synthetic: routine inspection finding requiring follow-up.",
        "Synthetic: vibration anomaly detected on rotating equipment.",
        "Synthetic: instrument drift on online analyser.",
        "Synthetic: gasket replacement scheduled.",
        "Synthetic: SCADA telemetry intermittent dropouts.",
        "Synthetic: protective coating degradation observed.",
        "Synthetic: pump bearing temperature trending up.",
        "Synthetic: pressure transducer recalibration required.",
        "Synthetic: chlorine analyser cell replacement.",
        "Synthetic: dosing pump diaphragm inspection.",
    ]
    n = 64
    for i in range(n):
        a = assets.sample(1, random_state=SEED + i).iloc[0]
        opened = TODAY - timedelta(days=int(np.random.uniform(0, 80)))
        priority = random.choice(priorities)
        status = random.choices(statuses, weights=[3, 2, 2, 4])[0]
        if a["asset_id"] == DEMO_MOMENTS["rising_failure_pump"] and i < 6:
            priority = "P1 - Critical"
            status = "In Progress"
        rows.append({
            "work_order_id": f"WO-{2026000 + i:07d}",
            "asset_id": a["asset_id"],
            "asset_name": a["name"],
            "priority": priority,
            "status": status,
            "opened_at": opened.isoformat(),
            "age_days": (TODAY - opened).days,
            "description": random.choice(descriptions),
            "synthetic_demo_flag": True,
        })
    return pd.DataFrame(rows)


def gen_asset_risk_scores(assets: pd.DataFrame, work_orders: pd.DataFrame, health: pd.DataFrame) -> pd.DataFrame:
    latest_health = (health.sort_values("date").groupby("asset_id").tail(1)
                     .set_index("asset_id")["health_index"])
    open_wo = (work_orders[work_orders["status"] != "Completed"]
               .groupby("asset_id").size())
    rows = []
    for _, a in assets.iterrows():
        h = float(latest_health.get(a["asset_id"], 0.80))
        wo = int(open_wo.get(a["asset_id"], 0))
        crit_weight = {"Critical": 1.0, "High": 0.85, "Medium": 0.65, "Low": 0.45}.get(a["criticality"], 0.65)
        score = (1 - h) * 0.6 + min(wo / 6.0, 1.0) * 0.25 + crit_weight * 0.15
        score = float(np.clip(score, 0.05, 0.98))
        if a["asset_id"] == DEMO_MOMENTS["rising_failure_pump"]:
            score = max(score, 0.86)
        failure_30d = float(np.clip(score * np.random.uniform(0.4, 0.7), 0.02, 0.65))
        if a["asset_id"] == DEMO_MOMENTS["rising_failure_pump"]:
            failure_30d = max(failure_30d, 0.42)
        risk_band = (
            "Critical" if score >= 0.80 else
            "High" if score >= 0.65 else
            "Medium" if score >= 0.45 else
            "Low"
        )
        recommended = {
            "Critical": "Engage operations now. Pre-stage spares. Validate redundancy.",
            "High": "Schedule executive review. Tighten inspection cadence.",
            "Medium": "Continue monitoring. Bring forward planned maintenance if trend persists.",
            "Low": "Maintain current cadence.",
        }[risk_band]
        rows.append({
            "asset_id": a["asset_id"],
            "asset_name": a["name"],
            "asset_type": a["asset_type"],
            "criticality": a["criticality"],
            "risk_score": round(score, 3),
            "risk_band": risk_band,
            "predicted_failure_30d": round(failure_30d, 3),
            "open_work_orders": wo,
            "health_index": round(h, 3),
            "recommended_action": recommended,
            "synthetic_demo_flag": True,
        })
    return pd.DataFrame(rows).sort_values("risk_score", ascending=False).reset_index(drop=True)


# ---------- water quality ----------

def gen_water_quality_samples(assets: pd.DataFrame) -> pd.DataFrame:
    plants = assets[assets["asset_type"].isin(["Water Treatment Plant", "Reservoir"])]
    rows = []
    n = 240
    for i in range(n):
        a = plants.sample(1, random_state=SEED + 100 + i).iloc[0]
        ts = TODAY - timedelta(hours=int(np.random.uniform(0, 14 * 24)))
        turb_base = 0.6
        if a["asset_id"] in DEMO_MOMENTS["turbidity_plants"] and ts > TODAY - timedelta(days=3):
            turb_base = 2.4
        turbidity = float(max(0.05, np.random.normal(turb_base, 0.6)))
        ph = float(np.random.normal(7.4, 0.18))
        chlorine = float(np.random.normal(0.85, 0.18))
        conductivity = float(np.random.normal(420, 35))
        temperature = float(np.random.normal(22.0, 2.5))
        e_coli = bool(np.random.random() < 0.005)
        zone = a["region"]
        if turbidity > 2.0 or e_coli:
            level = "Elevated"
        elif turbidity > 1.0:
            level = "Watch"
        else:
            level = "Normal"
        action_map = {
            "Normal": "Continue routine monitoring.",
            "Watch": "Increase sample frequency. Notify treatment supervisor.",
            "Elevated": "Review treatment process. Validate with operator. Notify water quality lead.",
        }
        rows.append({
            "sample_id": f"WQS-{i+1:05d}",
            "asset_id": a["asset_id"],
            "asset_name": a["name"],
            "sample_zone": zone,
            "sampled_at": ts.isoformat(),
            "turbidity_NTU": round(turbidity, 3),
            "pH": round(ph, 2),
            "chlorine_residual_mg_L": round(chlorine, 3),
            "conductivity_uS_cm": round(conductivity, 1),
            "temperature_c": round(temperature, 2),
            "e_coli_detected": e_coli,
            "alert_level": level,
            "recommended_action": action_map[level],
            "synthetic_demo_flag": True,
        })
    return pd.DataFrame(rows).sort_values("sampled_at", ascending=False).reset_index(drop=True)


def gen_treatment_plant_operations(assets: pd.DataFrame) -> pd.DataFrame:
    plants = assets[assets["asset_type"] == "Water Treatment Plant"]
    rows = []
    for _, p in plants.iterrows():
        cap = float(p["capacity_ml"])
        utilisation = float(np.clip(np.random.normal(0.74, 0.05), 0.4, 0.95))
        if p["asset_id"] in DEMO_MOMENTS["turbidity_plants"]:
            utilisation = min(utilisation + 0.06, 0.92)
        rows.append({
            "asset_id": p["asset_id"],
            "asset_name": p["name"],
            "region": p["region"],
            "design_capacity_ml_day": cap,
            "current_throughput_ml_day": round(cap * utilisation, 1),
            "utilisation_pct": round(utilisation * 100, 1),
            "operating_state": "Online" if utilisation > 0.5 else "Reduced",
            "synthetic_demo_flag": True,
        })
    return pd.DataFrame(rows)


def gen_turbidity_events(assets: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for plant_id in DEMO_MOMENTS["turbidity_plants"]:
        plant = assets[assets["asset_id"] == plant_id].iloc[0]
        for offset in range(0, 4):
            ts = TODAY - timedelta(hours=24 * offset + int(np.random.uniform(0, 12)))
            rows.append({
                "event_id": f"TURB-{plant_id}-{offset}",
                "asset_id": plant_id,
                "asset_name": plant["name"],
                "started_at": ts.isoformat(),
                "duration_hours": float(np.clip(np.random.normal(3.5, 1.2), 0.8, 8.0)),
                "peak_turbidity_NTU": float(np.clip(np.random.normal(2.6 + offset * 0.2, 0.4), 1.5, 4.5)),
                "status": "Resolved" if offset > 1 else "Active",
                "synthetic_demo_flag": True,
            })
    return pd.DataFrame(rows)


def gen_quality_alerts(samples: pd.DataFrame) -> pd.DataFrame:
    elevated = samples[samples["alert_level"].isin(["Elevated", "Watch"])].head(40).copy()
    elevated.insert(0, "alert_id", [f"WQA-{i+1:04d}" for i in range(len(elevated))])
    return elevated[["alert_id", "asset_id", "asset_name", "sample_zone", "sampled_at",
                     "alert_level", "turbidity_NTU", "recommended_action", "synthetic_demo_flag"]]


# ---------- flood scenarios ----------

def gen_flood_scenarios() -> pd.DataFrame:
    rows = [
        {
            "scenario_id": "FS-001",
            "scenario_name": "Severe Coastal Rainfall — 72 Hour Watch",
            "rainfall_forecast_mm_24h": 95,
            "rainfall_forecast_mm_72h": 280,
            "catchment_saturation_index": 0.82,
            "current_storage_percent": 78.5,
            "projected_storage_percent": 91.4,
            "release_required": True,
            "downstream_impact_score": 0.62,
            "recommended_actions": "Synthetic: convene flood operations review; pre-position field crews; brief retailers.",
            "action_owner": "Synthetic Operations Lead",
            "status": "Active demo scenario",
            "synthetic_demo_flag": True,
        },
        {
            "scenario_id": "FS-002",
            "scenario_name": "Moderate Inland Storm",
            "rainfall_forecast_mm_24h": 42,
            "rainfall_forecast_mm_72h": 90,
            "catchment_saturation_index": 0.55,
            "current_storage_percent": 64.2,
            "projected_storage_percent": 70.5,
            "release_required": False,
            "downstream_impact_score": 0.18,
            "recommended_actions": "Synthetic: monitor; no executive escalation required.",
            "action_owner": "Synthetic Duty Hydrologist",
            "status": "Reference scenario",
            "synthetic_demo_flag": True,
        },
        {
            "scenario_id": "FS-003",
            "scenario_name": "Slow-Moving Tropical Low",
            "rainfall_forecast_mm_24h": 70,
            "rainfall_forecast_mm_72h": 410,
            "catchment_saturation_index": 0.91,
            "current_storage_percent": 84.1,
            "projected_storage_percent": 98.6,
            "release_required": True,
            "downstream_impact_score": 0.84,
            "recommended_actions": "Synthetic: escalate to executive flood operations cell; coordinate with state agencies.",
            "action_owner": "Synthetic Flood Operations Lead",
            "status": "Stress test scenario",
            "synthetic_demo_flag": True,
        },
        {
            "scenario_id": "FS-004",
            "scenario_name": "Dry Lead-In, Sudden Burst",
            "rainfall_forecast_mm_24h": 120,
            "rainfall_forecast_mm_72h": 160,
            "catchment_saturation_index": 0.30,
            "current_storage_percent": 52.0,
            "projected_storage_percent": 58.4,
            "release_required": False,
            "downstream_impact_score": 0.22,
            "recommended_actions": "Synthetic: monitor turbidity at downstream WTPs; verify analyser availability.",
            "action_owner": "Synthetic Water Quality Lead",
            "status": "Reference scenario",
            "synthetic_demo_flag": True,
        },
        {
            "scenario_id": "FS-005",
            "scenario_name": "Cyclone Decay Track — Extended Watch",
            "rainfall_forecast_mm_24h": 60,
            "rainfall_forecast_mm_72h": 320,
            "catchment_saturation_index": 0.74,
            "current_storage_percent": 80.0,
            "projected_storage_percent": 92.8,
            "release_required": True,
            "downstream_impact_score": 0.71,
            "recommended_actions": "Synthetic: stand up extended ops; align with retailers and emergency services.",
            "action_owner": "Synthetic Operations Lead",
            "status": "Stress test scenario",
            "synthetic_demo_flag": True,
        },
    ]
    return pd.DataFrame(rows)


def gen_catchment_conditions(assets: pd.DataFrame) -> pd.DataFrame:
    catchments = assets[assets["asset_type"] == "Catchment Monitoring Site"]
    rows = []
    for _, c in catchments.iterrows():
        rows.append({
            "asset_id": c["asset_id"],
            "asset_name": c["name"],
            "region": c["region"],
            "saturation_index": round(float(np.clip(np.random.normal(0.65, 0.12), 0.2, 0.98)), 2),
            "antecedent_rainfall_mm_7d": round(float(np.clip(np.random.normal(48, 18), 0, 220)), 1),
            "stream_height_m": round(float(np.clip(np.random.normal(2.2, 0.6), 0.5, 5.0)), 2),
            "synthetic_demo_flag": True,
        })
    return pd.DataFrame(rows)


def gen_dam_release_simulation() -> pd.DataFrame:
    rows = []
    hours = list(range(0, 73, 3))
    for h in hours:
        base = 78 + h * 0.18
        rows.append({
            "scenario_id": "FS-001",
            "hour": h,
            "projected_storage_percent": round(min(99.0, base + np.random.normal(0, 0.4)), 2),
            "projected_release_ml": round(max(0, np.random.normal(220 + h * 1.5, 30)), 1),
            "synthetic_demo_flag": True,
        })
    return pd.DataFrame(rows)


def gen_incident_actions() -> pd.DataFrame:
    rows = [
        {"action_id": "ACT-001", "scenario_id": "FS-001",
         "action": "Validate latest rainfall and inflow observations with duty hydrologist.",
         "owner": "Duty Hydrologist (synthetic)", "status": "Pending", "due_in_hours": 4,
         "synthetic_demo_flag": True},
        {"action_id": "ACT-002", "scenario_id": "FS-001",
         "action": "Brief water quality leads on turbidity contingency at North Pine and Landers Shute (synthetic).",
         "owner": "Water Quality Lead (synthetic)", "status": "Pending", "due_in_hours": 6,
         "synthetic_demo_flag": True},
        {"action_id": "ACT-003", "scenario_id": "FS-001",
         "action": "Confirm spares and crew readiness for synthetic Caboolture Pump Station.",
         "owner": "Maintenance Lead (synthetic)", "status": "In Progress", "due_in_hours": 8,
         "synthetic_demo_flag": True},
        {"action_id": "ACT-004", "scenario_id": "FS-001",
         "action": "Draft retailer customer communication aligned to synthetic protocol.",
         "owner": "Stakeholder Comms (synthetic)", "status": "Pending", "due_in_hours": 12,
         "synthetic_demo_flag": True},
    ]
    return pd.DataFrame(rows)


# ---------- finance / capital ----------

def gen_capital_projects(assets: pd.DataFrame) -> pd.DataFrame:
    rows = []
    project_types = [
        "Pump replacement", "Pipeline renewal", "Treatment plant uprate",
        "Reservoir refurbishment", "Catchment monitoring expansion",
        "Resilience and climate adaptation", "Cyber and OT security",
        "Network metering uplift", "Data platform modernisation",
        "Recycled water pre-investment",
    ]
    n = 12
    for i in range(n):
        a = assets.sample(1, random_state=SEED + 200 + i).iloc[0]
        ptype = project_types[i % len(project_types)]
        cost = int(np.random.uniform(2.5, 38) * 1_000_000)
        risk_reduction = float(np.clip(np.random.normal(0.6, 0.18), 0.05, 0.98))
        if a["asset_id"] == DEMO_MOMENTS["risk_reducing_project_asset"]:
            risk_reduction = max(risk_reduction, 0.82)
        delivery_risk = random.choice(["Low", "Medium", "Medium", "High"])
        community_impact = random.choice(["Low", "Medium", "High"])
        priority = (
            "P1" if risk_reduction > 0.7 and delivery_risk != "High" else
            "P2" if risk_reduction > 0.5 else
            "P3"
        )
        rows.append({
            "project_id": f"CAP-{i+1:03d}",
            "project_name": f"{ptype} — {a['name']}",
            "asset_id": a["asset_id"],
            "asset_name": a["name"],
            "project_type": ptype,
            "estimated_cost_aud": cost,
            "risk_reduction_score": round(risk_reduction, 3),
            "delivery_risk": delivery_risk,
            "community_impact": community_impact,
            "recommended_priority": priority,
            "synthetic_demo_flag": True,
        })
    return pd.DataFrame(rows)


def gen_opex_costs(assets: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for _, a in assets.iterrows():
        for q in ["Q1 FY26", "Q2 FY26", "Q3 FY26"]:
            base = {
                "Dam": 1.4, "Water Treatment Plant": 1.8, "Pump Station": 0.45,
                "Reservoir": 0.28, "Pipeline Segment": 0.32,
                "Desalination Plant": 2.4, "Recycled Water Plant": 2.1,
                "Catchment Monitoring Site": 0.12, "Recreation Site": 0.18,
            }.get(a["asset_type"], 0.4)
            rows.append({
                "asset_id": a["asset_id"],
                "asset_name": a["name"],
                "quarter": q,
                "opex_aud_m": round(float(base * np.random.uniform(0.85, 1.15)), 2),
                "synthetic_demo_flag": True,
            })
    return pd.DataFrame(rows)


def gen_asset_investment_priorities(projects: pd.DataFrame) -> pd.DataFrame:
    df = projects.copy()
    df["score"] = (df["risk_reduction_score"] * 0.7 + (df["estimated_cost_aud"].rank(ascending=False) / len(df)) * 0.3).round(3)
    df = df.sort_values("score", ascending=False).reset_index(drop=True)
    df.insert(0, "rank", df.index + 1)
    return df[["rank", "project_id", "project_name", "asset_name", "estimated_cost_aud",
               "risk_reduction_score", "recommended_priority", "score", "synthetic_demo_flag"]]


# ---------- hourly telemetry ----------

def gen_hourly_telemetry(assets: pd.DataFrame) -> pd.DataFrame:
    rows = []
    times = _date_range(HOURLY_START, TODAY, freq="h")
    sample = assets.sample(min(8, len(assets)), random_state=SEED).reset_index(drop=True)
    for _, a in sample.iterrows():
        base_flow = {
            "Pump Station": 80, "Pipeline Segment": 120,
            "Water Treatment Plant": 200, "Dam": 180, "Reservoir": 60,
            "Desalination Plant": 130, "Recycled Water Plant": 150,
        }.get(a["asset_type"], 50)
        for t in times:
            flow = max(0.0, np.random.normal(base_flow, base_flow * 0.05))
            pressure = max(0.0, np.random.normal(420, 12))
            vibration = max(0.0, np.random.normal(2.4, 0.4))
            if a["asset_id"] == DEMO_MOMENTS["rising_failure_pump"] and t > TODAY - timedelta(days=3):
                vibration = max(vibration, np.random.normal(4.6, 0.5))
            rows.append({
                "asset_id": a["asset_id"],
                "asset_name": a["name"],
                "ts": t.isoformat(),
                "flow_lps": round(flow, 1),
                "pressure_kpa": round(pressure, 1),
                "vibration_mm_s": round(vibration, 2),
                "synthetic_demo_flag": True,
            })
    return pd.DataFrame(rows)


# ---------- AI interaction audit (seeded) ----------

def gen_ai_audit_seed() -> pd.DataFrame:
    rows = [
        {
            "trace_id": "trace-20260528-001",
            "user_id": "exec.demo@seqwater.demo",
            "timestamp": (TODAY - timedelta(hours=20)).isoformat(),
            "question": "What are the top operational risks over the next 72 hours?",
            "tools_used": "get_top_asset_risks; get_water_security_summary; retrieve_documents",
            "sources_used": "asset_risk_scores; dam_storage_daily; rainfall_forecast; synthetic_dam_operations_playbook",
            "confidence": "Medium",
            "response_summary": "Synthetic: elevated catchment rainfall, turbidity watch at WTP-002, rising failure trend at PMP-014.",
            "human_validation_required": True,
            "synthetic_demo_flag": True,
        },
        {
            "trace_id": "trace-20260528-002",
            "user_id": "ops.demo@seqwater.demo",
            "timestamp": (TODAY - timedelta(hours=12)).isoformat(),
            "question": "Generate a board-ready situation briefing.",
            "tools_used": "generate_executive_briefing; get_water_security_summary",
            "sources_used": "asset_risk_scores; flood_scenarios; water_quality_samples; capital_projects",
            "confidence": "Medium",
            "response_summary": "Synthetic briefing generated with risks, recommended actions, and assumptions.",
            "human_validation_required": True,
            "synthetic_demo_flag": True,
        },
    ]
    return pd.DataFrame(rows)


# ---------- runner ----------

def main() -> None:
    print(f"Seqwater AI Command Centre — synthetic data generator (seed={SEED})")
    assets = gen_assets()
    locations = gen_asset_locations()
    storage = gen_dam_storage_daily(assets)
    rain_obs = gen_rainfall_observations(assets)
    rain_fc = gen_rainfall_forecast(assets)
    demand = gen_demand_forecast()
    supply = gen_supply_forecast()
    transfers = gen_grid_transfer_recommendations()
    health = gen_asset_health_daily(assets)
    work_orders = gen_maintenance_work_orders(assets)
    risk = gen_asset_risk_scores(assets, work_orders, health)
    samples = gen_water_quality_samples(assets)
    plant_ops = gen_treatment_plant_operations(assets)
    turb_events = gen_turbidity_events(assets)
    quality_alerts = gen_quality_alerts(samples)
    flood_scenarios = gen_flood_scenarios()
    catchments = gen_catchment_conditions(assets)
    dam_release = gen_dam_release_simulation()
    incident_actions = gen_incident_actions()
    projects = gen_capital_projects(assets)
    opex = gen_opex_costs(assets)
    priorities = gen_asset_investment_priorities(projects)
    telemetry = gen_hourly_telemetry(assets)
    audit = gen_ai_audit_seed()

    _save(assets, "assets")
    _save(locations, "asset_locations")
    _save(storage, "dam_storage_daily")
    _save(rain_obs, "rainfall_observations")
    _save(rain_fc, "rainfall_forecast")
    _save(demand, "demand_forecast")
    _save(supply, "supply_forecast")
    _save(transfers, "grid_transfer_recommendations")
    _save(health, "asset_health_daily")
    _save(work_orders, "maintenance_work_orders")
    _save(risk, "asset_risk_scores")
    _save(samples, "water_quality_samples")
    _save(plant_ops, "treatment_plant_operations")
    _save(turb_events, "turbidity_events")
    _save(quality_alerts, "quality_alerts")
    _save(flood_scenarios, "flood_scenarios")
    _save(catchments, "catchment_conditions")
    _save(dam_release, "dam_release_simulation")
    _save(incident_actions, "incident_actions")
    _save(projects, "capital_projects")
    _save(opex, "opex_costs")
    _save(priorities, "asset_investment_priorities")
    _save(telemetry, "hourly_telemetry")
    _save(audit, "ai_interaction_audit")

    manifest = {
        "seed": SEED,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "synthetic_demo_flag": True,
        "tables": [p.stem for p in OUT_DIR.glob("*.csv")],
        "demo_moments": DEMO_MOMENTS,
    }
    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print(f"  wrote manifest.json")
    print("Synthetic data generation complete.")


if __name__ == "__main__":
    main()
