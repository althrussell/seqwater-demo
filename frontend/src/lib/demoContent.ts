/**
 * Canonical demo content for the Water for Life Intelligence Centre.
 *
 * Values in this module are SYNTHETIC. They are tuned to match the supplied
 * reference screenshots so the live UI can be presented with confidence.
 * Live trend and list data continues to flow from the FastAPI backend.
 */

import {
  AlertTriangle,
  Droplets,
  Eye,
  ShieldCheck,
  TrendingUp,
  Wrench,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import type { Status } from "@/components/ui/StatusBadge";

// ---------- Hero imagery ---------------------------------------------------

export const HERO_IMAGES = {
  executiveOverview: "/heroes/hero-01.jpg",
  seqWaterGridMap: "/heroes/hero-03.jpg",
  floodReadiness: "/heroes/hero-02.jpg",
  waterSecuritySupply:
    "https://images.unsplash.com/photo-1554492281-29e10c2e9c83?auto=format&fit=crop&w=1600&q=70",
  assetResilience:
    "https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=1600&q=70",
  waterQuality:
    "https://images.unsplash.com/photo-1559825481-12a05cc00344?auto=format&fit=crop&w=1600&q=70",
  aquaIQ:
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1600&q=70",
  governance:
    "https://images.unsplash.com/photo-1473773508845-188df298d2d1?auto=format&fit=crop&w=1600&q=70",
};

// ---------- Executive Overview --------------------------------------------

export interface KpiDef {
  title: string;
  value: string;
  supportingText: string;
  status: Status;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  spark: number[];
  sparkColor?: string;
  sparkVariant?: "area" | "bar";
}

export const EXECUTIVE_KPIS: KpiDef[] = [
  {
    title: "Total Grid Storage",
    value: "72.4%",
    supportingText: "▼ 1.8% vs yesterday",
    status: "monitor",
    icon: Droplets,
    spark: [70.1, 70.4, 70.9, 71.2, 71.5, 71.9, 72.4],
    sparkColor: "#0076BE",
  },
  {
    title: "Forecast Demand",
    value: "+8.7%",
    supportingText: "vs 14-day average",
    status: "monitor",
    icon: TrendingUp,
    spark: [4, 5, 5, 7, 8, 7, 9, 8, 9, 8, 9, 9, 10, 9],
    sparkColor: "#5FA777",
    sparkVariant: "bar",
  },
  {
    title: "Treatment Capacity",
    value: "86%",
    supportingText: "of total capacity",
    status: "normal",
    icon: ShieldCheck,
    spark: [82, 83, 84, 84, 85, 86, 86],
    sparkColor: "#2E7D59",
  },
  {
    title: "Water Quality Alerts",
    value: "4",
    supportingText: "▼ 2 vs yesterday",
    status: "watch",
    icon: AlertTriangle,
    spark: [3, 2, 3, 4, 4, 3, 4],
    sparkColor: "#D88A00",
    sparkVariant: "bar",
  },
  {
    title: "Elevated Asset Risks",
    value: "7",
    supportingText: "no change",
    status: "watch",
    icon: Eye,
    spark: [6, 7, 7, 7, 7, 7, 7],
    sparkColor: "#5FA777",
  },
  {
    title: "Critical Work Orders",
    value: "11",
    supportingText: "▼ 3 vs yesterday",
    status: "monitor",
    icon: Wrench,
    spark: [8, 9, 9, 10, 11, 11, 11],
    sparkColor: "#0076BE",
  },
];

export const EXECUTIVE_PRIORITIES: Array<{
  title: string;
  description: string;
  status: Status;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}> = [
  {
    title: "Monitor catchment rainfall and inflows",
    description: "Elevated rainfall forecast across 3 catchments.",
    status: "watch",
    icon: AlertTriangle,
  },
  {
    title: "Review water quality risk",
    description: "Turbidity risk elevated at 2 treatment plants.",
    status: "monitor",
    icon: Droplets,
  },
  {
    title: "Maintain asset resilience",
    description: "7 assets with elevated risk requiring attention.",
    status: "monitor",
    icon: ShieldCheck,
  },
];

export const EXECUTIVE_AI_SUMMARY = `Rainfall forecasts indicate increased inflows to Wivenhoe and Somerset catchments over the next 72 hours. Elevated turbidity risk at North Pine WTP and Moggill WTP should be monitored. Asset risk is elevated for 7 assets, primarily due to maintenance backlogs and age-related factors. No immediate operational impacts to supply continuity are expected.`;

export const EXECUTIVE_AI_EVIDENCE: string[] = [
  "Total grid storage at 72.4%, tracking 1.8% above the 5-year median for late May.",
  "Rainfall forecast 30–80mm across Wivenhoe, Somerset and North Pine catchments over the next 72 hours.",
  "2 treatment plants flagged for elevated turbidity risk: North Pine WTP and Moggill WTP.",
  "7 assets with elevated risk; 11 critical work orders open across the synthetic asset register.",
];

export const EXECUTIVE_AI_REVIEW: string[] = [
  "Confirm chemical dosing readiness with operations leads at North Pine and Moggill WTPs.",
  "Validate 72-hour inflow positioning with the dam operations team.",
  "Review the top 3 critical work orders ahead of the morning ops stand-up.",
];

export interface SourceChip {
  label: string;
  type: "table" | "document" | "workflow" | "model" | "view";
}

export const EXECUTIVE_AI_SOURCES: SourceChip[] = [
  { label: "main.seqwater_demo.dam_storage_daily", type: "table" },
  { label: "main.seqwater_demo.rainfall_forecast", type: "table" },
  { label: "Synthetic operations brief — 29 May", type: "document" },
  { label: "Foundation Model API (governed)", type: "model" },
  { label: "Quality compliance view (synthetic)", type: "view" },
];

// ---------- Water Security & Supply ---------------------------------------

export const SUPPLY_KPIS: KpiDef[] = [
  {
    title: "Total Grid Storage",
    value: "72.4%",
    supportingText: "▼ 1.8% vs yesterday",
    status: "monitor",
    icon: Droplets,
    spark: [70.1, 70.4, 70.9, 71.2, 71.5, 71.9, 72.4],
    sparkColor: "#0076BE",
  },
  {
    title: "Forecast Demand (Next 72h)",
    value: "+8.7%",
    supportingText: "vs 14-day average",
    status: "monitor",
    icon: TrendingUp,
    spark: [4, 5, 5, 7, 8, 7, 9, 8, 9, 8, 9, 9, 10, 9],
    sparkColor: "#5FA777",
    sparkVariant: "bar",
  },
  {
    title: "Treatment Capacity",
    value: "86%",
    supportingText: "of total capacity",
    status: "normal",
    icon: ShieldCheck,
    spark: [82, 83, 84, 84, 85, 86, 86],
    sparkColor: "#2E7D59",
  },
  {
    title: "Supply Continuity Status",
    value: "Good",
    supportingText: "No current constraints",
    status: "normal",
    icon: ShieldCheck,
    spark: [],
  },
  {
    title: "Storage Trend (14 Days)",
    value: "Stable",
    supportingText: "Within target range",
    status: "normal",
    icon: TrendingUp,
    spark: [70, 71, 71, 72, 72, 71, 72, 72, 72, 72, 73, 72, 72, 72],
    sparkColor: "#0076BE",
  },
  {
    title: "Climate Outlook (Next 7 Days)",
    value: "Wetter",
    supportingText: "Above median forecast",
    status: "monitor",
    icon: Droplets,
    spark: [],
  },
];

export const SUPPLY_BALANCE = {
  availableMl: 537_200,
  demandMl: 412_300,
  marginMl: 124_900,
  marginPercent: 23,
};

export const SOURCE_CONTRIBUTION = [
  { name: "Wivenhoe System", value: 225_600, color: "#0076BE" },
  { name: "North Pine System", value: 128_900, color: "#00AEEF" },
  { name: "Somerset System", value: 96_600, color: "#5FA777" },
  { name: "Stanley River System", value: 42_900, color: "#7FA77B" },
  { name: "Other Sources", value: 43_200, color: "#94A3B8" },
];

export const TREATMENT_PLANT_CAPACITY = [
  { plant: "North Pine WTP", availableMlDay: 470, percentDesign: 84 },
  { plant: "Moggill WTP", availableMlDay: 270, percentDesign: 90 },
  { plant: "Gold Coast WTP", availableMlDay: 180, percentDesign: 75 },
  { plant: "Brisbane West WTP", availableMlDay: 120, percentDesign: 80 },
  { plant: "Sunshine Coast WTP", availableMlDay: 95, percentDesign: 70 },
];

export const SUPPLY_WATCHPOINTS = [
  { text: "No active water supply constraints", status: "normal" as Status },
  {
    text: "All critical bulk water storages within normal operating range",
    status: "normal" as Status,
  },
  { text: "No restrictions in place", status: "normal" as Status },
  {
    text: "Monitor rainfall and inflows over coming 72 hours",
    status: "monitor" as Status,
  },
];

export const SUPPLY_AQUAIQ = `Forecast inflows are expected to increase across 3 major catchments over the next 72 hours. Supply outlook remains positive with adequate margins across all systems.`;

export const SUPPLY_KEY_DRIVERS = [
  "Increased inflows forecast in Brisbane, Pine and Maroochy catchments",
  "Demand forecast slightly above 14-day average",
  "All major treatment plants operating within normal parameters",
];

// 60 days of synthetic SEQ storage % (matches the look of the supplied chart)
export const STORAGE_HISTORY: { date: string; actual: number; median: number; p10: number; p90: number }[] =
  Array.from({ length: 60 }).map((_, i) => {
    const base = 74 - i * 0.05 + Math.sin(i / 5) * 1.4 + Math.sin(i / 11) * 0.6;
    const actual = Math.max(60, Math.min(82, base + (i > 45 ? -1.2 : 0)));
    const median = 71 + Math.sin(i / 7) * 0.6;
    return {
      date: new Date(2026, 3, 1 + i).toISOString().slice(0, 10),
      actual,
      median,
      p10: median - 9,
      p90: median + 9,
    };
  });

// ---------- Asset Resilience & Capital Priorities -------------------------

export const ASSET_RESILIENCE_KPIS: KpiDef[] = [
  {
    title: "Elevated Assets",
    value: "7",
    supportingText: "no change",
    status: "watch",
    icon: AlertTriangle,
    spark: [6, 7, 7, 7, 7, 7, 7],
    sparkColor: "#D88A00",
  },
  {
    title: "Critical Work Orders",
    value: "11",
    supportingText: "3 vs yesterday",
    status: "monitor",
    icon: Wrench,
    spark: [8, 9, 9, 10, 11, 11, 11],
    sparkColor: "#0076BE",
  },
  {
    title: "Priority Projects",
    value: "12",
    supportingText: "in capital pipeline",
    status: "normal",
    icon: ShieldCheck,
    spark: [11, 11, 12, 12, 12, 12, 12],
    sparkColor: "#2E7D59",
  },
  {
    title: "Risk Reduction Opportunity",
    value: "68%",
    supportingText: "from top 5 projects",
    status: "monitor",
    icon: TrendingUp,
    spark: [61, 63, 64, 66, 67, 68, 68],
    sparkColor: "#0076BE",
  },
  {
    title: "Capital Pipeline",
    value: "$420M",
    supportingText: "synthetic, 5-year",
    status: "normal",
    icon: TrendingUp,
    spark: [380, 390, 400, 410, 415, 420, 420],
    sparkColor: "#2E7D59",
  },
  {
    title: "Delivery Watchpoints",
    value: "3",
    supportingText: "projects requiring review",
    status: "watch",
    icon: AlertTriangle,
    spark: [2, 3, 3, 3, 3, 3, 3],
    sparkColor: "#D88A00",
  },
];

export interface MatrixPoint {
  asset: string;
  criticality: number; // 1..5
  conditionRisk: number; // 1..5
  region: string;
  band: "low" | "medium" | "high" | "elevated";
}

export const ASSET_MATRIX: MatrixPoint[] = [
  { asset: "Wivenhoe Dam", criticality: 5, conditionRisk: 2.4, region: "Brisbane", band: "medium" },
  { asset: "Somerset Dam", criticality: 5, conditionRisk: 2.1, region: "Brisbane", band: "low" },
  { asset: "North Pine WTP", criticality: 5, conditionRisk: 3.8, region: "Brisbane North", band: "high" },
  { asset: "Moggill WTP", criticality: 4, conditionRisk: 3.5, region: "Brisbane West", band: "high" },
  { asset: "Brisbane North Pump Station", criticality: 4, conditionRisk: 3.2, region: "Brisbane North", band: "medium" },
  { asset: "Sunshine Coast Trunk Main", criticality: 3, conditionRisk: 3.6, region: "Sunshine Coast", band: "high" },
  { asset: "Gold Coast Desalination Plant", criticality: 3, conditionRisk: 2.4, region: "Gold Coast", band: "medium" },
  { asset: "Logan River Pipeline", criticality: 3, conditionRisk: 4.1, region: "Logan", band: "elevated" },
  { asset: "Hinze Dam", criticality: 4, conditionRisk: 2.0, region: "Gold Coast", band: "low" },
  { asset: "Caboolture Pump Station", criticality: 2, conditionRisk: 3.4, region: "Moreton Bay", band: "medium" },
];

export interface CriticalAsset {
  asset: string;
  type: string;
  region: string;
  status: Status;
  riskDriver: string;
  recommendedReview: string;
}

export const CRITICAL_ASSETS: CriticalAsset[] = [
  {
    asset: "Wivenhoe Dam",
    type: "Dam",
    region: "Brisbane",
    status: "monitor",
    riskDriver: "Rising catchment inflows",
    recommendedReview: "Inflow forecast review",
  },
  {
    asset: "North Pine WTP",
    type: "Water Treatment Plant",
    region: "Brisbane North",
    status: "watch",
    riskDriver: "Turbidity forecast risk",
    recommendedReview: "Treatment readiness review",
  },
  {
    asset: "Moggill WTP",
    type: "Water Treatment Plant",
    region: "Brisbane West",
    status: "watch",
    riskDriver: "Aged dosing equipment",
    recommendedReview: "Maintenance prioritisation",
  },
  {
    asset: "Brisbane North Pump Station",
    type: "Pump Station",
    region: "Brisbane North",
    status: "monitor",
    riskDriver: "Pump health trending down",
    recommendedReview: "Condition-based maintenance",
  },
  {
    asset: "Sunshine Coast Trunk Main",
    type: "Pipeline",
    region: "Sunshine Coast",
    status: "watch",
    riskDriver: "Age and material risk",
    recommendedReview: "Capital investment review",
  },
  {
    asset: "Gold Coast Desalination Plant",
    type: "Water Treatment Plant",
    region: "Gold Coast",
    status: "normal",
    riskDriver: "Steady-state operations",
    recommendedReview: "Continue scheduled checks",
  },
];

export interface CapitalProjectCard {
  priority: number;
  name: string;
  estimatedCost: string;
  riskReductionScore: number;
  delivery: string;
  rationale: string;
}

export const CAPITAL_PROJECTS: CapitalProjectCard[] = [
  {
    priority: 1,
    name: "North Pine WTP Upgrade",
    estimatedCost: "$185M synthetic",
    riskReductionScore: 92,
    delivery: "FY27 – FY29",
    rationale:
      "Restores treatment headroom under elevated turbidity scenarios and reduces single-asset dependency in Brisbane North.",
  },
  {
    priority: 2,
    name: "Logan River Pipeline Duplication",
    estimatedCost: "$120M synthetic",
    riskReductionScore: 84,
    delivery: "FY28 – FY30",
    rationale:
      "Improves transfer reliability between Logan and Gold Coast networks and protects against single-point outage.",
  },
  {
    priority: 3,
    name: "Hinze Dam Safety Enhancement",
    estimatedCost: "$78M synthetic",
    riskReductionScore: 71,
    delivery: "FY27 – FY28",
    rationale:
      "Strengthens dam safety posture in line with synthetic regulatory direction and community resilience commitments.",
  },
  {
    priority: 4,
    name: "Advanced Metering Program",
    estimatedCost: "$37M synthetic",
    riskReductionScore: 56,
    delivery: "FY27 – FY29",
    rationale:
      "Unlocks demand visibility and supports proactive supply balancing across the SEQ Water Grid.",
  },
];

export const CAPITAL_AQUAIQ = `Synthetic investment analysis indicates the highest near-term risk reduction comes from water treatment resilience and raw water transfer reliability projects. Prioritisation should be validated against engineering assessments, regulatory commitments and approved capital planning processes.`;

// ---------- Water Quality Assurance ---------------------------------------

export const QUALITY_KPIS: KpiDef[] = [
  {
    title: "Water Quality Status",
    value: "Normal",
    supportingText: "All systems",
    status: "normal",
    icon: ShieldCheck,
    spark: [],
  },
  {
    title: "Compliance",
    value: "99.7%",
    supportingText: "rolling 30 day",
    status: "normal",
    icon: TrendingUp,
    spark: [99.5, 99.6, 99.6, 99.7, 99.7, 99.7, 99.7],
    sparkColor: "#2E7D59",
  },
  {
    title: "Events",
    value: "2 minor",
    supportingText: "this week",
    status: "monitor",
    icon: AlertTriangle,
    spark: [],
  },
  {
    title: "Customer Alerts",
    value: "0 active",
    supportingText: "no notifications",
    status: "normal",
    icon: ShieldCheck,
    spark: [],
  },
];

export interface QualityIndicator {
  indicator: string;
  status: Status;
  trend: number[];
  trendColor: string;
  compliance: string;
}

export const QUALITY_INDICATORS: QualityIndicator[] = [
  {
    indicator: "Turbidity",
    status: "watch",
    trend: [9, 10, 10.5, 11, 11.5, 12, 13.1],
    trendColor: "#D88A00",
    compliance: "99.2%",
  },
  {
    indicator: "E. coli",
    status: "normal",
    trend: [0, 0, 0, 0, 0, 0, 0],
    trendColor: "#2E7D59",
    compliance: "100%",
  },
  {
    indicator: "Chlorine Residual",
    status: "normal",
    trend: [0.92, 0.95, 0.94, 0.96, 0.97, 0.96, 0.95],
    trendColor: "#0076BE",
    compliance: "99.9%",
  },
  {
    indicator: "pH",
    status: "normal",
    trend: [7.4, 7.4, 7.5, 7.5, 7.4, 7.5, 7.5],
    trendColor: "#0076BE",
    compliance: "100%",
  },
  {
    indicator: "Taste & Odour",
    status: "monitor",
    trend: [1, 1, 1, 2, 1, 2, 2],
    trendColor: "#5FA777",
    compliance: "99.8%",
  },
];

export const QUALITY_PLANTS = [
  { plant: "North Pine WTP", status: "watch" as Status, compliance: "99.2%", review: "Operations review" },
  { plant: "Loganholme WTP", status: "normal" as Status, compliance: "99.9%", review: "Routine" },
  { plant: "Tarong WTP", status: "normal" as Status, compliance: "100%", review: "Routine" },
  { plant: "Moggill WTP", status: "watch" as Status, compliance: "99.4%", review: "Operations review" },
];

export const QUALITY_CHECKLIST = [
  "Daily quality summary reviewed",
  "Critical alarms reviewed",
  "Exception follow-up",
  "Customer notifications check",
];

export const QUALITY_AQUAIQ = `Elevated turbidity is likely due to forecast rainfall and catchment runoff. Results shown are synthetic and require water quality team validation before any operational response.`;

// ---------- Flood Readiness ----------------------------------------------

export const FLOOD_SCENARIO_DEFAULTS = {
  rainfallScenario: "1-in-20 year event",
  duration: "72 hours",
  antecedent: "Saturated catchments",
  seaLevel: "King tide aligned",
  stormMovement: "South-east tracking",
};

export const SCENARIO_RAINFALL_OPTIONS = [
  "1-in-5 year event",
  "1-in-20 year event",
  "1-in-50 year event",
  "1-in-100 year event",
];
export const SCENARIO_DURATION_OPTIONS = ["24 hours", "48 hours", "72 hours", "96 hours"];
export const SCENARIO_ANTECEDENT_OPTIONS = [
  "Dry catchments",
  "Normal saturation",
  "Saturated catchments",
];
export const SCENARIO_SEA_LEVEL_OPTIONS = ["Mean tide", "Spring tide", "King tide aligned"];
export const SCENARIO_STORM_OPTIONS = ["Stationary", "South-east tracking", "North tracking"];

export interface CatchmentImpact {
  catchment: string;
  impact: "low" | "medium" | "high";
  peakLevel: string;
  confidence: "Low" | "Medium" | "High";
}

export const CATCHMENT_IMPACTS: CatchmentImpact[] = [
  { catchment: "Lockyer Valley", impact: "high", peakLevel: "+3.4 m", confidence: "Medium" },
  { catchment: "Bremer River", impact: "high", peakLevel: "+2.8 m", confidence: "Medium" },
  { catchment: "Brisbane River", impact: "medium", peakLevel: "+1.9 m", confidence: "High" },
  { catchment: "Logan River", impact: "medium", peakLevel: "+1.5 m", confidence: "High" },
  { catchment: "Gold Coast Creeks", impact: "low", peakLevel: "+0.8 m", confidence: "High" },
];

export const EXECUTIVE_ACTIONS = [
  {
    title: "Activate incident team",
    description: "Assemble the synthetic incident command roster.",
    icon: ShieldCheck,
  },
  {
    title: "Notify stakeholders",
    description: "Trigger pre-approved stakeholder notification list.",
    icon: AlertTriangle,
  },
  {
    title: "Prepare communities",
    description: "Coordinate with local government communication leads.",
    icon: Droplets,
  },
  {
    title: "Review dam ops",
    description: "Engage dam operations team on planning posture.",
    icon: TrendingUp,
  },
  {
    title: "Mobilise resources",
    description: "Pre-position synthetic field crews and equipment.",
    icon: Wrench,
  },
];

export const FLOOD_DISCLAIMER = `This scenario is for planning purposes only. Actual operational decisions require authorised human review and approved procedures.`;

// ---------- AquaIQ Briefing Analyst --------------------------------------

export const AQUAIQ_DEFAULT_QUESTION =
  "What is the outlook for water security across SEQ over the next 3 months?";

export const AQUAIQ_STRUCTURED = {
  executiveSummary: `Water security outlook is Normal for the next 3 months across SEQ. Storages are above long-term average, demand is tracking below forecast, and there are no material water quality risks.`,
  evidence: [
    {
      sourceName: "main.seqwater_demo.dam_storage_daily",
      sourceType: "table" as const,
      usedFor: "Total storage at 82% (synthetic) across SEQ Water Grid",
      confidence: "high" as const,
      detail:
        "Aggregate of the latest synthetic dam storage record per asset, joined to the full supply volume catalogue.",
    },
    {
      sourceName: "main.seqwater_demo.demand_forecast",
      sourceType: "table" as const,
      usedFor: "Demand forecast tracking below 14-day average",
      confidence: "high" as const,
      detail: "Synthetic next-90-day demand baseline compared to the trailing 14-day mean.",
    },
    {
      sourceName: "Synthetic water quality samples (last 14 days)",
      sourceType: "view" as const,
      usedFor: "No material water quality risks detected",
      confidence: "medium" as const,
      detail: "Synthetic compliance view aggregating turbidity, pH, and chlorine residual exceedances.",
    },
    {
      sourceName: "Synthetic treatment plant operations",
      sourceType: "table" as const,
      usedFor: "Treatment plant availability normal",
      confidence: "high" as const,
      detail: "Daily synthetic plant operations health score, all plants within nominal range.",
    },
  ],
  assumptions: [
    "Climate outlook remains within Bureau of Meteorology synthetic medium-range envelope.",
    "No new compliance non-conformances are detected over the planning horizon.",
    "Demand assumptions hold within +/- 5% of synthetic baseline.",
  ],
  risks: [
    "Forecast 72-hour rainfall watch may transiently elevate turbidity at North Pine WTP.",
    "Two ageing synthetic pumps in Brisbane North could elevate operational risk if pressure rises.",
    "Capital project delivery slippage could affect FY28 risk reduction profile.",
  ],
  recommendations: [
    "Maintain current monitoring cadence; no change to public messaging required.",
    "Prioritise raw water pump inspection at North Pine WTP within next maintenance window.",
    "Confirm chemical dosing readiness with operations team.",
  ],
};

export const AQUAIQ_TOOLS_USED = [
  "water_security_summary",
  "asset_risk_search",
  "document_retrieval",
  "compliance_check",
];

export const AQUAIQ_TRACE_ID = "syn-trace-29may2026-0913aest-bf12a";

export const AQUAIQ_ANALYST = {
  name: "Avery Brennan",
  role: "Senior Operations Analyst",
  initials: "AB",
  status: "Pending review",
  reviewedAt: "—",
};

// ---------- Governance & Platform ----------------------------------------

export const GOVERNANCE_COLUMNS = [
  {
    title: "Data Sources",
    items: [
      "SCADA & Telemetry",
      "Hydrology & Rainfall",
      "Water Quality",
      "Assets & Maintenance",
      "Customer & Demand",
      "External Data",
    ],
  },
  {
    title: "Ingestion & Processing",
    items: [
      "Delta Live Tables",
      "Stream Processing",
      "Batch Processing",
      "Data Quality Checks",
    ],
  },
  {
    title: "Unity Catalog Governance",
    items: ["Data Catalog", "Access Controls", "Lineage", "Classification", "Audit Logs"],
  },
  {
    title: "Analytics & AI",
    items: ["Notebooks & BI", "AquaIQ Models", "Forecasting", "Scenario Planning"],
  },
  {
    title: "Delivery",
    items: ["Dashboards", "Alerts & Notifications", "APIs & Integrations", "Reports"],
  },
];

export const MODEL_SERVING_CARDS = [
  {
    title: "Feature Store",
    description: "Versioned, lineage-tracked synthetic features for AquaIQ models.",
  },
  {
    title: "Model Registry",
    description: "Governed registry with stage transitions and synthetic approvals.",
  },
  {
    title: "Serving Endpoints",
    description: "Foundation Model API endpoints with quota and rate guardrails.",
  },
  {
    title: "Monitoring",
    description: "Continuous monitoring of model performance and drift signals.",
  },
];

export const PROOF_POINTS = [
  { title: "Secure by design", description: "Encrypted in transit and at rest." },
  { title: "Privacy protected", description: "Role-based access and masking." },
  { title: "Compliant", description: "Designed for synthetic regulatory alignment." },
  { title: "Accountable", description: "Every AquaIQ output requires human validation." },
];
