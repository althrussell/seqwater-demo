"""Grant Unity Catalog permissions to the Databricks App service principal.

Reads the app metadata to discover the SP, then grants USE CATALOG, USE SCHEMA,
SELECT, and READ VOLUME on the demo schema and Volume so the deployed backend
can read synthetic data when running in databricks mode.

Usage:
    DATABRICKS_CONFIG_PROFILE=s2 \\
    DATABRICKS_WAREHOUSE_ID=b09feb4ffedc1d16 \\
    DATABRICKS_CATALOG=anzgt_may_us \\
    APP_NAME=seqwater-ai-command-centre \\
    python scripts/grant_app_permissions.py
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

APP_NAME = os.environ.get("APP_NAME", "seqwater-ai-command-centre")


def main() -> None:
    cfg = TargetConfig.from_env()
    client = get_workspace_client()
    app = client.apps.get(name=APP_NAME)
    sp = getattr(app, "service_principal_client_id", None)
    if not sp:
        raise SystemExit(
            f"Could not resolve service_principal_client_id for app {APP_NAME!r}."
        )
    print(f"App {APP_NAME!r} service principal: {sp}")

    grants = [
        f"GRANT USE CATALOG ON CATALOG {cfg.catalog} TO `{sp}`",
        f"GRANT USE SCHEMA ON SCHEMA {cfg.catalog}.{cfg.schema} TO `{sp}`",
        f"GRANT SELECT ON SCHEMA {cfg.catalog}.{cfg.schema} TO `{sp}`",
        f"GRANT READ VOLUME ON VOLUME {cfg.catalog}.{cfg.schema}.{cfg.volume} TO `{sp}`",
    ]
    for stmt in grants:
        print(f"--> {stmt}")
        execute_sql(client, cfg.warehouse_id, stmt)
    print("Grants applied.")


if __name__ == "__main__":
    main()
