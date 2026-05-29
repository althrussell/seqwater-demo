"""Shared helpers for executing parameterised SQL on a Databricks SQL Warehouse.

Used by the deployment scripts (create UC assets, seed data, run quality checks).

The SQL files under ``databricks/sql`` and ``databricks/volumes`` use simple
``{catalog}.{schema}.{volume}`` placeholders; this helper substitutes them with
the configured values before submitting via the SQL Statements API.
"""
from __future__ import annotations

import os
import re
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[1]


def _split_statements(sql_text: str) -> list[str]:
    """Split a SQL file into individual statements, ignoring comments / blanks."""
    cleaned: list[str] = []
    for raw in sql_text.split(";"):
        # Drop pure-comment / whitespace blocks.
        no_comments = re.sub(r"--.*$", "", raw, flags=re.MULTILINE)
        if no_comments.strip():
            cleaned.append(raw.strip())
    return cleaned


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
            warehouse_id=_require_env("DATABRICKS_WAREHOUSE_ID"),
            catalog=os.environ.get("DATABRICKS_CATALOG", "main"),
            schema=os.environ.get("DATABRICKS_SCHEMA", "seqwater_demo"),
            volume=os.environ.get("DATABRICKS_VOLUME", "operational_docs"),
        )

    def render(self, sql_text: str) -> str:
        return sql_text.format(
            catalog=self.catalog,
            schema=self.schema,
            volume=self.volume,
        )


def _require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        print(f"ERROR: environment variable {name} is required.", file=sys.stderr)
        raise SystemExit(2)
    return value


def get_workspace_client():  # noqa: ANN201 — dynamic import
    try:
        from databricks.sdk import WorkspaceClient  # type: ignore
    except ImportError as exc:  # pragma: no cover
        raise SystemExit(
            "databricks-sdk is not installed. Run "
            "`pip install -e '.[databricks]'` first."
        ) from exc
    return WorkspaceClient(profile=os.environ.get("DATABRICKS_CONFIG_PROFILE"))


def execute_sql(client, warehouse_id: str, statement: str, *, catalog: str | None = None,
                schema: str | None = None, max_wait_seconds: int = 180):
    """Run a single SQL statement via the Statements API and wait for completion."""
    from databricks.sdk.service.sql import StatementState  # type: ignore

    response = client.statement_execution.execute_statement(
        warehouse_id=warehouse_id,
        statement=statement,
        catalog=catalog,
        schema=schema,
        wait_timeout="50s",
    )
    statement_id = response.statement_id
    state = response.status.state if response.status else StatementState.PENDING
    waited = 0
    while state in (StatementState.PENDING, StatementState.RUNNING):
        if waited >= max_wait_seconds:
            raise SystemExit(
                f"SQL statement timed out after {waited}s (id={statement_id}): "
                f"{statement[:200]}"
            )
        time.sleep(2)
        waited += 2
        polled = client.statement_execution.get_statement(statement_id)
        response = polled
        state = polled.status.state if polled.status else StatementState.PENDING

    if state != StatementState.SUCCEEDED:
        err = (
            response.status.error.message
            if response.status and response.status.error
            else "unknown error"
        )
        raise SystemExit(f"SQL execution failed (state={state}): {err}\nSQL: {statement[:400]}")
    return response


def run_sql_file(client, cfg: TargetConfig, path: Path, *, on_each: Iterable[str] | None = None) -> None:
    print(f"--> {path.relative_to(ROOT)}")
    rendered = cfg.render(path.read_text())
    statements = _split_statements(rendered)
    for stmt in statements:
        execute_sql(client, cfg.warehouse_id, stmt, catalog=cfg.catalog, schema=cfg.schema)
    print(f"   ok  ({len(statements)} statements)")
