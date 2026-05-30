/**
 * Canonical demo content for the Water for Life Intelligence Centre.
 *
 * Values in this module are SYNTHETIC. They are tuned to match the supplied
 * reference screenshots so the live UI can be presented with confidence.
 * Live trend and list data continues to flow from the FastAPI backend.
 */

import {
  AlertTriangle,
  Bot,
  Briefcase,
  Database,
  Droplets,
  Eye,
  Map as MapIcon,
  Megaphone,
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
  waterSecuritySupply: "/heroes/hero-03.jpg",
  assetResilience: "/heroes/hero-01.jpg",
  waterQuality: "/heroes/hero-02.jpg",
  aquaIQ: "/heroes/hero-01.jpg",
  governance: "/heroes/hero-03.jpg",
};

export const HERO_COPY = {
  waterSecuritySupply: {
    eyebrow: "Water Security & Supply",
    headline: "Securing today.\nSustaining tomorrow.",
    sub: "Storage strong. Demand stable. Confidence in supply across South East Queensland.",
  },
  assetResilience: {
    eyebrow: "Asset Resilience & Capital Priorities",
    headline: "Built to last.\nReady to adapt.",
    sub: "Critical infrastructure delivering reliability across SEQ — with synthetic capital insight to guide investment.",
  },
  waterQuality: {
    eyebrow: "Water Quality Assurance",
    headline: "Quality you can trust.",
    sub: "Confidence in every drop, every day — synthetic compliance across treatment plants and indicators.",
  },
  aquaIQ: {
    eyebrow: "AquaIQ Briefing Analyst",
    headline: "Answers grounded\nin trusted data.",
    sub: "Governed AI for South East Queensland water leadership. Every response is evidence-led and human-validated.",
  },
  governance: {
    eyebrow: "Governance & Platform",
    headline: "Trusted data.\nGoverned AI. Better decisions.",
    sub: "Built on Databricks. Designed for confidence. Every recommendation is auditable end-to-end.",
  },
};

// ---------- Executive Overview --------------------------------------------

/**
 * Curated synthetic asset set used by the Executive Overview SEQ Water Grid
 * preview map. We intentionally restrict this list to a calm, well-spaced
 * group of named assets so the executive panel reads as a Seqwater
 * geospatial intelligence layer rather than a crowded satellite snapshot.
 * Coordinates are slightly adjusted from the raw asset CSV to avoid marker
 * crowding around Brisbane.
 */
export const EXECUTIVE_FEATURED_ASSETS: Array<{
  asset_id: string;
  name: string;
  asset_type: string;
  region: string;
  lat: number;
  lon: number;
}> = [
  {
    asset_id: "DAM-002",
    name: "Somerset Dam",
    asset_type: "Dam",
    region: "Brisbane Valley",
    lat: -27.1163,
    lon: 152.5552,
  },
  {
    asset_id: "DAM-001",
    name: "Wivenhoe Dam",
    asset_type: "Dam",
    region: "Brisbane Valley",
    lat: -27.3953,
    lon: 152.6094,
  },
  {
    asset_id: "WTP-003",
    name: "North Pine WTP",
    asset_type: "Water Treatment Plant",
    region: "Brisbane North",
    lat: -27.273,
    lon: 152.946,
  },
  {
    asset_id: "PMP-014",
    name: "Brisbane North Pump Station",
    asset_type: "Pump Station",
    region: "Brisbane North",
    lat: -27.04,
    lon: 152.99,
  },
  {
    asset_id: "WTP-MOGGILL",
    name: "Moggill WTP",
    asset_type: "Water Treatment Plant",
    region: "Brisbane West",
    lat: -27.57,
    lon: 152.88,
  },
  {
    asset_id: "DES-001",
    name: "Gold Coast Desalination Plant",
    asset_type: "Desalination Plant",
    region: "Gold Coast",
    lat: -28.158,
    lon: 153.502,
  },
];


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

// Executive KPI row — calm, executive-readable headline numbers tuned for the
// 72-hour rainfall watch demo posture. Values stay aligned with the live
// Seqwater dam-levels snapshot (29/05/2026 ~21:00 AEST) where they overlap.
export const EXECUTIVE_KPIS: KpiDef[] = [
  {
    title: "Total Grid Storage",
    value: "86.0%",
    supportingText: "Live Seqwater snapshot — 29 May",
    status: "normal",
    icon: Droplets,
    spark: [78.6, 80.2, 81.4, 82.7, 83.9, 85.0, 86.0],
    sparkColor: "#0076BE",
  },
  {
    title: "Catchments on Watch",
    value: "3",
    supportingText: "Lockyer, Bremer and Brisbane River",
    status: "watch",
    icon: AlertTriangle,
    spark: [1, 1, 2, 2, 3, 3, 3],
    sparkColor: "#D88A00",
    sparkVariant: "bar",
  },
  {
    title: "Flood Storage Available",
    value: "100%",
    supportingText: "Somerset + Wivenhoe compartments",
    status: "normal",
    icon: ShieldCheck,
    spark: [100, 100, 100, 100, 100, 100, 100],
    sparkColor: "#2E7D59",
  },
  {
    title: "Water Quality Alerts",
    value: "4",
    supportingText: "▲ 2 vs yesterday",
    status: "watch",
    icon: Eye,
    spark: [2, 2, 3, 3, 4, 4, 4],
    sparkColor: "#D88A00",
    sparkVariant: "bar",
  },
  {
    title: "Elevated Asset Risks",
    value: "7",
    supportingText: "no change vs yesterday",
    status: "watch",
    icon: Eye,
    spark: [6, 7, 7, 7, 7, 7, 7],
    sparkColor: "#5FA777",
  },
  {
    title: "Critical Work Orders",
    value: "11",
    supportingText: "▲ 3 vs yesterday",
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

export const EXECUTIVE_AI_SUMMARY = `Grid storage sits at 86.0% across the 25 published Seqwater storages, with 10 dams currently spilling (including Hinze, Baroon Pocket, Borumba, Leslie Harrison, Sideling Creek). Both Somerset and Wivenhoe dedicated flood compartments are 100% available. Three storages remain below 60% — Lake Macdonald (40.2%), North Pine (51.1%) and Poona (69.9%). Elevated turbidity risk at North Pine WTP and Landers Shute WTP should be monitored as wet catchments stabilise.`;

export const EXECUTIVE_AI_EVIDENCE: string[] = [
  "Total grid storage at 86.0% (live Seqwater snapshot — 29 May ~21:00 AEST).",
  "10 of 25 dams currently spilling; both Wivenhoe (87.1%) and Somerset (79.5%) remain inside FSV with flood compartments empty.",
  "Lake Macdonald at 40.2% (mid-upgrade) is the lowest storage; North Pine at 51.1% remains at reduced FSL.",
  "2 treatment plants flagged for elevated turbidity risk after the wet event: North Pine WTP and Landers Shute WTP.",
];

export const EXECUTIVE_AI_REVIEW: string[] = [
  "Confirm spillway monitoring and downstream comms cadence for the 10 spilling dams.",
  "Validate North Pine WTP and Landers Shute WTP dosing readiness for post-event turbidity.",
  "Brief executive on Lake Macdonald 40.2% storage status and the active upgrade program.",
];

export interface SourceChip {
  label: string;
  type: "table" | "document" | "workflow" | "model" | "view";
}

export const EXECUTIVE_AI_SOURCES: SourceChip[] = [
  { label: "main.seqwater_demo.dam_levels_current", type: "table" },
  { label: "main.seqwater_demo.flood_storage_current", type: "table" },
  { label: "main.seqwater_demo.dam_storage_daily", type: "table" },
  { label: "main.seqwater_demo.rainfall_forecast", type: "table" },
  { label: "Synthetic operations brief — 29 May", type: "document" },
  { label: "Foundation Model API (governed)", type: "model" },
];

// ---------- Water Security & Supply ---------------------------------------

export const SUPPLY_KPIS: KpiDef[] = [
  {
    title: "Total Grid Storage",
    value: "86.0%",
    supportingText: "Live Seqwater snapshot — 29 May",
    status: "normal",
    icon: Droplets,
    spark: [78.6, 80.2, 81.4, 82.7, 83.9, 85.0, 86.0],
    sparkColor: "#0076BE",
  },
  {
    title: "Dams Spilling",
    value: "10 of 25",
    supportingText: "Hinze, Baroon, Borumba, Leslie Harrison +6",
    status: "watch",
    icon: AlertTriangle,
    spark: [2, 4, 5, 7, 8, 9, 10],
    sparkColor: "#0076BE",
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
    supportingText: "No active constraints",
    status: "normal",
    icon: ShieldCheck,
    spark: [],
  },
  {
    title: "Lowest Storage",
    value: "40.2%",
    supportingText: "Lake Macdonald (mid-upgrade)",
    status: "watch",
    icon: AlertTriangle,
    spark: [44, 43, 42, 41, 41, 41, 40],
    sparkColor: "#D88A00",
  },
  {
    title: "Flood Storage Available",
    value: "100%",
    supportingText: "Somerset + Wivenhoe compartments",
    status: "normal",
    icon: ShieldCheck,
    spark: [],
  },
];

// Derived from the 29/05/2026 Seqwater snapshot:
// Total full-supply volume across the 25 published dams = 2,574,180 ML
// Total current volume = 2,212,460 ML (86.0% full).
export const SUPPLY_BALANCE = {
  availableMl: 2_212_460,
  demandMl: 412_300,
  marginMl: 1_800_160,
  marginPercent: 81,
};

// System totals derived from the live snapshot (current volume in ML):
//   Wivenhoe System (Wivenhoe + Somerset) = 1,316,458
//   Gold Coast System (Hinze + Little Nerang) = 324,585
//   Scenic Rim / Southern (Maroon + Moogerah + Wyaralong + Nindooinbah) = 214,195
//   Sunshine Coast (Baroon + Cooloolabin + Ewen Maddock + Wappa + Borumba +
//                   Lake Macdonald + Cedar Pocket) = 141,146
//   North Pine System = 109,528
//   Brisbane West / Lockyer / Bayside (Atkinson + Lake Manchester + Bill Gunn +
//                   Clarendon + Enoggera + Gold Creek + Poona + Sideling Creek +
//                   Leslie Harrison) = 106,548
export const SOURCE_CONTRIBUTION = [
  { name: "Wivenhoe System", value: 1_316_458, color: "#0076BE" },
  { name: "Gold Coast System", value: 324_585, color: "#00AEEF" },
  { name: "Scenic Rim / Southern", value: 214_195, color: "#5FA777" },
  { name: "Sunshine Coast System", value: 141_146, color: "#7FA77B" },
  { name: "North Pine System", value: 109_528, color: "#0EA5E9" },
  { name: "Brisbane West / Lockyer / Bayside", value: 106_548, color: "#94A3B8" },
];

export const TREATMENT_PLANT_CAPACITY = [
  { plant: "Mount Crosby (East + Westbank) WTP", availableMlDay: 1_400, percentDesign: 93 },
  { plant: "North Pine WTP", availableMlDay: 195, percentDesign: 89 },
  { plant: "Molendinar + Mudgeeraba WTP", availableMlDay: 380, percentDesign: 86 },
  { plant: "Landers Shute WTP", availableMlDay: 118, percentDesign: 87 },
  { plant: "Capalaba WTP", availableMlDay: 140, percentDesign: 85 },
];

export const SUPPLY_WATCHPOINTS = [
  {
    text: "10 of 25 dams currently spilling — confirm downstream comms cadence",
    status: "monitor" as Status,
  },
  {
    text: "Lake Macdonald 40.2% (mid-upgrade) — coordinate with Sunshine Coast retailers",
    status: "watch" as Status,
  },
  {
    text: "Both Wivenhoe and Somerset flood compartments 100% available",
    status: "normal" as Status,
  },
  { text: "No water restrictions in place", status: "normal" as Status },
];

export const SUPPLY_AQUAIQ = `Grid storage is at 86.0% on the live Seqwater snapshot, with 10 of 25 dams spilling after the recent wet event. Both Wivenhoe and Somerset dedicated flood compartments are fully available, and headroom remains comfortable for the next 72 hours of forecast inflows. Three storages — Lake Macdonald (40.2%), North Pine (51.1%) and Poona (69.9%) — remain below 60% and continue to be monitored.`;

export const SUPPLY_KEY_DRIVERS = [
  "10 dams currently spilling (Hinze, Baroon Pocket, Borumba, Leslie Harrison +6)",
  "Both Somerset and Wivenhoe flood compartments 100% available",
  "Lake Macdonald and North Pine remain below 60% — drawdown / upgrade narratives intact",
];

// 60 days of synthetic SEQ storage % tracking up to the live 29/05/2026
// snapshot value (86.0%). Median band remains seasonal context.
export const STORAGE_HISTORY: { date: string; actual: number; median: number; p10: number; p90: number }[] =
  Array.from({ length: 60 }).map((_, i) => {
    // Ramp from ~77% to 86% over the 60-day window, with the last 10 days
    // jumping ~3% as catchments fill from the wet event.
    const wetTail = i > 50 ? (i - 50) * 0.35 : 0;
    const base = 76.5 + i * 0.13 + Math.sin(i / 6) * 0.6 + Math.sin(i / 11) * 0.4 + wetTail;
    const actual = Math.max(72, Math.min(86.5, base));
    const median = 75 + Math.sin(i / 7) * 0.6;
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
  executiveSummary: `Water security outlook is Normal for the next 3 months across SEQ. Live Seqwater snapshot shows grid storage at 86.0% with 10 of 25 dams currently spilling and both Wivenhoe and Somerset flood compartments 100% available. Demand is tracking below forecast and there are no material water quality risks beyond the post-event turbidity watch at North Pine WTP and Landers Shute WTP.`,
  evidence: [
    {
      sourceName: "main.seqwater_demo.dam_levels_current",
      sourceType: "table" as const,
      usedFor: "Live grid storage 86.0% across 25 published dams (29/05/2026 snapshot)",
      confidence: "high" as const,
      detail:
        "Authoritative dam-levels snapshot from the public Seqwater dam-levels page, joined to the synthetic operational telemetry for context.",
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
    "Post-event turbidity may elevate at North Pine WTP and Landers Shute WTP as the 10 spilling dams continue to discharge.",
    "Lake Macdonald is at 40.2% on the live snapshot and remains mid-upgrade — coordinate Sunshine Coast retailer messaging.",
    "Two ageing synthetic pumps in Brisbane North could elevate operational risk if pressure rises.",
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

// ---------- KPI Insight Drawer -------------------------------------------
//
// Each KPI card on the Executive Overview is clickable. Clicking opens a
// right-side "AI Insight" drawer that shows:
//   - the live value + sparkline,
//   - an AI narrative streamed token-by-token (Foundation Model API),
//   - the drivers behind the number (with up/down/flat deltas),
//   - the Agent Bricks tool calls the Supervisor made to produce it,
//   - the Genie-generated SQL (collapsible),
//   - Unity Catalog source chips for full lineage,
//   - a recommended-actions block with click-through navigation,
//   - confidence + trace id + human-validation badge.
//
// This is the Databricks AI demo surface — every KPI is a doorway into the
// governed agentic stack behind the number.

export type KpiActionKind = "navigate" | "aquaiq" | "brief" | "workflow";

export interface KpiAction {
  label: string;
  kind: KpiActionKind;
  /** Route for `kind === "navigate"`. */
  target?: string;
  /** Auto-sent question for `kind === "aquaiq"`. */
  prompt?: string;
  /** Toast title for `kind === "brief" | "workflow"`. */
  toastTitle?: string;
  /** Toast body for `kind === "brief" | "workflow"`. */
  toastBody?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
}

export interface KpiDriver {
  label: string;
  delta?: string;
  tone?: "up" | "down" | "flat";
}

export interface ToolEventDef {
  name: string;
  summary: string;
}

export interface KpiInsight {
  id: string;
  /** Human-readable card title (must match the KPI title). */
  title: string;
  /** The headline value displayed in the drawer. */
  value: string;
  /** Status badge to show in the drawer header. */
  status: Status;
  /** One-liner that frames why this metric matters today. */
  headline: string;
  /** Streamed AquaIQ narrative (used for the typewriter effect). */
  narrative: string;
  /** Bulleted drivers behind the number. */
  drivers: KpiDriver[];
  /** "What this means for operations" callout body. */
  meaning: string;
  /** Genie-generated SQL block (synthetic) shown verbatim. */
  sql: string;
  /** Unity Catalog source chips. */
  sources: SourceChip[];
  /** Agent Bricks tool events animated in like the chat does. */
  agentTools: ToolEventDef[];
  /** Recommended actions surfaced as click-through buttons. */
  actions: KpiAction[];
  confidence: "Low" | "Medium" | "High";
  traceId: string;
}

export interface PostureInsight {
  /** The card heading for the "What does this mean?" drawer. */
  title: string;
  /** Sub-heading describing the posture. */
  subtitle: string;
  status: Status;
  /** Streaming AquaIQ narrative explaining the posture. */
  narrative: string;
  /** Signals that drove the posture decision. */
  drivers: KpiDriver[];
  /** Operational implications of this posture. */
  meaning: string;
  /** Pre-canned tool events from the Supervisor that produced the posture. */
  agentTools: ToolEventDef[];
  sources: SourceChip[];
  actions: KpiAction[];
  confidence: "Low" | "Medium" | "High";
  traceId: string;
}

export const POSTURE_INSIGHT: PostureInsight = {
  title: "Why posture is Watch",
  subtitle: "Live AquaIQ assessment of SEQ Water Grid posture",
  status: "watch",
  narrative:
    "Overall posture is Watch — not Escalate — because the grid is structurally healthy but the next 72 hours carry above-baseline operational signal. Storage sits at 86.0% across the 25 published Seqwater dams and both Wivenhoe and Somerset dedicated flood compartments are 100% available, so supply continuity is not at risk. What lifts posture above Normal is the cluster of secondary signals: 10 of 25 dams are currently spilling, post-event turbidity risk is elevated at North Pine WTP and Landers Shute WTP, and 7 assets are sitting in the Elevated risk band with 11 critical work orders still open. AquaIQ has weighted these signals against the Seqwater operational playbook and recommends maintaining elevated monitoring cadence, not a public-facing escalation.",
  drivers: [
    { label: "Grid storage 86.0% across 25 published dams", tone: "flat" },
    { label: "10 of 25 dams spilling after recent wet event", delta: "+8 vs 7-day avg", tone: "up" },
    { label: "Elevated turbidity risk at 2 WTPs (North Pine, Landers Shute)", tone: "up" },
    { label: "7 assets in Elevated risk band, 11 critical work orders open", tone: "flat" },
    { label: "Both Wivenhoe + Somerset flood compartments 100% available", tone: "flat" },
  ],
  meaning:
    "Watch posture means routine monitoring cadence is no longer sufficient, but no public messaging change is required. Operations should hold elevated cadence on the 10 spilling dams, validate post-event dosing readiness at North Pine and Landers Shute, and brief the executive on the Lake Macdonald drawdown narrative ahead of the regular weekly cycle.",
  agentTools: [
    { name: "water_security_summary", summary: "Storage 86.0%, 10 spilling, flood compartments 100%" },
    { name: "asset_risk_search", summary: "7 elevated assets across Brisbane North + Sunshine Coast" },
    { name: "water_quality_outlook", summary: "Elevated turbidity risk @ North Pine, Landers Shute" },
    { name: "operational_playbook_lookup", summary: "Matched §4.2 — Elevated monitoring posture" },
  ],
  sources: [
    { label: "main.seqwater_demo.dam_levels_current", type: "table" },
    { label: "main.seqwater_demo.flood_storage_current", type: "table" },
    { label: "main.seqwater_demo.asset_risk_scores", type: "table" },
    { label: "main.seqwater_demo.water_quality_samples", type: "table" },
    { label: "Synthetic operations playbook §4.2 (posture matrix)", type: "document" },
    { label: "seqwater_supervisor (Agent Bricks)", type: "workflow" },
  ],
  actions: [
    {
      label: "Open SEQ Water Grid map",
      kind: "navigate",
      target: "/map",
      icon: MapIcon,
    },
    {
      label: "Ask AquaIQ — what changes the posture?",
      kind: "aquaiq",
      prompt:
        "What synthetic signals would have to change for the SEQ Water Grid posture to move from Watch back to Normal, and which signals would push it to Escalate?",
      icon: Bot,
    },
    {
      label: "Add to executive briefing",
      kind: "brief",
      toastTitle: "Added to executive briefing",
      toastBody: "Posture rationale queued for the next synthetic briefing.",
      icon: Briefcase,
    },
  ],
  confidence: "High",
  traceId: "syn-trace-29may2026-0913aest-bf12a",
};

export const EXECUTIVE_KPI_INSIGHTS: Record<string, KpiInsight> = {
  "Total Grid Storage": {
    id: "total-grid-storage",
    title: "Total Grid Storage",
    value: "86.0%",
    status: "normal",
    headline: "Grid storage strong across the 25 published Seqwater dams",
    narrative:
      "Total grid storage is 86.0% on the live Seqwater snapshot — 2,212,460 ML against a full-supply capacity of 2,574,180 ML across the 25 published dams. The 7-day trajectory is up ~7.4 points, driven entirely by inflows from the recent wet event. Wivenhoe (87.1%) and Somerset (79.5%) carry the majority of system volume and both flood compartments remain 100% available. Three storages remain below 60%: Lake Macdonald (40.2%, mid-upgrade), North Pine (51.1%, at reduced FSL), and Poona (69.9%). No supply-continuity constraints are forecast over the planning horizon.",
    drivers: [
      { label: "Wivenhoe System contribution", delta: "1,316,458 ML", tone: "flat" },
      { label: "Recent wet-event inflows across SEQ catchments", delta: "+7.4 pts (7d)", tone: "up" },
      { label: "Both Somerset + Wivenhoe flood compartments 100% available", tone: "flat" },
      { label: "Lake Macdonald drawdown (mid-upgrade)", delta: "40.2%", tone: "down" },
    ],
    meaning:
      "Supply continuity is robust through at least the 90-day planning horizon. Public messaging can remain in 'comfortable' framing; no demand-management activation required. The watchpoint is the Lake Macdonald upgrade narrative — coordinate Sunshine Coast retailer messaging before the next briefing cycle.",
    sql: `-- Live grid storage % across the 25 published Seqwater dams\n-- Generated by Genie • seqwater_operations space\nSELECT\n  ROUND(SUM(current_volume_ml) / SUM(full_supply_volume_ml) * 100, 1) AS grid_storage_pct,\n  SUM(current_volume_ml)                                              AS total_volume_ml,\n  SUM(full_supply_volume_ml)                                          AS full_supply_volume_ml,\n  COUNT(*)                                                            AS dams_in_grid\nFROM   main.seqwater_demo.dam_levels_current\nWHERE  is_published = TRUE`,
    sources: [
      { label: "main.seqwater_demo.dam_levels_current", type: "table" },
      { label: "main.seqwater_demo.dam_storage_daily", type: "table" },
      { label: "Synthetic supply continuity view", type: "view" },
      { label: "seqwater_supervisor (Agent Bricks)", type: "workflow" },
    ],
    agentTools: [
      { name: "genie.dam_levels_current", summary: "Aggregated 25 published dams → 86.0%" },
      { name: "water_security_summary", summary: "7d ramp +7.4 pts, no supply constraint" },
      { name: "operational_playbook_lookup", summary: "Storage > 80% → Normal posture" },
    ],
    actions: [
      {
        label: "Open Water Security & Supply",
        kind: "navigate",
        target: "/supply",
        icon: Droplets,
      },
      {
        label: "View on the SEQ Water Grid map",
        kind: "navigate",
        target: "/map",
        icon: MapIcon,
      },
      {
        label: "Ask AquaIQ for a 90-day supply outlook",
        kind: "aquaiq",
        prompt:
          "Give me a synthetic 90-day water security outlook for SEQ. Reference Wivenhoe, Somerset, Lake Macdonald, and the post-event spilling dams.",
        icon: Bot,
      },
    ],
    confidence: "High",
    traceId: "syn-trace-29may2026-0913aest-grd01",
  },
  "Dams Spilling": {
    id: "dams-spilling",
    title: "Dams Spilling",
    value: "10",
    status: "watch",
    headline: "10 of 25 published storages are currently spilling",
    narrative:
      "10 of 25 published Seqwater storages are currently spilling on the live snapshot: Hinze, Baroon Pocket, Borumba, Leslie Harrison, Sideling Creek, and five more across the Brisbane and Sunshine Coast catchments. This is a sharp lift from the 7-day average of 2 and follows the recent wet event. Critically, both Wivenhoe (87.1%) and Somerset (79.5%) sit inside their full supply volumes with dedicated flood compartments still 100% available — they are not spilling, and the flood-mitigation buffer is intact. AquaIQ recommends maintaining spillway monitoring cadence and downstream communications coordination, but no escalation is warranted.",
    drivers: [
      { label: "Hinze, Baroon Pocket, Borumba spilling above nominal", tone: "up" },
      { label: "Leslie Harrison + Sideling Creek above FSL", tone: "up" },
      { label: "Wivenhoe + Somerset flood compartments intact (100%)", tone: "flat" },
      { label: "Catchment saturation index elevated (synthetic)", delta: "+0.18", tone: "up" },
    ],
    meaning:
      "Spilling itself is not a supply-continuity risk — these dams are doing exactly what they're designed to do. The watchpoints are downstream stakeholder communications and post-event turbidity at the treatment plants pulling from the now-replenished catchments. Maintain hourly spillway monitoring through the next 24-48 hours.",
    sql: `-- Dams currently spilling (current_volume_ml >= full_supply_volume_ml)\n-- Generated by Genie • seqwater_operations space\nSELECT dam_id,\n       dam_name,\n       ROUND(current_volume_ml / full_supply_volume_ml * 100, 1) AS pct_full,\n       is_spilling,\n       last_updated\nFROM   main.seqwater_demo.dam_levels_current\nWHERE  is_published = TRUE\n  AND  is_spilling = TRUE\nORDER  BY pct_full DESC`,
    sources: [
      { label: "main.seqwater_demo.dam_levels_current", type: "table" },
      { label: "main.seqwater_demo.flood_storage_current", type: "table" },
      { label: "main.seqwater_demo.rainfall_observations", type: "table" },
      { label: "Synthetic spillway monitoring runbook", type: "document" },
    ],
    agentTools: [
      { name: "genie.dam_levels_current", summary: "10 dams flagged is_spilling = TRUE" },
      { name: "flood_storage_check", summary: "Wivenhoe + Somerset compartments 100% available" },
      { name: "document_retrieval", summary: "Matched §3 — Post-event spillway runbook" },
    ],
    actions: [
      {
        label: "Open Flood Readiness scenario",
        kind: "navigate",
        target: "/flood",
        icon: ShieldCheck,
      },
      {
        label: "View dams on the SEQ Water Grid map",
        kind: "navigate",
        target: "/map",
        icon: MapIcon,
      },
      {
        label: "Ask AquaIQ which downstream communities are affected",
        kind: "aquaiq",
        prompt:
          "For the 10 synthetic Seqwater dams currently spilling, which downstream catchments and communities are most likely to be affected over the next 24-48 hours? Reference the spilling list and the synthetic spillway monitoring runbook.",
        icon: Bot,
      },
      {
        label: "Notify stakeholders",
        kind: "workflow",
        toastTitle: "Stakeholder notification queued",
        toastBody: "Synthetic pre-approved comms list cued for review.",
        icon: Megaphone,
      },
    ],
    confidence: "High",
    traceId: "syn-trace-29may2026-0913aest-spl02",
  },
  "Flood Storage Available": {
    id: "flood-storage-available",
    title: "Flood Storage Available",
    value: "100%",
    status: "normal",
    headline: "Both Wivenhoe + Somerset dedicated flood compartments are empty",
    narrative:
      "Dedicated flood mitigation storage is 100% available across the two compartments that protect Brisbane: Wivenhoe (1,450,000 ML compartment, 0 ML committed) and Somerset (524,000 ML compartment, 0 ML committed). Combined headroom of 1,974,000 ML is roughly equivalent to a 1-in-100-year event under the synthetic catchment-saturation envelope used in AquaIQ's flood scenarios. The recent wet event has been absorbed entirely inside the full-supply volumes; no encroachment into flood storage has occurred.",
    drivers: [
      { label: "Wivenhoe flood compartment", delta: "100% available", tone: "flat" },
      { label: "Somerset flood compartment", delta: "100% available", tone: "flat" },
      { label: "Recent wet event absorbed inside FSV", tone: "flat" },
      { label: "Synthetic 1-in-20yr scenario headroom", delta: "+870,000 ML", tone: "up" },
    ],
    meaning:
      "Flood-mitigation posture is the strongest it can be. AquaIQ has confirmed against the synthetic dam operations playbook that no protective release is required. This metric should remain at 100% unless a defined synthetic scenario is triggered from /flood.",
    sql: `-- Flood compartment availability across protective storages\n-- Generated by Genie • seqwater_operations space\nSELECT dam_id,\n       dam_name,\n       flood_compartment_capacity_ml,\n       flood_compartment_used_ml,\n       ROUND(\n         (flood_compartment_capacity_ml - flood_compartment_used_ml)\n         / flood_compartment_capacity_ml * 100, 1\n       ) AS flood_storage_available_pct\nFROM   main.seqwater_demo.flood_storage_current\nWHERE  dam_id IN ('wivenhoe', 'somerset')`,
    sources: [
      { label: "main.seqwater_demo.flood_storage_current", type: "table" },
      { label: "main.seqwater_demo.dam_release_simulation", type: "table" },
      { label: "Synthetic dam operations playbook", type: "document" },
      { label: "run_flood_scenario (UC function)", type: "workflow" },
    ],
    agentTools: [
      { name: "flood_storage_check", summary: "Wivenhoe + Somerset → 100%, 100%" },
      { name: "run_flood_scenario", summary: "1-in-20yr synthetic → headroom intact" },
      { name: "document_retrieval", summary: "Dam operations playbook §6 — no release" },
    ],
    actions: [
      {
        label: "Run a flood scenario",
        kind: "navigate",
        target: "/flood",
        icon: ShieldCheck,
      },
      {
        label: "Ask AquaIQ for a 1-in-100yr what-if",
        kind: "aquaiq",
        prompt:
          "Run a synthetic 1-in-100 year flood scenario against the current Wivenhoe and Somerset flood compartment availability. Summarise headroom and any protective releases the synthetic playbook would recommend.",
        icon: Bot,
      },
    ],
    confidence: "High",
    traceId: "syn-trace-29may2026-0913aest-fld03",
  },
  "Water Quality Alerts": {
    id: "water-quality-alerts",
    title: "Water Quality Alerts",
    value: "4",
    status: "watch",
    headline: "4 active synthetic water quality alerts — turbidity-led",
    narrative:
      "There are 4 active water quality alerts on the synthetic compliance view: 2 turbidity alerts (North Pine WTP, Landers Shute WTP), 1 taste & odour alert (Moggill WTP), and 1 chlorine-residual drift alert (Capalaba WTP). The week-over-week trend is -2, which is a positive direction. The two turbidity alerts are causally linked to the post-event catchment runoff feeding the 10 currently-spilling dams, and AquaIQ rates them at Medium confidence pending operator validation. No customer-facing notifications have been issued.",
    drivers: [
      { label: "Turbidity (North Pine + Landers Shute)", delta: "13.1 NTU", tone: "up" },
      { label: "Taste & odour (Moggill)", tone: "up" },
      { label: "Chlorine residual drift (Capalaba)", tone: "flat" },
      { label: "Customer alerts active", delta: "0", tone: "flat" },
    ],
    meaning:
      "Operational response is the right level here — no public messaging, no retailer escalation. Operations should validate post-event dosing readiness at North Pine and Landers Shute (the two turbidity-led plants) and confirm the chlorine residual drift at Capalaba is within seasonal envelope.",
    sql: `-- Active synthetic water-quality alerts in the last 24 hours\n-- Generated by Genie • seqwater_operations space\nSELECT  qa.alert_id,\n        qa.plant,\n        qa.indicator,\n        qa.value,\n        qa.threshold,\n        qa.alert_level,\n        qa.opened_at\nFROM    main.seqwater_demo.quality_alerts qa\nWHERE   qa.opened_at >= current_timestamp() - INTERVAL 24 HOURS\n  AND   qa.alert_level IN ('Watch', 'Elevated')\nORDER   BY qa.opened_at DESC`,
    sources: [
      { label: "main.seqwater_demo.quality_alerts", type: "table" },
      { label: "main.seqwater_demo.water_quality_samples", type: "table" },
      { label: "main.seqwater_demo.turbidity_events", type: "table" },
      { label: "Synthetic water quality response procedure", type: "document" },
    ],
    agentTools: [
      { name: "genie.quality_alerts", summary: "4 open alerts → turbidity-led" },
      { name: "water_quality_outlook", summary: "Elevated risk at North Pine + Landers Shute" },
      { name: "document_retrieval", summary: "Matched response procedure §2.4 dosing readiness" },
    ],
    actions: [
      {
        label: "Open Water Quality Assurance",
        kind: "navigate",
        target: "/quality",
        icon: Droplets,
      },
      {
        label: "Ask AquaIQ what is driving the elevated turbidity",
        kind: "aquaiq",
        prompt:
          "What is driving the elevated synthetic water quality risk this month at North Pine WTP and Landers Shute WTP? Reference the recent wet event and the synthetic turbidity_events feed.",
        icon: Bot,
      },
      {
        label: "Brief operations leadership",
        kind: "brief",
        toastTitle: "Briefing queued",
        toastBody: "Water quality alert summary added to the next briefing pack.",
        icon: Briefcase,
      },
    ],
    confidence: "Medium",
    traceId: "syn-trace-29may2026-0913aest-wqa04",
  },
  "Elevated Asset Risks": {
    id: "elevated-asset-risks",
    title: "Elevated Asset Risks",
    value: "7",
    status: "watch",
    headline: "7 assets sitting in the Elevated risk band",
    narrative:
      "7 synthetic assets are currently in the Elevated risk band: North Pine WTP, Moggill WTP, Sunshine Coast Trunk Main, Logan River Pipeline, Brisbane North Pump Station, Caboolture Pump Station, and the Wivenhoe spillway gate-3 actuator. The risk score is a blended index combining synthetic predicted_failure_30d, open work orders, age, and criticality. The week-over-week count is unchanged. AquaIQ has linked these directly to the synthetic capital pipeline — three of the seven are addressed by approved capital projects, and risk-reduction modelling suggests 68% portfolio risk reduction is achievable from the top 5 projects.",
    drivers: [
      { label: "North Pine WTP (turbidity + age)", delta: "3.8 / 5", tone: "up" },
      { label: "Logan River Pipeline (material + age)", delta: "4.1 / 5", tone: "up" },
      { label: "Sunshine Coast Trunk Main (material risk)", delta: "3.6 / 5", tone: "flat" },
      { label: "3 of 7 mapped to approved capital projects", tone: "flat" },
    ],
    meaning:
      "Asset risk is steady, not deteriorating, but concentration in Brisbane North means a single high-impact event would stress the network. The capital pipeline addresses ~68% of total elevated risk; bring forward the North Pine WTP Upgrade business case if turbidity events continue.",
    sql: `-- Synthetic elevated-risk assets, joined to the open capital pipeline\n-- Generated by Genie • seqwater_operations space\nSELECT  a.asset_id,\n        a.name,\n        a.asset_type,\n        a.region,\n        ar.risk_band,\n        ar.risk_score,\n        ar.open_work_orders,\n        cp.project_name AS linked_capital_project\nFROM    main.seqwater_demo.asset_risk_scores ar\n   JOIN main.seqwater_demo.assets a USING (asset_id)\n   LEFT JOIN main.seqwater_demo.capital_projects cp ON cp.primary_asset_id = a.asset_id\nWHERE   ar.risk_band IN ('Elevated', 'High', 'Critical')\nORDER   BY ar.risk_score DESC`,
    sources: [
      { label: "main.seqwater_demo.asset_risk_scores", type: "table" },
      { label: "main.seqwater_demo.assets", type: "table" },
      { label: "main.seqwater_demo.capital_projects", type: "table" },
      { label: "top_asset_risks (UC function)", type: "workflow" },
    ],
    agentTools: [
      { name: "top_asset_risks", summary: "7 assets in Elevated band — top 3 listed" },
      { name: "capital_priorities", summary: "3 of 7 mapped to approved projects" },
      { name: "document_retrieval", summary: "Matched asset criticality framework §2" },
    ],
    actions: [
      {
        label: "Open Asset Resilience",
        kind: "navigate",
        target: "/assets",
        icon: Wrench,
      },
      {
        label: "Ask AquaIQ which capital projects reduce the most risk",
        kind: "aquaiq",
        prompt:
          "Which synthetic capital projects reduce the most operational risk across the 7 elevated assets? Reference asset_risk_scores and the capital pipeline.",
        icon: Bot,
      },
      {
        label: "Brief board on capital prioritisation",
        kind: "brief",
        toastTitle: "Board brief queued",
        toastBody: "Synthetic capital risk-reduction summary added to next pack.",
        icon: Briefcase,
      },
    ],
    confidence: "High",
    traceId: "syn-trace-29may2026-0913aest-rsk05",
  },
  "Critical Work Orders": {
    id: "critical-work-orders",
    title: "Critical Work Orders",
    value: "11",
    status: "monitor",
    headline: "11 open critical work orders — down 3 vs yesterday",
    narrative:
      "There are 11 open work orders at Priority 1 (Critical) across the synthetic maintenance backlog, down from 14 yesterday. Three were closed overnight by the Brisbane North night crew. The remaining 11 split across pump stations (5), treatment plants (4), and pipeline / valve work (2). Median age is 6 days, well inside the 14-day SLA. The two oldest sit against the Brisbane North pump station — AquaIQ recommends elevating these into the next maintenance window to align with peak-demand readiness.",
    drivers: [
      { label: "Pump station P1 work orders", delta: "5 open", tone: "flat" },
      { label: "Treatment plant P1 work orders", delta: "4 open", tone: "flat" },
      { label: "Closed overnight (Brisbane North)", delta: "-3", tone: "down" },
      { label: "Median age", delta: "6d (SLA 14d)", tone: "flat" },
    ],
    meaning:
      "Backlog is being worked down inside SLA — no governance action required. Operations leadership should consider bringing forward the two oldest Brisbane North pump-station orders to align with the heatwave-readiness window. No risk to public-facing service.",
    sql: `-- Open critical (P1) work orders across the synthetic maintenance backlog\n-- Generated by Genie • seqwater_operations space\nSELECT  wo.work_order_id,\n        a.name        AS asset_name,\n        a.asset_type,\n        a.region,\n        wo.priority,\n        wo.status,\n        wo.opened_at,\n        DATEDIFF(current_date(), wo.opened_at) AS age_days\nFROM    main.seqwater_demo.maintenance_work_orders wo\n   JOIN main.seqwater_demo.assets a USING (asset_id)\nWHERE   wo.priority = 'P1'\n  AND   wo.status   IN ('Open', 'In Progress')\nORDER   BY wo.opened_at`,
    sources: [
      { label: "main.seqwater_demo.maintenance_work_orders", type: "table" },
      { label: "main.seqwater_demo.assets", type: "table" },
      { label: "main.seqwater_demo.asset_health_daily", type: "table" },
      { label: "Synthetic maintenance prioritisation runbook", type: "document" },
    ],
    agentTools: [
      { name: "genie.maintenance_work_orders", summary: "11 P1 open · 3 closed overnight" },
      { name: "asset_risk_search", summary: "Brisbane North pump station correlated" },
      { name: "document_retrieval", summary: "Matched maintenance prioritisation runbook §3" },
    ],
    actions: [
      {
        label: "Open Asset Resilience",
        kind: "navigate",
        target: "/assets",
        icon: Wrench,
      },
      {
        label: "Ask AquaIQ which work orders to prioritise",
        kind: "aquaiq",
        prompt:
          "From the 11 open synthetic critical work orders, which should be elevated into the next maintenance window? Prioritise against asset criticality, age, and the synthetic heatwave readiness scenario.",
        icon: Bot,
      },
      {
        label: "Queue night-crew brief",
        kind: "workflow",
        toastTitle: "Night-crew brief queued",
        toastBody: "Top 2 Brisbane North P1 orders flagged for next window.",
        icon: Megaphone,
      },
    ],
    confidence: "High",
    traceId: "syn-trace-29may2026-0913aest-wo06",
  },
};

/**
 * Lookup helper used by `ExecutiveOverview` when a KPI card is clicked.
 * Returns `null` for KPIs without authored insight content (the drawer
 * will then fall back to a generic surface).
 */
export function getKpiInsight(title: string): KpiInsight | null {
  return EXECUTIVE_KPI_INSIGHTS[title] ?? null;
}
