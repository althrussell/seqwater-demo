import type {
  Asset,
  AssetRiskRow,
  AuditRow,
  BriefingResponse,
  CapitalProject,
  ChatResponse,
  FloodScenario,
  GovernanceTile,
  OverviewResponse,
  ScenarioRunResult,
  WaterQualitySample,
} from "./types";

const BASE = "/api";

async function jsonGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function jsonPost<TReq, TRes>(path: string, body: TReq): Promise<TRes> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
  return res.json() as Promise<TRes>;
}

export const api = {
  health: () => jsonGet<{ status: string; mode: string; version: string }>("/health"),
  overview: () => jsonGet<OverviewResponse>("/overview"),
  assets: () => jsonGet<Asset[]>("/assets"),
  asset: (id: string) => jsonGet<Asset & Record<string, unknown>>(`/assets/${id}`),
  assetRisk: () => jsonGet<AssetRiskRow[]>("/asset-risk"),
  workOrders: () => jsonGet<Record<string, unknown>[]>("/work-orders"),
  waterSecurity: () => jsonGet<Record<string, unknown>>("/water-security"),
  waterQuality: () =>
    jsonGet<{
      samples: WaterQualitySample[];
      plant_operations: Record<string, unknown>[];
      turbidity_events: Record<string, unknown>[];
      alerts: Record<string, unknown>[];
      elevated_count: number;
      watch_count: number;
      turbidity_trend: { x: string; y: number }[];
    }>("/water-quality"),
  floodScenarios: () => jsonGet<FloodScenario[]>("/flood-scenarios"),
  floodScenarioDetail: (id: string) =>
    jsonGet<FloodScenario & { simulation: Record<string, unknown>[]; actions: Record<string, unknown>[] }>(
      `/flood-scenarios/${id}`,
    ),
  runScenario: (body: {
    scenario_name: string;
    rainfall_forecast_mm_24h: number;
    rainfall_forecast_mm_72h: number;
    catchment_saturation_index: number;
    current_storage_percent: number;
    treatment_demand_ml_day: number;
    downstream_sensitivity: number;
  }) => jsonPost<typeof body, ScenarioRunResult>("/flood-scenarios/run", body),
  capitalProjects: () => jsonGet<CapitalProject[]>("/capital-projects"),
  chat: (body: { question: string; history?: { role: string; content: string }[]; selected_asset_id?: string }) =>
    jsonPost<typeof body, ChatResponse>("/ai/chat", body),
  briefing: (body: { audience?: string; include_sections?: string[]; scenario_id?: string }) =>
    jsonPost<typeof body, BriefingResponse>("/ai/briefing", body),
  audit: () => jsonGet<AuditRow[]>("/governance/audit"),
  governanceTiles: () => jsonGet<GovernanceTile[]>("/governance/tiles"),
};
