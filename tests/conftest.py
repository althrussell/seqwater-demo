"""Pytest configuration: ensure tests always run in local mode and import paths
resolve cleanly from the repo root. We override the APP_MODE env var BEFORE
``backend.config.Settings`` is imported, so the cached settings are deterministic.
"""
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

os.environ.setdefault("APP_MODE", "local")
# Force a known synthetic data path even if a stray .env points elsewhere.
os.environ.setdefault("SYNTHETIC_DATA_DIR", str(ROOT / "data" / "synthetic"))
os.environ.setdefault("DOCUMENTS_DIR", str(ROOT / "data" / "documents"))
# Tests should not hit Databricks. Override anything the developer's .env might set.
os.environ["APP_MODE"] = "local"
