import AquaIQChat from "@/components/AquaIQChat";
import Section from "@/components/Section";
import { ShieldCheck, Sparkles } from "lucide-react";

export default function AquaIQAssistant() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr,360px]">
      <Section
        title="AquaIQ — synthetic governed assistant"
        description="Streaming-style answers · Source citations · Confidence and assumptions · Trace ID per answer"
        bodyClassName="p-4"
      >
        <AquaIQChat />
      </Section>

      <aside className="space-y-3">
        <div className="panel p-4">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-brand-300" />
            <span className="text-[10px] uppercase tracking-wider text-ink-300">
              How AquaIQ answers
            </span>
          </div>
          <ol className="space-y-1.5 text-xs text-ink-200">
            <li>1. Routes to synthetic tools (overview, risk, quality, scenarios, capital).</li>
            <li>2. Retrieves chunks from synthetic Markdown corpus stored in a Volume.</li>
            <li>3. Optionally calls the configured Foundation Model API endpoint.</li>
            <li>4. Always returns the same six-section structure.</li>
            <li>5. Logs an MLflow-style trace for every interaction.</li>
          </ol>
        </div>

        <div className="panel p-4">
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-catchment-400" />
            <span className="text-[10px] uppercase tracking-wider text-ink-300">
              Guardrails
            </span>
          </div>
          <ul className="space-y-1.5 text-xs text-ink-200">
            <li>· Refuses operational authorisation requests.</li>
            <li>· Never claims synthetic data is real.</li>
            <li>· Never invents regulatory thresholds.</li>
            <li>· Always requires human validation.</li>
            <li>· Always cites synthetic sources.</li>
          </ul>
        </div>

        <div className="panel p-4">
          <div className="mb-2 text-[10px] uppercase tracking-wider text-ink-300">
            Tool palette
          </div>
          <ul className="grid gap-1.5 text-xs text-ink-200">
            <li className="rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1.5">
              <span className="font-mono text-ink-100">get_overview</span>
              <span className="ml-2 text-ink-300">— synthetic command-centre summary</span>
            </li>
            <li className="rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1.5">
              <span className="font-mono text-ink-100">get_top_asset_risks</span>
              <span className="ml-2 text-ink-300">— ranked synthetic asset risks</span>
            </li>
            <li className="rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1.5">
              <span className="font-mono text-ink-100">get_water_security_summary</span>
              <span className="ml-2 text-ink-300">— synthetic security KPIs</span>
            </li>
            <li className="rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1.5">
              <span className="font-mono text-ink-100">get_water_quality_alerts</span>
              <span className="ml-2 text-ink-300">— synthetic quality alerts</span>
            </li>
            <li className="rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1.5">
              <span className="font-mono text-ink-100">run_flood_readiness_scenario</span>
              <span className="ml-2 text-ink-300">— synthetic scenario detail</span>
            </li>
            <li className="rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1.5">
              <span className="font-mono text-ink-100">get_capital_priorities</span>
              <span className="ml-2 text-ink-300">— synthetic capital options</span>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
