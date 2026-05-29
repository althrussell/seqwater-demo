import { Check } from "lucide-react";
import KpiCard from "@/components/ui/KpiCard";
import SectionCard from "@/components/ui/SectionCard";
import StatusBadge from "@/components/ui/StatusBadge";
import Sparkline from "@/components/ui/Sparkline";
import AquaIQSummaryCard from "@/components/ui/AquaIQSummaryCard";
import {
  QUALITY_AQUAIQ,
  QUALITY_CHECKLIST,
  QUALITY_INDICATORS,
  QUALITY_KPIS,
  QUALITY_PLANTS,
} from "@/lib/demoContent";

export default function WaterQualityAssurance() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {QUALITY_KPIS.map((k) => (
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
          title="Key Indicators"
          description="Synthetic compliance and trend by indicator"
          className="lg:col-span-7"
          padded={false}
        >
          <table className="table-clean">
            <thead>
              <tr>
                <th>Indicator</th>
                <th>Status</th>
                <th>Trend</th>
                <th className="text-right">Compliance</th>
              </tr>
            </thead>
            <tbody>
              {QUALITY_INDICATORS.map((i) => (
                <tr key={i.indicator}>
                  <td className="font-semibold text-deepNavy">{i.indicator}</td>
                  <td>
                    <StatusBadge status={i.status} size="sm" />
                  </td>
                  <td className="w-[160px]">
                    <Sparkline data={i.trend} stroke={i.trendColor} height={28} />
                  </td>
                  <td className="text-right font-semibold text-deepNavy">{i.compliance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        <SectionCard
          title="Quality Trends"
          description="7-day synthetic trends"
          className="lg:col-span-5"
        >
          <div className="grid grid-cols-2 gap-3">
            <TrendTile label="Turbidity (NTU)" data={[9, 10, 10.5, 11, 11.5, 12, 13.1]} color="#D88A00" />
            <TrendTile label="pH" data={[7.4, 7.4, 7.5, 7.5, 7.4, 7.5, 7.5]} color="#0076BE" />
            <TrendTile
              label="Chlorine (mg/L)"
              data={[0.92, 0.95, 0.94, 0.96, 0.97, 0.96, 0.95]}
              color="#2E7D59"
            />
            <TrendTile
              label="Conductivity (µS/cm)"
              data={[210, 215, 212, 218, 220, 217, 222]}
              color="#5FA777"
            />
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <SectionCard
          title="Treatment Plants Overview"
          className="lg:col-span-7"
          padded={false}
        >
          <table className="table-clean">
            <thead>
              <tr>
                <th>Plant</th>
                <th>Status</th>
                <th className="text-right">Compliance %</th>
                <th>Review status</th>
              </tr>
            </thead>
            <tbody>
              {QUALITY_PLANTS.map((p) => (
                <tr key={p.plant}>
                  <td className="font-semibold text-deepNavy">{p.plant}</td>
                  <td>
                    <StatusBadge status={p.status} size="sm" />
                  </td>
                  <td className="text-right">{p.compliance}</td>
                  <td className="text-[12.5px] text-ink-secondary">{p.review}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        <SectionCard
          title="Operator Review Checklist"
          className="lg:col-span-5"
        >
          <ul className="space-y-2">
            {QUALITY_CHECKLIST.map((c) => (
              <li
                key={c}
                className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2.5 text-[13px] text-ink-secondary"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-greenDark/40 bg-surface-green text-greenDark">
                  <Check className="h-3 w-3" />
                </span>
                {c}
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <AquaIQSummaryCard
        title="AquaIQ Explanation"
        description="Synthetic AquaIQ note: water quality observations and recommended action"
        body={QUALITY_AQUAIQ}
        updatedLabel="Synthetic — 29 May 2026 09:10 AM AEST"
      />
    </div>
  );
}

function TrendTile({
  label,
  data,
  color,
}: {
  label: string;
  data: number[];
  color: string;
}) {
  const latest = data[data.length - 1];
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2.5">
      <div className="text-[11px] text-ink-muted">{label}</div>
      <div className="mt-0.5 text-[16px] font-semibold text-deepNavy">{latest.toFixed(2)}</div>
      <Sparkline data={data} stroke={color} height={36} />
    </div>
  );
}
