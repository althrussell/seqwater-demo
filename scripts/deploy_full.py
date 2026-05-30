"""End-to-end deploy of the Seqwater AI Command Centre to a fresh Databricks workspace.

Runs every step in order, reusing the existing per-stage scripts so each phase
remains independently runnable for debugging:

  1. Pre-flight: discover the warehouse / catalog / schema / volume / LLM
     endpoint for the active profile and persist them to ``.env``.
  2. ``scripts/create_uc_assets.py``  — create schema, tables, views, UC
     functions, and the synthetic Volume.
  3. ``scripts/generate_synthetic_data.py`` — local Parquet generation.
  4. ``scripts/generate_synthetic_pdfs.py`` — local synthetic PDF + KA Q/A
     companion JSON generation.
  5. ``scripts/seed_data.py`` — upload Parquet, INSERT OVERWRITE every table,
     upload markdown + PDF + companion JSON to the Volume.
  6. ``scripts/setup_agent_bricks.py`` — provision Genie space + Knowledge
     Assistant + Supervisor MAS via the Databricks SDK and persist resolved
     IDs / endpoint names to ``.env``.
  7. ``scripts/deploy_app.py`` — render ``databricks/app_create.json`` from the
     template + ``.env``, build the SPA, sync, and deploy the Databricks App.
  8. ``scripts/grant_app_permissions.py`` — grant UC SELECT / EXECUTE / READ
     VOLUME to the App SP (and Supervisor SP if its application id is known).
  9. ``scripts/verify_app_permissions.py`` — final pre-demo gate.

Usage::

    DATABRICKS_CONFIG_PROFILE=vm01 python scripts/deploy_full.py

Override discovery values by setting any of these before running::

    DATABRICKS_WAREHOUSE_ID
    DATABRICKS_CATALOG
    DATABRICKS_SCHEMA            (default: seqwater_demo)
    DATABRICKS_VOLUME            (default: operational_docs)
    DATABRICKS_LLM_ENDPOINT      (default: databricks-gpt-oss-120b)

Skip individual phases for re-runs::

    SKIP_DATA_GEN=1   SKIP_AGENT_BRICKS=1   SKIP_VERIFY=1   …

The script is restart-safe — every underlying step is idempotent and any
already-provisioned resource (Genie space, KA, Supervisor, App) is reused
based on its display name.
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _load_dotenv(env_path: Path) -> dict[str, str]:
    if not env_path.exists():
        return {}
    out: dict[str, str] = {}
    for raw in env_path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key:
            out[key] = value
    return out


def _persist_env(updates: dict[str, str], env_path: Path) -> None:
    """Idempotently merge ``updates`` into the .env file."""
    seen: set[str] = set()
    lines: list[str] = []
    if env_path.exists():
        for raw in env_path.read_text().splitlines():
            stripped = raw.strip()
            if not stripped or stripped.startswith("#") or "=" not in raw:
                lines.append(raw)
                continue
            k, _, _ = raw.partition("=")
            k = k.strip()
            if k in updates:
                lines.append(f"{k}={updates[k]}")
                seen.add(k)
            else:
                lines.append(raw)
                seen.add(k)
    for k, v in updates.items():
        if k not in seen:
            lines.append(f"{k}={v}")
    env_path.write_text("\n".join(lines).rstrip() + "\n")


def _print_banner(title: str) -> None:
    bar = "=" * (len(title) + 4)
    print()
    print(bar)
    print(f"  {title}")
    print(bar)


def _run(cmd: list[str], *, env: dict[str, str] | None = None, cwd: Path | None = None) -> None:
    """Run ``cmd`` and abort on non-zero exit."""
    print(f"\n$ {' '.join(cmd)}")
    proc = subprocess.run(
        cmd,
        cwd=cwd,
        env=env or os.environ.copy(),
        check=False,
        text=True,
    )
    if proc.returncode != 0:
        print(f"command failed (exit={proc.returncode})", file=sys.stderr)
        sys.exit(proc.returncode)


def _capture(cmd: list[str], *, env: dict[str, str] | None = None) -> str:
    proc = subprocess.run(
        cmd,
        env=env or os.environ.copy(),
        check=False,
        text=True,
        capture_output=True,
    )
    if proc.returncode != 0:
        print(proc.stdout)
        print(proc.stderr, file=sys.stderr)
        raise SystemExit(proc.returncode)
    return proc.stdout


# ---------------------------------------------------------------------------
# Phase 1: pre-flight discovery
# ---------------------------------------------------------------------------


def _discover_workspace(profile: str) -> dict[str, str]:
    """Return discovered warehouse / catalog / host for ``profile``.

    We honour pre-set env vars so a user can pin a specific warehouse or
    catalog before running the script — but we always validate the pin
    against the live workspace and fall back to discovery if the pinned
    value doesn't exist (e.g. it's a stale value carried over from a
    previous workspace's .env file).
    """
    discovered: dict[str, str] = {
        "DATABRICKS_CONFIG_PROFILE": profile,
        "DATABRICKS_SCHEMA": os.environ.get("DATABRICKS_SCHEMA", "seqwater_demo"),
        "DATABRICKS_VOLUME": os.environ.get("DATABRICKS_VOLUME", "operational_docs"),
        "DATABRICKS_LLM_ENDPOINT": os.environ.get(
            "DATABRICKS_LLM_ENDPOINT", "databricks-gpt-oss-120b"
        ),
        "APP_MODE": os.environ.get("APP_MODE", "databricks"),
    }

    print("Discovering workspace metadata for profile=%s …" % profile)

    auth_env_raw = _capture(
        ["databricks", "auth", "env", "--profile", profile],
    )
    auth_env = json.loads(auth_env_raw).get("env", {})
    host = auth_env.get("DATABRICKS_HOST", "").rstrip("/")
    if host and "://" not in host:
        host = f"https://{host}"
    if host:
        discovered["DATABRICKS_HOST"] = host
        print(f"  host: {host}")
    workspace_id = auth_env.get("DATABRICKS_WORKSPACE_ID", "").strip()
    if workspace_id:
        discovered["DATABRICKS_WORKSPACE_ID"] = workspace_id
        print(f"  workspace id: {workspace_id}")

    # --- warehouse: validate any pin against the live list -----------------
    out = _capture(
        ["databricks", "warehouses", "list", "--profile", profile, "-o", "json"],
    )
    warehouses = json.loads(out) if out.strip() else []
    if not warehouses:
        raise SystemExit(
            "No SQL warehouses available on this workspace. Create one before "
            "running deploy_full."
        )
    available_ids = {w["id"] for w in warehouses}
    pinned_wh = os.environ.get("DATABRICKS_WAREHOUSE_ID", "")
    if pinned_wh and pinned_wh not in available_ids:
        print(
            f"  pinned warehouse {pinned_wh} not in this workspace — "
            "discarding and rediscovering."
        )
        pinned_wh = ""
    if pinned_wh:
        chosen = next(w for w in warehouses if w["id"] == pinned_wh)
        discovered["DATABRICKS_WAREHOUSE_ID"] = chosen["id"]
        print(
            f"  warehouse (pinned): {chosen.get('name')!r} id={chosen['id']} "
            f"size={chosen.get('cluster_size')}"
        )
    else:
        chosen = next(
            (w for w in warehouses if w.get("enable_serverless_compute")),
            warehouses[0],
        )
        discovered["DATABRICKS_WAREHOUSE_ID"] = chosen["id"]
        print(
            f"  warehouse: {chosen.get('name')!r} id={chosen['id']} "
            f"size={chosen.get('cluster_size')} "
            f"serverless={chosen.get('enable_serverless_compute')}"
        )

    # --- catalog: validate any pin against the live list -------------------
    out = _capture(
        ["databricks", "catalogs", "list", "--profile", profile, "-o", "json"],
    )
    catalogs = json.loads(out) if out.strip() else []
    available_catalogs = {c["name"]: c for c in catalogs}
    pinned_cat = os.environ.get("DATABRICKS_CATALOG", "")
    if pinned_cat and pinned_cat not in available_catalogs:
        print(
            f"  pinned catalog {pinned_cat!r} not in this workspace — "
            "discarding and rediscovering."
        )
        pinned_cat = ""
    if pinned_cat:
        discovered["DATABRICKS_CATALOG"] = pinned_cat
        print(f"  catalog (pinned): {pinned_cat}")
    else:
        managed = [c for c in catalogs if c.get("catalog_type") == "MANAGED_CATALOG"]
        if not managed:
            raise SystemExit(
                "No MANAGED_CATALOG found on this workspace. Set DATABRICKS_CATALOG "
                "explicitly to a writable catalog."
            )
        chosen_cat = managed[0]
        discovered["DATABRICKS_CATALOG"] = chosen_cat["name"]
        print(f"  catalog: {chosen_cat['name']}")

    print(f"  schema: {discovered['DATABRICKS_SCHEMA']}")
    print(f"  volume: {discovered['DATABRICKS_VOLUME']}")
    print(f"  llm endpoint: {discovered['DATABRICKS_LLM_ENDPOINT']}")
    return discovered


def _ensure_warehouse_running(profile: str, warehouse_id: str) -> None:
    """Best-effort: kick the warehouse if it is STOPPED so the SQL Statements
    API doesn't burn 60s of cold-start latency on the first request."""
    try:
        out = _capture(
            ["databricks", "warehouses", "get", warehouse_id, "--profile", profile, "-o", "json"],
        )
        info = json.loads(out)
    except SystemExit:
        return
    state = (info.get("state") or "").upper()
    print(f"  warehouse state: {state}")
    if state in ("RUNNING", "STARTING"):
        return
    print("  starting warehouse …")
    subprocess.run(
        ["databricks", "warehouses", "start", warehouse_id, "--profile", profile],
        check=False,
    )


# ---------------------------------------------------------------------------
# Phase 2-9: orchestration
# ---------------------------------------------------------------------------


def _phase_uc(env: dict[str, str]) -> None:
    _print_banner("Phase 2 / 9: Unity Catalog assets (schema, tables, views, UC functions, volume)")
    _run([sys.executable, str(ROOT / "scripts" / "create_uc_assets.py")], env=env)


def _phase_data_gen(env: dict[str, str]) -> None:
    if os.environ.get("SKIP_DATA_GEN") == "1":
        _print_banner("Phase 3 / 9: synthetic data generation [SKIPPED]")
        return
    _print_banner("Phase 3 / 9: generate synthetic Parquet locally")
    _run([sys.executable, str(ROOT / "scripts" / "generate_synthetic_data.py")], env=env)


def _phase_pdf_gen(env: dict[str, str]) -> None:
    if os.environ.get("SKIP_PDF_GEN") == "1":
        _print_banner("Phase 4 / 9: synthetic PDFs [SKIPPED]")
        return
    _print_banner("Phase 4 / 9: generate synthetic PDFs + KA Q/A companions")
    _run([sys.executable, str(ROOT / "scripts" / "generate_synthetic_pdfs.py")], env=env)


def _phase_seed(env: dict[str, str]) -> None:
    _print_banner("Phase 5 / 9: seed Unity Catalog tables + upload PDFs / docs to Volume")
    _run([sys.executable, str(ROOT / "scripts" / "seed_data.py")], env=env)


def _phase_agent_bricks(env: dict[str, str]) -> None:
    if os.environ.get("SKIP_AGENT_BRICKS") == "1":
        _print_banner("Phase 6 / 9: Agent Bricks (Genie + KA + Supervisor) [SKIPPED]")
        return
    _print_banner("Phase 6 / 9: provision Genie space, Knowledge Assistant, Supervisor MAS")
    _run([sys.executable, str(ROOT / "scripts" / "setup_agent_bricks.py")], env=env)
    # Reload .env so the resolved IDs are visible to subsequent phases.
    refreshed = _load_dotenv(ROOT / ".env")
    for key in (
        "DATABRICKS_GENIE_SPACE_ID",
        "DATABRICKS_KA_TILE_ID",
        "DATABRICKS_KA_ENDPOINT",
        "DATABRICKS_SUPERVISOR_TILE_ID",
        "DATABRICKS_SUPERVISOR_ENDPOINT",
    ):
        if refreshed.get(key):
            env[key] = refreshed[key]
            os.environ[key] = refreshed[key]
            print(f"  resolved {key}={refreshed[key]}")


def _phase_deploy(env: dict[str, str]) -> None:
    _print_banner("Phase 7 / 9: deploy Databricks App (renders app_create.json + sync + deploy)")
    _run([sys.executable, str(ROOT / "scripts" / "deploy_app.py")], env=env)


def _resolve_app_sp(profile: str, app_name: str) -> str | None:
    try:
        out = _capture(
            ["databricks", "apps", "get", app_name, "--profile", profile, "-o", "json"],
        )
    except SystemExit:
        return None
    if not out.strip():
        return None
    info = json.loads(out)
    return info.get("service_principal_client_id")


def _resolve_supervisor_sp(profile: str, endpoint_name: str) -> str | None:
    """Best-effort discovery of the Supervisor endpoint's owning service principal.

    The Agent Bricks endpoint's ``creator`` field is the service principal that
    should be granted UC EXECUTE on the demo functions so the supervisor can
    invoke them at runtime.
    """
    if not endpoint_name:
        return None
    try:
        out = _capture(
            [
                "databricks", "serving-endpoints", "get", endpoint_name,
                "--profile", profile, "-o", "json",
            ],
        )
    except SystemExit:
        return None
    info = json.loads(out)
    creator = info.get("creator") or ""
    # When the endpoint is owned by a service principal the creator field is
    # the SP application id (e.g. "abcd1234-...-..."). Fall back to None when
    # it looks like a user (e.g. "alice@example.com").
    if creator and "@" not in creator:
        return creator
    return None


def _phase_grants(env: dict[str, str]) -> None:
    _print_banner("Phase 8 / 9: grant UC permissions (App SP + Supervisor SP)")
    profile = env.get("DATABRICKS_CONFIG_PROFILE", "DEFAULT")
    app_name = env.get("APP_NAME", "seqwater-ai-command-centre")
    sup_endpoint = env.get("DATABRICKS_SUPERVISOR_ENDPOINT", "")

    sup_sp = _resolve_supervisor_sp(profile, sup_endpoint)
    if sup_sp:
        env["SUPERVISOR_SP_APPLICATION_ID"] = sup_sp
        env["DATABRICKS_SUPERVISOR_SP_APPLICATION_ID"] = sup_sp
        os.environ["DATABRICKS_SUPERVISOR_SP_APPLICATION_ID"] = sup_sp
        print(f"  resolved Supervisor SP application id: {sup_sp}")
        _persist_env({"DATABRICKS_SUPERVISOR_SP_APPLICATION_ID": sup_sp}, ROOT / ".env")
    else:
        print(
            "  Supervisor SP application id not resolved automatically — "
            "the supervisor may inherit creator-level permissions."
        )

    _run([sys.executable, str(ROOT / "scripts" / "grant_app_permissions.py")], env=env)


def _phase_verify(env: dict[str, str]) -> None:
    if os.environ.get("SKIP_VERIFY") == "1":
        _print_banner("Phase 9 / 9: pre-demo verification [SKIPPED]")
        return
    _print_banner("Phase 9 / 9: pre-demo verification")
    _run([sys.executable, str(ROOT / "scripts" / "verify_app_permissions.py")], env=env)


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------


def main() -> None:
    profile = os.environ.get("DATABRICKS_CONFIG_PROFILE")
    if not profile:
        raise SystemExit(
            "DATABRICKS_CONFIG_PROFILE is required (e.g. "
            "`DATABRICKS_CONFIG_PROFILE=vm01 python scripts/deploy_full.py`)."
        )

    if not shutil.which("databricks"):
        raise SystemExit("`databricks` CLI not found on PATH.")

    env_path = ROOT / ".env"
    existing = _load_dotenv(env_path)
    # If we're targeting a different profile from the one previously stored in
    # .env, the .env's workspace-specific values (warehouse, catalog, host,
    # Agent Bricks IDs) are stale. Clear them from os.environ AND from .env so
    # pre-flight discovery picks up fresh values for the new workspace.
    previous_profile = existing.get("DATABRICKS_CONFIG_PROFILE", "")
    profile_changed = bool(previous_profile) and previous_profile != profile
    workspace_specific = (
        "DATABRICKS_HOST",
        "DATABRICKS_WORKSPACE_ID",
        "DATABRICKS_WAREHOUSE_ID",
        "DATABRICKS_CATALOG",
        "DATABRICKS_GENIE_SPACE_ID",
        "DATABRICKS_KA_TILE_ID",
        "DATABRICKS_KA_ENDPOINT",
        "DATABRICKS_SUPERVISOR_TILE_ID",
        "DATABRICKS_SUPERVISOR_ENDPOINT",
        "DATABRICKS_SUPERVISOR_SP_APPLICATION_ID",
        "DATABRICKS_GENIE_EMBED_URL",
    )
    if profile_changed:
        print(
            f"Profile change detected: {previous_profile!r} -> {profile!r}. "
            "Clearing workspace-specific values from .env and the environment."
        )
        for key in workspace_specific:
            os.environ.pop(key, None)
            if key in existing:
                existing[key] = ""
    # Honour explicit env vars over the existing .env, then over discovery.
    for key, value in existing.items():
        if value and key not in os.environ:
            os.environ[key] = value

    _print_banner(f"Phase 1 / 9: pre-flight discovery (profile={profile})")
    discovered = _discover_workspace(profile)
    # Wipe stale Agent Bricks IDs so we don't carry IDs from a previous workspace
    # forward into the new deployment by accident. We treat a change in
    # profile, catalog, or host as a different workspace.
    prev_host = existing.get("DATABRICKS_HOST", "")
    prev_catalog = existing.get("DATABRICKS_CATALOG", "")
    new_host = discovered.get("DATABRICKS_HOST", "")
    new_catalog = discovered.get("DATABRICKS_CATALOG", "")
    workspace_changed = (
        profile_changed
        or (prev_host and new_host and prev_host != new_host)
        or (prev_catalog and new_catalog and prev_catalog != new_catalog)
    )
    if workspace_changed:
        for stale in (
            "DATABRICKS_GENIE_SPACE_ID",
            "DATABRICKS_KA_TILE_ID",
            "DATABRICKS_KA_ENDPOINT",
            "DATABRICKS_SUPERVISOR_TILE_ID",
            "DATABRICKS_SUPERVISOR_ENDPOINT",
            "DATABRICKS_SUPERVISOR_SP_APPLICATION_ID",
            "DATABRICKS_GENIE_EMBED_URL",
        ):
            if existing.get(stale):
                print(
                    f"  clearing stale {stale} (was for "
                    f"profile={previous_profile or '?'} / catalog={prev_catalog or '?'})"
                )
            discovered[stale] = ""
            os.environ.pop(stale, None)

    _persist_env(discovered, env_path)
    for key, value in discovered.items():
        if value:
            os.environ[key] = value

    _ensure_warehouse_running(profile, os.environ["DATABRICKS_WAREHOUSE_ID"])

    env = os.environ.copy()
    started = time.time()

    _phase_uc(env)
    _phase_data_gen(env)
    _phase_pdf_gen(env)
    _phase_seed(env)
    _phase_agent_bricks(env)
    _phase_deploy(env)
    _phase_grants(env)
    _phase_verify(env)

    elapsed = int(time.time() - started)
    _print_banner(
        f"DONE in {elapsed//60}m{elapsed%60:02d}s — Seqwater AI Command Centre is live on profile={profile}"
    )
    print(f"  databricks --profile {profile} apps get "
          f"{env.get('APP_NAME', 'seqwater-ai-command-centre')}")


if __name__ == "__main__":
    main()
