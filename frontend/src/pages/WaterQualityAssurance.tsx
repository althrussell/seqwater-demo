import { Check } from "lucide-react";
import KpiCard from "@/components/ui/KpiCard";
import SectionCard from "@/components/ui/SectionCard";
import StatusBadge from "@/components/ui/StatusBadge";
import Sparkline from "@/components/ui/Sparkline";
import HeroBanner from "@/components/ui/HeroBanner";
import {
  HERO_COPY,
  HERO_IMAGES,
  QUALITY_CHECKLIST,
  QUALITY_INDICATORS,
  QUALITY_KPIS,
  QUALITY_PLANTS,
} from "@/lib/demoContent";

export default function WaterQualityAssurance() {
  return (
    <div className="flex h-[var(--page-h)] min-h-0 flex-col gap-2">
      <HeroBanner
        image={HERO_IMAGES.waterQuality}
        eyebrow={HERO_COPY.waterQuality.eyebrow}
        headline={HERO_COPY.waterQuality.headline}
        sub={HERO_COPY.waterQuality.sub}
        height={130}
      />

      <div className="grid flex-none grid-cols-2 gap-2 md:grid-cols-4">
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

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-12">
        <SectionCard
          title="Key Indicators"
          description="Compliance and trend by indicator"
          className="min-h-0 lg:col-span-7"
          padded={false}
          bodyClassName="p-0 min-h-0"
        >
          <div className="scrollbar-clean h-full min-h-0 overflow-auto">
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
                    <td className="w-[140px]">
                      <Sparkline data={i.trend} stroke={i.trendColor} height={22} />
                    </td>
                    <td className="text-right font-semibold text-deepNavy">{i.compliance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard
          title="Quality Trends"
          description="7-day trends"
          className="min-h-0 lg:col-span-5"
          bodyClassName="p-3 min-h-0"
        >
          <div className="grid h-full min-h-0 grid-cols-2 gap-2">
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

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-12">
        <SectionCard
          title="Treatment Plants Overview"
          className="min-h-0 lg:col-span-7"
          padded={false}
          bodyClassName="p-0 min-h-0"
        >
          <div className="scrollbar-clean h-full min-h-0 overflow-auto">
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
                    <td className="text-[12px] text-ink-secondary">{p.review}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard
          title="Operator Review Checklist"
          className="min-h-0 lg:col-span-5"
          bodyClassName="p-3 min-h-0"
        >
          <ul className="scrollbar-clean h-full min-h-0 space-y-1.5 overflow-auto pr-1">
            {QUALITY_CHECKLIST.map((c) => (
              <li
                key={c}
                className="flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-2 text-[12px] text-ink-secondary"
              >
                <span className="flex h-4 w-4 flex-none items-center justify-center rounded-full border border-greenDark/40 bg-surface-green text-greenDark">
                  <Check className="h-2.5 w-2.5" />
                </span>
                {c}
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
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
    <div className="flex min-h-0 flex-col overflow-hidden rounded-md border border-border bg-surface px-2.5 py-2">
      <div className="text-[10.5px] text-ink-muted">{label}</div>
      <div className="text-[14px] font-semibold text-deepNavy">{latest.toFixed(2)}</div>
      <div className="mt-auto min-h-0 flex-1">
        <Sparkline data={data} stroke={color} height={24} />
      </div>
    </div>
  );
}
