import {
  Activity,
  CloudRain,
  Compass,
  Database,
  Droplets,
  Map,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

export interface NavItem {
  to: string;
  label: string;
  subtitle: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export interface NavGroup {
  /** Short uppercase label shown above the group in the left rail. */
  heading: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    heading: "Overview",
    items: [
      {
        to: "/overview",
        label: "Executive Overview",
        subtitle: "South East Queensland Water Security View",
        icon: Compass,
      },
      {
        to: "/map",
        label: "SEQ Water Grid Map",
        subtitle: "SEQ Water Grid Map",
        icon: Map,
      },
    ],
  },
  {
    heading: "Operations",
    items: [
      {
        to: "/supply",
        label: "Water Security & Supply",
        subtitle: "Water Security & Supply Outlook",
        icon: Droplets,
      },
      {
        to: "/assets",
        label: "Asset Resilience & Capital Priorities",
        subtitle: "Asset Resilience & Capital Priorities",
        icon: Activity,
      },
      {
        to: "/quality",
        label: "Water Quality Assurance",
        subtitle: "Water Quality Assurance",
        icon: Waves,
      },
      {
        to: "/flood",
        label: "Flood Readiness & Scenario Briefing",
        subtitle: "Flood Readiness & Scenario Briefing",
        icon: CloudRain,
      },
    ],
  },
  {
    heading: "AI & Data",
    items: [
      {
        to: "/aquaiq",
        label: "AquaIQ Assistant",
        subtitle: "AquaIQ Assistant",
        icon: Sparkles,
      },
      {
        to: "/genie",
        label: "Data Intelligence",
        subtitle: "Embedded Genie Space",
        icon: Database,
      },
    ],
  },
  {
    heading: "Platform",
    items: [
      {
        to: "/governance",
        label: "Governance & Platform",
        subtitle: "Governance & Platform",
        icon: ShieldCheck,
      },
    ],
  },
];

/** Flat list of all nav items, in render order. Convenience for legacy
 *  consumers that don't care about grouping (e.g. breadcrumb lookups). */
export const NAV: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
