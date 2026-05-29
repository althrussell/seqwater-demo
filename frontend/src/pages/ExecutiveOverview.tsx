import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import ExecutiveKpiCard from "@/components/ExecutiveKpiCard";
import Section from "@/components/Section";
import ActionRecommendationCard from "@/components/ActionRecommendationCard";
import TrendSparkline from "@/components/TrendSparkline";
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  ScrollText,
  Sparkles,
} from "lucide-react";
import RiskBadge from "@/components/RiskBadge";

const KPI_ICONS: Record<string, string> = {
  "Water Security": "shield",
  "Total Storage": "droplets",
  "Forecast Demand": "gauge",
  "Treatment Capacity": "activity",
  "Critical Work Orders": "wrench",
  "Quality Alerts": "alert",
  "Elevated Assets": "alert",
  "72h Rainfall Forecast": "rain",
};

export default function ExecutiveOverview() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["overview"],
    queryFn: api.overview,
  });
  const risk = useQuery({ queryKey: ["asset-risk"], queryFn: api.assetRisk });

  if (isLoading || !data) return <SkeletonGrid />;

  return (
    <div className="space-y-5">
      <Hero data={data} onBriefing={() => navigate("/briefing")} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((k) => {
          const trendKey =
            k.label === "Total Storage"
              ? "storage"
              : k.label === "Forecast Demand"
                ? "demand"
                : k.label === "72h Rainfall Forecast"
                  ? "rainfall"
                  : k.label === "Quality Alerts"
                    ? "quality"
                    : null;
          const trend = trendKey ? data.trends[trendKey] : undefined;
          return (
            <ExecutiveKpiCard
              key={k.label}
              label={k.label}
              value={k.value}
              sublabel={k.sublabel}
              status={k.status ?? "ok"}
              icon={KPI_ICONS[k.label] ?? "gauge"}
              trend={trend}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Section
          title="AquaIQ executive summary"
          description="Synthetic, evidence-led, conservative."
          actions={
            <button
              onClick={() => navigate("/aquaiq")}
              className="btn-ghost text-xs"
            >
              Open AquaIQ <ArrowRight className="h-3.5 w-3.5" />
            </button>
          }
          className="lg:col-span-2"
        >
          <p className="text-sm leading-relaxed text-ink-100">
            {data.ai_executive_summary}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <SignalCard
              title="72-hour synthetic posture"
              value={data.seventy_two_hour_risk}
              footnote={data.headline_status}
            />
            <SignalCard
              title="Storage across SEQ Water Grid"
              value={`${data.storage_percent.toFixed(1)}%`}
              footnote={`${data.elevated_assets} synthetic assets in elevated risk band`}
            />
          </div>
          <div className="mt-4">
            <h4 className="mb-2 text-[10px] uppercase tracking-wider text-ink-300">
              Top recommended actions (synthetic)
            </h4>
            <ActionRecommendationCard actions={data.top_actions} />
          </div>
        </Section>

        <Section
          title="Top synthetic asset risks"
          description="Ranked from synthetic asset_risk_scores"
          actions={
            <button
              onClick={() => navigate("/assets")}
              className="btn-ghost text-xs"
            >
              All assets <ArrowRight className="h-3.5 w-3.5" />
            </button>
          }
        >
          <ul className="space-y-2">
            {(risk.data ?? []).slice(0, 6).map((r) => (
              <li
                key={r.asset_id}
                className="flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink-50">
                    {r.asset_name}
                  </div>
                  <div className="text-[11px] text-ink-300">
                    {r.asset_type} · score {r.risk_score.toFixed(2)} ·{" "}
                    {r.open_work_orders} open WOs
                  </div>
                </div>
                <RiskBadge band={r.risk_band} />
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <TrendCard
          title="Synthetic SEQ-wide storage %"
          subtitle="60-day rolling daily aggregate"
          data={data.trends.storage}
          stroke="#3FA1F2"
          yLabel="% storage"
        />
        <TrendCard
          title="Synthetic forecast demand"
          subtitle="14-day baseline"
          data={data.trends.demand}
          stroke="#5DDCD0"
          yLabel="ML/day"
        />
        <TrendCard
          title="Synthetic 14-day turbidity trend"
          subtitle="Mean across treatment plants"
          data={data.trends.quality}
          stroke="#FFC04D"
          yLabel="NTU"
        />
      </div>
    </div>
  );
}

function Hero({
  data,
  onBriefing,
}: {
  data: ReturnType<typeof useQuery<any>>["data"] & {
    headline_status: string;
    seventy_two_hour_risk: string;
    generated_at: string;
  };
  onBriefing: () => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-water-grad p-6 shadow-elevated">
      <div className="pointer-events-none absolute inset-0 opacity-25 mix-blend-screen" style={{
        backgroundImage:
          "radial-gradient(800px 320px at 80% -10%, rgba(255,255,255,0.4), transparent 60%), radial-gradient(700px 360px at -10% 90%, rgba(255,143,118,0.4), transparent 60%)",
      }} />
      <div className="relative flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/70">
            <Clock className="h-3 w-3" />
            <span>
              Synthetic snapshot · {new Date(data.generated_at).toLocaleString()}
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-white">
            Seqwater AI Command Centre
          </h1>
          <p className="mt-1 text-sm text-white/80">
            Governed intelligence for water security, asset resilience, flood
            readiness, and executive decision-making.
          </p>
          <p className="mt-4 text-base text-white/85">
            <span className="font-semibold">{data.headline_status}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-right backdrop-blur">
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/70">
              72-hour posture (synthetic)
            </div>
            <div className="mt-0.5 text-2xl font-semibold text-white">
              {data.seventy_two_hour_risk}
            </div>
          </div>
          <button
            onClick={onBriefing}
            className="btn-primary"
          >
            <ScrollText className="h-4 w-4" />
            Generate board briefing
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}

function TrendCard({
  title,
  subtitle,
  data,
  stroke,
  yLabel,
}: {
  title: string;
  subtitle: string;
  data: { x: string; y: number }[];
  stroke: string;
  yLabel: string;
}) {
  return (
    <Section title={title} description={subtitle}>
      <TrendSparkline data={data} height={120} stroke={stroke} yLabel={yLabel} />
    </Section>
  );
}

function SignalCard({
  title,
  value,
  footnote,
}: {
  title: string;
  value: string;
  footnote: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-ink-300">
        <Sparkles className="h-3.5 w-3.5 text-brand-300" />
        {title}
      </div>
      <div className="mt-2 text-2xl font-semibold text-ink-50">{value}</div>
      <p className="mt-1 text-xs text-ink-300">{footnote}</p>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="space-y-5">
      <div className="h-44 animate-pulse rounded-3xl bg-white/[0.03]" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-2xl bg-white/[0.03]"
          />
        ))}
      </div>
    </div>
  );
}
