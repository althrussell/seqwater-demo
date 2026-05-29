"""Data loader.

Strategy:

1. ``LocalDataLoader``  — loads CSV files from ``data/synthetic/`` into pandas
   DataFrames, with results cached for the process lifetime.
2. ``DatabricksDataLoader`` — runs SQL via the Databricks SQL connector against
   the configured Unity Catalog schema. Falls back to ``LocalDataLoader`` if
   anything goes wrong, so the demo always renders something useful.

Tables resolved (Unity Catalog three-level names assumed when in Databricks
mode):

    main.seqwater_demo.assets
    main.seqwater_demo.asset_locations
    main.seqwater_demo.dam_storage_daily
    main.seqwater_demo.dam_levels_current
    main.seqwater_demo.flood_storage_current
    main.seqwater_demo.rainfall_observations
    main.seqwater_demo.rainfall_forecast
    main.seqwater_demo.demand_forecast
    main.seqwater_demo.supply_forecast
    main.seqwater_demo.grid_transfer_recommendations
    main.seqwater_demo.asset_health_daily
    main.seqwater_demo.maintenance_work_orders
    main.seqwater_demo.asset_risk_scores
    main.seqwater_demo.water_quality_samples
    main.seqwater_demo.treatment_plant_operations
    main.seqwater_demo.turbidity_events
    main.seqwater_demo.quality_alerts
    main.seqwater_demo.flood_scenarios
    main.seqwater_demo.catchment_conditions
    main.seqwater_demo.dam_release_simulation
    main.seqwater_demo.incident_actions
    main.seqwater_demo.capital_projects
    main.seqwater_demo.opex_costs
    main.seqwater_demo.asset_investment_priorities
    main.seqwater_demo.hourly_telemetry
    main.seqwater_demo.ai_interaction_audit
"""
from __future__ import annotations

import logging
from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from backend.config import Settings, get_settings

LOG = logging.getLogger(__name__)


def _stringify_temporal_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Cast date/datetime/timestamp columns to ISO strings.

    The Databricks SQL connector returns ``DATE`` as ``datetime.date`` and
    ``TIMESTAMP`` as ``datetime``/``Timestamp``. Pandas read_csv always returns
    them as plain strings. Normalising here keeps the repository / API layer
    backend-agnostic and Pydantic-friendly.
    """
    if df.empty:
        return df
    out = df.copy()
    for col in out.columns:
        if pd.api.types.is_datetime64_any_dtype(out[col]):
            out[col] = out[col].astype(str)
            continue
        # Pandas leaves Python date/datetime objects in object dtype.
        sample = out[col].dropna().head(1)
        if not sample.empty and isinstance(sample.iloc[0], (pd.Timestamp, np.datetime64)):
            out[col] = pd.to_datetime(out[col], errors="ignore").astype(str)
            continue
        if not sample.empty:
            from datetime import date, datetime  # local import to avoid hard dep when no rows
            v = sample.iloc[0]
            if isinstance(v, (date, datetime)):
                out[col] = out[col].astype(str)
    return out


TABLES = (
    "assets",
    "asset_locations",
    "dam_storage_daily",
    "dam_levels_current",
    "flood_storage_current",
    "rainfall_observations",
    "rainfall_forecast",
    "demand_forecast",
    "supply_forecast",
    "grid_transfer_recommendations",
    "asset_health_daily",
    "maintenance_work_orders",
    "asset_risk_scores",
    "water_quality_samples",
    "treatment_plant_operations",
    "turbidity_events",
    "quality_alerts",
    "flood_scenarios",
    "catchment_conditions",
    "dam_release_simulation",
    "incident_actions",
    "capital_projects",
    "opex_costs",
    "asset_investment_priorities",
    "hourly_telemetry",
    "ai_interaction_audit",
)


class LocalDataLoader:
    """Loads synthetic CSV data from disk, with simple in-memory caching."""

    def __init__(self, synthetic_dir: Path):
        self.dir = synthetic_dir
        self._cache: dict[str, pd.DataFrame] = {}

    def has_data(self) -> bool:
        return any((self.dir / f"{t}.csv").exists() for t in TABLES)

    def load(self, name: str) -> pd.DataFrame:
        if name in self._cache:
            return self._cache[name].copy()
        path = self.dir / f"{name}.csv"
        if not path.exists():
            LOG.warning("Synthetic table %s not found at %s", name, path)
            df = pd.DataFrame()
        else:
            df = pd.read_csv(path)
        self._cache[name] = df
        return df.copy()

    def clear_cache(self) -> None:
        self._cache.clear()


class DatabricksDataLoader:
    """Loads tables from Unity Catalog via the Databricks SQL connector.

    On any failure, transparently falls back to ``LocalDataLoader`` so the demo
    always renders. Connection objects are constructed lazily on first call.
    """

    def __init__(self, settings: Settings, fallback: LocalDataLoader):
        self.settings = settings
        self.fallback = fallback
        self._connection: Any | None = None
        self._cache: dict[str, pd.DataFrame] = {}

    def _get_connection(self):  # noqa: ANN202 — depends on optional import
        if self._connection is not None:
            return self._connection
        try:
            from databricks import sql  # type: ignore
            from databricks.sdk.core import Config  # type: ignore
        except ImportError:  # pragma: no cover — optional extra
            LOG.warning("databricks-sql/sdk not installed; falling back to local mode.")
            return None

        s = self.settings
        if not s.databricks_warehouse_id:
            LOG.warning("DATABRICKS_WAREHOUSE_ID not set; using local synthetic data.")
            return None

        # Inside Databricks Apps the SDK Config auto-detects host + OAuth M2M from
        # DATABRICKS_HOST / DATABRICKS_CLIENT_ID / DATABRICKS_CLIENT_SECRET.
        # Locally it can also pick up a CLI profile.
        try:
            cfg = Config(
                host=s.databricks_host,
                token=s.databricks_token,  # honoured if explicitly set
            )
            host = cfg.host or s.databricks_host or ""
            host = host.replace("https://", "").rstrip("/")
            if not host:
                LOG.warning("No Databricks host resolved; using local synthetic data.")
                return None
            self._connection = sql.connect(
                server_hostname=host,
                http_path=f"/sql/1.0/warehouses/{s.databricks_warehouse_id}",
                credentials_provider=lambda: cfg.authenticate,
            )
            LOG.info("Connected to Databricks SQL warehouse=%s", s.databricks_warehouse_id)
            return self._connection
        except Exception as exc:  # pragma: no cover — runtime guard
            LOG.exception("Failed to connect to Databricks SQL: %s", exc)
            return None

    def load(self, name: str) -> pd.DataFrame:
        if name in self._cache:
            return self._cache[name].copy()
        conn = self._get_connection()
        if conn is None:
            return self.fallback.load(name)
        try:
            with conn.cursor() as cur:
                cur.execute(f"SELECT * FROM {self.settings.uc_namespace}.{name}")
                rows = cur.fetchall_arrow().to_pandas()
            rows = _stringify_temporal_columns(rows)
            self._cache[name] = rows
            return rows.copy()
        except Exception as exc:
            LOG.exception("Databricks query for %s failed; falling back: %s", name, exc)
            return self.fallback.load(name)


@lru_cache
def get_loader():  # noqa: ANN201 — returns Loader-like
    settings = get_settings()
    local = LocalDataLoader(settings.synthetic_dir)
    if settings.is_databricks_mode:
        return DatabricksDataLoader(settings, local)
    return local
