// Type definitions mirror the backend Pydantic models. Kept loose with index
// signatures so they tolerate extra synthetic fields without breaking builds.

export interface KpiTile {
  label: string;
  value: string;
  sublabel?: string;
  status?: "ok" | "watch" | "elevated" | "critical";
  delta?: string;
  icon?: string;
}

export interface TrendPoint {
  x: string;
  y: number;
}

export interface OverviewResponse {
  generated_at: string;
  synthetic_demo: boolean;
  headline_status: string;
  seventy_two_hour_risk: string;
  storage_percent: number;
  forecast_demand_ml: number;
  treatment_capacity_ml: number;
  open_critical_work_orders: number;
  quality_alerts: number;
  elevated_assets: number;
  ai_executive_summary: string;
  top_actions: string[];
  kpis: KpiTile[];
  trends: Record<string, TrendPoint[]>;
}

export interface Asset {
  asset_id: string;
  name: string;
  asset_type: string;
  region: string;
  criticality: string;
  capacity_ml?: number | null;
  commissioned_year?: number | null;
  lat?: number | null;
  lon?: number | null;
  synthetic_demo_flag?: boolean;
}

export interface AssetRiskRow {
  asset_id: string;
  asset_name: string;
  asset_type: string;
  criticality: string;
  risk_score: number;
  risk_band: string;
  predicted_failure_30d: number;
  open_work_orders: number;
  health_index: number;
  recommended_action: string;
  lat?: number;
  lon?: number;
}

export interface WaterQualitySample {
  sample_id: string;
  asset_id: string;
  asset_name: string;
  sample_zone: string;
  sampled_at: string;
  turbidity_NTU: number;
  pH: number;
  chlorine_residual_mg_L: number;
  conductivity_uS_cm: number;
  temperature_c: number;
  e_coli_detected: boolean;
  alert_level: "Normal" | "Watch" | "Elevated";
  recommended_action: string;
}

export interface FloodScenario {
  scenario_id: string;
  scenario_name: string;
  rainfall_forecast_mm_24h: number;
  rainfall_forecast_mm_72h: number;
  catchment_saturation_index: number;
  current_storage_percent: number;
  projected_storage_percent: number;
  release_required: boolean;
  downstream_impact_score: number;
  recommended_actions: string;
  action_owner: string;
  status: string;
}

export interface ScenarioRunResult {
  scenario_id: string;
  scenario_name: string;
  inputs: Record<string, number>;
  projected_storage_percent: number;
  risk_classification: string;
  assets_affected: string[];
  water_quality_risk: string;
  recommended_actions: string[];
  communications_checklist: string[];
  human_validation_required: boolean;
  storage_trajectory: { hour: number; projected_storage_percent: number }[];
}

export interface Citation {
  source: string;
  detail: string;
  href?: string;
}

export interface ChatResponse {
  trace_id: string;
  answer: string;
  summary: string;
  key_signals: string[];
  recommended_next_actions: string[];
  risks_assumptions: string[];
  sources_used: Citation[];
  human_validation_required: boolean;
  confidence: "Low" | "Medium" | "High";
  tools_used: string[];
  is_mock: boolean;
}

export interface BriefingResponse {
  trace_id: string;
  title: string;
  generated_at: string;
  audience: string;
  sections: Record<string, string>;
  markdown: string;
  html: string;
  sources_used: Citation[];
  human_validation_required: boolean;
}

export interface CapitalProject {
  project_id: string;
  project_name: string;
  asset_id: string;
  asset_name: string;
  project_type: string;
  estimated_cost_aud: number;
  risk_reduction_score: number;
  delivery_risk: string;
  community_impact: string;
  recommended_priority: string;
}

export interface GovernanceTile {
  title: string;
  summary: string;
  detail: string[];
  icon: string;
  accent: string;
}

export interface AuditRow {
  trace_id: string;
  user_id: string;
  timestamp: string;
  question: string;
  tools_used: string;
  sources_used: string;
  confidence: string;
  response_summary: string;
  human_validation_required: boolean | string;
}
