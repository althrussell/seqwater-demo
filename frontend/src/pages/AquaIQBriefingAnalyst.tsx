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
import { useToast } from "@/components/ui/Toast";
import {
  AQUAIQ_ANALYST,
  AQUAIQ_DEFAULT_QUESTION,
  AQUAIQ_STRUCTURED,
  AQUAIQ_TOOLS_USED,
  AQUAIQ_TRACE_ID,
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
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <SectionCard
          title="Ask AquaIQ"
          description="Governed AI over synthetic operational data, documents, and workflows."
          className="lg:col-span-7"
        >
          <div className="flex flex-col gap-3">
            <label className="block">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                <textarea
                  rows={2}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask AquaIQ a question..."
                  className="input min-h-[64px] resize-none pl-9"
                />
              </div>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => ask.mutate()}
                disabled={ask.isPending}
                className="btn-primary"
              >
                {ask.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Ask AquaIQ
              </button>
              <button
                onClick={() => setQuestion(AQUAIQ_DEFAULT_QUESTION)}
                className="btn-secondary"
              >
                Use demo question
              </button>
              <span className="ml-auto text-[11.5px] text-ink-muted">
                AquaIQ answers are evidence-led and require human validation.
              </span>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Human Validation"
          description="This briefing requires named analyst review"
          className="lg:col-span-5"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primaryBlue text-[13px] font-semibold text-white">
              {AQUAIQ_ANALYST.initials}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-semibold text-deepNavy">
                {AQUAIQ_ANALYST.name}
              </div>
              <div className="text-[11.5px] text-ink-muted">{AQUAIQ_ANALYST.role}</div>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#FFF4E0] px-2.5 py-0.5 text-[11.5px] font-semibold text-status-watch">
                <CircleDot className="h-3 w-3" /> {AQUAIQ_ANALYST.status}
              </div>
              <p className="mt-2.5 text-[12px] text-ink-secondary">
                Reviewed: {AQUAIQ_ANALYST.reviewedAt}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={() =>
                toast({
                  title: "Validation note added",
                  description: "Synthetic note attached to the trace.",
                })
              }
              className="btn-secondary text-[12.5px]"
            >
              <Plus className="h-3.5 w-3.5" /> Add note
            </button>
            <button className="btn-ghost text-[12.5px]">
              <History className="h-3.5 w-3.5" /> View validation history
            </button>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Structured AquaIQ Response"
        description="Synthetic, governed, evidence-led. Tabs reveal the supporting reasoning."
        actions={
          <button
            onClick={() =>
              toast({
                title: "Added to executive brief",
                description: "Response sections queued for distribution.",
              })
            }
            className="btn-primary text-[12.5px]"
          >
            Add to executive brief
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        }
      >
        <div className="border-b border-border">
          <nav className="-mb-px flex gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={cn(
                  "rounded-t-md border-b-2 px-3 py-2 text-[12.5px] font-medium transition",
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
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="pt-4"
          >
            {active === "summary" ? (
              <p className="text-[14px] leading-relaxed text-ink-primary">{summary}</p>
            ) : null}
            {active === "evidence" ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {evidence.map((e) => (
                  <EvidenceCard key={e.sourceName} {...e} />
                ))}
              </div>
            ) : null}
            {active === "assumptions" ? (
              <ul className="space-y-2">
                {assumptions.map((a) => (
                  <li
                    key={a}
                    className="flex items-start gap-2 rounded-md border border-border bg-surface px-3 py-2.5 text-[13px] text-ink-secondary"
                  >
                    <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-primaryBlue" />
                    {a}
                  </li>
                ))}
              </ul>
            ) : null}
            {active === "risks" ? (
              <ul className="space-y-2">
                {risks.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 rounded-md border border-border bg-surface px-3 py-2.5 text-[13px] text-ink-secondary"
                  >
                    <CircleDot className="mt-0.5 h-3.5 w-3.5 flex-none text-status-watch" />
                    {r}
                  </li>
                ))}
              </ul>
            ) : null}
            {active === "recommendations" ? (
              <ul className="space-y-2">
                {recommendations.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 rounded-md border border-border bg-surface px-3 py-2.5 text-[13px] text-ink-secondary"
                  >
                    <Check className="mt-0.5 h-3.5 w-3.5 flex-none text-greenDark" />
                    {r}
                  </li>
                ))}
              </ul>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          title="Source / Tool Trace"
          description="Every AquaIQ response is auditable"
        >
          <div className="grid grid-cols-2 gap-3">
            <TraceRow label="Confidence">
              <span className="pill-blue capitalize">{confidence}</span>
            </TraceRow>
            <TraceRow label="Trace ID">
              <span className="font-mono text-[11.5px] text-ink-secondary">{trace}</span>
            </TraceRow>
            <TraceRow label="Human validation">
              <StatusBadge status="watch" label="Required" size="sm" />
            </TraceRow>
            <TraceRow label="Run mode">
              <span className="pill-neutral">Synthetic</span>
            </TraceRow>
          </div>
          <div className="mt-4">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-muted">
              Tools used
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {tools.map((t) => (
                <span key={t} className="pill-neutral inline-flex items-center gap-1.5">
                  <Wrench className="h-3 w-3" /> {t}
                </span>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Suggested follow-up briefings" description="From the synthetic briefing register">
          <ul className="space-y-2">
            {[
              "3-month water security outlook (synthetic)",
              "North Pine WTP operational readiness (synthetic)",
              "Capital investment prioritisation note (synthetic)",
            ].map((s) => (
              <li
                key={s}
                className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2.5 text-[13px]"
              >
                <span className="flex items-center gap-2 text-deepNavy">
                  <FileText className="h-3.5 w-3.5 text-primaryBlue" /> {s}
                </span>
                <button className="btn-ghost text-[12px]">Open</button>
              </li>
            ))}
          </ul>
          <div className="mt-3 inline-flex items-center gap-1 text-[12px] text-ink-muted">
            <UserCircle2 className="h-3.5 w-3.5" /> Human validation required for every AquaIQ output.
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function TraceRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2">
      <div className="text-[10.5px] uppercase tracking-wider text-ink-muted">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}
