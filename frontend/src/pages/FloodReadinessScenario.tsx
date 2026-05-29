import { useState } from "react";
import { AlertTriangle, ChevronRight, Layers, List, MapPin } from "lucide-react";
import HeroBanner from "@/components/ui/HeroBanner";
import SectionCard from "@/components/ui/SectionCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import {
  CATCHMENT_IMPACTS,
  EXECUTIVE_ACTIONS,
  FLOOD_DISCLAIMER,
  FLOOD_SCENARIO_DEFAULTS,
  HERO_IMAGES,
  SCENARIO_ANTECEDENT_OPTIONS,
  SCENARIO_DURATION_OPTIONS,
  SCENARIO_RAINFALL_OPTIONS,
  SCENARIO_SEA_LEVEL_OPTIONS,
  SCENARIO_STORM_OPTIONS,
} from "@/lib/demoContent";

const IMPACT_COLOR: Record<string, string> = {
  low: "#5FA777",
  medium: "#0076BE",
  high: "#D88A00",
};

export default function FloodReadinessScenario() {
  const [view, setView] = useState<"map" | "list">("map");
  const [scenario, setScenario] = useState({ ...FLOOD_SCENARIO_DEFAULTS });
  const { toast } = useToast();

  return (
    <div className="space-y-5">
      <HeroBanner
        image={HERO_IMAGES.floodReadiness}
        eyebrow="Flood Readiness & Scenario Briefing"
        headline={"Prepared today.\nSafer tomorrow."}
        sub="Synthetic scenario planning for executive briefing. Not for operational decisioning."
        height={240}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <SectionCard
          title="Scenario Assumptions"
          description="Configure the synthetic planning scenario"
          className="lg:col-span-5"
        >
          <div className="space-y-3">
            <ScenarioSelect
              label="Rainfall Scenario"
              value={scenario.rainfallScenario}
              onChange={(v) => setScenario((s) => ({ ...s, rainfallScenario: v }))}
              options={SCENARIO_RAINFALL_OPTIONS}
            />
            <ScenarioSelect
              label="Duration"
              value={scenario.duration}
              onChange={(v) => setScenario((s) => ({ ...s, duration: v }))}
              options={SCENARIO_DURATION_OPTIONS}
            />
            <ScenarioSelect
              label="Antecedent Conditions"
              value={scenario.antecedent}
              onChange={(v) => setScenario((s) => ({ ...s, antecedent: v }))}
              options={SCENARIO_ANTECEDENT_OPTIONS}
            />
            <ScenarioSelect
              label="Sea Level Condition"
              value={scenario.seaLevel}
              onChange={(v) => setScenario((s) => ({ ...s, seaLevel: v }))}
              options={SCENARIO_SEA_LEVEL_OPTIONS}
            />
            <ScenarioSelect
              label="Storm Movement"
              value={scenario.stormMovement}
              onChange={(v) => setScenario((s) => ({ ...s, stormMovement: v }))}
              options={SCENARIO_STORM_OPTIONS}
            />
            <button
              onClick={() =>
                toast({
                  title: "Synthetic scenario updated",
                  description: "Affected catchments and actions refreshed.",
                })
              }
              className="btn-primary w-full"
            >
              Apply synthetic scenario
            </button>
          </div>
        </SectionCard>

        <SectionCard
          title="Affected Catchments"
          description="Synthetic spatial projection"
          className="lg:col-span-7"
          padded={false}
          actions={
            <div className="flex items-center rounded-md border border-border bg-surface text-[12px]">
              <button
                onClick={() => setView("map")}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2.5 py-1",
                  view === "map" ? "bg-surface-blue text-primaryBlue" : "text-ink-muted",
                )}
              >
                <MapPin className="h-3 w-3" /> Map
              </button>
              <button
                onClick={() => setView("list")}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2.5 py-1",
                  view === "list" ? "bg-surface-blue text-primaryBlue" : "text-ink-muted",
                )}
              >
                <List className="h-3 w-3" /> List
              </button>
            </div>
          }
        >
          {view === "map" ? <SyntheticCatchmentMap /> : <CatchmentList />}
        </SectionCard>
      </div>

      <SectionCard
        title="Catchment Impact Summary"
        description="Synthetic projected peak levels and confidence"
        padded={false}
      >
        <table className="table-clean">
          <thead>
            <tr>
              <th>Catchment</th>
              <th>Impact level</th>
              <th>Peak level (synthetic)</th>
              <th>Confidence</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {CATCHMENT_IMPACTS.map((c) => (
              <tr key={c.catchment}>
                <td className="font-semibold text-deepNavy">{c.catchment}</td>
                <td>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize"
                    style={{
                      background: IMPACT_COLOR[c.impact] + "20",
                      color: IMPACT_COLOR[c.impact],
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: IMPACT_COLOR[c.impact] }}
                    />
                    {c.impact}
                  </span>
                </td>
                <td>{c.peakLevel}</td>
                <td>
                  <span className="pill-blue">{c.confidence}</span>
                </td>
                <td className="text-right">
                  <ChevronRight className="ml-auto h-4 w-4 text-ink-muted" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>

      <SectionCard title="Executive Actions" description="Synthetic action cards for executive review">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          {EXECUTIVE_ACTIONS.map((a) => (
            <button
              key={a.title}
              onClick={() =>
                toast({
                  title: `${a.title} queued`,
                  description: "Synthetic action recorded for briefing.",
                })
              }
              className="group flex flex-col items-start gap-2 rounded-md border border-border bg-surface p-3.5 text-left transition hover:border-primaryBlue/30 hover:shadow-card"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-blue text-primaryBlue">
                <a.icon className="h-4 w-4" />
              </span>
              <div className="text-[13.5px] font-semibold text-deepNavy">{a.title}</div>
              <div className="text-[12px] text-ink-muted">{a.description}</div>
              <span className="mt-auto inline-flex items-center gap-1 text-[12px] font-semibold text-primaryBlue group-hover:text-deepBlue">
                Queue action <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </button>
          ))}
        </div>
      </SectionCard>

      <div className="flex items-start gap-3 rounded-md border border-status-watch/30 bg-[#FFF4E0] px-4 py-3 text-[13px] text-status-watch">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
        <div>
          <div className="font-semibold">Planning view only</div>
          <p className="mt-0.5 text-[12.5px] text-ink-secondary">{FLOOD_DISCLAIMER}</p>
        </div>
      </div>
    </div>
  );
}

function ScenarioSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <div className="mb-1 text-[11.5px] font-semibold uppercase tracking-wider text-ink-muted">
        {label}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function SyntheticCatchmentMap() {
  return (
    <div className="relative h-[300px] overflow-hidden">
      <svg viewBox="0 0 600 320" className="h-full w-full">
        <defs>
          <linearGradient id="ocean2" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor="#D8F0FB" />
            <stop offset="100%" stopColor="#EAF6FC" />
          </linearGradient>
        </defs>
        <rect width="600" height="320" fill="#F5FAFD" />
        <path d="M560 0 Q 540 120 555 240 Q 570 290 580 320 L 600 320 L 600 0 Z" fill="url(#ocean2)" />
        <CatchmentBlob d="M80 60 Q 180 30 280 60 Q 320 120 280 180 Q 200 200 120 180 Z" fill="#D88A00" alpha={0.55} label="Lockyer Valley" lx={170} ly={130} />
        <CatchmentBlob d="M250 80 Q 350 60 420 100 Q 430 170 360 200 Q 290 200 250 160 Z" fill="#D88A00" alpha={0.45} label="Bremer River" lx={335} ly={150} />
        <CatchmentBlob d="M380 110 Q 480 90 530 150 Q 510 220 440 240 Q 380 220 370 170 Z" fill="#0076BE" alpha={0.4} label="Brisbane River" lx={450} ly={180} />
        <CatchmentBlob d="M200 220 Q 320 220 380 260 Q 320 300 230 290 Z" fill="#0076BE" alpha={0.35} label="Logan River" lx={300} ly={265} />
        <CatchmentBlob d="M420 250 Q 510 250 560 280 Q 530 305 460 305 Q 410 290 410 270 Z" fill="#5FA777" alpha={0.35} label="Gold Coast Creeks" lx={485} ly={280} />
      </svg>
      <div className="absolute bottom-3 left-3 rounded-md border border-border bg-surface/95 p-2 text-[11px] text-ink-secondary shadow-card backdrop-blur">
        <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-deepNavy">
          Impact level
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#5FA777]" /> Low
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#0076BE]" /> Medium
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#D88A00]" /> High
          </span>
        </div>
      </div>
      <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md border border-border bg-surface/90 px-2 py-1 text-[11px] text-ink-muted shadow-card backdrop-blur">
        <Layers className="h-3 w-3 text-primaryBlue" /> Synthetic projection
      </div>
    </div>
  );
}

function CatchmentBlob({
  d,
  fill,
  alpha,
  label,
  lx,
  ly,
}: {
  d: string;
  fill: string;
  alpha: number;
  label: string;
  lx: number;
  ly: number;
}) {
  return (
    <g>
      <path d={d} fill={fill} fillOpacity={alpha} stroke={fill} strokeOpacity={0.7} strokeWidth={1.2} />
      <text x={lx} y={ly} fontSize={11} fontWeight={600} fill="#0A2E4D" textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

function CatchmentList() {
  return (
    <div className="p-4">
      <ul className="space-y-2">
        {CATCHMENT_IMPACTS.map((c) => (
          <li
            key={c.catchment}
            className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2.5"
          >
            <div className="flex items-center gap-3">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: IMPACT_COLOR[c.impact] }}
              />
              <div>
                <div className="text-[13px] font-semibold text-deepNavy">{c.catchment}</div>
                <div className="text-[11px] text-ink-muted">
                  Peak {c.peakLevel} · {c.confidence} confidence
                </div>
              </div>
            </div>
            <StatusBadge
              status={c.impact === "high" ? "watch" : c.impact === "medium" ? "monitor" : "normal"}
              label={c.impact}
              size="sm"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

