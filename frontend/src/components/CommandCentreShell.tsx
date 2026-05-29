import { NavLink, useLocation } from "react-router-dom";
import {
  Activity,
  CloudRain,
  Compass,
  Droplets,
  Gauge,
  KeyRound,
  Map,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import SyntheticDataBanner from "./SyntheticDataBanner";

const NAV = [
  { to: "/overview", label: "Executive Overview", icon: Compass },
  { to: "/map", label: "Water Security Map", icon: Map },
  { to: "/assets", label: "Asset Risk", icon: Activity },
  { to: "/quality", label: "Water Quality", icon: Droplets },
  { to: "/flood", label: "Flood Readiness", icon: CloudRain },
  { to: "/aquaiq", label: "AquaIQ Assistant", icon: Sparkles },
  { to: "/briefing", label: "Board Briefing", icon: ScrollText },
  { to: "/governance", label: "Governance & Lineage", icon: KeyRound },
];

export default function CommandCentreShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const health = useQuery({ queryKey: ["health"], queryFn: api.health });
  const overview = useQuery({ queryKey: ["overview"], queryFn: api.overview });

  return (
    <div className="relative min-h-screen bg-command-grad">
      <BackgroundGrid />

      <div className="relative mx-auto flex min-h-screen max-w-[1600px] gap-0">
        <aside className="sticky top-0 hidden h-screen w-[260px] flex-none flex-col border-r border-white/5 bg-black/30 backdrop-blur-md lg:flex">
          <BrandHeader />
          <nav className="mt-2 flex flex-1 flex-col gap-0.5 px-3">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                    isActive
                      ? "bg-white/[0.06] text-ink-50 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                      : "text-ink-200 hover:bg-white/[0.04] hover:text-ink-50",
                  )
                }
              >
                <item.icon className="h-4 w-4 opacity-80 group-hover:opacity-100" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <SidebarFooter mode={health.data?.mode} version={health.data?.version} />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <TopBar
            currentPath={location.pathname}
            risk={overview.data?.seventy_two_hour_risk}
            mode={health.data?.mode ?? "local"}
          />
          <div className="flex-1 px-6 pb-12 pt-4 lg:px-8">
            <SyntheticDataBanner className="mb-5" />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function BrandHeader() {
  return (
    <div className="flex items-center gap-3 border-b border-white/5 px-5 py-5">
      <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-water-grad shadow-[inset_0_0_0_1px_rgba(255,255,255,0.10)]">
        <div className="absolute inset-0 grid place-items-center">
          <Droplets className="h-4 w-4 text-white" />
        </div>
        <div className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-brand-500 shadow-[0_0_18px_4px_rgba(255,54,33,0.55)]" />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-ink-300">
          Seqwater
        </div>
        <div className="-mt-0.5 text-sm font-semibold text-ink-50">
          AI Command Centre
        </div>
      </div>
    </div>
  );
}

function SidebarFooter({ mode, version }: { mode?: string; version?: string }) {
  return (
    <div className="m-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
      <div className="flex items-center justify-between text-[11px] text-ink-300">
        <div>
          Mode
          <div className="mt-0.5 font-semibold uppercase tracking-wider text-ink-100">
            {mode === "databricks" ? "Databricks" : "Local Demo"}
          </div>
        </div>
        <div className="text-right">
          v{version ?? "0.1.0"}
          <div className="mt-0.5 inline-flex items-center gap-1 text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-catchment-400 animate-pulseSoft" />
            Live
          </div>
        </div>
      </div>
      <div className="mt-3 rounded-lg bg-black/30 p-2 text-[10px] leading-relaxed text-ink-300">
        Synthetic demo data only. Not real Seqwater data. Not for operational use.
      </div>
    </div>
  );
}

function TopBar({
  currentPath,
  risk,
  mode,
}: {
  currentPath: string;
  risk?: string;
  mode: string;
}) {
  const current = NAV.find((n) => n.to === currentPath) ?? NAV[0];
  const Icon = current.icon;
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/5 bg-black/40 px-6 py-3 backdrop-blur-xl lg:px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-white/[0.04]">
          <Icon className="h-4 w-4 text-ink-100" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-ink-300">
            Command Centre
          </div>
          <div className="-mt-0.5 text-sm font-semibold text-ink-50">
            {current.label}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {risk ? (
          <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs sm:inline-flex">
            <Gauge className="h-3.5 w-3.5 text-ink-200" />
            <span className="text-ink-300">72h synthetic posture</span>
            <span className="font-semibold text-ink-50">{risk}</span>
          </div>
        ) : null}
        <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-catchment-400 animate-pulseSoft" />
          <span className="text-ink-300">Mode</span>
          <span className="font-semibold uppercase tracking-wider text-ink-50">
            {mode === "databricks" ? "Databricks" : "Local Demo"}
          </span>
        </div>
      </div>
    </header>
  );
}

function BackgroundGrid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.06]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
        backgroundSize: "44px 44px",
        maskImage:
          "radial-gradient(900px 600px at 30% 0%, black, transparent 70%), radial-gradient(900px 700px at 90% 100%, black, transparent 70%)",
        WebkitMaskImage:
          "radial-gradient(900px 600px at 30% 0%, black, transparent 70%), radial-gradient(900px 700px at 90% 100%, black, transparent 70%)",
      }}
    />
  );
}
