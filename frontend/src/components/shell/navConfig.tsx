import {
  Activity,
  CloudRain,
  Compass,
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

export const NAV: NavItem[] = [
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
  {
    to: "/aquaiq",
    label: "AquaIQ Briefing Analyst",
    subtitle: "AquaIQ Briefing Analyst",
    icon: Sparkles,
  },
  {
    to: "/governance",
    label: "Governance & Platform",
    subtitle: "Governance & Platform",
    icon: ShieldCheck,
  },
];
