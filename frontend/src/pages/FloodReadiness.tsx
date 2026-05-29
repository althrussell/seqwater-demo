import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Section from "@/components/Section";
import RiskBadge from "@/components/RiskBadge";
import ScenarioSimulator from "@/components/ScenarioSimulator";
import { CloudRain, ShieldAlert } from "lucide-react";
import type { FloodScenario } from "@/lib/types";

export default function FloodReadiness() {
  const scenarios = useQuery({ queryKey: ["flood-scenarios"], queryFn: api.floodScenarios });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amberop-400/30 bg-amberop-400/[0.06] p-4 text-sm text-amberop-100">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <div className="font-semibold">Synthetic scenario only</div>
            <p className="mt-0.5 text-xs leading-relaxed">
              This page demonstrates how Databricks can support flood readiness analytics.
              It is <span className="font-semibold">not</span> an operational
              flood-release model and must not be used for any operational decision.
              Real flood operations are governed by approved Seqwater procedures and
              licensed operators.
            </p>
          </div>
        </div>
      </div>

      <Section
        title="Synthetic flood scenario register"
        description="Preloaded synthetic scenarios — `main.seqwater_demo.flood_scenarios`"
      >
        <div className="grid gap-3 lg:grid-cols-2">
          {(scenarios.data ?? []).map((s) => (
            <ScenarioCard key={s.scenario_id} scenario={s} />
          ))}
        </div>
      </Section>

      <Section
        title='Synthetic scenario simulator'
        description='Preloaded with "Severe Coastal Rainfall — 72 Hour Watch" inputs.'
      >
        <ScenarioSimulator />
      </Section>
    </div>
  );
}

function ScenarioCard({ scenario }: { scenario: FloodScenario }) {
  const isActive = scenario.status === "Active demo scenario";
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition hover:border-water-400/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-ink-300">
            {scenario.scenario_id} · {scenario.status}
          </div>
          <h3 className="mt-1 text-base font-semibold text-ink-50">
            {scenario.scenario_name}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {scenario.release_required ? (
            <RiskBadge band="Coordinate" />
          ) : (
            <RiskBadge band="Watch" />
          )}
          {isActive ? (
            <span className="pill bg-brand-500/20 text-brand-100 border-brand-500/40">Active</span>
          ) : null}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <Mini label="24h forecast" value={`${scenario.rainfall_forecast_mm_24h} mm`} icon={<CloudRain className="h-3 w-3" />} />
        <Mini label="72h forecast" value={`${scenario.rainfall_forecast_mm_72h} mm`} icon={<CloudRain className="h-3 w-3" />} />
        <Mini label="Saturation" value={scenario.catchment_saturation_index.toFixed(2)} />
        <Mini label="Storage now → projected" value={`${scenario.current_storage_percent}% → ${scenario.projected_storage_percent}%`} />
        <Mini label="Downstream impact" value={scenario.downstream_impact_score.toFixed(2)} />
        <Mini label="Owner" value={scenario.action_owner} />
      </div>
      <p className="mt-3 rounded-xl border border-white/5 bg-white/[0.03] p-3 text-xs leading-relaxed text-ink-200">
        {scenario.recommended_actions}
      </p>
    </div>
  );
}

function Mini({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink-300">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold text-ink-50">{value}</div>
    </div>
  );
}
