"""Seed synthetic CSVs and operational documents into Unity Catalog on s2.

Steps:
  1. Stage every CSV from ``data/synthetic`` into a sub-folder of the demo Volume.
  2. Run ``COPY INTO`` against each Unity Catalog table.
  3. Upload Markdown documents from ``data/documents`` to the Volume root.

Auth comes from the active Databricks CLI profile / OAuth (Databricks SDK).

Usage:
    DATABRICKS_CONFIG_PROFILE=s2 \\
    DATABRICKS_WAREHOUSE_ID=b09feb4ffedc1d16 \\
    DATABRICKS_CATALOG=anzgt_may_us \\
    python scripts/seed_data.py
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from databricks_sql import (  # noqa: E402
    TargetConfig,
    execute_sql,
    get_workspace_client,
)

SYN = ROOT / "data" / "synthetic"
DOCS = ROOT / "data" / "documents"

TABLES = [
    "assets", "asset_locations", "dam_storage_daily", "rainfall_observations",
    "rainfall_forecast", "demand_forecast", "supply_forecast",
    "grid_transfer_recommendations", "asset_health_daily",
    "maintenance_work_orders", "asset_risk_scores", "water_quality_samples",
    "treatment_plant_operations", "turbidity_events", "quality_alerts",
    "flood_scenarios", "catchment_conditions", "dam_release_simulation",
    "incident_actions", "capital_projects", "opex_costs",
    "asset_investment_priorities", "hourly_telemetry", "ai_interaction_audit",
]


def stage_dir(cfg: TargetConfig) -> str:
    return f"/Volumes/{cfg.catalog}/{cfg.schema}/{cfg.volume}/_stage"


def docs_dir(cfg: TargetConfig) -> str:
    return f"/Volumes/{cfg.catalog}/{cfg.schema}/{cfg.volume}/documents"


def upload_csvs(client, cfg: TargetConfig) -> None:
    target = stage_dir(cfg)
    print(f"--> staging Parquet into {target}")
    for table in TABLES:
        src = SYN / f"{table}.parquet"
        if not src.exists():
            print(f"   skip (missing): {src.name}")
            continue
        with open(src, "rb") as fh:
            client.files.upload(
                file_path=f"{target}/{src.name}",
                contents=fh,
                overwrite=True,
            )
        print(f"   uploaded {src.name} ({src.stat().st_size:,} bytes)")


def upload_documents(client, cfg: TargetConfig) -> None:
    target = docs_dir(cfg)
    print(f"--> uploading synthetic documents into {target}")
    for src in sorted(DOCS.glob("*.md")):
        with open(src, "rb") as fh:
            client.files.upload(
                file_path=f"{target}/{src.name}",
                contents=fh,
                overwrite=True,
            )
        print(f"   uploaded {src.name}")


def truncate_then_copy(client, cfg: TargetConfig) -> None:
    """Load each table from staged Parquet using INSERT OVERWRITE + read_files.

    INSERT ... SELECT applies implicit Spark casts (e.g. int64 -> INT, BIGINT
    -> DOUBLE), so we don't have to align pandas dtypes pixel-for-pixel with
    the declared table schema.
    """
    target = stage_dir(cfg)
    for table in TABLES:
        src = SYN / f"{table}.parquet"
        if not src.exists():
            continue
        fq = f"{cfg.catalog}.{cfg.schema}.{table}"
        print(f"--> INSERT OVERWRITE {fq}")
        # Pull the column list from the table to keep ordering deterministic.
        cols_resp = execute_sql(
            client, cfg.warehouse_id,
            f"SELECT column_name FROM {cfg.catalog}.information_schema.columns "
            f"WHERE table_schema = '{cfg.schema}' AND table_name = '{table}' "
            f"ORDER BY ordinal_position",
        )
        col_rows = cols_resp.result.data_array if cols_resp.result and cols_resp.result.data_array else []
        cols = [row[0] for row in col_rows]
        if not cols:
            print(f"   skip {table}: no columns found in information_schema")
            continue
        col_list = ", ".join(f"`{c}`" for c in cols)
        select_list = ", ".join(f"CAST(`{c}` AS {{cast}}) AS `{c}`" for c in cols)  # placeholder
        del select_list  # not used; just kept for future reference

        sql = (
            f"INSERT OVERWRITE TABLE {fq} ({col_list}) "
            f"SELECT {col_list} FROM read_files('{target}/{table}.parquet', format => 'parquet')"
        )
        execute_sql(client, cfg.warehouse_id, sql, max_wait_seconds=300)


def main() -> None:
    if not SYN.exists() or not any(SYN.glob("*.parquet")):
        raise SystemExit(
            "Synthetic data missing. Run `python scripts/generate_synthetic_data.py` first."
        )
    cfg = TargetConfig.from_env()
    client = get_workspace_client()
    print(
        f"Target: profile={cfg.profile} warehouse={cfg.warehouse_id} "
        f"catalog={cfg.catalog} schema={cfg.schema} volume={cfg.volume}"
    )
    # Make sure the Volume sub-directories exist (Files API creates them on upload).
    upload_csvs(client, cfg)
    truncate_then_copy(client, cfg)
    upload_documents(client, cfg)
    print("Synthetic data + documents seeded into Unity Catalog.")


if __name__ == "__main__":
    main()
