import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  KeyRound,
  Pin,
  ScrollText,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import SectionCard from "@/components/ui/SectionCard";
import GovernanceFlow from "@/components/ui/GovernanceFlow";
import HeroBanner from "@/components/ui/HeroBanner";
import { useToast } from "@/components/ui/Toast";
import {
  GOVERNANCE_COLUMNS,
  HERO_COPY,
  HERO_IMAGES,
  MODEL_SERVING_CARDS,
  PROOF_POINTS,
} from "@/lib/demoContent";

export default function GovernancePlatform() {
  const { toast } = useToast();
  return (
    <div className="space-y-6">
      <HeroBanner
        image={HERO_IMAGES.governance}
        eyebrow={HERO_COPY.governance.eyebrow}
        headline={HERO_COPY.governance.headline}
        sub={HERO_COPY.governance.sub}
        height={220}
      />
      <div className="flex justify-end">
        <DatabricksMark />
      </div>

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
          <button
            onClick={() =>
              toast({
                title: "Governance one-pager",
                description:
                  "Synthetic — printable governance summary would download here.",
              })
            }
            className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-white/85 hover:text-white"
          >
            Download governance one-pager <ArrowRight className="h-3.5 w-3.5" />
          </button>
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
  const steps: { label: string; icon: LucideIcon }[] = [
    { label: "AI Output", icon: Sparkles },
    { label: "Analyst Review", icon: Search },
    { label: "Validation", icon: CheckCircle2 },
    { label: "Decision & Action", icon: Pin },
    { label: "Audit & Learning", icon: BookOpen },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((s, i) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-[12.5px] font-medium text-deepNavy">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-blue text-primaryBlue">
                <Icon className="h-3.5 w-3.5" />
              </span>
              {s.label}
            </div>
            {i < steps.length - 1 ? (
              <ArrowRight className="h-3.5 w-3.5 text-ink-muted" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
