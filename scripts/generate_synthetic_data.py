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


# Real Seqwater bulk-water asset register with real published full-supply
# volumes and real geographic coordinates (cross-checked against the public
# asset and dam-levels pages on https://www.seqwater.com.au and Seqwater's
# published Drinking Water Quality Reports as at 29 May 2026, ~9-10pm AEST).
# All operational *values* in the rest of this generator are SYNTHETIC, but
# every asset_id maps to a real Seqwater asset at its real location, and the
# latest snapshot in ``CURRENT_DAM_SNAPSHOT`` (below) matches the published
# values exactly, so the map and storyline stay credible.
ASSETS: list[AssetSpec] = [
    # ----- Dams (real bulk-storage estate) ------------------------------------
    # 25 Seqwater-published bulk-storage dams, FSVs match the 29/05/2026 snapshot.
    AssetSpec("DAM-001", "Wivenhoe Dam",                          "Dam", "Brisbane Valley",  -27.3953, 152.6094, 1_165_240, "Critical", 1985),
    AssetSpec("DAM-002", "Somerset Dam",                          "Dam", "Brisbane Valley",  -27.1163, 152.5552,   379_849, "Critical", 1959),
    AssetSpec("DAM-003", "North Pine Dam (Lake Samsonvale)",      "Dam", "Brisbane North",   -27.2723, 152.9395,   214_302, "Critical", 1976),
    AssetSpec("DAM-004", "Hinze Dam",                             "Dam", "Gold Coast",       -28.0540, 153.2820,   310_730, "Critical", 1976),
    AssetSpec("DAM-005", "Baroon Pocket Dam",                     "Dam", "Sunshine Coast",   -26.7000, 152.8750,    61_000, "High",     1989),
    AssetSpec("DAM-006", "Cooloolabin Dam",                       "Dam", "Sunshine Coast",   -26.6120, 152.9080,     8_183, "Medium",   1979),
    AssetSpec("DAM-007", "Ewen Maddock Dam",                      "Dam", "Sunshine Coast",   -26.7760, 153.0200,    16_587, "Medium",   1976),
    AssetSpec("DAM-008", "Lake Macdonald Dam (Six Mile Creek)",   "Dam", "Sunshine Coast",   -26.3780, 152.9290,     8_018, "High",     1965),
    AssetSpec("DAM-009", "Wappa Dam",                             "Dam", "Sunshine Coast",   -26.6170, 152.9490,     4_694, "Medium",   1962),
    AssetSpec("DAM-010", "Borumba Dam",                           "Dam", "Sunshine Coast",   -26.5240, 152.5810,    46_000, "High",     1964),
    AssetSpec("DAM-011", "Maroon Dam",                            "Dam", "Scenic Rim",       -28.1790, 152.6600,    44_319, "High",     1974),
    AssetSpec("DAM-012", "Moogerah Dam",                          "Dam", "Scenic Rim",       -28.0410, 152.5530,    83_765, "High",     1961),
    AssetSpec("DAM-013", "Atkinson Dam",                          "Dam", "Lockyer Valley",   -27.4050, 152.4340,    30_401, "Medium",   1970),
    AssetSpec("DAM-014", "Lake Manchester Dam",                   "Dam", "Brisbane West",    -27.4830, 152.7700,    26_217, "Medium",   1916),
    AssetSpec("DAM-015", "Sideling Creek Dam (Lake Kurwongbah)",  "Dam", "Brisbane North",   -27.2430, 152.9530,    14_192, "Medium",   1957),
    AssetSpec("DAM-016", "Leslie Harrison Dam",                   "Dam", "Bayside",          -27.5540, 153.2310,    13_206, "Medium",   1968),
    AssetSpec("DAM-017", "Little Nerang Dam",                     "Dam", "Gold Coast",       -28.1760, 153.2280,     6_705, "Medium",   1963),
    AssetSpec("DAM-018", "Bill Gunn Dam (Lake Dyer)",             "Dam", "Lockyer Valley",   -27.6200, 152.2650,     6_947, "Low",      1983),
    AssetSpec("DAM-019", "Cedar Pocket Dam",                      "Dam", "Mary Valley",      -26.2086, 152.7647,       735, "Low",      1970),
    AssetSpec("DAM-020", "Clarendon Dam",                         "Dam", "Lockyer Valley",   -27.5870, 152.2000,    24_276, "Medium",   1979),
    AssetSpec("DAM-021", "Enoggera Reservoir",                    "Dam", "Brisbane West",    -27.4396, 152.9270,     4_262, "Low",      1866),
    AssetSpec("DAM-022", "Gold Creek Reservoir",                  "Dam", "Brisbane West",    -27.4530, 152.8950,       801, "Low",      1885),
    AssetSpec("DAM-023", "Nindooinbah Dam (Lake Nindooinbah)",    "Dam", "Scenic Rim",       -28.0233, 152.8987,       213, "Low",      1990),
    AssetSpec("DAM-024", "Poona Dam",                             "Dam", "Brisbane Valley",  -26.9333, 152.5167,       655, "Low",      1957),
    AssetSpec("DAM-025", "Wyaralong Dam",                         "Dam", "Scenic Rim",       -27.9750, 152.8567,   102_883, "High",     2011),

    # ----- Water Treatment Plants (real published nameplate capacities) -------
    AssetSpec("WTP-001", "Mount Crosby Westbank WTP",   "Water Treatment Plant", "Brisbane West",  -27.5350, 152.7930, 750, "Critical", 1893),
    AssetSpec("WTP-002", "Mount Crosby Eastbank WTP",   "Water Treatment Plant", "Brisbane West",  -27.5320, 152.8080, 750, "Critical", 1990),
    AssetSpec("WTP-003", "North Pine WTP",              "Water Treatment Plant", "Brisbane North", -27.2730, 152.9460, 220, "Critical", 1981),
    AssetSpec("WTP-004", "Landers Shute WTP",           "Water Treatment Plant", "Sunshine Coast", -26.7320, 152.8980, 136, "High",     1988),
    AssetSpec("WTP-005", "Image Flat WTP",              "Water Treatment Plant", "Sunshine Coast", -26.6380, 152.9060,  32, "Medium",   1976),
    AssetSpec("WTP-006", "Mudgeeraba WTP",              "Water Treatment Plant", "Gold Coast",     -28.0770, 153.3470, 218, "High",     1980),
    AssetSpec("WTP-007", "Molendinar WTP",              "Water Treatment Plant", "Gold Coast",     -28.0050, 153.3760, 225, "High",     1986),
    AssetSpec("WTP-008", "Capalaba WTP",                "Water Treatment Plant", "Bayside",        -27.5200, 153.1970, 165, "High",     1972),
    AssetSpec("WTP-009", "Banksia Beach WTP",           "Water Treatment Plant", "Brisbane North", -27.0610, 153.1570,  10, "Medium",   1995),
    AssetSpec("WTP-010", "Petrie WTP",                  "Water Treatment Plant", "Brisbane North", -27.2650, 152.9850,  20, "Medium",   1968),

    # ----- Specialised supply assets ------------------------------------------
    AssetSpec("DES-001", "Gold Coast Desalination Plant",                 "Desalination Plant",   "Gold Coast",    -28.1580, 153.5020, 133, "Critical", 2009),
    AssetSpec("RWS-001", "Bundamba Advanced Water Treatment Plant",       "Recycled Water Plant", "Brisbane West", -27.6040, 152.8570,  66, "Critical", 2007),
    AssetSpec("RWS-002", "Luggage Point Advanced Water Treatment Plant",  "Recycled Water Plant", "Brisbane Bay",  -27.3910, 153.1430,  66, "High",     2008),

    # ----- SEQ Water Grid pump stations / bulk transfer nodes -----------------
    AssetSpec("PMP-001", "Park Ridge Pump Station (Southern Regional Pipeline)",
              "Pump Station", "Logan",          -27.7040, 153.0380, None, "High",     2008),
    AssetSpec("PMP-014", "Caboolture Pump Station (Northern Pipeline Interconnector)",
              "Pump Station", "Brisbane North", -27.0850, 152.9530, None, "Critical", 2008),

    # ----- Catchment monitoring sites (real catchment names) ------------------
    AssetSpec("CMS-001", "Brisbane River Upper Catchment Monitoring Site",   "Catchment Monitoring Site", "Lockyer Valley",      -27.1000, 152.3000, None, "Medium", 2010),
    AssetSpec("CMS-002", "Stanley River Catchment Monitoring Site",          "Catchment Monitoring Site", "Sunshine Coast",      -26.8500, 152.6500, None, "Medium", 2010),
    AssetSpec("CMS-003", "Pine River (North Branch) Catchment Monitoring Site","Catchment Monitoring Site", "Brisbane North",    -27.2000, 152.8500, None, "Medium", 2012),
    AssetSpec("CMS-004", "Coomera River Catchment Monitoring Site",          "Catchment Monitoring Site", "Gold Coast",          -28.1000, 153.2000, None, "Medium", 2012),
    AssetSpec("CMS-005", "Logan River (Upper) Catchment Monitoring Site",    "Catchment Monitoring Site", "Scenic Rim",          -28.2500, 152.6500, None, "Medium", 2014),

    # ----- Recreation areas (Seqwater is the real recreation manager) --------
    AssetSpec("REC-001", "Cormorant Bay — Lake Wivenhoe Recreation Area", "Recreation Site", "Brisbane Valley", -27.3930, 152.6230, None, "Low", 1985),
    AssetSpec("REC-002", "Hinze Dam Recreation Area",                     "Recreation Site", "Gold Coast",      -28.0540, 153.2820, None, "Low", 1976),
    AssetSpec("REC-003", "Lake Atkinson Recreation Area",                 "Recreation Site", "Lockyer Valley",  -27.4050, 152.4340, None, "Low", 1995),
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
    # Catchments / dams that receive the synthetic developing weather event.
    "rainfall_event_assets": ["DAM-001", "DAM-002", "DAM-003", "DAM-005", "CMS-001", "CMS-002", "CMS-003"],
    # Plants we want to put on a synthetic turbidity watch (real assets).
    "turbidity_plants": ["WTP-003", "WTP-004"],  # North Pine WTP + Landers Shute WTP
    # The pump station with a synthetic rising-failure trend.
    "rising_failure_pump": "PMP-014",  # Caboolture Pump Station (NPI)
    # The dam approaching a synthetic attention threshold during the demo.
    "attention_dam": "DAM-003",  # North Pine Dam (currently at reduced FSL, ~51%)
    # The dam that is critically low in the real published snapshot (40.2%).
    "critically_low_dam": "DAM-008",  # Lake Macdonald (mid-upgrade)
    # The asset whose synthetic capital project shows the largest risk reduction.
    "risk_reducing_project_asset": "PMP-014",
}


# ---------- authoritative current snapshot --------------------------------
# Published Seqwater dam-levels snapshot, 29 May 2026, between 21:00 and 22:01
# AEST (UTC+10). Sourced from the public Seqwater dam-levels page; full-supply
# volumes (ML), current volumes (ML), % full, the latest observation time, and
# whether the dam is spilling are all taken verbatim. The synthetic time
# series in ``gen_dam_storage_daily`` is anchored to these values on the
# final day so the demo storyline matches the live snapshot exactly.
CURRENT_DAM_SNAPSHOT: dict[str, dict[str, Any]] = {
    "DAM-001": {"name": "Wivenhoe Dam",                          "fsv_ml": 1_165_240, "current_ml": 1_014_550, "pct":  87.1, "observed_local": "2026-05-29T21:46+10:00", "spilling": False, "comment": ""},
    "DAM-002": {"name": "Somerset Dam",                          "fsv_ml":   379_849, "current_ml":   301_908, "pct":  79.5, "observed_local": "2026-05-29T21:56+10:00", "spilling": False, "comment": ""},
    "DAM-003": {"name": "North Pine Dam (Lake Samsonvale)",      "fsv_ml":   214_302, "current_ml":   109_528, "pct":  51.1, "observed_local": "2026-05-29T21:00+10:00", "spilling": False, "comment": ""},
    "DAM-004": {"name": "Hinze Dam",                             "fsv_ml":   310_730, "current_ml":   317_799, "pct": 102.3, "observed_local": "2026-05-29T22:01+10:00", "spilling": True,  "comment": "Dam is spilling"},
    "DAM-005": {"name": "Baroon Pocket Dam",                     "fsv_ml":    61_000, "current_ml":    61_419, "pct": 100.7, "observed_local": "2026-05-29T21:47+10:00", "spilling": True,  "comment": "Dam is spilling"},
    "DAM-006": {"name": "Cooloolabin Dam",                       "fsv_ml":     8_183, "current_ml":     8_017, "pct":  98.0, "observed_local": "2026-05-29T21:31+10:00", "spilling": False, "comment": ""},
    "DAM-007": {"name": "Ewen Maddock Dam",                      "fsv_ml":    16_587, "current_ml":    16_951, "pct": 102.2, "observed_local": "2026-05-29T21:03+10:00", "spilling": True,  "comment": "Dam is spilling"},
    "DAM-008": {"name": "Lake Macdonald Dam (Six Mile Creek)",   "fsv_ml":     8_018, "current_ml":     3_223, "pct":  40.2, "observed_local": "2026-05-29T22:01+10:00", "spilling": False, "comment": ""},
    "DAM-009": {"name": "Wappa Dam",                             "fsv_ml":     4_694, "current_ml":     4_748, "pct": 101.1, "observed_local": "2026-05-29T21:00+10:00", "spilling": True,  "comment": "Dam is spilling"},
    "DAM-010": {"name": "Borumba Dam",                           "fsv_ml":    46_000, "current_ml":    46_048, "pct": 100.1, "observed_local": "2026-05-29T21:39+10:00", "spilling": True,  "comment": "Dam is spilling"},
    "DAM-011": {"name": "Maroon Dam",                            "fsv_ml":    44_319, "current_ml":    43_823, "pct":  98.9, "observed_local": "2026-05-29T21:00+10:00", "spilling": False, "comment": ""},
    "DAM-012": {"name": "Moogerah Dam",                          "fsv_ml":    83_765, "current_ml":    69_687, "pct":  83.2, "observed_local": "2026-05-29T21:00+10:00", "spilling": False, "comment": ""},
    "DAM-013": {"name": "Atkinson Dam",                          "fsv_ml":    30_401, "current_ml":    23_063, "pct":  75.9, "observed_local": "2026-05-29T21:50+10:00", "spilling": False, "comment": ""},
    "DAM-014": {"name": "Lake Manchester Dam",                   "fsv_ml":    26_217, "current_ml":    23_336, "pct":  89.0, "observed_local": "2026-05-29T21:00+10:00", "spilling": False, "comment": ""},
    "DAM-015": {"name": "Sideling Creek Dam (Lake Kurwongbah)",  "fsv_ml":    14_192, "current_ml":    14_517, "pct": 102.3, "observed_local": "2026-05-29T21:36+10:00", "spilling": True,  "comment": "Dam is spilling"},
    "DAM-016": {"name": "Leslie Harrison Dam",                   "fsv_ml":    13_206, "current_ml":    13_720, "pct": 103.9, "observed_local": "2026-05-29T21:00+10:00", "spilling": True,  "comment": "Dam is spilling"},
    "DAM-017": {"name": "Little Nerang Dam",                     "fsv_ml":     6_705, "current_ml":     6_786, "pct": 101.2, "observed_local": "2026-05-29T21:50+10:00", "spilling": True,  "comment": "Dam is spilling"},
    "DAM-018": {"name": "Bill Gunn Dam (Lake Dyer)",             "fsv_ml":     6_947, "current_ml":     5_883, "pct":  84.7, "observed_local": "2026-05-29T21:00+10:00", "spilling": False, "comment": ""},
    "DAM-019": {"name": "Cedar Pocket Dam",                      "fsv_ml":       735, "current_ml":       740, "pct": 100.7, "observed_local": "2026-05-29T21:00+10:00", "spilling": True,  "comment": "Dam is spilling"},
    "DAM-020": {"name": "Clarendon Dam",                         "fsv_ml":    24_276, "current_ml":    20_511, "pct":  84.5, "observed_local": "2026-05-29T21:00+10:00", "spilling": False, "comment": ""},
    "DAM-021": {"name": "Enoggera Reservoir",                    "fsv_ml":     4_262, "current_ml":     4_380, "pct": 102.8, "observed_local": "2026-05-29T21:50+10:00", "spilling": True,  "comment": "Dam is spilling"},
    "DAM-022": {"name": "Gold Creek Reservoir",                  "fsv_ml":       801, "current_ml":       680, "pct":  84.8, "observed_local": "2026-05-29T21:00+10:00", "spilling": False, "comment": ""},
    "DAM-023": {"name": "Nindooinbah Dam (Lake Nindooinbah)",    "fsv_ml":       213, "current_ml":       206, "pct":  96.5, "observed_local": "2026-05-29T21:00+10:00", "spilling": False, "comment": ""},
    "DAM-024": {"name": "Poona Dam",                             "fsv_ml":       655, "current_ml":       458, "pct":  69.9, "observed_local": "2026-05-29T21:00+10:00", "spilling": False, "comment": ""},
    "DAM-025": {"name": "Wyaralong Dam",                         "fsv_ml":   102_883, "current_ml":   100_479, "pct":  97.7, "observed_local": "2026-05-29T21:47+10:00", "spilling": False, "comment": ""},
}


# Dedicated flood-storage compartments above FSV for the two flood-mitigation
# dams. Values are the published 29/05/2026 snapshot — both compartments are
# currently 0% in use (the spilling event has not consumed flood storage).
CURRENT_FLOOD_STORAGE: list[dict[str, Any]] = [
    {
        "asset_id": "DAM-002",
        "asset_name": "Somerset Dam",
        "total_flood_storage_ml": 705_000,
        "flood_storage_in_use_pct": 0.0,
        "flood_storage_available_pct": 100.0,
        "observed_local": "2026-05-29T21:56+10:00",
    },
    {
        "asset_id": "DAM-001",
        "asset_name": "Wivenhoe Dam",
        "total_flood_storage_ml": 2_203_000,
        "flood_storage_in_use_pct": 0.0,
        "flood_storage_available_pct": 100.0,
        "observed_local": "2026-05-29T21:46+10:00",
    },
]


# ---------- dam storage ----------

def gen_dam_storage_daily(assets: pd.DataFrame) -> pd.DataFrame:
    """Synthetic daily dam-storage time series.

    The final row for every dam is anchored exactly to the published
    Seqwater 29/05/2026 snapshot in ``CURRENT_DAM_SNAPSHOT``. Prior days
    are a smooth synthetic ramp from a soft 180-day baseline up to the
    snapshot value, with a wet-event lift over the last ~10 days so dams
    that are currently spilling have a credible inflow pattern.
    """
    dams = assets[assets["asset_type"] == "Dam"]
    dates = _date_range(START_DATE, TODAY + timedelta(days=1))
    n = len(dates)
    rows = []
    for _, dam in dams.iterrows():
        full = float(dam["capacity_ml"])
        asset_id = dam["asset_id"]
        snap = CURRENT_DAM_SNAPSHOT.get(asset_id)
        # Target value for "today" — exactly matches the published snapshot
        # (in fractional terms) when we have one, otherwise falls back to a
        # plausible synthetic baseline.
        target_frac = (snap["pct"] / 100.0) if snap else 0.78
        # Pick a soft 180-day baseline that is lower for the spilling /
        # near-full dams (so the trajectory feels like a real wet event
        # filling them) and roughly flat for the dry / low-storage dams.
        if snap and snap["spilling"]:
            start_frac = max(0.55, target_frac - 0.20)
        elif snap and target_frac < 0.55:
            start_frac = target_frac + 0.05  # was a bit higher before drawdown
        else:
            start_frac = max(0.40, target_frac - 0.08)

        ramp = np.linspace(start_frac, target_frac, n)
        # Demo moment: attention dam (North Pine) trends up over the last 30
        # days as the wet event develops.
        if asset_id == DEMO_MOMENTS["attention_dam"]:
            tail = np.linspace(0, 0.05, 30)
            ramp[-30:] = ramp[-30:] + tail
        # Critically low dam (Lake Macdonald): keep the slow drawdown trend.
        if asset_id == DEMO_MOMENTS["critically_low_dam"]:
            tail = np.linspace(0, -0.04, 60)
            ramp[-60:] = ramp[-60:] + tail
        # Wet-event lift across the last ~10 days for spilling dams.
        if snap and snap["spilling"]:
            wet_tail = np.linspace(0, 0.06, 10)
            ramp[-10:] = ramp[-10:] + wet_tail

        seasonal = 0.015 * np.sin(np.linspace(0, 1.4 * math.pi, n))
        noise = np.random.normal(0, 0.006, n)
        traj = ramp + seasonal + noise
        # Clamp to a plausible band but allow >100% for spilling dams.
        upper = 1.06 if (snap and snap["spilling"]) else 0.99
        traj = np.clip(traj, 0.25, upper)
        # Anchor the FINAL day exactly to the snapshot percentage so the
        # demo always shows the live published value as "today".
        traj[-1] = target_frac

        for i, d in enumerate(dates):
            storage_pct = float(traj[i])
            current_ml = full * storage_pct
            inflow = max(0.0, np.random.normal(180, 90))
            outflow = max(0.0, np.random.normal(160, 70))
            is_today = (i == n - 1)
            is_spilling = bool(snap and snap["spilling"]) if is_today else (storage_pct >= 1.0)
            # Use the published current_ml on the final day so the snapshot
            # column-for-column matches the Seqwater dam-levels page.
            if is_today and snap:
                current_ml = float(snap["current_ml"])
                storage_pct = snap["pct"] / 100.0
            rows.append({
                "asset_id": asset_id,
                "asset_name": dam["name"],
                "date": d.date().isoformat(),
                "current_storage_ml": round(current_ml, 1),
                "full_supply_ml": full,
                "storage_percent": round(storage_pct * 100, 2),
                "inflow_ml": round(inflow, 1),
                "outflow_ml": round(outflow, 1),
                "is_spilling": is_spilling,
                "synthetic_demo_flag": True,
            })
    return pd.DataFrame(rows)


# ---------- live dam-levels & flood-storage snapshots ---------------------

def gen_dam_levels_current(assets: pd.DataFrame) -> pd.DataFrame:
    """Snapshot of the published Seqwater dam-levels page at 29/05/2026 ~21:00 AEST.

    This mirrors the columns of the public Seqwater dam-levels table so it can
    be displayed verbatim by the UI and queried by the AquaIQ agent. Every
    row is real published data; the ``synthetic_demo_flag`` reflects that the
    *surrounding* operational telemetry is synthetic, not this snapshot.
    """
    rows = []
    by_id = {a["asset_id"]: a for _, a in assets.iterrows()}
    for asset_id, snap in CURRENT_DAM_SNAPSHOT.items():
        meta = by_id.get(asset_id, {})
        rows.append({
            "asset_id": asset_id,
            "asset_name": snap["name"],
            "region": meta.get("region", ""),
            "full_supply_ml": snap["fsv_ml"],
            "current_volume_ml": snap["current_ml"],
            "percent_full": snap["pct"],
            "latest_observation_local": snap["observed_local"],
            "is_spilling": snap["spilling"],
            "comment": snap["comment"],
            "source": "Seqwater dam levels (published)",
            "synthetic_demo_flag": False,
        })
    df = pd.DataFrame(rows).sort_values("asset_name").reset_index(drop=True)
    return df


def gen_flood_storage_current() -> pd.DataFrame:
    """Snapshot of dedicated flood-storage compartments at Somerset and Wivenhoe."""
    rows = [{**r, "source": "Seqwater flood storage (published)", "synthetic_demo_flag": False}
            for r in CURRENT_FLOOD_STORAGE]
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
         "rationale": "Synthetic: balance treatment headroom via the Northern Pipeline Interconnector ahead of forecast rainfall window.",
         "confidence": "Medium", "synthetic_demo_flag": True},
        {"from_region": "Brisbane Valley", "to_region": "Gold Coast", "grid_transfer_ml_day": 22.0,
         "rationale": "Synthetic: pre-position storage via the Southern Regional Water Pipeline during the synthetic turbidity watch.",
         "confidence": "Medium", "synthetic_demo_flag": True},
        {"from_region": "Brisbane West", "to_region": "Bayside", "grid_transfer_ml_day": 14.5,
         "rationale": "Synthetic: maintain Mount Crosby blend ratios into the Capalaba zone ahead of the demand peak.",
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
    plants = assets[assets["asset_type"].isin([
        "Water Treatment Plant", "Desalination Plant", "Recycled Water Plant",
    ])]
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
            "response_summary": "Synthetic: elevated catchment rainfall, turbidity watch at North Pine WTP, rising failure trend at Caboolture Pump Station (NPI).",
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
    dam_levels_current = gen_dam_levels_current(assets)
    flood_storage_current = gen_flood_storage_current()
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
    _save(dam_levels_current, "dam_levels_current")
    _save(flood_storage_current, "flood_storage_current")
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
