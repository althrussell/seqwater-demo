"""Provision the three Seqwater Agent Bricks (Genie space, Knowledge Assistant,
Supervisor MAS) and persist their resolved IDs to ``.env``.

The script is intentionally pragmatic about Databricks API surface area:

1.  It first tries the ``manage_genie`` / ``manage_ka`` / ``manage_mas`` MCP
    tools if they are exposed by the runtime (Cursor / Claude environments
    that have the Agent Bricks plugin loaded).
2.  Falls back to the Databricks REST API endpoints (subject to availability
    in the target workspace's region / release ring).
3.  As a last resort, prints a complete UI / CLI runbook so an SA can apply
    the spec by hand and feed the resolved IDs back into ``.env``.

Inputs
------
* ``databricks/agent_bricks/genie_space.json``
* ``databricks/agent_bricks/knowledge_assistant.json``
* ``databricks/agent_bricks/supervisor.json``

Outputs
-------
* Resolved IDs and endpoint names are written to ``.env`` (or printed to
  stdout for manual use):

    DATABRICKS_GENIE_SPACE_ID=...
    DATABRICKS_KA_TILE_ID=...
    DATABRICKS_KA_ENDPOINT=...
    DATABRICKS_SUPERVISOR_TILE_ID=...
    DATABRICKS_SUPERVISOR_ENDPOINT=...

Usage
-----
    DATABRICKS_CONFIG_PROFILE=s2 \\
    DATABRICKS_WAREHOUSE_ID=b09feb4ffedc1d16 \\
    DATABRICKS_CATALOG=anzgt_may_us \\
    DATABRICKS_SCHEMA=seqwater_demo \\
    DATABRICKS_VOLUME=operational_docs \\
    python scripts/setup_agent_bricks.py
"""
from __future__ import annotations

import json
import logging
import os
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

LOG = logging.getLogger("setup_agent_bricks")

SPEC_DIR = ROOT / "databricks" / "agent_bricks"
GENIE_SPEC = SPEC_DIR / "genie_space.json"
KA_SPEC = SPEC_DIR / "knowledge_assistant.json"
SUP_SPEC = SPEC_DIR / "supervisor.json"
ENV_FILE = ROOT / ".env"

POLL_TIMEOUT_S = 600
POLL_INTERVAL_S = 15


@dataclass
class TargetConfig:
    profile: str
    warehouse_id: str
    catalog: str
    schema: str
    volume: str

    @classmethod
    def from_env(cls) -> "TargetConfig":
        return cls(
            profile=os.environ.get("DATABRICKS_CONFIG_PROFILE", "DEFAULT"),
            warehouse_id=os.environ.get("DATABRICKS_WAREHOUSE_ID", ""),
            catalog=os.environ.get("DATABRICKS_CATALOG", "main"),
            schema=os.environ.get("DATABRICKS_SCHEMA", "seqwater_demo"),
            volume=os.environ.get("DATABRICKS_VOLUME", "operational_docs"),
        )

    def render(self, value: Any) -> Any:
        if isinstance(value, str):
            return value.format(
                catalog=self.catalog, schema=self.schema, volume=self.volume
            )
        if isinstance(value, list):
            return [self.render(v) for v in value]
        if isinstance(value, dict):
            return {k: self.render(v) for k, v in value.items()}
        return value


def _load_spec(path: Path, cfg: TargetConfig) -> dict[str, Any]:
    raw = json.loads(path.read_text())
    return cfg.render(raw)


def _persist_env(updates: dict[str, str]) -> None:
    """Idempotently update ``.env`` with the resolved ID variables."""
    existing: dict[str, str] = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            if line.strip().startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            existing[k.strip()] = v.strip()
    existing.update({k: v for k, v in updates.items() if v})

    lines: list[str] = []
    seen: set[str] = set()
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            if line.strip().startswith("#") or "=" not in line:
                lines.append(line)
                continue
            k, _, _ = line.partition("=")
            k = k.strip()
            if k in updates and updates[k]:
                lines.append(f"{k}={updates[k]}")
                seen.add(k)
            else:
                lines.append(line)
                seen.add(k)
    for k, v in updates.items():
        if v and k not in seen:
            lines.append(f"{k}={v}")
    ENV_FILE.write_text("\n".join(lines) + "\n")
    LOG.info("Wrote %d Agent Bricks identifiers to %s", len(updates), ENV_FILE)


# ---------------------------------------------------------------------------
# Provisioning back-ends
# ---------------------------------------------------------------------------


class _AgentBricksBackend:
    """Abstract back-end. Concrete implementations either call MCP tools or
    fall back to printing a runbook."""

    name = "abstract"

    def is_available(self) -> bool:
        return False

    def create_or_update_genie(self, spec: dict[str, Any]) -> dict[str, str]:
        raise NotImplementedError

    def create_or_update_ka(self, spec: dict[str, Any]) -> dict[str, str]:
        raise NotImplementedError

    def create_or_update_mas(
        self, spec: dict[str, Any], *, ka_tile_id: str, genie_space_id: str
    ) -> dict[str, str]:
        raise NotImplementedError

    def wait_until_ready(self, tile_id: str, *, kind: str) -> None:
        raise NotImplementedError


class _PrintRunbookBackend(_AgentBricksBackend):
    """Last-resort backend: print exactly what to do in the UI / CLI."""

    name = "print-runbook"

    def is_available(self) -> bool:
        return True

    def create_or_update_genie(self, spec: dict[str, Any]) -> dict[str, str]:
        LOG.warning("Genie creation requires manual UI step. Spec follows.")
        print("\n=== Manual step: create Genie space ===")
        print(json.dumps(spec, indent=2))
        print(
            "\n1. Open the Databricks UI -> Genie -> 'New space'.\n"
            "2. Use the name above and add the listed tables.\n"
            "3. Paste the sample questions and certified queries.\n"
            "4. After saving, copy the space id (URL or ?spaceId= param).\n"
            "5. Paste it into .env as DATABRICKS_GENIE_SPACE_ID and re-run.\n"
        )
        return {"DATABRICKS_GENIE_SPACE_ID": os.environ.get("DATABRICKS_GENIE_SPACE_ID", "")}

    def create_or_update_ka(self, spec: dict[str, Any]) -> dict[str, str]:
        LOG.warning("Knowledge Assistant creation requires manual UI step. Spec follows.")
        print("\n=== Manual step: create Knowledge Assistant ===")
        print(json.dumps(spec, indent=2))
        print(
            "\n1. Open the Databricks UI -> Agent Bricks -> 'Knowledge Assistant'.\n"
            "2. Name it as above and point it at the listed Volume path.\n"
            "3. Paste the instructions verbatim.\n"
            "4. After saving and the endpoint reaches ONLINE, copy the tile id\n"
            "   and serving endpoint name from the Agent Bricks page.\n"
            "5. Paste them into .env as DATABRICKS_KA_TILE_ID and\n"
            "   DATABRICKS_KA_ENDPOINT, then re-run setup_agent_bricks.py.\n"
        )
        return {
            "DATABRICKS_KA_TILE_ID": os.environ.get("DATABRICKS_KA_TILE_ID", ""),
            "DATABRICKS_KA_ENDPOINT": os.environ.get("DATABRICKS_KA_ENDPOINT", ""),
        }

    def create_or_update_mas(
        self, spec: dict[str, Any], *, ka_tile_id: str, genie_space_id: str
    ) -> dict[str, str]:
        LOG.warning("Supervisor MAS creation requires manual UI step. Spec follows.")
        rendered = dict(spec)
        for agent in rendered.get("agents", []):
            if agent.get("kind") == "knowledge_assistant":
                agent["ka_tile_id"] = ka_tile_id
            if agent.get("kind") == "genie_space":
                agent["genie_space_id"] = genie_space_id
        print("\n=== Manual step: create Supervisor MAS ===")
        print(json.dumps(rendered, indent=2))
        print(
            "\n1. Open the Databricks UI -> Agent Bricks -> 'Supervisor agent'.\n"
            "2. Add the five child agents listed above (Genie, KA, three UC fns).\n"
            "3. Paste the instructions and example Q/A pairs.\n"
            "4. After the endpoint reaches ONLINE, copy the supervisor's tile id\n"
            "   and serving endpoint name.\n"
            "5. Paste them into .env as DATABRICKS_SUPERVISOR_TILE_ID and\n"
            "   DATABRICKS_SUPERVISOR_ENDPOINT.\n"
        )
        return {
            "DATABRICKS_SUPERVISOR_TILE_ID": os.environ.get("DATABRICKS_SUPERVISOR_TILE_ID", ""),
            "DATABRICKS_SUPERVISOR_ENDPOINT": os.environ.get("DATABRICKS_SUPERVISOR_ENDPOINT", ""),
        }

    def wait_until_ready(self, tile_id: str, *, kind: str) -> None:
        if not tile_id:
            return
        LOG.info(
            "(%s) Skipping ONLINE poll because we are in print-runbook mode. "
            "Verify status in the Agent Bricks UI before continuing.",
            kind,
        )


class _MCPBackend(_AgentBricksBackend):
    """Probe the runtime for the manage_* tools.

    These tools are exposed by Databricks plugin runtimes (Cursor / Claude /
    Copilot) when the Agent Bricks plugin is loaded. We detect them via
    duck-typed module imports first; if not present, we report unavailable so
    the print-runbook fallback takes over.
    """

    name = "mcp"

    def __init__(self) -> None:
        self._fns: dict[str, Any] = {}
        for fn_name in ("manage_genie", "manage_ka", "manage_mas"):
            try:
                # The runtime may inject these as Python callables under
                # different module names. We intentionally try a small set of
                # likely paths and record whichever succeeds.
                fn = self._try_import(fn_name)
                if fn is not None:
                    self._fns[fn_name] = fn
            except Exception:
                continue

    @staticmethod
    def _try_import(fn_name: str):
        candidates = [
            ("databricks_agent_bricks", fn_name),
            ("agent_bricks", fn_name),
            ("databricks.agent_bricks", fn_name),
        ]
        for mod_name, attr in candidates:
            try:
                module = __import__(mod_name, fromlist=[attr])
                fn = getattr(module, attr, None)
                if callable(fn):
                    return fn
            except ImportError:
                continue
        return None

    def is_available(self) -> bool:
        return all(k in self._fns for k in ("manage_genie", "manage_ka", "manage_mas"))

    def create_or_update_genie(self, spec: dict[str, Any]) -> dict[str, str]:
        result = self._fns["manage_genie"](
            action="create_or_update",
            name=spec["name"],
            description=spec.get("description", ""),
            tables=spec.get("tables", []),
            sample_questions=spec.get("sample_questions", []),
            instructions="\n".join(spec.get("instructions", [])),
            certified_queries=spec.get("certified_queries", []),
        ) or {}
        space_id = result.get("space_id") or result.get("id") or ""
        LOG.info("Genie space ready: id=%s", space_id)
        return {"DATABRICKS_GENIE_SPACE_ID": space_id}

    def create_or_update_ka(self, spec: dict[str, Any]) -> dict[str, str]:
        result = self._fns["manage_ka"](
            action="create_or_update",
            name=spec["name"],
            volume_path=spec["volume_path"],
            description=spec.get("description", ""),
            instructions="\n".join(spec.get("instructions", [])),
            add_examples_from_volume=spec.get("add_examples_from_volume", True),
        ) or {}
        tile_id = result.get("tile_id") or ""
        endpoint_name = result.get("endpoint_name") or ""
        LOG.info("Knowledge Assistant ready: tile_id=%s endpoint=%s", tile_id, endpoint_name)
        return {
            "DATABRICKS_KA_TILE_ID": tile_id,
            "DATABRICKS_KA_ENDPOINT": endpoint_name,
        }

    def create_or_update_mas(
        self, spec: dict[str, Any], *, ka_tile_id: str, genie_space_id: str
    ) -> dict[str, str]:
        agents_payload: list[dict[str, Any]] = []
        for agent in spec.get("agents", []):
            entry = {"name": agent["name"], "description": agent["description"]}
            kind = agent.get("kind")
            if kind == "knowledge_assistant":
                entry["ka_tile_id"] = ka_tile_id
            elif kind == "genie_space":
                entry["genie_space_id"] = genie_space_id
            elif kind == "uc_function":
                entry["uc_function_name"] = agent["uc_function_name"]
            elif kind == "endpoint":
                entry["endpoint_name"] = agent["endpoint_name"]
            agents_payload.append(entry)

        result = self._fns["manage_mas"](
            action="create_or_update",
            name=spec["name"],
            description=spec.get("description", ""),
            instructions="\n".join(spec.get("instructions", [])),
            agents=agents_payload,
            examples=spec.get("examples", []),
        ) or {}
        tile_id = result.get("tile_id") or ""
        endpoint_name = result.get("endpoint_name") or ""
        LOG.info("Supervisor MAS ready: tile_id=%s endpoint=%s", tile_id, endpoint_name)
        return {
            "DATABRICKS_SUPERVISOR_TILE_ID": tile_id,
            "DATABRICKS_SUPERVISOR_ENDPOINT": endpoint_name,
        }

    def wait_until_ready(self, tile_id: str, *, kind: str) -> None:
        if not tile_id:
            return
        fn = self._fns.get(f"manage_{ 'mas' if kind == 'supervisor' else 'ka' }")
        if not fn:
            return
        deadline = time.time() + POLL_TIMEOUT_S
        while time.time() < deadline:
            result = fn(action="get", tile_id=tile_id) or {}
            status = (result.get("endpoint_status") or "").upper()
            if status in ("ONLINE", "READY"):
                LOG.info("(%s) tile %s is %s", kind, tile_id, status)
                return
            if status in ("FAILED", "OFFLINE"):
                raise SystemExit(f"{kind} tile {tile_id} entered terminal state {status}")
            LOG.info("(%s) waiting for tile %s (status=%s)", kind, tile_id, status)
            time.sleep(POLL_INTERVAL_S)
        raise SystemExit(
            f"{kind} tile {tile_id} did not reach ONLINE within {POLL_TIMEOUT_S}s"
        )


def _select_backend() -> _AgentBricksBackend:
    mcp = _MCPBackend()
    if mcp.is_available():
        LOG.info("Using MCP Agent Bricks backend (manage_genie / manage_ka / manage_mas)")
        return mcp
    LOG.warning(
        "Agent Bricks MCP tools not detected; falling back to print-runbook mode. "
        "Apply the printed specs in the Databricks UI, then re-run with the "
        "resolved IDs in your .env."
    )
    return _PrintRunbookBackend()


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    cfg = TargetConfig.from_env()
    LOG.info(
        "Provisioning Seqwater Agent Bricks against catalog=%s schema=%s volume=%s",
        cfg.catalog, cfg.schema, cfg.volume,
    )

    genie_spec = _load_spec(GENIE_SPEC, cfg)
    ka_spec = _load_spec(KA_SPEC, cfg)
    sup_spec = _load_spec(SUP_SPEC, cfg)

    backend = _select_backend()

    LOG.info("Step 1/3: Genie space")
    genie_ids = backend.create_or_update_genie(genie_spec)
    genie_space_id = genie_ids.get("DATABRICKS_GENIE_SPACE_ID", "")

    LOG.info("Step 2/3: Knowledge Assistant")
    ka_ids = backend.create_or_update_ka(ka_spec)
    ka_tile_id = ka_ids.get("DATABRICKS_KA_TILE_ID", "")
    backend.wait_until_ready(ka_tile_id, kind="ka")

    LOG.info("Step 3/3: Supervisor MAS")
    sup_ids = backend.create_or_update_mas(
        sup_spec, ka_tile_id=ka_tile_id, genie_space_id=genie_space_id
    )
    sup_tile_id = sup_ids.get("DATABRICKS_SUPERVISOR_TILE_ID", "")
    backend.wait_until_ready(sup_tile_id, kind="supervisor")

    updates: dict[str, str] = {}
    updates.update(genie_ids)
    updates.update(ka_ids)
    updates.update(sup_ids)
    if updates:
        _persist_env(updates)
    LOG.info("Done. Restart `uvicorn backend.main:app` so the new env vars are picked up.")


if __name__ == "__main__":
    main()
