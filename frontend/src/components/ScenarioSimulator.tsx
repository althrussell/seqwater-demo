import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  AlertTriangle,
  Beaker,
  CloudRain,
  Loader2,
  Mail,
  Play,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/lib/api";
import type { ScenarioRunResult } from "@/lib/types";
import { cn } from "@/lib/utils";
import RiskBadge from "./RiskBadge";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PRESET_NAME = "Severe Coastal Rainfall — 72 Hour Watch";

export default function ScenarioSimulator() {
  const [inputs, setInputs] = useState({
    scenario_name: PRESET_NAME,
    rainfall_forecast_mm_24h: 95,
    rainfall_forecast_mm_72h: 280,
    catchment_saturation_index: 0.82,
    current_storage_percent: 78.5,
    treatment_demand_ml_day: 1280,
    downstream_sensitivity: 0.65,
  });
  const [result, setResult] = useState<ScenarioRunResult | null>(null);

  const run = useMutation({
    mutationFn: async () => api.runScenario(inputs),
    onSuccess: setResult,
  });

  const update = (key: keyof typeof inputs, value: number | string) =>
    setInputs((s) => ({ ...s, [key]: value as never }));

  return (
    <div className="grid gap-4 lg:grid-cols-[420px,1fr]">
      <section className="panel-elevated">
        <header className="flex items-center justify-between gap-2 border-b border-white/5 px-5 py-3">
          <div className="flex items-center gap-2">
            <CloudRain className="h-4 w-4 text-water-300" />
            <h3 className="text-sm font-semibold text-ink-50">Scenario inputs</h3>
          </div>
          <span className="pill bg-amberop-500/15 text-amberop-100 border-amberop-500/30">
            Synthetic
          </span>
        </header>
        <div className="space-y-4 px-5 py-4">
          <Field label="Scenario name">
            <input
              className="input"
              value={inputs.scenario_name}
              onChange={(e) => update("scenario_name", e.target.value)}
            />
          </Field>
          <Slider
            label="24h rainfall forecast (mm)"
            min={0}
            max={250}
            step={5}
            value={inputs.rainfall_forecast_mm_24h}
            onChange={(v) => update("rainfall_forecast_mm_24h", v)}
            display={(v) => `${v} mm`}
          />
          <Slider
            label="72h rainfall forecast (mm)"
            min={0}
            max={500}
            step={10}
            value={inputs.rainfall_forecast_mm_72h}
            onChange={(v) => update("rainfall_forecast_mm_72h", v)}
            display={(v) => `${v} mm`}
          />
          <Slider
            label="Catchment saturation index"
            min={0}
            max={1}
            step={0.01}
            value={inputs.catchment_saturation_index}
            onChange={(v) => update("catchment_saturation_index", v)}
            display={(v) => v.toFixed(2)}
          />
          <Slider
            label="Starting dam storage %"
            min={20}
            max={99}
            step={0.5}
            value={inputs.current_storage_percent}
            onChange={(v) => update("current_storage_percent", v)}
            display={(v) => `${v.toFixed(1)}%`}
          />
          <Slider
            label="Treatment demand (ML/day)"
            min={800}
            max={1800}
            step={10}
            value={inputs.treatment_demand_ml_day}
            onChange={(v) => update("treatment_demand_ml_day", v)}
            display={(v) => `${Math.round(v)} ML/d`}
          />
          <Slider
            label="Downstream sensitivity"
            min={0}
            max={1}
            step={0.05}
            value={inputs.downstream_sensitivity}
            onChange={(v) => update("downstream_sensitivity", v)}
            display={(v) => v.toFixed(2)}
          />

          <button
            onClick={() => run.mutate()}
            disabled={run.isPending}
            className="btn-primary w-full"
          >
            {run.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Run synthetic scenario
          </button>
          <p className="text-[11px] leading-relaxed text-ink-300">
            Synthetic scenario only. Not for operational flood-release decisioning.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="panel-elevated">
          <header className="flex items-center justify-between gap-2 border-b border-white/5 px-5 py-3">
            <div className="flex items-center gap-2">
              <Beaker className="h-4 w-4 text-aqua-300" />
              <h3 className="text-sm font-semibold text-ink-50">
                Synthetic scenario outputs
              </h3>
            </div>
            {result ? (
              <RiskBadge band={result.risk_classification} size="md" />
            ) : (
              <span className="text-[11px] text-ink-300">Run a scenario to see outputs</span>
            )}
          </header>

          {!result ? (
            <div className="grid place-items-center px-6 py-16 text-center text-sm text-ink-300">
              <CloudRain className="mb-3 h-8 w-8 text-ink-300" />
              <div>Adjust the synthetic inputs and run the scenario.</div>
            </div>
          ) : (
            <div className="space-y-4 p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <Stat
                  label="Projected storage"
                  value={`${result.projected_storage_percent.toFixed(1)}%`}
                />
                <Stat
                  label="Risk classification"
                  value={result.risk_classification}
                />
                <Stat
                  label="Water quality risk"
                  value={result.water_quality_risk}
                  small
                />
              </div>

              <div className="panel p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-ink-300">
                    Synthetic 72-hour storage trajectory
                  </span>
                  <span className="text-[11px] text-ink-300">
                    {result.storage_trajectory.length} points
                  </span>
                </div>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={result.storage_trajectory}>
                      <defs>
                        <linearGradient id="trajfill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#3FA1F2" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#3FA1F2" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis
                        dataKey="hour"
                        stroke="#A8A29E"
                        fontSize={11}
                        tickFormatter={(h) => `${h}h`}
                      />
                      <YAxis
                        stroke="#A8A29E"
                        fontSize={11}
                        tickFormatter={(v) => `${v}%`}
                        domain={[
                          (min: number) => Math.max(20, Math.floor(min - 2)),
                          (max: number) => Math.min(100, Math.ceil(max + 2)),
                        ]}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#15161A",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        labelFormatter={(h) => `Hour ${h}`}
                        formatter={(v: number) => [`${v}%`, "Storage"]}
                      />
                      <Area
                        dataKey="projected_storage_percent"
                        type="monotone"
                        stroke="#3FA1F2"
                        strokeWidth={2}
                        fill="url(#trajfill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="panel p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-catchment-400" />
                    <span className="text-[10px] uppercase tracking-wider text-ink-300">
                      Synthetic recommended actions
                    </span>
                  </div>
                  <ol className="space-y-1.5 text-xs text-ink-200">
                    {result.recommended_actions.map((a, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-0.5 inline-flex h-4 w-4 flex-none items-center justify-center rounded bg-white/[0.05] text-[10px] font-semibold text-ink-100">
                          {i + 1}
                        </span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="panel p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-water-300" />
                    <span className="text-[10px] uppercase tracking-wider text-ink-300">
                      Communications checklist (synthetic)
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-ink-200">
                    {result.communications_checklist.map((c, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-water-300" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="panel p-4">
                <div className="mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amberop-400" />
                  <span className="text-[10px] uppercase tracking-wider text-ink-300">
                    Synthetic assets affected
                  </span>
                </div>
                <ul className="grid gap-1.5 sm:grid-cols-2 text-xs text-ink-200">
                  {result.assets_affected.map((a) => (
                    <li
                      key={a}
                      className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5"
                    >
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-ink-300">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
  display,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  display?: (v: number) => string;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-brand-500"
        />
        <span className="w-20 text-right font-mono text-xs text-ink-100">
          {display ? display(value) : value.toFixed(2)}
        </span>
      </div>
    </Field>
  );
}

function Stat({
  label,
  value,
  small,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
      <div className="text-[10px] uppercase tracking-wider text-ink-300">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-semibold text-ink-50",
          small ? "text-sm" : "text-lg",
        )}
      >
        {value}
      </div>
    </div>
  );
}
