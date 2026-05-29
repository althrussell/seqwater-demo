import { useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ArrowRight, Check, ChevronRight } from "lucide-react";
import KpiCard from "@/components/ui/KpiCard";
import SectionCard from "@/components/ui/SectionCard";
import AquaIQSummaryCard from "@/components/ui/AquaIQSummaryCard";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  SOURCE_CONTRIBUTION,
  STORAGE_HISTORY,
  SUPPLY_AQUAIQ,
  SUPPLY_BALANCE,
  SUPPLY_KEY_DRIVERS,
  SUPPLY_KPIS,
  SUPPLY_WATCHPOINTS,
  TREATMENT_PLANT_CAPACITY,
} from "@/lib/demoContent";
import { useToast } from "@/components/ui/Toast";
import { fmtNumber } from "@/lib/utils";

const TIMEFRAMES = ["7 Days", "30 Days", "90 Days"];

export default function WaterSecuritySupply() {
  const [timeframe, setTimeframe] = useState("30 Days");
  const { toast } = useToast();
  const slice =
    timeframe === "7 Days"
      ? STORAGE_HISTORY.slice(-14)
      : timeframe === "90 Days"
        ? STORAGE_HISTORY
        : STORAGE_HISTORY.slice(-30);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {SUPPLY_KPIS.map((k) => (
          <KpiCard
            key={k.title}
            title={k.title}
            value={k.value}
            supportingText={k.supportingText}
            status={k.status}
            icon={k.icon}
            sparklineData={k.spark.length > 0 ? k.spark : undefined}
            sparklineColor={k.sparkColor}
            sparklineVariant={k.sparkVariant}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <SectionCard
          title="Grid Storage Over Time"
          description="Total useable storage across Seqwater storages"
          className="lg:col-span-7"
          actions={
            <div className="flex items-center rounded-md border border-border bg-surface text-[12px]">
              {TIMEFRAMES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-2.5 py-1 transition ${
                    t === timeframe
                      ? "rounded-md bg-surface-blue text-primaryBlue"
                      : "text-ink-muted hover:text-deepBlue"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          }
        >
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={slice} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="band" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00AEEF" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#00AEEF" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  tickFormatter={(d: string) =>
                    new Date(d).toLocaleDateString("en-AU", { day: "2-digit", month: "short" })
                  }
                  tickLine={false}
                  axisLine={{ stroke: "#E2E8F0" }}
                  minTickGap={36}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                />
                <RTooltip
                  formatter={(v: number) => `${v.toFixed(1)}%`}
                  labelFormatter={(l) =>
                    new Date(l).toLocaleDateString("en-AU", {
                      day: "2-digit",
                      month: "short",
                    })
                  }
                  contentStyle={{ borderRadius: 12, borderColor: "#D7E7F0" }}
                />
                <Area
                  type="monotone"
                  dataKey="p90"
                  stroke="none"
                  fill="url(#band)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="p10"
                  stroke="none"
                  fill="#FFFFFF"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="median"
                  stroke="#94A3B8"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  dot={false}
                  name="Median (5yr)"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#0076BE"
                  strokeWidth={2.4}
                  dot={false}
                  name="Actual"
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-[11.5px] text-ink-muted">
            <LegendDot color="#0076BE" label="Actual" />
            <LegendDot color="#94A3B8" label="Median (5yr)" dashed />
            <LegendDot color="#00AEEF" label="10th – 90th percentile" muted />
            <a
              href="#"
              className="ml-auto inline-flex items-center gap-1 text-[12px] font-semibold text-primaryBlue hover:text-deepBlue"
            >
              View storage by dam <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        </SectionCard>

        <SectionCard
          title="Water Supply Balance (Next 72h)"
          className="lg:col-span-5"
        >
          <div className="grid grid-cols-3 gap-3">
            <BalanceTile
              label="AVAILABLE SUPPLY"
              value={`${fmtNumber(SUPPLY_BALANCE.availableMl, {
                maximumFractionDigits: 0,
              })} ML`}
              color="text-primaryBlue"
            />
            <BalanceTile
              label="FORECAST DEMAND"
              value={`${fmtNumber(SUPPLY_BALANCE.demandMl, {
                maximumFractionDigits: 0,
              })} ML`}
              color="text-status-watch"
              prefix="−"
            />
            <BalanceTile
              label="SUPPLY MARGIN"
              value={`${fmtNumber(SUPPLY_BALANCE.marginMl, {
                maximumFractionDigits: 0,
              })} ML`}
              color="text-greenDark"
              prefix="="
              sub={`(${SUPPLY_BALANCE.marginPercent}% margin)`}
            />
          </div>
          <div className="mt-4">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-muted">
              Key drivers
            </div>
            <ul className="mt-2 space-y-1.5">
              {SUPPLY_KEY_DRIVERS.map((d) => (
                <li
                  key={d}
                  className="flex items-start gap-2 text-[12.5px] text-ink-secondary"
                >
                  <Check className="mt-0.5 h-3.5 w-3.5 flex-none text-primaryBlue" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <SectionCard
          title="Source Contribution (Current)"
          className="lg:col-span-5"
          actions={
            <a
              href="#"
              className="btn-ghost text-[12px]"
            >
              View source details
              <ArrowRight className="h-3 w-3" />
            </a>
          }
        >
          <DonutSourceContribution />
        </SectionCard>

        <SectionCard
          title="Treatment Plant Capacity"
          description="Available capacity by plant"
          className="lg:col-span-7"
          actions={
            <a href="#" className="btn-ghost text-[12px]">
              View all treatment plants <ArrowRight className="h-3 w-3" />
            </a>
          }
        >
          <table className="table-clean">
            <thead>
              <tr>
                <th>Plant</th>
                <th className="text-right">Available Capacity</th>
                <th className="text-right">% of Design</th>
              </tr>
            </thead>
            <tbody>
              {TREATMENT_PLANT_CAPACITY.map((p) => (
                <tr key={p.plant}>
                  <td className="font-medium">{p.plant}</td>
                  <td className="text-right text-ink-secondary">
                    {p.availableMlDay} ML/day
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-32 overflow-hidden rounded-full bg-surface-blue">
                        <div
                          className="h-full rounded-full bg-primaryBlue"
                          style={{ width: `${p.percentDesign}%` }}
                        />
                      </div>
                      <span className="w-9 text-right text-[12.5px] font-semibold text-deepNavy">
                        {p.percentDesign}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <SectionCard
          title="Supply Continuity Watchpoints"
          className="lg:col-span-6"
        >
          <ul className="space-y-2">
            {SUPPLY_WATCHPOINTS.map((w) => (
              <li
                key={w.text}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2.5 text-[13px] text-deepNavy"
              >
                <div className="flex items-center gap-2.5">
                  <StatusBadge status={w.status} size="sm" />
                  <span>{w.text}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-ink-muted" />
              </li>
            ))}
          </ul>
        </SectionCard>

        <AquaIQSummaryCard
          className="lg:col-span-6"
          title="AquaIQ Insight"
          description="Synthetic AquaIQ explanation grounded in governed operational data."
          body={SUPPLY_AQUAIQ}
          updatedLabel="Synthetic — 29 May 2026 09:10 AM AEST"
          onCta={() =>
            toast({
              title: "Added to executive brief",
              description: "Insight queued for the AquaIQ Briefing Analyst.",
            })
          }
          ctaLabel="Add to Executive Brief"
        />
      </div>
    </div>
  );
}

function BalanceTile({
  label,
  value,
  color,
  prefix,
  sub,
}: {
  label: string;
  value: string;
  color: string;
  prefix?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-3 text-center">
      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-muted">
        {label}
      </div>
      <div className={`mt-2 text-[20px] font-semibold leading-none ${color}`}>
        {prefix ? <span className="mr-1 text-ink-muted">{prefix}</span> : null}
        {value}
      </div>
      {sub ? <div className="mt-1 text-[11px] text-ink-muted">{sub}</div> : null}
    </div>
  );
}

function LegendDot({
  color,
  label,
  dashed,
  muted,
}: {
  color: string;
  label: string;
  dashed?: boolean;
  muted?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-[3px] w-6"
        style={{
          background: muted ? `${color}33` : color,
          borderTop: dashed ? `2px dashed ${color}` : undefined,
          height: dashed ? 0 : 3,
        }}
      />
      <span>{label}</span>
    </span>
  );
}

function DonutSourceContribution() {
  const total = SOURCE_CONTRIBUTION.reduce((acc, s) => acc + s.value, 0);
  return (
    <div className="grid grid-cols-2 items-center gap-3">
      <div className="relative h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={SOURCE_CONTRIBUTION}
              dataKey="value"
              nameKey="name"
              innerRadius={56}
              outerRadius={82}
              startAngle={90}
              endAngle={-270}
              stroke="#FFFFFF"
              strokeWidth={3}
              isAnimationActive={false}
            >
              {SOURCE_CONTRIBUTION.map((s) => (
                <Cell key={s.name} fill={s.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-[10.5px] uppercase tracking-wider text-ink-muted">Total Available</div>
            <div className="text-[18px] font-semibold text-deepNavy">
              {fmtNumber(total, { maximumFractionDigits: 0 })} ML
            </div>
          </div>
        </div>
      </div>
      <ul className="space-y-1.5 text-[12.5px]">
        {SOURCE_CONTRIBUTION.map((s) => {
          const pct = ((s.value / total) * 100).toFixed(0);
          return (
            <li key={s.name} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-deepNavy">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: s.color }}
                />
                <span>{s.name}</span>
              </div>
              <div className="flex items-center gap-2 text-ink-muted">
                <span>{fmtNumber(s.value, { maximumFractionDigits: 0 })} ML</span>
                <span className="font-semibold text-deepNavy">{pct}%</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
