import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CircleDot,
  FileText,
  History,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  UserCircle2,
  Wrench,
} from "lucide-react";
import SectionCard from "@/components/ui/SectionCard";
import EvidenceCard from "@/components/ui/EvidenceCard";
import StatusBadge from "@/components/ui/StatusBadge";
import HeroBanner from "@/components/ui/HeroBanner";
import { useToast } from "@/components/ui/Toast";
import {
  AQUAIQ_ANALYST,
  AQUAIQ_DEFAULT_QUESTION,
  AQUAIQ_STRUCTURED,
  AQUAIQ_TOOLS_USED,
  AQUAIQ_TRACE_ID,
  HERO_COPY,
  HERO_IMAGES,
} from "@/lib/demoContent";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ChatResponse } from "@/lib/types";

const TABS = [
  { id: "summary", label: "Executive Summary" },
  { id: "evidence", label: "Evidence" },
  { id: "assumptions", label: "Assumptions" },
  { id: "risks", label: "Risks" },
  { id: "recommendations", label: "Recommendations" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function AquaIQBriefingAnalyst() {
  const [question, setQuestion] = useState(AQUAIQ_DEFAULT_QUESTION);
  const [active, setActive] = useState<TabId>("summary");
  const { toast } = useToast();
  const [response, setResponse] = useState<ChatResponse | null>(null);

  const ask = useMutation({
    mutationFn: () => api.chat({ question }),
    onSuccess: (r) => setResponse(r),
    onError: () => setResponse(null),
  });

  // Prefer the live API response when present; otherwise fall back to the
  // canonical demo content so the page is always evidence-led.
  const summary = response?.summary ?? AQUAIQ_STRUCTURED.executiveSummary;
  const evidence = AQUAIQ_STRUCTURED.evidence;
  const assumptions = AQUAIQ_STRUCTURED.assumptions;
  const risks = response?.risks_assumptions ?? AQUAIQ_STRUCTURED.risks;
  const recommendations =
    response?.recommended_next_actions ?? AQUAIQ_STRUCTURED.recommendations;
  const tools = response?.tools_used ?? AQUAIQ_TOOLS_USED;
  const trace = response?.trace_id ?? AQUAIQ_TRACE_ID;
  const confidence = (response?.confidence ?? "High").toLowerCase();

  return (
    <div className="flex h-[var(--page-h)] min-h-0 flex-col gap-2">
      <HeroBanner
        image={HERO_IMAGES.aquaIQ}
        eyebrow={HERO_COPY.aquaIQ.eyebrow}
        headline={HERO_COPY.aquaIQ.headline}
        sub={HERO_COPY.aquaIQ.sub}
        height={120}
      />

      <div className="grid flex-none grid-cols-1 gap-2 lg:grid-cols-12">
        <SectionCard
          title="Ask AquaIQ"
          description="Governed AI over operational data, documents, and workflows."
          className="lg:col-span-7"
          bodyClassName="p-3"
        >
          <div className="flex flex-col gap-2">
            <label className="block">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
                <textarea
                  rows={2}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask AquaIQ a question..."
                  className="input min-h-[44px] resize-none pl-9 text-[12.5px]"
                />
              </div>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => ask.mutate()}
                disabled={ask.isPending}
                className="btn-primary !py-1.5 text-[12.5px]"
              >
                {ask.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Ask AquaIQ
              </button>
              <button
                onClick={() => setQuestion(AQUAIQ_DEFAULT_QUESTION)}
                className="btn-secondary !py-1.5 text-[12.5px]"
              >
                Use demo question
              </button>
              <span className="ml-auto text-[11px] text-ink-muted">
                Evidence-led; human validation required.
              </span>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Human Validation"
          description="Named analyst review"
          className="lg:col-span-5"
          bodyClassName="p-3"
        >
          <div className="flex items-start gap-2.5">
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primaryBlue text-[12px] font-semibold text-white">
              {AQUAIQ_ANALYST.initials}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-semibold text-deepNavy">
                {AQUAIQ_ANALYST.name}
              </div>
              <div className="text-[11px] text-ink-muted">{AQUAIQ_ANALYST.role}</div>
            </div>
            <div className="inline-flex flex-none items-center gap-1 rounded-full bg-[#FFF4E0] px-2 py-0.5 text-[10.5px] font-semibold text-status-watch">
              <CircleDot className="h-2.5 w-2.5" /> {AQUAIQ_ANALYST.status}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <button
              onClick={() =>
                toast({
                  title: "Validation note added",
                  description: "Note attached to the trace.",
                })
              }
              className="btn-secondary !py-1 text-[11.5px]"
            >
              <Plus className="h-3 w-3" /> Add note
            </button>
            <button
              onClick={() =>
                toast({
                  title: "Validation history",
                  description:
                    "Demo — full audit trail would open here, showing every reviewer, note, and trace ID.",
                })
              }
              className="btn-ghost text-[11.5px]"
            >
              <History className="h-3 w-3" /> History
            </button>
            <span className="ml-auto text-[10.5px] text-ink-muted">
              Reviewed: {AQUAIQ_ANALYST.reviewedAt}
            </span>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Structured AquaIQ Response"
        description="governed, evidence-led. Tabs reveal the supporting reasoning."
        className="min-h-0 flex-1"
        bodyClassName="flex flex-col p-3 min-h-0"
        actions={
          <button
            onClick={() =>
              toast({
                title: "Added to executive brief",
                description: "Response sections queued for distribution.",
              })
            }
            className="btn-primary !py-1 text-[12px]"
          >
            Add to brief
            <ArrowRight className="h-3 w-3" />
          </button>
        }
      >
        <div className="flex-none border-b border-border">
          <nav className="-mb-px flex gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={cn(
                  "rounded-t-md border-b-2 px-3 py-1.5 text-[12px] font-medium transition",
                  active === t.id
                    ? "border-primaryBlue text-primaryBlue"
                    : "border-transparent text-ink-muted hover:text-deepBlue",
                )}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="scrollbar-clean min-h-0 flex-1 overflow-auto pt-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {active === "summary" ? (
                <p className="text-[13px] leading-relaxed text-ink-primary">{summary}</p>
              ) : null}
              {active === "evidence" ? (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {evidence.map((e) => (
                    <EvidenceCard key={e.sourceName} {...e} />
                  ))}
                </div>
              ) : null}
              {active === "assumptions" ? (
                <ul className="space-y-1.5">
                  {assumptions.map((a) => (
                    <li
                      key={a}
                      className="flex items-start gap-2 rounded-md border border-border bg-surface px-2.5 py-2 text-[12px] text-ink-secondary"
                    >
                      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-none text-primaryBlue" />
                      {a}
                    </li>
                  ))}
                </ul>
              ) : null}
              {active === "risks" ? (
                <ul className="space-y-1.5">
                  {risks.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 rounded-md border border-border bg-surface px-2.5 py-2 text-[12px] text-ink-secondary"
                    >
                      <CircleDot className="mt-0.5 h-3 w-3 flex-none text-status-watch" />
                      {r}
                    </li>
                  ))}
                </ul>
              ) : null}
              {active === "recommendations" ? (
                <ul className="space-y-1.5">
                  {recommendations.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 rounded-md border border-border bg-surface px-2.5 py-2 text-[12px] text-ink-secondary"
                    >
                      <Check className="mt-0.5 h-3 w-3 flex-none text-greenDark" />
                      {r}
                    </li>
                  ))}
                </ul>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </SectionCard>

      <div className="grid flex-none grid-cols-1 gap-2 lg:grid-cols-2">
        <SectionCard
          title="Source / Tool Trace"
          description="Every AquaIQ response is auditable"
          bodyClassName="p-3"
        >
          <div className="grid grid-cols-4 gap-1.5">
            <TraceRow label="Confidence">
              <span className="pill-blue capitalize text-[10.5px]">{confidence}</span>
            </TraceRow>
            <TraceRow label="Trace ID">
              <span className="truncate font-mono text-[10.5px] text-ink-secondary" title={trace}>
                {trace}
              </span>
            </TraceRow>
            <TraceRow label="Validation">
              <StatusBadge status="watch" label="Required" size="sm" />
            </TraceRow>
            <TraceRow label="Mode">
              <span className="pill-neutral text-[10.5px]">Demo</span>
            </TraceRow>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
              Tools
            </span>
            {tools.map((t) => (
              <span key={t} className="pill-neutral inline-flex items-center gap-1 text-[10.5px]">
                <Wrench className="h-2.5 w-2.5" /> {t}
              </span>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Suggested follow-up briefings"
          description="From the briefing register"
          bodyClassName="p-3"
        >
          <ul className="space-y-1.5">
            {[
              "3-month water security outlook",
              "North Pine WTP operational readiness",
              "Capital investment prioritisation note",
            ].map((s) => (
              <li
                key={s}
                className="flex items-center justify-between rounded-md border border-border bg-surface px-2.5 py-1.5 text-[12px]"
              >
                <span className="flex min-w-0 items-center gap-1.5 text-deepNavy">
                  <FileText className="h-3 w-3 flex-none text-primaryBlue" />
                  <span className="truncate">{s}</span>
                </span>
                <button
                  onClick={() =>
                    toast({
                      title: "Briefing queued",
                      description: `“${s}” opened in the briefing workspace.`,
                    })
                  }
                  className="btn-ghost text-[11.5px]"
                >
                  Open
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-1.5 inline-flex items-center gap-1 text-[10.5px] text-ink-muted">
            <UserCircle2 className="h-3 w-3" /> Human validation required for every AquaIQ output.
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function TraceRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-surface px-2 py-1.5">
      <div className="text-[9.5px] uppercase tracking-wider text-ink-muted">{label}</div>
      <div className="mt-0.5 truncate">{children}</div>
    </div>
  );
}
