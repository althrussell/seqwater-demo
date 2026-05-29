import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Section from "@/components/Section";
import RiskBadge from "@/components/RiskBadge";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Beaker, Droplets, Sparkles } from "lucide-react";

export default function WaterQuality() {
  const { data, isLoading } = useQuery({
    queryKey: ["water-quality"],
    queryFn: api.waterQuality,
  });

  if (isLoading || !data) {
    return <div className="h-72 animate-pulse rounded-2xl bg-white/[0.03]" />;
  }

  const turbidity = data.turbidity_trend ?? [];
  const samples = data.samples ?? [];
  const plants = (data.plant_operations ?? []) as any[];
  const events = (data.turbidity_events ?? []) as any[];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat
          label="Synthetic elevated alerts"
          value={String(data.elevated_count)}
          band={data.elevated_count > 5 ? "Elevated" : "Watch"}
        />
        <Stat
          label="Synthetic watch alerts"
          value={String(data.watch_count)}
          band="Watch"
        />
        <Stat
          label="Active synthetic turbidity events"
          value={String(events.filter((e: any) => e.status === "Active").length)}
          band="Watch"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Section
          title="Synthetic turbidity trend"
          description="14-day mean across treatment plants (NTU)"
          className="lg:col-span-2"
        >
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={turbidity}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="x" stroke="#A8A29E" fontSize={11} />
                <YAxis stroke="#A8A29E" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "#15161A",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [v.toFixed(2), "NTU"]}
                />
                <Line dataKey="y" stroke="#FFC04D" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section
          title="Synthetic AI explanation"
          description="Likely drivers · for executive context only"
        >
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-sm leading-relaxed text-ink-100">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-300" />
              <span className="text-[10px] uppercase tracking-wider text-ink-300">
                Synthetic AquaIQ narrative
              </span>
            </div>
            <p>
              Synthetic turbidity at North Pine and Landers Shute treatment plants is
              elevated. This is correlated with synthetic forecast rainfall in the
              Brisbane North and Sunshine Coast catchments. AquaIQ recommends a
              synthetic operational review of analyser calibration and treatment
              setpoints, validated by water quality leads.
            </p>
            <ul className="mt-3 space-y-1.5 text-xs text-ink-200">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-amberop-400" />
                Synthetic turbidity events: {events.length} (synthetic)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-water-400" />
                Synthetic samples reviewed: {samples.length}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-catchment-400" />
                Conservative wording — no public health advice provided.
              </li>
            </ul>
          </div>
        </Section>
      </div>

      <Section title="Synthetic operational review checklist">
        <ol className="grid gap-2 sm:grid-cols-2 text-sm text-ink-100">
          {[
            "Confirm synthetic online analyser calibration status.",
            "Review synthetic inlet raw water quality from upstream catchment.",
            "Verify synthetic coagulation, flocculation, and filtration setpoints.",
            "Check synthetic disinfection contact time and residual.",
            "Sample synthetic downstream zones for confirmation.",
            "Document the synthetic review and decisions taken.",
          ].map((step, i) => (
            <li key={i} className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
              <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded bg-white/[0.06] text-[11px] font-semibold text-ink-100">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-[11px] leading-relaxed text-ink-300">
          Conservative wording. No public health advice or regulatory thresholds are
          provided by this synthetic demo.
        </p>
      </Section>

      <div className="grid gap-3 lg:grid-cols-2">
        <Section
          title="Synthetic treatment plant operations"
          description={`${plants.length} synthetic plants`}
        >
          <ul className="space-y-2">
            {plants.map((p) => (
              <li
                key={p.asset_id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="text-sm text-ink-50">{p.asset_name}</div>
                  <div className="text-[11px] text-ink-300">
                    {p.region} · {p.operating_state}
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-semibold text-ink-50">{p.utilisation_pct}% utilisation</div>
                  <div className="text-ink-300">{p.current_throughput_ml_day} / {p.design_capacity_ml_day} ML/day</div>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          title="Synthetic sample log"
          description="Latest 30 synthetic samples"
        >
          <div className="scrollbar-clean max-h-[420px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-ink-900/80 backdrop-blur">
                <tr className="text-[10px] uppercase tracking-wider text-ink-300">
                  <th className="px-2 py-2">Asset</th>
                  <th className="px-2 py-2">NTU</th>
                  <th className="px-2 py-2">pH</th>
                  <th className="px-2 py-2">Cl mg/L</th>
                  <th className="px-2 py-2">Alert</th>
                </tr>
              </thead>
              <tbody>
                {samples.slice(0, 30).map((s) => (
                  <tr key={s.sample_id} className="table-row">
                    <td className="px-2 py-1.5 text-ink-100">
                      <div>{s.asset_name}</div>
                      <div className="text-[10px] text-ink-300">{new Date(s.sampled_at).toLocaleString()}</div>
                    </td>
                    <td className="px-2 py-1.5 text-ink-200 font-mono">{s.turbidity_NTU.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-ink-200 font-mono">{s.pH.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-ink-200 font-mono">{s.chlorine_residual_mg_L.toFixed(2)}</td>
                    <td className="px-2 py-1.5"><RiskBadge band={s.alert_level} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Stat({ label, value, band }: { label: string; value: string; band: string }) {
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wider text-ink-300">{label}</div>
        <div className="flex items-center gap-2">
          {label.includes("turbidity") ? <Beaker className="h-3.5 w-3.5 text-amberop-400" /> : <Droplets className="h-3.5 w-3.5 text-water-300" />}
          <RiskBadge band={band} />
        </div>
      </div>
      <div className="mt-1 text-2xl font-semibold text-ink-50">{value}</div>
    </div>
  );
}
