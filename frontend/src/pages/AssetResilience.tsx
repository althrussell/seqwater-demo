import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
  ReferenceArea,
} from "recharts";
import { ArrowRight, BadgeDollarSign, Plus, Sparkles } from "lucide-react";
import KpiCard from "@/components/ui/KpiCard";
import SectionCard from "@/components/ui/SectionCard";
import StatusBadge from "@/components/ui/StatusBadge";
import AquaIQSummaryCard from "@/components/ui/AquaIQSummaryCard";
import HeroBanner from "@/components/ui/HeroBanner";
import {
  ASSET_MATRIX,
  ASSET_RESILIENCE_KPIS,
  CAPITAL_AQUAIQ,
  CAPITAL_PROJECTS,
  CRITICAL_ASSETS,
  HERO_COPY,
  HERO_IMAGES,
} from "@/lib/demoContent";
import { useToast } from "@/components/ui/Toast";

const BAND_COLORS: Record<string, string> = {
  low: "#5FA777",
  medium: "#0076BE",
  high: "#D88A00",
  elevated: "#C2410C",
};

export default function AssetResilience() {
  const { toast } = useToast();
  return (
    <div className="space-y-5">
      <HeroBanner
        image={HERO_IMAGES.assetResilience}
        eyebrow={HERO_COPY.assetResilience.eyebrow}
        headline={HERO_COPY.assetResilience.headline}
        sub={HERO_COPY.assetResilience.sub}
        height={220}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {ASSET_RESILIENCE_KPIS.map((k) => (
          <KpiCard
            key={k.title}
            title={k.title}
            value={k.value}
            supportingText={k.supportingText}
            status={k.status}
            icon={k.icon}
            sparklineData={k.spark.length > 0 ? k.spark : undefined}
            sparklineColor={k.sparkColor}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <SectionCard
          title="Asset Resilience Matrix"
          description="Synthetic criticality vs condition risk"
          className="lg:col-span-7"
        >
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 16, right: 24, bottom: 28, left: 24 }}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="conditionRisk"
                  name="Condition risk"
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  tickLine={false}
                  axisLine={{ stroke: "#CBD5E1" }}
                  label={{
                    value: "Condition risk",
                    position: "insideBottom",
                    offset: -10,
                    fill: "#64748B",
                    fontSize: 11,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="criticality"
                  name="Criticality"
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  tickLine={false}
                  axisLine={{ stroke: "#CBD5E1" }}
                  label={{
                    value: "Criticality",
                    angle: -90,
                    position: "insideLeft",
                    offset: -4,
                    fill: "#64748B",
                    fontSize: 11,
                  }}
                />
                <ReferenceArea x1={3.5} x2={5} y1={3.5} y2={5} fill="#FCE5DA" fillOpacity={0.6} />
                <ReferenceArea x1={2} x2={3.5} y1={3.5} y2={5} fill="#FFF4E0" fillOpacity={0.7} />
                <ReferenceArea x1={1} x2={2} y1={3.5} y2={5} fill="#EAF6FC" fillOpacity={0.6} />
                <ReferenceArea x1={1} x2={2} y1={1} y2={3.5} fill="#EEF8F2" fillOpacity={0.6} />
                <RTooltip
                  cursor={{ strokeDasharray: "3 3", stroke: "#0076BE" }}
                  contentStyle={{ borderRadius: 12, borderColor: "#D7E7F0" }}
                  formatter={(_v: any, _n: any, p: any) => [p.payload.asset, p.payload.region]}
                />
                {(["low", "medium", "high", "elevated"] as const).map((band) => (
                  <Scatter
                    key={band}
                    name={band}
                    data={ASSET_MATRIX.filter((m) => m.band === band)}
                    fill={BAND_COLORS[band]}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    shape={(props: any) => (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={9}
                        fill={BAND_COLORS[band]}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      />
                    )}
                    isAnimationActive={false}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11.5px] text-ink-muted">
            <BandKey color="#5FA777" label="Low" />
            <BandKey color="#0076BE" label="Medium" />
            <BandKey color="#D88A00" label="High" />
            <BandKey color="#C2410C" label="Elevated" />
            <span className="ml-auto text-[11px]">
              Bubble = synthetic asset · upper-right quadrant = focus zone
            </span>
          </div>
        </SectionCard>

        <SectionCard
          title="Critical Assets"
          description="Synthetic shortlist for executive attention"
          className="lg:col-span-5"
          padded={false}
        >
          <div className="scrollbar-clean max-h-[360px] overflow-auto">
            <table className="table-clean">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Status</th>
                  <th>Risk driver</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {CRITICAL_ASSETS.map((a) => (
                  <tr key={a.asset}>
                    <td>
                      <div className="font-semibold text-deepNavy">{a.asset}</div>
                      <div className="text-[11px] text-ink-muted">
                        {a.type} · {a.region}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={a.status} size="sm" />
                    </td>
                    <td className="text-[12.5px] text-ink-secondary">{a.riskDriver}</td>
                    <td className="text-right">
                      <button
                        onClick={() =>
                          toast({
                            title: "Added to briefing",
                            description: `${a.asset} review queued.`,
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-[11.5px] font-medium text-primaryBlue transition hover:bg-surface-blue"
                      >
                        <Plus className="h-3 w-3" />
                        Add to briefing
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Capital Project Priorities"
        description="Synthetic ranked pipeline for investment decisioning"
        actions={
          <button
            onClick={() =>
              toast({
                title: "Capital plan",
                description:
                  "Synthetic — full capital investment plan would open in the planning workspace.",
              })
            }
            className="btn-ghost text-[12.5px]"
          >
            View capital plan <ArrowRight className="h-3.5 w-3.5" />
          </button>
        }
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {CAPITAL_PROJECTS.map((p) => (
            <div
              key={p.name}
              className="flex flex-col rounded-md border border-border bg-surface p-3.5 transition hover:border-primaryBlue/30 hover:shadow-card"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-surface-blue text-[11px] font-semibold text-primaryBlue">
                  {p.priority}
                </span>
                <span className="text-[10.5px] uppercase tracking-wider text-ink-muted">
                  Priority
                </span>
              </div>
              <div className="mt-2 text-[14.5px] font-semibold leading-snug text-deepNavy">
                {p.name}
              </div>
              <div className="mt-2 flex items-center justify-between text-[12px] text-ink-muted">
                <span className="inline-flex items-center gap-1">
                  <BadgeDollarSign className="h-3.5 w-3.5 text-greenDark" />
                  {p.estimatedCost}
                </span>
                <span>{p.delivery}</span>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] text-ink-muted">
                  <span>Risk reduction</span>
                  <span className="font-semibold text-deepNavy">{p.riskReductionScore}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-blue">
                  <div
                    className="h-full rounded-full bg-primaryBlue"
                    style={{ width: `${p.riskReductionScore}%` }}
                  />
                </div>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-ink-secondary">{p.rationale}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <AquaIQSummaryCard
        title="AquaIQ Capital Insight"
        description="AI-generated synthetic prioritisation note"
        body={CAPITAL_AQUAIQ}
        updatedLabel="Synthetic — Last updated 09:10 AM AEST"
        ctaLabel="View capital reasoning"
        onCta={() => toast({ title: "Capital reasoning opened", variant: "info" })}
      />

      <SectionFooterHint />
    </div>
  );
}

function BandKey({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span>{label}</span>
    </span>
  );
}

function SectionFooterHint() {
  return (
    <div className="rounded-md border border-dashed border-border bg-surface-blue/30 px-4 py-3 text-[11.5px] text-ink-muted">
      <Sparkles className="mr-1 inline-block h-3.5 w-3.5 text-primaryBlue" />
      Synthetic prioritisation. Final capital decisions require engineering, regulatory and
      planning validation under approved Seqwater processes.
    </div>
  );
}
