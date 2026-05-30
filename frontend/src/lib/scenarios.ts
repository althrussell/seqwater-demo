/**
 * Scenario overlays.
 *
 * The scenario selector in the app header lets executives swap between
 * pre-canned operational postures. Every scenario value here is DEMO and
 * intended for demo / briefing only.
 *
 * Each overlay returns a small set of optional overrides that pages can
 * consume. Pages without specific overrides fall back to the canonical
 * `demoContent.ts` values, plus the universal scenario banner exposed by
 * `ScenarioBanner` keeps the active scenario visible across every page.
 */

import {
  AlertTriangle,
  CloudRain,
  Droplets,
  Flame,
  ShieldCheck,
  Sun,
  Wrench,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import type { LucideIcon } from "lucide-react";
import type { Status } from "@/components/ui/StatusBadge";

export interface ScenarioPriority {
  title: string;
  description: string;
  status: Status;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Optional override for the status chip text (e.g. "Review"). */
  chipLabel?: string;
  /** Optional short evidence/source label shown as a subtle chip. */
  evidenceLabel?: string;
  evidenceType?: "table" | "document";
}

export interface ScenarioOverlay {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Tailwind color tokens for the scenario banner accent. */
  accentClass: string;
  bannerTitle: string;
  bannerBody: string;
  /** Override for the Executive Overview hero (sub line). */
  heroSub: string;
  heroHeadline?: string;
  /** Posture floating card on the Executive Overview hero. */
  posture: { status: Status; description: string };
  /** AquaIQ Executive Summary panel body. */
  executiveSummary: string;
  /** AquaIQ Executive Summary recommended review bullets. */
  executiveReview: string[];
  /** Executive Priorities tiles. */
  priorities: ScenarioPriority[];
}

export const SCENARIO_OVERLAYS: Record<string, ScenarioOverlay> = {
  "72h-rainfall-watch": {
    id: "72h-rainfall-watch",
    label: "72-hour rainfall watch",
    description: "Elevated rainfall forecast across 3 catchments",
    icon: CloudRain,
    accentClass: "border-primaryBlue/40 bg-surface-blue text-primaryBlue",
    bannerTitle: "Active scenario: 72-hour rainfall watch",
    bannerBody:
      "Rainfall band tracking across Lockyer, Bremer and Brisbane River catchments. Posture elevated to Watch.",
    heroSub:
      "Active rainfall watch across 3 catchments. Regular monitoring continues across the water grid.",
    posture: {
      status: "watch",
      description:
        "Elevated monitoring in place for selected catchments, assets and water quality indicators.",
    },
    executiveSummary: `Rainfall forecasts indicate increased inflows to Wivenhoe and Somerset catchments over the next 72 hours. Elevated turbidity risk at North Pine WTP and Moggill WTP should be monitored. Asset risk is elevated for 7 assets, primarily due to maintenance backlogs and age-related factors. No immediate operational impacts to supply continuity are expected.`,
    executiveReview: [
      "Confirm spillway monitoring and downstream comms cadence for the wet event.",
      "Validate North Pine WTP and Moggill WTP dosing readiness for post-event turbidity.",
      "Brief executive on the 7 elevated-risk assets and the active maintenance plan.",
    ],
    priorities: [
      {
        title: "Monitor catchment rainfall and inflows",
        description: "Elevated rainfall forecast across 3 catchments.",
        status: "watch",
        icon: AlertTriangle,
        evidenceLabel: "rainfall_forecast · catchment_conditions",
        evidenceType: "table",
      },
      {
        title: "Review water quality risk",
        description: "Turbidity risk elevated at 2 treatment plants.",
        status: "monitor",
        icon: Droplets,
        evidenceLabel: "quality_alerts · turbidity_events",
        evidenceType: "table",
      },
      {
        title: "Maintain asset resilience",
        description: "7 assets with elevated risk requiring attention.",
        status: "monitor",
        chipLabel: "Review",
        icon: ShieldCheck,
        evidenceLabel: "asset_risk_scores · maintenance_work_orders",
        evidenceType: "table",
      },
    ],
  },
  "summer-heatwave": {
    id: "summer-heatwave",
    label: "Summer heatwave",
    description: "Demand surge with depleted storage",
    icon: Sun,
    accentClass: "border-status-watch/40 bg-[#FFF4E0] text-status-watch",
    bannerTitle: "Active scenario: Summer heatwave",
    bannerBody:
      "7-day heat event. Demand running +14% above 14-day baseline. Posture elevated to Watch.",
    heroHeadline:
      "Demand running hot. Storage holding firm.\nWatch posture across SEQ.",
    heroSub:
      "7-day heatwave scenario. Demand surge is testing peak treatment capacity.",
    posture: {
      status: "watch",
      description:
        "Demand surge of +14% against the 14-day baseline. Two pump stations near capacity. Storage trending down 0.6% / day.",
    },
    executiveSummary: `7-day heatwave is driving peak demand to 1,420 ML/day (+14% vs 14-day baseline). Grid storage is holding at 85.4% but trending down ~0.6% per day. Mt Crosby East and West WTPs are running at 92% and 88% available capacity respectively. Brisbane North pump stations BNE-PS-01 and BNE-PS-04 are operating close to their ageing-asset thresholds — recommend bringing forward planned maintenance windows.`,
    executiveReview: [
      "Activate demand-management messaging in Brisbane and Logan service areas.",
      "Confirm chemical dosing inventory and operator coverage at Mt Crosby (East + West).",
      "Bring forward inspection on BNE-PS-01 and BNE-PS-04 before next peak day.",
      "Brief retailers on supply continuity options if storage trends below 84%.",
    ],
    priorities: [
      {
        title: "Manage peak demand",
        description: "Demand at +14% vs baseline; activate retailer comms.",
        status: "watch",
        icon: Flame,
        evidenceLabel: "demand_forecast · supply_forecast",
        evidenceType: "table",
      },
      {
        title: "Treatment capacity headroom",
        description: "Mt Crosby East at 92% available capacity.",
        status: "watch",
        icon: Droplets,
        evidenceLabel: "treatment_plant_operations",
        evidenceType: "table",
      },
      {
        title: "Pump station risk",
        description: "2 ageing pump stations operating near thresholds.",
        status: "monitor",
        chipLabel: "Review",
        icon: Wrench,
        evidenceLabel: "asset_risk_scores · maintenance_work_orders",
        evidenceType: "table",
      },
    ],
  },
  "supply-restoration": {
    id: "supply-restoration",
    label: "Supply restoration drill",
    description: "Treatment outage and rebalancing",
    icon: Wrench,
    accentClass: "border-status-escalate/40 bg-[#FCE5DA] text-status-escalate",
    bannerTitle: "Active scenario: Supply restoration drill",
    bannerBody:
      "Outage at North Pine WTP. Network rebalancing engaged. Posture elevated to Escalate.",
    heroHeadline:
      "Outage drill in progress.\nNetwork holding through rebalancing.",
    heroSub:
      "North Pine WTP outage scenario. Supply continuity maintained via grid rebalancing and chlorinated bypass.",
    posture: {
      status: "escalate",
      description:
        "North Pine WTP offline (outage). Flow rebalanced to Mt Crosby and Landers Shute. Continuity holding; comms cadence increased.",
    },
    executiveSummary: `Restoration drill is underway. North Pine WTP is offline for an 8-hour rebalancing exercise; supply has been redistributed to Mt Crosby (East + West) and Landers Shute. Affected service areas are Brisbane North and Moreton Bay. Grid storage remains at 86.0% and downstream chlorine residual remains within target across the bypassed network. Drill validates ICS, executive notification, and customer-comms playbooks.`,
    executiveReview: [
      "Validate executive notification chain and time-to-acknowledge (target < 15 min).",
      "Confirm Mt Crosby East ramp-up to +18 ML/day and Landers Shute to +9 ML/day.",
      "Brief Brisbane North and Moreton Bay retailer ops centres on the outage.",
      "Capture lessons-learned for the September drill cycle.",
    ],
    priorities: [
      {
        title: "Restore North Pine WTP",
        description: "Outage; target restoration window 8 hours.",
        status: "escalate",
        icon: Wrench,
        evidenceLabel: "incident_actions · maintenance_work_orders",
        evidenceType: "table",
      },
      {
        title: "Rebalance the grid",
        description: "Mt Crosby +18 ML/day; Landers Shute +9 ML/day.",
        status: "watch",
        icon: Droplets,
        evidenceLabel: "grid_transfer_recommendations",
        evidenceType: "table",
      },
      {
        title: "Maintain customer comms",
        description: "Brisbane North and Moreton Bay retailers briefed.",
        status: "monitor",
        chipLabel: "Review",
        icon: ShieldCheck,
        evidenceLabel: "Customer comms protocol",
        evidenceType: "document",
      },
    ],
  },
  baseline: {
    id: "baseline",
    label: "Baseline operating posture",
    description: "Steady-state profile",
    icon: ShieldCheck,
    accentClass: "border-greenDark/40 bg-surface-green text-greenDark",
    bannerTitle: "Active scenario: Baseline operating posture",
    bannerBody:
      "Steady-state. All catchments, plants and assets within nominal range. Posture Normal.",
    heroHeadline:
      "Water security stable.\nSupply, quality and assets all within normal range.",
    heroSub:
      "Steady-state baseline. No active alerts; cadence is routine.",
    posture: {
      status: "normal",
      description:
        "All catchments, treatment plants and critical assets within nominal range. Cadence is routine across the grid.",
    },
    executiveSummary: `Baseline operating posture. Grid storage sits at 86.0% across 25 published storages, no spilling above nominal, demand is tracking 2% below the 14-day baseline, water quality indicators are all within compliance bands and no critical assets are flagged for unplanned maintenance. Routine briefing cadence is appropriate; AquaIQ has no urgent recommendations for executive review.`,
    executiveReview: [
      "Maintain routine monitoring cadence; no change to public messaging.",
      "Continue scheduled maintenance program; no acceleration required.",
      "Confirm next executive briefing is set for the regular weekly slot.",
    ],
    priorities: [
      {
        title: "Routine grid monitoring",
        description: "All catchments and storages within nominal range.",
        status: "normal",
        icon: ShieldCheck,
        evidenceLabel: "dam_levels_current · catchment_conditions",
        evidenceType: "table",
      },
      {
        title: "Water quality compliance",
        description: "All indicators inside compliance bands.",
        status: "normal",
        icon: Droplets,
        evidenceLabel: "water_quality_samples",
        evidenceType: "table",
      },
      {
        title: "Asset health stable",
        description: "No critical assets in unplanned maintenance.",
        status: "normal",
        icon: Wrench,
        evidenceLabel: "asset_risk_scores",
        evidenceType: "table",
      },
    ],
  },
};

/**
 * Resolve the active overlay, falling back to the rainfall-watch default
 * if an unknown scenario id is held in context.
 */
export function getScenarioOverlay(id: string): ScenarioOverlay {
  return SCENARIO_OVERLAYS[id] ?? SCENARIO_OVERLAYS["72h-rainfall-watch"];
}
