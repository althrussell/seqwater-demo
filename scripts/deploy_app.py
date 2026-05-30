"""Deploy the Seqwater AI Command Centre to Databricks Apps.

Flow (all idempotent):
  1. Render ``databricks/app_create.template.json`` into ``app_create.json``
     using values from the current environment (.env). Resource bindings
     whose required env vars are unset are dropped, so the same template
     works whether or not the Agent Bricks have been provisioned yet.
  2. Build the frontend SPA (`npm install && npm run build`) so
     ``frontend/dist`` is produced and bundled with the source tree.
  3. Ensure the app exists on the target workspace (create if missing) with
     bound resources (SQL warehouse + Foundation Model endpoint + Supervisor
     + KA + Genie space).
  4. Sync the project to a workspace path under the current user's home
     using ``databricks sync``.
  5. Trigger ``databricks apps deploy`` against that source path.

Configuration is read from environment / .env:

  DATABRICKS_CONFIG_PROFILE        CLI profile (default: DEFAULT)
  APP_NAME                         App name (default: seqwater-ai-command-centre)
  WORKSPACE_PATH                   Source path in the workspace
                                   (default: /Workspace/Users/<me>/<APP_NAME>)
  DATABRICKS_WAREHOUSE_ID          Required.
  DATABRICKS_LLM_ENDPOINT          Required (e.g. databricks-gpt-oss-120b).
  DATABRICKS_SUPERVISOR_ENDPOINT   Optional — bound when set.
  DATABRICKS_KA_ENDPOINT           Optional — bound when set.
  DATABRICKS_GENIE_SPACE_ID        Optional — bound when set.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))


def _load_dotenv() -> None:
    """Best-effort load of a ``.env`` next to the project root.

    We intentionally avoid the ``python-dotenv`` dependency so this script can
    bootstrap a brand-new workspace where dependencies have not been installed
    yet. We do not override variables that are already set in the environment.
    """
    env_path = ROOT / ".env"
    if not env_path.exists():
        return
    for raw in env_path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


_load_dotenv()

APP_NAME = os.environ.get("APP_NAME", "seqwater-ai-command-centre")
os.environ.setdefault("APP_NAME", APP_NAME)
PROFILE = os.environ.get("DATABRICKS_CONFIG_PROFILE", "DEFAULT")
APP_TEMPLATE = ROOT / "databricks" / "app_create.template.json"
APP_SPEC = ROOT / "databricks" / "app_create.json"
APP_YAML_TEMPLATE = ROOT / "app.template.yaml"
APP_YAML = ROOT / "app.yaml"


_PLACEHOLDER_RE = re.compile(r"\$\{([A-Z0-9_]+)\}")


def _substitute(value, env: dict[str, str]) -> tuple[object, list[str]]:
    """Replace ``${VAR}`` tokens with values from ``env``.

    Returns the substituted value and the list of variable names that were
    referenced but missing.
    """
    missing: list[str] = []
    if isinstance(value, str):
        def _repl(match: re.Match[str]) -> str:
            name = match.group(1)
            v = env.get(name, "")
            if not v:
                missing.append(name)
            return v

        substituted = _PLACEHOLDER_RE.sub(_repl, value)
        return substituted, missing
    if isinstance(value, list):
        out_list = []
        for item in value:
            sub, miss = _substitute(item, env)
            out_list.append(sub)
            missing.extend(miss)
        return out_list, missing
    if isinstance(value, dict):
        out_dict = {}
        for k, v in value.items():
            sub, miss = _substitute(v, env)
            out_dict[k] = sub
            missing.extend(miss)
        return out_dict, missing
    return value, missing


def render_app_spec() -> Path:
    """Render ``app_create.template.json`` into ``app_create.json``.

    Resource entries with unmet ``_required`` env vars are dropped from the
    rendered spec so that fresh-workspace deploys never reference endpoints
    that have not yet been provisioned.
    """
    template = json.loads(APP_TEMPLATE.read_text())
    env = dict(os.environ)

    rendered: dict[str, object] = {}
    for key, value in template.items():
        if key == "resources":
            kept: list[dict] = []
            for res in value:
                required = res.get("_required", [])
                if any(not env.get(r) for r in required):
                    missing = [r for r in required if not env.get(r)]
                    print(
                        f"  skip resource {res.get('name')!r}: missing env "
                        f"{','.join(missing)}"
                    )
                    continue
                substituted, miss = _substitute(res, env)
                if miss:
                    print(
                        f"  skip resource {res.get('name')!r}: unresolved "
                        f"placeholders {','.join(sorted(set(miss)))}"
                    )
                    continue
                substituted.pop("_required", None)
                kept.append(substituted)
            rendered[key] = kept
        else:
            substituted, _miss = _substitute(value, env)
            rendered[key] = substituted

    APP_SPEC.write_text(json.dumps(rendered, indent=2) + "\n")
    print(f"Rendered {APP_SPEC.relative_to(ROOT)} ({len(rendered.get('resources', []))} resources):")
    for r in rendered.get("resources", []):  # type: ignore[union-attr]
        print(f"  - {r['name']}")
    return APP_SPEC


def render_app_yaml() -> Path:
    """Render ``app.template.yaml`` into ``app.yaml`` with values from env.

    Only literal ``${VAR}`` placeholders are substituted; ``valueFrom``
    references are left as-is for the Databricks Apps runtime to resolve.
    """
    if not APP_YAML_TEMPLATE.exists():
        print(f"  no template at {APP_YAML_TEMPLATE.relative_to(ROOT)} — leaving app.yaml untouched")
        return APP_YAML
    raw = APP_YAML_TEMPLATE.read_text()
    env = dict(os.environ)

    missing: set[str] = set()

    def _repl(match: re.Match[str]) -> str:
        name = match.group(1)
        v = env.get(name, "")
        if not v:
            missing.add(name)
        return v

    rendered = _PLACEHOLDER_RE.sub(_repl, raw)
    if missing:
        raise SystemExit(
            f"Missing env vars while rendering app.yaml: {', '.join(sorted(missing))}"
        )
    APP_YAML.write_text(rendered)
    print(f"Rendered {APP_YAML.relative_to(ROOT)}.")
    return APP_YAML


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
    #   * app.yaml             (rendered from app.template.yaml — see render_app_yaml)
    #   * frontend/dist/       (the SPA build)
    #   * data/synthetic/*.csv|*.json  (the synthetic data the LocalDataLoader falls back to)
    run([
        "databricks", "--profile", PROFILE, "sync",
        str(ROOT), path,
        "--full",
        "--include", "app.yaml",
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
    print(f"Profile: {PROFILE}")
    render_app_spec()
    render_app_yaml()
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
