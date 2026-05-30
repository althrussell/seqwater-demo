"""Run data quality checks against the deployed Unity Catalog tables."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from databricks_sql import (  # noqa: E402
    TargetConfig,
    execute_sql,
    get_workspace_client,
)


def main() -> None:
    cfg = TargetConfig.from_env()
    client = get_workspace_client()
    sql_path = ROOT / "databricks" / "sql" / "04_quality_checks.sql"
    rendered = cfg.render(sql_path.read_text())
    statements = [s.strip() for s in rendered.split(";") if s.strip() and not s.strip().startswith("--")]
    failures = 0
    for i, stmt in enumerate(statements, 1):
        print(f"--> check {i}/{len(statements)}")
        resp = execute_sql(client, cfg.warehouse_id, stmt)
        rows = resp.result.data_array if resp.result and resp.result.data_array else []
        if rows:
            print(f"   FAIL — {len(rows)} bad row(s)")
            for r in rows[:5]:
                print(f"     {r}")
            failures += 1
        else:
            print("   ok")
    if failures:
        raise SystemExit(f"{failures} quality check(s) failed.")
    print("All quality checks passed.")


if __name__ == "__main__":
    main()
