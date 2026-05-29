import { ArrowRight, ShieldCheck, ScrollText, KeyRound, Award } from "lucide-react";
import { motion } from "framer-motion";
import SectionCard from "@/components/ui/SectionCard";
import GovernanceFlow from "@/components/ui/GovernanceFlow";
import {
  GOVERNANCE_COLUMNS,
  MODEL_SERVING_CARDS,
  PROOF_POINTS,
} from "@/lib/demoContent";

export default function GovernancePlatform() {
  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-3xl">
            <div className="text-[11px] uppercase tracking-[0.18em] text-databricks-red">
              Governance & Platform
            </div>
            <h2 className="mt-1 text-[24px] font-semibold leading-snug text-deepNavy">
              Trusted Data. Governed AI. Better Decisions.
            </h2>
            <p className="mt-1.5 text-[13.5px] text-ink-secondary">
              The Water for Life Intelligence Centre runs on Databricks. Unity Catalog
              governs every dataset, Lakeflow pipelines keep them current, Foundation Model
              API powers AquaIQ, and every recommendation is auditable end-to-end.
            </p>
          </div>
          <DatabricksMark />
        </div>
      </header>

      <SectionCard title="Architecture Flow" description="Source to insight">
        <GovernanceFlow columns={GOVERNANCE_COLUMNS} highlightColumn="Unity Catalog Governance" />
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Model Serving & Orchestration">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {MODEL_SERVING_CARDS.map((c) => (
              <motion.div
                key={c.title}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.18 }}
                className="rounded-md border border-border bg-surface px-3.5 py-3.5 transition hover:border-databricks-red/40"
              >
                <div className="text-[13.5px] font-semibold text-deepNavy">{c.title}</div>
                <div className="mt-1 text-[12.5px] text-ink-secondary">{c.description}</div>
              </motion.div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Human-in-the-Loop Assurance">
          <HumanLoopFlow />
          <p className="mt-3 text-[12.5px] text-ink-muted">
            Every AquaIQ output is paired with named analyst review, validation status, and a
            stored audit trail. AI accelerates decisions — humans authorise them.
          </p>
        </SectionCard>
      </div>

      <footer className="rounded-xl bg-deepNavy px-5 py-4 text-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.18em] text-white/70">
            <ShieldCheck className="h-3.5 w-3.5" /> Platform proof points
          </div>
          <a
            href="#"
            className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-white/85 hover:text-white"
          >
            Download governance one-pager <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {PROOF_POINTS.map((p, idx) => (
            <div
              key={p.title}
              className="rounded-md bg-white/5 px-3 py-3 backdrop-blur"
            >
              <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider">
                <ProofIcon idx={idx} />
                {p.title}
              </div>
              <div className="mt-1 text-[12px] text-white/75">{p.description}</div>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}

function DatabricksMark() {
  return (
    <div className="flex items-center gap-2 rounded-md border border-databricks-red/30 bg-[#FFF1EE] px-3 py-2 text-[12px] font-semibold text-databricks-red">
      <svg
        width="22"
        height="22"
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path d="M16 4 L28 11 L16 18 L4 11 Z" fill="#FF3621" />
        <path d="M16 14 L28 21 L16 28 L4 21 Z" fill="#FF8A00" />
      </svg>
      Powered by Databricks
    </div>
  );
}

function ProofIcon({ idx }: { idx: number }) {
  const icons = [ShieldCheck, KeyRound, ScrollText, Award];
  const Icon = icons[idx % icons.length];
  return <Icon className="h-3.5 w-3.5 text-databricks-orange" />;
}

function HumanLoopFlow() {
  const steps = [
    { label: "AI Output", icon: "✨" },
    { label: "Analyst Review", icon: "🔍" },
    { label: "Validation", icon: "✅" },
    { label: "Decision & Action", icon: "📌" },
    { label: "Audit & Learning", icon: "📚" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-[12.5px] font-medium text-deepNavy">
            <span className="text-[14px]">{s.icon}</span>
            {s.label}
          </div>
          {i < steps.length - 1 ? <ArrowRight className="h-3.5 w-3.5 text-ink-muted" /> : null}
        </div>
      ))}
    </div>
  );
}
