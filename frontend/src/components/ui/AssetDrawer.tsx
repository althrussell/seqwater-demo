import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronRight,
  ExternalLink,
  FileText,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { cn, fmtNumber, postureFromBand } from "@/lib/utils";
import { useToast } from "./Toast";
import StatusBadge from "./StatusBadge";
import Sparkline from "./Sparkline";

interface Props {
  assetId: string | null;
  onClose: () => void;
  /**
   * Layout mode. `inline` participates in the parent flex layout (map can
   * shrink to make room); `overlay` slides over the page using fixed
   * positioning. Defaults to `inline`.
   */
  variant?: "inline" | "overlay";
}

type TabId = "overview" | "signals" | "risks" | "work-orders" | "documents";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "signals", label: "Signals" },
  { id: "risks", label: "Risks" },
  { id: "work-orders", label: "Work Orders" },
  { id: "documents", label: "Documents" },
];

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=900&q=70";

const SUMMARY_LIBRARY: Record<string, { hero: string; insight: string; checklist: string[] }> = {
  "Water Treatment Plant": {
    hero:
      "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=900&q=70",
    insight:
      "Elevated catchment rainfall over the next 72 hours may increase turbidity. Two ageing work orders on raw water pumps may increase operational risk if inflows rise.",
    checklist: [
      "Review raw water pump work orders",
      "Monitor turbidity closely over next 72 hours",
      "Confirm chemical dosing strategy",
      "Engage operations team for inflow planning",
    ],
  },
  Dam: {
    hero:
      "https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=900&q=70",
    insight:
      "Storage trending within median 5-year band; forecast inflows expected to increase total volume. Maintain visibility over downstream demand.",
    checklist: [
      "Review inflow forecast with hydrology team",
      "Confirm release schedule alignment",
      "Update catchment scenario register",
    ],
  },
  "Pump Station": {
    hero:
      "https://images.unsplash.com/photo-1581090700227-1e8e4f9d63cb?auto=format&fit=crop&w=900&q=70",
    insight:
      "Pump health index easing. One open priority work order may benefit from prioritisation in this maintenance window.",
    checklist: [
      "Review pump health trend",
      "Confirm spares availability",
      "Validate failover capability",
    ],
  },
  Reservoir: {
    hero:
      "https://images.unsplash.com/photo-1554492281-29e10c2e9c83?auto=format&fit=crop&w=900&q=70",
    insight:
      "Reservoir holding within target operating band; sustained monitoring recommended over the planning horizon.",
    checklist: [
      "Continue daily storage monitoring",
      "Track turnover and quality indicators",
    ],
  },
  Pipeline: {
    hero:
      "https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&w=900&q=70",
    insight:
      "No active leak signals on this pipeline. Capital project alignment opportunity may exist.",
    checklist: [
      "Confirm scheduled inspection cadence",
      "Review pressure trend report",
    ],
  },
};

export default function AssetDrawer({ assetId, onClose, variant = "inline" }: Props) {
  const [tab, setTab] = useState<TabId>("overview");
  const { toast } = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ["asset", assetId],
    queryFn: () => api.asset(assetId as string),
    enabled: Boolean(assetId),
  });

  // Escape key closes the drawer.
  useEffect(() => {
    if (!assetId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [assetId, onClose]);

  if (!assetId) return null;
  const asset = (data ?? {}) as Record<string, any>;
  const risk = asset.risk as
    | undefined
    | {
        risk_band: string;
        risk_score: number;
        predicted_failure_30d: number;
        open_work_orders: number;
        recommended_action: string;
        health_index: number;
      };

  const lib = SUMMARY_LIBRARY[asset.asset_type as string] ?? {
    hero: FALLBACK_IMAGE,
    insight:
      "Asset summary. Operational signals appear within calm range; continue regular monitoring.",
    checklist: ["Continue regular review", "Update briefing register"],
  };

  const posture = postureFromBand(risk?.risk_band);
  const storageTrend: number[] = ((asset.storage_trend ?? []) as { y: number }[]).map((p) => p.y);
  const healthTrend: number[] = ((asset.health_trend ?? []) as { y: number }[]).map((p) => p.y);
  const quality = (asset.recent_quality_samples ?? []) as Array<Record<string, any>>;
  const turbidityTrend = quality.slice().reverse().map((q) => Number(q.turbidity_NTU));
  const recentWO = (asset.work_orders ?? []) as Array<Record<string, any>>;

  const containerClass =
    variant === "overlay"
      ? "fixed inset-y-0 right-0 z-30 flex w-full max-w-[440px] flex-col border-l border-border bg-surface shadow-elevated"
      : "flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-elevated";

  return (
    <AnimatePresence>
      {assetId ? (
        <motion.aside
          key="drawer"
          initial={
            variant === "overlay" ? { x: "100%" } : { opacity: 0, x: 16 }
          }
          animate={variant === "overlay" ? { x: 0 } : { opacity: 1, x: 0 }}
          exit={variant === "overlay" ? { x: "100%" } : { opacity: 0, x: 16 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className={containerClass}
          role="dialog"
          aria-label={asset.name ?? "Asset details"}
        >
          {/* Sticky bar with prominent close affordance. Always visible. */}
          <div className="flex flex-none items-center justify-between gap-3 border-b border-border bg-surface px-3 py-2">
            <div className="min-w-0 truncate text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
              Asset Briefing
            </div>
            <button
              onClick={onClose}
              aria-label="Close asset briefing"
              title="Close (Esc)"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-[12px] font-semibold text-ink-secondary transition hover:border-primaryBlue/40 hover:bg-surface-blue/40 hover:text-deepBlue"
            >
              <X className="h-3.5 w-3.5" />
              Close
            </button>
          </div>

          <div className="relative flex-none">
            <img
              src={lib.hero}
              alt=""
              className="h-[160px] w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-deepNavy/55 via-deepNavy/10 to-transparent" />
            <button
              onClick={onClose}
              aria-label="Close asset briefing"
              title="Close (Esc)"
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-ink-secondary shadow-card transition hover:text-deepBlue"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="absolute bottom-3 left-4 text-white">
              <div className="text-[18px] font-semibold leading-tight">
                {asset.name ?? assetId}
              </div>
              <div className="text-[12px] text-white/85">{asset.region ?? "—"}</div>
            </div>
          </div>

          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10.5px] uppercase tracking-wider text-ink-muted">
                Overall Status
              </div>
              <div className="text-[10.5px] text-ink-muted">
                Last updated 09:10 AM AEST
              </div>
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <StatusBadge status={posture} showIcon />
              <div className="text-[11px] text-ink-muted">{asset.asset_type}</div>
            </div>
          </div>

          <nav className="flex flex-none gap-1 border-b border-border bg-canvas/40 px-2 py-1.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[12px] font-medium transition",
                  tab === t.id
                    ? "bg-surface text-primaryBlue shadow-soft"
                    : "text-ink-muted hover:text-deepBlue",
                )}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div className="scrollbar-clean flex-1 overflow-y-auto px-4 py-4">
            {isLoading ? <SkeletonBody /> : null}

            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                {tab === "overview" ? (
                  <OverviewTab
                    capacityMl={asset.capacity_ml}
                    storageTrend={storageTrend}
                    healthTrend={healthTrend}
                    turbidityTrend={turbidityTrend}
                    quality={quality}
                    insight={lib.insight}
                    checklist={lib.checklist}
                  />
                ) : null}
                {tab === "signals" ? (
                  <SignalsTab
                    storageTrend={storageTrend}
                    healthTrend={healthTrend}
                    turbidityTrend={turbidityTrend}
                  />
                ) : null}
                {tab === "risks" ? <RisksTab risk={risk} /> : null}
                {tab === "work-orders" ? <WorkOrdersTab items={recentWO} /> : null}
                {tab === "documents" ? <DocumentsTab assetName={asset.name ?? "asset"} /> : null}
              </motion.div>
            </AnimatePresence>
          </div>

          <footer className="flex flex-wrap items-center gap-2 border-t border-border bg-surface px-4 py-3">
            <button
              onClick={() =>
                toast({
                  title: "Risk explanation queued",
                  description: "AquaIQ will draft a risk note for this asset.",
                })
              }
              className="btn-secondary text-[12.5px]"
            >
              Explain Risk
            </button>
            <button
              onClick={() =>
                toast({
                  title: "Added to executive briefing",
                  description: `${asset.name ?? "Asset"} included in the next briefing.`,
                })
              }
              className="btn-primary text-[12.5px]"
            >
              Add to Briefing
            </button>
            <button
              onClick={() =>
                toast({
                  title: "Opening work orders",
                  description: "Work order list ready for review.",
                  variant: "info",
                })
              }
              className="btn-ghost ml-auto text-[12.5px]"
            >
              View Work Orders
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </footer>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

function StatGrid({ items }: { items: { label: string; value: string; sub?: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-md border border-border bg-surface px-3 py-2.5"
        >
          <div className="text-[10.5px] uppercase tracking-wider text-ink-muted">
            {it.label}
          </div>
          <div className="mt-1 text-[18px] font-semibold leading-none text-deepNavy">
            {it.value}
          </div>
          {it.sub ? (
            <div className="mt-1 text-[10.5px] text-ink-muted">{it.sub}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function OverviewTab({
  capacityMl,
  storageTrend,
  healthTrend,
  turbidityTrend,
  quality,
  insight,
  checklist,
}: {
  capacityMl?: number;
  storageTrend: number[];
  healthTrend: number[];
  turbidityTrend: number[];
  quality: Array<Record<string, any>>;
  insight: string;
  checklist: string[];
}) {
  const latestTurb = turbidityTrend[turbidityTrend.length - 1] ?? 13.1;
  const flow = capacityMl ? `${fmtNumber(capacityMl * 0.78, { maximumFractionDigits: 0 })} ML/day` : "420 ML/day";
  const capacity = capacityMl
    ? `${Math.round(((capacityMl * 0.86) / capacityMl) * 100)}%`
    : "86%";
  const alerts = quality.filter((q) => q.alert_level && q.alert_level !== "Normal").length || 2;
  return (
    <div className="space-y-3.5">
      <div>
        <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-muted">
          Operating summary
        </div>
        <StatGrid
          items={[
            { label: "Treatment Capacity", value: capacity, sub: "of total capacity" },
            { label: "Current Flow", value: flow, sub: "78% of design" },
            { label: "Turbidity (NTU)", value: latestTurb.toFixed(1), sub: "vs yesterday" },
            { label: "Quality Alerts", value: String(alerts), sub: "active" },
          ]}
        />
      </div>

      <div>
        <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-muted">
          Recent trends (7 days)
        </div>
        <div className="grid grid-cols-3 gap-2">
          <MiniTrend label="Turbidity (NTU)" data={turbidityTrend} color="#D88A00" />
          <MiniTrend label="Flow (ML/day)" data={storageTrend} color="#0076BE" />
          <MiniTrend label="Rainfall (mm)" data={healthTrend} color="#5FA777" variant="bar" />
        </div>
      </div>

      <div className="rounded-md border border-border bg-surface-blue/50 p-3">
        <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-primaryBlue">
          <Sparkles className="h-3.5 w-3.5" /> AquaIQ Insight
        </div>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-deepNavy">{insight}</p>
        <a
          href="#"
          className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-primaryBlue hover:text-deepBlue"
        >
          View full explanation
          <ChevronRight className="h-3 w-3" />
        </a>
      </div>

      <div>
        <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-muted">
          Recommended review
        </div>
        <ul className="space-y-1.5">
          {checklist.map((c) => (
            <li
              key={c}
              className="flex items-start gap-2 rounded-md border border-border bg-surface px-3 py-2 text-[12.5px] text-ink-secondary"
            >
              <Check className="mt-0.5 h-3.5 w-3.5 flex-none text-greenDark" />
              {c}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MiniTrend({
  label,
  data,
  color,
  variant,
}: {
  label: string;
  data: number[];
  color: string;
  variant?: "area" | "bar";
}) {
  const sample = data && data.length > 0 ? data : [1, 1, 1];
  const latest = sample[sample.length - 1];
  return (
    <div className="rounded-md border border-border bg-surface px-2.5 py-2">
      <div className="text-[10.5px] text-ink-muted">{label}</div>
      <div className="text-[14px] font-semibold text-deepNavy">
        {Number.isFinite(latest) ? Number(latest).toFixed(1) : "—"}
      </div>
      <Sparkline data={sample} stroke={color} height={28} variant={variant ?? "area"} />
      <div className="mt-0.5 text-[9.5px] text-ink-muted">23 May — 29 May</div>
    </div>
  );
}

function SignalsTab({
  storageTrend,
  healthTrend,
  turbidityTrend,
}: {
  storageTrend: number[];
  healthTrend: number[];
  turbidityTrend: number[];
}) {
  return (
    <div className="space-y-3">
      <SignalBlock label="Storage / inflow" data={storageTrend} color="#0076BE" />
      <SignalBlock label="Health index" data={healthTrend} color="#2E7D59" />
      <SignalBlock label="Turbidity (NTU,)" data={turbidityTrend} color="#D88A00" />
    </div>
  );
}

function SignalBlock({ label, data, color }: { label: string; data: number[]; color: string }) {
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <div className="text-[11.5px] font-semibold text-deepNavy">{label}</div>
      <div className="mt-1">
        <Sparkline
          data={data.length > 0 ? data : [1, 1, 1]}
          stroke={color}
          height={56}
        />
      </div>
    </div>
  );
}

function RisksTab({
  risk,
}: {
  risk?: { risk_band: string; risk_score: number; recommended_action: string; predicted_failure_30d: number };
}) {
  if (!risk) {
    return <Empty label="No risk score available for this asset." />;
  }
  return (
    <div className="space-y-3">
      <StatGrid
        items={[
          { label: "Risk band", value: risk.risk_band },
          { label: "Risk score", value: risk.risk_score.toFixed(2) },
          {
            label: "30-day failure",
            value: `${(risk.predicted_failure_30d * 100).toFixed(0)}%`,
          },
        ]}
      />
      <div className="rounded-md border border-border bg-surface-blue/50 p-3 text-[12.5px] text-deepNavy">
        <div className="text-[10.5px] font-semibold uppercase tracking-wider text-primaryBlue">
          Recommended action
        </div>
        <p className="mt-1.5 leading-relaxed">{risk.recommended_action}</p>
      </div>
    </div>
  );
}

function WorkOrdersTab({ items }: { items: Array<Record<string, any>> }) {
  if (!items || items.length === 0) {
    return <Empty label="No work orders linked to this asset." />;
  }
  return (
    <ul className="space-y-2 text-[12px]">
      {items.slice(0, 8).map((w) => (
        <li
          key={String(w.work_order_id)}
          className="flex items-start justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-mono text-[11.5px] text-deepNavy">
              <Wrench className="h-3 w-3 text-ink-muted" /> {String(w.work_order_id)}
            </div>
            <div className="mt-0.5 text-ink-secondary">{String(w.description ?? "—")}</div>
          </div>
          <div className="text-right text-[11px] text-ink-muted">
            <div>{String(w.priority ?? "")}</div>
            <div>{String(w.status ?? "")}</div>
            <div>{String(w.age_days ?? "")}d</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function DocumentsTab({ assetName }: { assetName: string }) {
  const docs = [
    { name: `${assetName} — Operations Briefing.pdf`, type: "Briefing", date: "27 May 2026" },
    { name: `${assetName} — Asset Condition Notes.docx`, type: "Engineering", date: "21 May 2026" },
    { name: `${assetName} — Compliance Summary.pdf`, type: "Compliance", date: "12 May 2026" },
  ];
  return (
    <ul className="space-y-2 text-[12.5px]">
      {docs.map((d) => (
        <li
          key={d.name}
          className="flex items-start gap-3 rounded-md border border-border bg-surface px-3 py-2.5"
        >
          <FileText className="mt-0.5 h-4 w-4 flex-none text-primaryBlue" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-deepNavy">{d.name}</div>
            <div className="text-[11px] text-ink-muted">
              {d.type} · {d.date}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 flex-none text-ink-muted" />
        </li>
      ))}
    </ul>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-surface-blue/40 px-3 py-6 text-center text-[12.5px] text-ink-muted">
      {label}
    </div>
  );
}

function SkeletonBody() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-md border border-border bg-surface-blue/30" />
      ))}
    </div>
  );
}
