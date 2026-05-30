"""Final pre-demo gate: verify every Seqwater AI Command Centre permission.

Runs as the **App SP** (i.e. the Databricks App service principal) and proves
end-to-end that every capability the FastAPI process needs at runtime is
actually available. It is intentionally pessimistic: a single 403 here is a
guaranteed demo bug, so we'd rather fail loudly here than half-way through a
live demo.

Checks
------

1. ``SELECT 1 FROM {catalog}.{schema}.assets LIMIT 1`` — table SELECT on the
   synthetic schema.
2. ``LIST '/Volumes/{catalog}/{schema}/{volume}/pdf/'`` — Volume READ on the
   synthetic PDF subpath (where the KA looks for source documents).
3. ``SELECT * FROM {catalog}.{schema}.top_asset_risks(3)`` — UC function
   EXECUTE.
4. ``POST /serving-endpoints/{supervisor}/invocations`` with a 1-token noop —
   Supervisor CAN_QUERY.
5. ``POST /serving-endpoints/{ka}/invocations`` with the same payload — KA
   CAN_QUERY.
6. ``POST /api/2.0/genie/spaces/{space}/start-conversation`` with a noop
   query (best-effort: skip if the start endpoint isn't available in the
   workspace's release ring).
7. ``GET /api/2.0/serving-endpoints/{supervisor}`` ``state == READY``.

Each check prints a row in the summary table with timing and a remediation
hint on failure. The script exits non-zero on any failure.

Usage::

    DATABRICKS_CONFIG_PROFILE=s2 \\
    DATABRICKS_WAREHOUSE_ID=b09feb4ffedc1d16 \\
    DATABRICKS_CATALOG=anzgt_may_us \\
    DATABRICKS_SCHEMA=seqwater_demo \\
    DATABRICKS_VOLUME=operational_docs \\
    DATABRICKS_SUPERVISOR_ENDPOINT=agents_anzgt_may_us-seqwater_demo-seqwater_supervisor \\
    DATABRICKS_KA_ENDPOINT=agents_anzgt_may_us-seqwater_demo-seqwater_operational_docs \\
    DATABRICKS_GENIE_SPACE_ID=01ef... \\
    python scripts/verify_app_permissions.py
"""
from __future__ import annotations

import logging
import os
import sys
import time
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from databricks_sql import (  # noqa: E402
    TargetConfig,
    execute_sql,
    get_workspace_client,
)

LOG = logging.getLogger("verify_app_permissions")


@dataclass
class CheckResult:
    name: str
    permission: str
    ok: bool
    detail: str = ""
    elapsed_ms: int = 0
    remediation: str = ""

    def line(self) -> str:
        status = "ok " if self.ok else "FAIL"
        return f"{self.name:<48} {self.permission:<14} {status}  ({self.elapsed_ms} ms)"


def _timed(label: str, permission: str, fn, *, remediation: str = "") -> CheckResult:
    start = time.monotonic()
    try:
        detail = fn() or ""
        elapsed = int((time.monotonic() - start) * 1000)
        return CheckResult(label, permission, True, detail=detail, elapsed_ms=elapsed)
    except Exception as exc:
        elapsed = int((time.monotonic() - start) * 1000)
        return CheckResult(
            label,
            permission,
            False,
            detail=str(exc).splitlines()[0][:240],
            elapsed_ms=elapsed,
            remediation=remediation,
        )


def _check_select(client, cfg: TargetConfig) -> CheckResult:
    return _timed(
        f"SELECT on {cfg.schema}.assets",
        "SELECT",
        lambda: (
            execute_sql(
                client,
                cfg.warehouse_id,
                f"SELECT 1 FROM {cfg.catalog}.{cfg.schema}.assets LIMIT 1",
                catalog=cfg.catalog,
                schema=cfg.schema,
            )
            and "1 row"
        ),
        remediation="Run python scripts/grant_app_permissions.py to grant SELECT on the schema.",
    )


def _check_volume(client, cfg: TargetConfig) -> CheckResult:
    pdf_path = f"/Volumes/{cfg.catalog}/{cfg.schema}/{cfg.volume}/pdf/"

    def _do() -> str:
        # Resilient against SDK version drift — fall back to dbutils-style listing.
        try:
            files = list(client.files.list_directory_contents(directory_path=pdf_path))
        except Exception:
            files = list(client.files.list_directory(directory_path=pdf_path))  # type: ignore[attr-defined]
        return f"{len(files)} files"

    return _timed(
        f"LIST {pdf_path}",
        "READ VOLUME",
        _do,
        remediation=(
            "Run python scripts/grant_app_permissions.py and confirm "
            "scripts/seed_data.py uploaded the PDFs to the volume."
        ),
    )


def _check_uc_function(client, cfg: TargetConfig) -> CheckResult:
    return _timed(
        "EXECUTE top_asset_risks(3)",
        "EXECUTE",
        lambda: (
            execute_sql(
                client,
                cfg.warehouse_id,
                f"SELECT * FROM {cfg.catalog}.{cfg.schema}.top_asset_risks(3)",
                catalog=cfg.catalog,
                schema=cfg.schema,
            )
            and "ok"
        ),
        remediation=(
            "Run python scripts/create_uc_assets.py to (re)create the UC functions, "
            "then python scripts/grant_app_permissions.py to grant EXECUTE."
        ),
    )


def _check_serving_endpoint(client, name: str, *, perm_label: str) -> CheckResult:
    """Smoke-invoke an Agent Bricks serving endpoint.

    The Supervisor MAS and KA endpoints both implement the Databricks
    ``agent/v1/responses`` API contract (the OpenAI ``messages`` shape is
    rejected with ``'messages' field is not supported``). We therefore POST
    a minimal payload using the ``input`` field directly via httpx so we
    don't depend on the SDK's chat-completions helper.
    """
    def _do() -> str:
        from databricks.sdk.core import Config  # type: ignore
        import httpx

        cfg = Config()
        host = (cfg.host or "").rstrip("/")
        headers = {"Content-Type": "application/json"}
        headers.update(cfg.authenticate())
        url = f"{host}/serving-endpoints/{name}/invocations"
        payload = {
            "input": [{"role": "user", "content": "ping"}],
            "max_output_tokens": 1,
            "stream": False,
        }
        with httpx.Client(timeout=60.0) as hc:
            r = hc.post(url, headers=headers, json=payload)
        if r.status_code >= 400:
            raise RuntimeError(f"HTTP {r.status_code}: {r.text[:200]}")
        return f"http {r.status_code}"

    return _timed(
        f"INVOKE {name}",
        perm_label,
        _do,
        remediation=(
            f"Confirm {name!r} is bound in databricks/app_create.json with CAN_QUERY "
            "and re-run scripts/deploy_app.py so the Apps runtime picks it up."
        ),
    )


def _check_endpoint_ready(client, name: str) -> CheckResult:
    def _do() -> str:
        ep = client.serving_endpoints.get(name)
        state = getattr(getattr(ep, "state", None), "ready", None)
        ready_str = str(state).upper() if state is not None else ""
        if "READY" in ready_str:
            return f"state={ready_str}"
        config_state = getattr(getattr(ep, "state", None), "config_update", "")
        raise RuntimeError(f"endpoint not READY: ready={ready_str} config={config_state}")

    return _timed(
        f"STATE {name}",
        "READY",
        _do,
        remediation=(
            "Re-run python scripts/setup_agent_bricks.py and wait for the "
            "endpoint to reach ONLINE / READY."
        ),
    )


def _check_genie(client, space_id: str) -> CheckResult:
    def _do() -> str:
        try:
            from databricks.sdk.service.dashboards import GenieAPI  # type: ignore  # noqa: F401
        except Exception:
            pass
        # Use the Genie REST API directly so we don't depend on a particular
        # SDK release exposing `genie_spaces`.
        from databricks.sdk.core import Config  # type: ignore

        cfg = Config()
        host = (cfg.host or "").rstrip("/")
        headers = {"Content-Type": "application/json"}
        headers.update(cfg.authenticate())
        import httpx

        url = f"{host}/api/2.0/genie/spaces/{space_id}/start-conversation"
        with httpx.Client(timeout=30.0) as hc:
            r = hc.post(
                url,
                headers=headers,
                json={"content": "What is the synthetic asset count?"},
            )
        if r.status_code >= 400:
            raise RuntimeError(f"HTTP {r.status_code}: {r.text[:120]}")
        return "started"

    return _timed(
        "Genie start-conversation",
        "CAN_RUN",
        _do,
        remediation=(
            "Confirm the Genie space is bound in databricks/app_create.json and "
            "user_api_scopes contains dashboards.genie."
        ),
    )


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    cfg = TargetConfig.from_env()
    client = get_workspace_client()

    supervisor = os.environ.get("DATABRICKS_SUPERVISOR_ENDPOINT")
    ka = os.environ.get("DATABRICKS_KA_ENDPOINT")
    genie_space = os.environ.get("DATABRICKS_GENIE_SPACE_ID")

    results: list[CheckResult] = []
    results.append(_check_select(client, cfg))
    results.append(_check_volume(client, cfg))
    results.append(_check_uc_function(client, cfg))

    if supervisor:
        results.append(_check_serving_endpoint(client, supervisor, perm_label="CAN_QUERY"))
        results.append(_check_endpoint_ready(client, supervisor))
    else:
        LOG.warning(
            "DATABRICKS_SUPERVISOR_ENDPOINT is not set — skipping Supervisor checks. "
            "After running scripts/setup_agent_bricks.py copy the resolved endpoint "
            "name into .env and re-run this script."
        )

    if ka:
        results.append(_check_serving_endpoint(client, ka, perm_label="CAN_QUERY"))
    else:
        LOG.warning(
            "DATABRICKS_KA_ENDPOINT is not set — skipping KA checks."
        )

    if genie_space:
        results.append(_check_genie(client, genie_space))
    else:
        LOG.warning(
            "DATABRICKS_GENIE_SPACE_ID is not set — skipping Genie check."
        )

    print("")
    print("Resource".ljust(48), "Permission".ljust(14), "Result")
    print("-" * 48, "-" * 14, "-" * 14)
    failures = 0
    for r in results:
        print(r.line())
        if not r.ok:
            failures += 1
            print(f"    detail: {r.detail}")
            if r.remediation:
                print(f"    fix: {r.remediation}")

    print("")
    if failures:
        print(f"FAILED {failures}/{len(results)} checks.")
        sys.exit(1)
    print(f"PASSED {len(results)}/{len(results)} checks.")


if __name__ == "__main__":
    main()
