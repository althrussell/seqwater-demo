"""Pydantic response models exposed by the API.

These are intentionally permissive (most fields optional) so that the same models
serve both local synthetic data and live Databricks Unity Catalog data.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class _Base(BaseModel):
    model_config = ConfigDict(extra="allow")


class HealthResponse(_Base):
    status: Literal["ok"]
    mode: str
    synthetic_demo: bool = True
    catalog: str
    schema_: str = Field(alias="schema")
    timestamp: str
    version: str


class Asset(_Base):
    asset_id: str
    name: str
    asset_type: str
    region: str
    criticality: str
    capacity_ml: float | None = None
    commissioned_year: int | None = None
    lat: float | None = None
    lon: float | None = None
    synthetic_demo_flag: bool = True


class AssetRiskRow(_Base):
    asset_id: str
    asset_name: str
    asset_type: str
    criticality: str
    risk_score: float
    risk_band: str
    predicted_failure_30d: float
    open_work_orders: int
    health_index: float
    recommended_action: str
    synthetic_demo_flag: bool = True


class WorkOrder(_Base):
    work_order_id: str
    asset_id: str
    asset_name: str
    priority: str
    status: str
    opened_at: str
    age_days: int
    description: str
    synthetic_demo_flag: bool = True


class WaterQualitySample(_Base):
    sample_id: str
    asset_id: str
    asset_name: str
    sample_zone: str
    sampled_at: str
    turbidity_NTU: float
    pH: float
    chlorine_residual_mg_L: float
    conductivity_uS_cm: float
    temperature_c: float
    e_coli_detected: bool
    alert_level: str
    recommended_action: str
    synthetic_demo_flag: bool = True


class FloodScenario(_Base):
    scenario_id: str
    scenario_name: str
    rainfall_forecast_mm_24h: float
    rainfall_forecast_mm_72h: float
    catchment_saturation_index: float
    current_storage_percent: float
    projected_storage_percent: float
    release_required: bool
    downstream_impact_score: float
    recommended_actions: str
    action_owner: str
    status: str
    synthetic_demo_flag: bool = True


class ScenarioRunRequest(BaseModel):
    scenario_name: str = Field(default="Custom synthetic scenario")
    rainfall_forecast_mm_24h: float = 60
    rainfall_forecast_mm_72h: float = 200
    catchment_saturation_index: float = 0.65
    current_storage_percent: float = 78.0
    treatment_demand_ml_day: float = 1280
    downstream_sensitivity: float = 0.5


class ScenarioRunResult(_Base):
    scenario_id: str
    scenario_name: str
    inputs: dict[str, Any]
    projected_storage_percent: float
    risk_classification: str
    assets_affected: list[str]
    water_quality_risk: str
    recommended_actions: list[str]
    communications_checklist: list[str]
    human_validation_required: bool = True
    synthetic_demo_flag: bool = True
    storage_trajectory: list[dict[str, Any]] = []


class KpiTile(_Base):
    label: str
    value: str
    sublabel: str | None = None
    status: Literal["ok", "watch", "elevated", "critical"] = "ok"
    delta: str | None = None
    icon: str | None = None


class TrendPoint(_Base):
    x: str
    y: float


class TrendSeries(_Base):
    name: str
    points: list[TrendPoint]


class OverviewResponse(_Base):
    generated_at: str
    synthetic_demo: bool = True
    headline_status: str
    seventy_two_hour_risk: str
    storage_percent: float
    forecast_demand_ml: float
    treatment_capacity_ml: float
    open_critical_work_orders: int
    quality_alerts: int
    elevated_assets: int
    ai_executive_summary: str
    top_actions: list[str]
    kpis: list[KpiTile]
    trends: dict[str, list[TrendPoint]]


class ChatMessage(_Base):
    role: Literal["user", "assistant", "system", "tool"]
    content: str


class ChatRequest(BaseModel):
    question: str
    history: list[ChatMessage] = []
    selected_asset_id: str | None = None


class Citation(_Base):
    source: str
    detail: str
    href: str | None = None


class ChatResponse(_Base):
    trace_id: str
    answer: str
    summary: str
    key_signals: list[str]
    recommended_next_actions: list[str]
    risks_assumptions: list[str]
    sources_used: list[Citation]
    human_validation_required: bool = True
    confidence: Literal["Low", "Medium", "High"] = "Medium"
    tools_used: list[str] = []
    is_mock: bool = True
    synthetic_demo_flag: bool = True


class BriefingRequest(BaseModel):
    audience: Literal["board", "executive", "operations"] = "board"
    include_sections: list[str] | None = None
    scenario_id: str | None = None


class BriefingResponse(_Base):
    trace_id: str
    title: str
    generated_at: str
    audience: str
    sections: dict[str, str]
    markdown: str
    html: str
    sources_used: list[Citation]
    human_validation_required: bool = True
    synthetic_demo_flag: bool = True


class CapitalProject(_Base):
    project_id: str
    project_name: str
    asset_id: str
    asset_name: str
    project_type: str
    estimated_cost_aud: int
    risk_reduction_score: float
    delivery_risk: str
    community_impact: str
    recommended_priority: str
    synthetic_demo_flag: bool = True


class GovernanceTile(_Base):
    title: str
    summary: str
    detail: list[str]
    icon: str
    accent: str


class AuditRow(_Base):
    trace_id: str
    user_id: str
    timestamp: str
    question: str
    tools_used: str
    sources_used: str
    confidence: str
    response_summary: str
    human_validation_required: bool
    synthetic_demo_flag: bool = True
