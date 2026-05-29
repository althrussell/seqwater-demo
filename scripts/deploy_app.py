"""Deploy the Seqwater AI Command Centre to Databricks Apps.

Flow (all idempotent):
  1. Build the frontend SPA (`npm install && npm run build`) so `frontend/dist`
     is produced and bundled with the source tree.
  2. Ensure the app exists on the target workspace (create if missing) with
     bound resources (SQL warehouse + Foundation Model endpoint).
  3. Sync the project to a workspace path under the current user's home using
     ``databricks sync``.
  4. Trigger ``databricks apps deploy`` against that source path.

Configuration is read from environment / .env:

  DATABRICKS_CONFIG_PROFILE  CLI profile (default: DEFAULT)
  APP_NAME                   App name (default: seqwater-ai-command-centre)
  WORKSPACE_PATH             Source path in the workspace
                             (default: /Workspace/Users/<me>/<APP_NAME>)
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

APP_NAME = os.environ.get("APP_NAME", "seqwater-ai-command-centre")
PROFILE = os.environ.get("DATABRICKS_CONFIG_PROFILE", "DEFAULT")
APP_SPEC = ROOT / "databricks" / "app_create.json"


def run(cmd: list[str], cwd: Path | None = None, *, capture: bool = False) -> str:
    print(f"$ {' '.join(cmd)}")
    proc = subprocess.run(
        cmd,
        cwd=cwd,
        check=False,
        text=True,
        capture_output=capture,
    )
    if proc.returncode != 0:
        if capture:
            print(proc.stdout)
            print(proc.stderr, file=sys.stderr)
        sys.exit(proc.returncode)
    return proc.stdout if capture else ""


def ensure_npm() -> str:
    npm = shutil.which("npm") or os.environ.get("NPM_BIN")
    if not npm:
        # Try fnm-managed npm.
        from glob import glob
        cands = sorted(glob(os.path.expanduser("~/.local/state/fnm_multishells/*/bin/npm")))
        if cands:
            npm = cands[-1]
    if not npm:
        sys.exit("npm not found on PATH; install Node.js or set NPM_BIN.")
    return npm


def build_frontend() -> None:
    npm = ensure_npm()
    print("Building frontend bundle…")
    run([npm, "install", "--no-audit", "--no-fund"], cwd=ROOT / "frontend")
    run([npm, "run", "build"], cwd=ROOT / "frontend")


def whoami() -> str:
    out = run(
        ["databricks", "--profile", PROFILE, "current-user", "me", "--output", "json"],
        capture=True,
    )
    return json.loads(out)["userName"]


def workspace_path() -> str:
    explicit = os.environ.get("WORKSPACE_PATH")
    if explicit:
        return explicit
    user = whoami()
    return f"/Workspace/Users/{user}/{APP_NAME}"


def app_exists() -> bool:
    proc = subprocess.run(
        ["databricks", "--profile", PROFILE, "apps", "get", APP_NAME, "--output", "json"],
        capture_output=True, text=True,
    )
    return proc.returncode == 0


def create_app() -> None:
    print(f"Creating app {APP_NAME}…")
    # When --json is used, the name must live inside the JSON body (no positional arg).
    run([
        "databricks", "--profile", PROFILE, "apps", "create",
        "--json", f"@{APP_SPEC}",
    ])


def update_app_resources() -> None:
    print(f"Updating app {APP_NAME} resources / metadata…")
    run([
        "databricks", "--profile", PROFILE, "apps", "update", APP_NAME,
        "--json", f"@{APP_SPEC}",
    ])


def sync_source(path: str) -> None:
    print(f"Syncing project to {path}…")
    # We explicitly --include the gitignored artefacts that the running app needs:
    #   * frontend/dist/  (the SPA build)
    #   * data/synthetic/*.csv|*.json  (the synthetic data the LocalDataLoader falls back to)
    run([
        "databricks", "--profile", PROFILE, "sync",
        str(ROOT), path,
        "--full",
        "--include", "frontend/dist/**",
        "--include", "data/synthetic/*.csv",
        "--include", "data/synthetic/*.json",
        "--exclude", ".venv",
        "--exclude", "frontend/node_modules",
        "--exclude", ".git",
        "--exclude", "__pycache__",
        "--exclude", ".pytest_cache",
        "--exclude", "data/synthetic/*.parquet",
        "--exclude", ".env",
        "--exclude", ".env.*",
    ])


def deploy(path: str) -> None:
    print(f"Deploying {APP_NAME} from {path}…")
    run([
        "databricks", "--profile", PROFILE, "apps", "deploy", APP_NAME,
        "--source-code-path", path,
    ])


def main() -> None:
    build_frontend()
    path = workspace_path()
    if app_exists():
        update_app_resources()
    else:
        create_app()
    sync_source(path)
    # Apps need a brief delay between sync and deploy for workspace consistency.
    time.sleep(2)
    deploy(path)
    print("Deploy submitted. Check status with:")
    print(f"  databricks --profile {PROFILE} apps get {APP_NAME}")
    print("Tail logs with:")
    print(f"  databricks --profile {PROFILE} apps logs {APP_NAME}")


if __name__ == "__main__":
    main()
