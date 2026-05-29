"""Grant Unity Catalog permissions to the Databricks App and Agent Bricks SPs.

The Seqwater demo runs against two distinct service principals:

* **App SP** — backs the Databricks App; owns the FastAPI process. Needs to
  read every synthetic table, list the synthetic Volume, execute the three
  Seqwater UC functions, and call the Supervisor / KA serving endpoints
  (those are bound via :file:`databricks/app_create.json`).
* **Supervisor SP** — auto-created by Agent Bricks when the synthetic
  Supervisor MAS is provisioned. Needs the same UC function EXECUTE rights
  so it can route to the deterministic Python tools, and SELECT on the
  synthetic schema for any direct table reads its child agents perform.

This script is idempotent: every grant is ``GRANT … TO \`<sp>\``` which UC
treats as a no-op when the grant already exists.

Usage::

    DATABRICKS_CONFIG_PROFILE=s2 \\
    DATABRICKS_WAREHOUSE_ID=b09feb4ffedc1d16 \\
    DATABRICKS_CATALOG=anzgt_may_us \\
    DATABRICKS_SCHEMA=seqwater_demo \\
    DATABRICKS_VOLUME=operational_docs \\
    APP_NAME=seqwater-ai-command-centre \\
    SUPERVISOR_SP_APPLICATION_ID=<resolved-after-setup_agent_bricks> \\
    python scripts/grant_app_permissions.py

When ``SUPERVISOR_SP_APPLICATION_ID`` is omitted, only the App SP grants are
applied; the script prints a reminder telling the operator how to populate
it. After running ``scripts/setup_agent_bricks.py`` the resolved Supervisor
SP id is also written to ``.env`` as
``DATABRICKS_SUPERVISOR_SP_APPLICATION_ID``.
"""
from __future__ import annotations

import logging
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

LOG = logging.getLogger("grant_app_permissions")

APP_NAME = os.environ.get("APP_NAME", "seqwater-ai-command-centre")

UC_FUNCTIONS = ("top_asset_risks", "capital_priorities", "run_flood_scenario")


def _grants_for(sp: str, cfg: TargetConfig, *, role: str) -> list[str]:
    """Return the canonical grant statements for a service principal."""
    grants = [
        f"GRANT USE CATALOG ON CATALOG {cfg.catalog} TO `{sp}`",
        f"GRANT USE SCHEMA ON SCHEMA {cfg.catalog}.{cfg.schema} TO `{sp}`",
        f"GRANT SELECT ON SCHEMA {cfg.catalog}.{cfg.schema} TO `{sp}`",
    ]
    if role in ("app", "supervisor"):
        for fn in UC_FUNCTIONS:
            grants.append(
                f"GRANT EXECUTE ON FUNCTION {cfg.catalog}.{cfg.schema}.{fn} TO `{sp}`"
            )
    if role == "app":
        grants.append(
            f"GRANT READ VOLUME ON VOLUME "
            f"{cfg.catalog}.{cfg.schema}.{cfg.volume} TO `{sp}`"
        )
    return grants


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    cfg = TargetConfig.from_env()
    client = get_workspace_client()

    app = client.apps.get(name=APP_NAME)
    app_sp = getattr(app, "service_principal_client_id", None)
    if not app_sp:
        raise SystemExit(
            f"Could not resolve service_principal_client_id for app {APP_NAME!r}."
        )
    LOG.info("App %s service principal: %s", APP_NAME, app_sp)

    plans: list[tuple[str, str, list[str]]] = [
        ("App SP", app_sp, _grants_for(app_sp, cfg, role="app")),
    ]

    supervisor_sp = (
        os.environ.get("SUPERVISOR_SP_APPLICATION_ID")
        or os.environ.get("DATABRICKS_SUPERVISOR_SP_APPLICATION_ID")
    )
    if supervisor_sp:
        plans.append(
            ("Supervisor SP", supervisor_sp, _grants_for(supervisor_sp, cfg, role="supervisor"))
        )
    else:
        LOG.warning(
            "SUPERVISOR_SP_APPLICATION_ID not set. Skipping Supervisor SP grants. "
            "After running scripts/setup_agent_bricks.py, copy "
            "DATABRICKS_SUPERVISOR_SP_APPLICATION_ID from .env (or read it "
            "from the Agent Bricks endpoint detail page) and re-run this "
            "script so the Supervisor can EXECUTE the UC functions."
        )

    ka_sp = (
        os.environ.get("KA_SP_APPLICATION_ID")
        or os.environ.get("DATABRICKS_KA_SP_APPLICATION_ID")
    )
    if ka_sp:
        plans.append(
            (
                "KA SP",
                ka_sp,
                [
                    f"GRANT USE CATALOG ON CATALOG {cfg.catalog} TO `{ka_sp}`",
                    f"GRANT USE SCHEMA ON SCHEMA {cfg.catalog}.{cfg.schema} TO `{ka_sp}`",
                    f"GRANT READ VOLUME ON VOLUME "
                    f"{cfg.catalog}.{cfg.schema}.{cfg.volume} TO `{ka_sp}`",
                ],
            )
        )

    for label, sp, grants in plans:
        LOG.info("Applying %d grants to %s (%s)", len(grants), label, sp)
        for stmt in grants:
            LOG.info("--> %s", stmt)
            try:
                execute_sql(client, cfg.warehouse_id, stmt)
            except Exception as exc:  # pragma: no cover
                LOG.error("Grant failed: %s -- %s", stmt, exc)
                raise

    LOG.info("All grants applied.")


if __name__ == "__main__":
    main()
