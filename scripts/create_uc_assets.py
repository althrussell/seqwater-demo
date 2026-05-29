"""Create the Unity Catalog schema, tables, views, and Volume for the demo.

Reads ``DATABRICKS_*`` env vars (or .env). Uses the Databricks SDK / SQL
Statements API so it works on Databricks CLI v1+ and any v0 release.

Usage:
    DATABRICKS_CONFIG_PROFILE=s2 \\
    DATABRICKS_WAREHOUSE_ID=b09feb4ffedc1d16 \\
    DATABRICKS_CATALOG=anzgt_may_us \\
    python scripts/create_uc_assets.py
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from databricks_sql import (  # noqa: E402
    TargetConfig,
    get_workspace_client,
    run_sql_file,
)

SQL_DIR = ROOT / "databricks" / "sql"
VOLUME_SQL = ROOT / "databricks" / "volumes" / "create_volume.sql"

SCRIPTS = [
    SQL_DIR / "01_create_schema.sql",
    SQL_DIR / "02_create_tables.sql",
    SQL_DIR / "03_create_views.sql",
    SQL_DIR / "05_create_uc_functions.sql",
    VOLUME_SQL,
]


def main() -> None:
    cfg = TargetConfig.from_env()
    client = get_workspace_client()
    print(
        f"Target: profile={cfg.profile} warehouse={cfg.warehouse_id} "
        f"catalog={cfg.catalog} schema={cfg.schema} volume={cfg.volume}"
    )
    for p in SCRIPTS:
        run_sql_file(client, cfg, p)
    print("Done. UC schema, tables, views, and Volume ready.")


if __name__ == "__main__":
    main()
