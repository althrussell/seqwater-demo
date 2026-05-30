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
    <div className="flex h-[var(--page-h)] min-h-0 flex-col gap-2">
      <HeroBanner
        image={HERO_IMAGES.governance}
        eyebrow={HERO_COPY.governance.eyebrow}
        headline={HERO_COPY.governance.headline}
        sub={HERO_COPY.governance.sub}
        height={120}
      />

      <SectionCard
        title="Architecture Flow"
        description="Source to insight"
        className="min-h-0 flex-1"
        bodyClassName="p-3 min-h-0"
      >
        <GovernanceFlow columns={GOVERNANCE_COLUMNS} highlightColumn="Unity Catalog Governance" />
      </SectionCard>

      <div className="grid min-h-0 flex-none grid-cols-1 gap-2 lg:grid-cols-2">
        <SectionCard title="Model Serving & Orchestration" bodyClassName="p-3">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {MODEL_SERVING_CARDS.map((c) => (
              <motion.div
                key={c.title}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.18 }}
                className="rounded-md border border-border bg-surface px-2.5 py-2 transition hover:border-databricks-red/40"
              >
                <div className="text-[12px] font-semibold text-deepNavy">{c.title}</div>
                <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-ink-secondary">
                  {c.description}
                </div>
              </motion.div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Human-in-the-Loop Assurance" bodyClassName="p-3">
          <HumanLoopFlow />
          <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-ink-muted">
            Every AquaIQ output is paired with named analyst review, validation status, and a
            stored audit trail. AI accelerates decisions — humans authorise them.
          </p>
        </SectionCard>
      </div>

      <footer className="flex-none rounded-xl bg-deepNavy px-3 py-2.5 text-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-white/70">
            <ShieldCheck className="h-3 w-3" /> Platform proof points
          </div>
          <button
            onClick={() =>
              toast({
                title: "Governance one-pager",
                description:
                  "printable governance summary would download here.",
              })
            }
            className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-white/85 hover:text-white"
          >
            Download one-pager <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
          {PROOF_POINTS.map((p, idx) => (
            <div
              key={p.title}
              className="rounded-md bg-white/5 px-2.5 py-1.5 backdrop-blur"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider">
                <ProofIcon idx={idx} />
                {p.title}
              </div>
              <div className="mt-0.5 line-clamp-1 text-[10.5px] text-white/75">{p.description}</div>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}

function ProofIcon({ idx }: { idx: number }) {
  const icons = [ShieldCheck, KeyRound, ScrollText, Award];
  const Icon = icons[idx % icons.length];
  return <Icon className="h-3 w-3 text-databricks-orange" />;
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
    <div className="flex flex-wrap items-center gap-1.5">
      {steps.map((s, i) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-[11.5px] font-medium text-deepNavy">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-blue text-primaryBlue">
                <Icon className="h-3 w-3" />
              </span>
              {s.label}
            </div>
            {i < steps.length - 1 ? (
              <ArrowRight className="h-3 w-3 text-ink-muted" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
