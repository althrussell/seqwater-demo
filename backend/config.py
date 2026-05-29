"""Application configuration loaded from environment / .env."""
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    """Runtime settings.

    The app supports two modes:
      * ``local``       (default) — synthetic data only, mock AI responses.
      * ``databricks``  — Serverless SQL Warehouse, Foundation Model API, Volumes.
    """

    model_config = SettingsConfigDict(
        env_file=str(ROOT_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_mode: str = Field(default="local", alias="APP_MODE")
    app_host: str = Field(default="0.0.0.0", alias="APP_HOST")
    app_port: int = Field(default=8000, alias="APP_PORT")
    frontend_dev_port: int = Field(default=5173, alias="FRONTEND_DEV_PORT")

    databricks_host: str | None = Field(default=None, alias="DATABRICKS_HOST")
    databricks_token: str | None = Field(default=None, alias="DATABRICKS_TOKEN")
    databricks_warehouse_id: str | None = Field(default=None, alias="DATABRICKS_WAREHOUSE_ID")
    databricks_catalog: str = Field(default="main", alias="DATABRICKS_CATALOG")
    databricks_schema: str = Field(default="seqwater_demo", alias="DATABRICKS_SCHEMA")
    databricks_volume: str = Field(default="operational_docs", alias="DATABRICKS_VOLUME")
    databricks_llm_endpoint: str = Field(
        default="databricks-meta-llama-3-3-70b-instruct",
        alias="DATABRICKS_LLM_ENDPOINT",
    )
    databricks_llm_temperature: float = Field(default=0.1, alias="DATABRICKS_LLM_TEMPERATURE")
    databricks_llm_max_tokens: int = Field(default=2048, alias="DATABRICKS_LLM_MAX_TOKENS")
    databricks_vector_search_endpoint: str | None = Field(
        default=None, alias="DATABRICKS_VECTOR_SEARCH_ENDPOINT"
    )
    databricks_vector_search_index: str | None = Field(
        default=None, alias="DATABRICKS_VECTOR_SEARCH_INDEX"
    )

    synthetic_data_dir: str = Field(default="data/synthetic", alias="SYNTHETIC_DATA_DIR")
    documents_dir: str = Field(default="data/documents", alias="DOCUMENTS_DIR")

    mlflow_tracking_uri: str | None = Field(default=None, alias="MLFLOW_TRACKING_URI")
    mlflow_experiment_name: str = Field(
        default="/Shared/seqwater-aquaiq", alias="MLFLOW_EXPERIMENT_NAME"
    )

    demo_seed: int = Field(default=20260529, alias="DEMO_SEED")
    demo_timezone: str = Field(default="Australia/Brisbane", alias="DEMO_TIMEZONE")

    @property
    def is_databricks_mode(self) -> bool:
        return self.app_mode.lower() == "databricks"

    @property
    def synthetic_dir(self) -> Path:
        path = Path(self.synthetic_data_dir)
        if not path.is_absolute():
            path = ROOT_DIR / path
        return path

    @property
    def docs_dir(self) -> Path:
        path = Path(self.documents_dir)
        if not path.is_absolute():
            path = ROOT_DIR / path
        return path

    @property
    def uc_namespace(self) -> str:
        return f"{self.databricks_catalog}.{self.databricks_schema}"

    @property
    def uc_volume_path(self) -> str:
        return f"/Volumes/{self.databricks_catalog}/{self.databricks_schema}/{self.databricks_volume}"


@lru_cache
def get_settings() -> Settings:
    return Settings()
