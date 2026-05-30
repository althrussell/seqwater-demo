import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  ChevronDown,
  ChevronRight,
  Code2,
  Database,
  FileText,
  GitBranch,
  Layers,
  ShieldCheck,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import Sparkline from "./Sparkline";
import { useToast } from "./Toast";
import { cn } from "@/lib/utils";
import { askAquaIQ } from "@/lib/aquaiqBridge";
import type {
  KpiAction,
  KpiInsight,
  PostureInsight,
  SourceChip,
  ToolEventDef,
} from "@/lib/demoContent";

/**
 * Right-side slide-over that opens when a KPI card or the Overall Posture
 * "What does this mean?" link is clicked. Designed to read as a live
 * Databricks AI surface:
 *
 *   - Headline number + 7-day sparkline + status badge
 *   - "AquaIQ explains" body, streamed token-by-token through a typewriter
 *     hook for live-AI feel
 *   - Tool-call chips that animate in one-by-one, mirroring the live chat
 *   - Drivers list and operational-implications callout
 *   - Genie-generated SQL block (collapsible)
 *   - Unity Catalog source chips with type icons
 *   - Recommended action buttons (route, ask-AquaIQ, brief, workflow)
 *   - Confidence / trace id / human-validation footer
 */

interface BaseProps {
  open: boolean;
  onClose: () => void;
  /** Optional sparkline series shown in the hero strip. */
  sparkline?: number[];
  sparklineColor?: string;
  sparklineVariant?: "area" | "bar";
  /** Caption rendered just under the headline value. */
  valueCaption?: string;
}

type Props = BaseProps & (
  | { kind: "kpi"; insight: KpiInsight | null; postureInsight?: undefined }
  | { kind: "posture"; postureInsight: PostureInsight; insight?: undefined }
);

export default function KpiInsightDrawer(props: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Normalize the two payload variants into a single shape the renderer
  // can consume without branching on `kind` everywhere.
  const data = useMemo(() => {
    if (props.kind === "kpi") {
      const i = props.insight;
      if (!i) return null;
      return {
        title: i.title,
        subtitle: i.headline,
        value: i.value,
        status: i.status,
        narrative: i.narrative,
        drivers: i.drivers,
        meaning: i.meaning,
        sql: i.sql,
        sources: i.sources,
        agentTools: i.agentTools,
        actions: i.actions,
        confidence: i.confidence,
        traceId: i.traceId,
      };
    }
    const p = props.postureInsight;
    return {
      title: p.title,
      subtitle: p.subtitle,
      value: "",
      status: p.status,
      narrative: p.narrative,
      drivers: p.drivers,
      meaning: p.meaning,
      sql: undefined,
      sources: p.sources,
      agentTools: p.agentTools,
      actions: p.actions,
      confidence: p.confidence,
      traceId: p.traceId,
    };
  }, [props]);

  // Close on Escape, lock body scroll while open.
  useEffect(() => {
    if (!props.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") props.onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [props]);

  const handleAction = (action: KpiAction) => {
    switch (action.kind) {
      case "navigate":
        if (action.target) navigate(action.target);
        props.onClose();
        break;
      case "aquaiq":
        if (action.prompt) askAquaIQ(action.prompt);
        props.onClose();
        toast({
          title: "Routing to AquaIQ",
          description: "Question streaming to the synthetic Supervisor…",
          variant: "info",
        });
        break;
      case "brief":
      case "workflow":
      default:
        toast({
          title: action.toastTitle ?? "Action queued",
          description: action.toastBody ?? "Synthetic action acknowledged.",
          variant: action.kind === "brief" ? "success" : "info",
        });
        break;
    }
  };

  return (
    <AnimatePresence>
      {props.open && data ? (
        <>
          {/* Scrim — click to close. Pointer-events on the scrim, not the
              drawer, so the drawer itself remains fully interactive. */}
          <motion.div
            key="kpi-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={props.onClose}
            className="fixed inset-0 z-[55] bg-deepNavy/30 backdrop-blur-sm"
            aria-hidden
          />

          <motion.aside
            key="kpi-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-[560px] flex-col border-l border-border bg-white shadow-elevated"
            role="dialog"
            aria-label={data.title}
          >
            {/* ---- Header ---- */}
            <div className="flex flex-none items-start justify-between gap-3 border-b border-border bg-gradient-to-r from-[#F4F7FB] to-white px-5 py-3.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-primaryBlue">
                  <Sparkles className="h-3.5 w-3.5" />
                  AquaIQ Insight
                </div>
                <div className="mt-1 truncate text-[16px] font-semibold leading-tight text-deepNavy">
                  {data.title}
                </div>
                <div className="mt-0.5 truncate text-[12px] text-ink-secondary">
                  {data.subtitle}
                </div>
              </div>
              <button
                onClick={props.onClose}
                aria-label="Close insight"
                title="Close (Esc)"
                className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-md border border-border bg-surface text-ink-secondary transition hover:border-primaryBlue/40 hover:bg-surface-blue hover:text-deepBlue"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ---- Hero strip: value + status + sparkline ---- */}
            <div className="flex flex-none items-end justify-between gap-4 border-b border-border bg-white px-5 py-4">
              <div className="min-w-0">
                {data.value ? (
                  <div className="text-[36px] font-semibold leading-none tracking-tight text-deepNavy">
                    {data.value}
                  </div>
                ) : null}
                <div className="mt-1.5">
                  <StatusBadge status={data.status} showIcon />
                </div>
                {props.valueCaption ? (
                  <div className="mt-1.5 text-[11.5px] text-ink-muted">
                    {props.valueCaption}
                  </div>
                ) : null}
              </div>
              {props.sparkline && props.sparkline.length > 0 ? (
                <div className="w-[180px] flex-none">
                  <Sparkline
                    data={props.sparkline}
                    stroke={props.sparklineColor ?? "#0076BE"}
                    height={48}
                    variant={props.sparklineVariant ?? "area"}
                  />
                  <div className="mt-1 text-right text-[10px] uppercase tracking-wider text-ink-muted">
                    7 day trend
                  </div>
                </div>
              ) : null}
            </div>

            {/* ---- Body ---- */}
            <div className="scrollbar-clean flex-1 overflow-y-auto px-5 py-5">
              <AquaIQNarrative key={data.title} text={data.narrative} />

              <AgentToolStrip tools={data.agentTools} />

              <SectionLabel>Key drivers</SectionLabel>
              <ul className="mt-2 space-y-1.5">
                {data.drivers.map((d) => (
                  <li
                    key={d.label}
                    className="flex items-start justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2 text-[12.5px] text-ink-secondary"
                  >
                    <div className="flex min-w-0 items-start gap-2">
                      <span
                        className={cn(
                          "mt-1 inline-flex h-1.5 w-1.5 flex-none rounded-full",
                          d.tone === "up"
                            ? "bg-status-watch"
                            : d.tone === "down"
                              ? "bg-greenDark"
                              : "bg-primaryBlue",
                        )}
                      />
                      <span className="truncate">{d.label}</span>
                    </div>
                    {d.delta ? (
                      <span
                        className={cn(
                          "flex-none rounded-full px-2 py-0.5 text-[10.5px] font-medium",
                          d.tone === "up"
                            ? "bg-[#FFF4E0] text-status-watch"
                            : d.tone === "down"
                              ? "bg-surface-green text-greenDark"
                              : "bg-surface-blue text-primaryBlue",
                        )}
                      >
                        {d.delta}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>

              <SectionLabel className="mt-5">
                What this means for operations
              </SectionLabel>
              <div className="mt-2 rounded-lg border border-surface-blueStrong/60 bg-surface-blue/50 p-3.5 text-[12.5px] leading-relaxed text-deepNavy">
                {data.meaning}
              </div>

              {data.sql ? <SqlBlock sql={data.sql} /> : null}

              <SectionLabel className="mt-5">Unity Catalog lineage</SectionLabel>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {data.sources.map((s) => (
                  <SourcePill key={s.label} source={s} />
                ))}
              </div>

              <SectionLabel className="mt-5">Recommended actions</SectionLabel>
              <div className="mt-2 grid grid-cols-1 gap-2">
                {data.actions.map((a) => (
                  <ActionButton
                    key={a.label}
                    action={a}
                    onActivate={handleAction}
                  />
                ))}
              </div>
            </div>

            {/* ---- Footer: confidence + trace id + governance pill ---- */}
            <div className="flex flex-none flex-wrap items-center gap-2 border-t border-border bg-surface px-5 py-3 text-[10.5px] text-ink-muted">
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-blue px-2 py-0.5 text-primaryBlue">
                <Sparkles className="h-3 w-3" />
                Foundation Model API
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-green px-2 py-0.5 text-greenDark">
                <ShieldCheck className="h-3 w-3" />
                Governed via Unity Catalog
              </span>
              <span className="inline-flex items-center gap-1">
                Confidence:{" "}
                <strong className="text-deepNavy">{data.confidence}</strong>
              </span>
              <span className="font-mono">trace {data.traceId}</span>
              <span className="ml-auto">Human validation required.</span>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

// ----------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------

function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink-muted",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Streamed AquaIQ narrative. Reveals characters at ~22ms each so the
 * surface reads as a live model response rather than static text.
 */
function AquaIQNarrative({ text }: { text: string }) {
  const visible = useTypewriter(text, 22);
  const done = visible.length >= text.length;
  return (
    <section className="mb-5">
      <div className="flex items-center justify-between">
        <SectionLabel>AquaIQ explains</SectionLabel>
        <span className="inline-flex items-center gap-1 text-[10.5px] text-ink-muted">
          <Bot className="h-3 w-3 text-primaryBlue" />
          Streaming
          {done ? null : (
            <span className="ml-0.5 inline-block h-2.5 w-1 animate-pulse bg-primaryBlue" />
          )}
        </span>
      </div>
      <div className="mt-2 rounded-lg border border-border bg-white p-4 text-[13.5px] leading-[1.6] text-deepNavy shadow-soft">
        {visible}
        {!done ? (
          <span className="ml-0.5 inline-block h-3.5 w-1.5 -translate-y-px animate-pulse bg-primaryBlue align-baseline" />
        ) : null}
      </div>
    </section>
  );
}

/**
 * Tool-call chips that animate in one-by-one to mirror the Supervisor's
 * tool-use trace.
 */
function AgentToolStrip({ tools }: { tools: ToolEventDef[] }) {
  const reveal = useStaggeredReveal(tools.length, 240);
  return (
    <section className="mb-5">
      <SectionLabel>Agent Bricks reasoning trace</SectionLabel>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {tools.map((t, i) => (
          <AnimatePresence key={t.name} mode="popLayout">
            {i < reveal ? (
              <motion.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-[#E8F0FB] px-2 py-0.5 text-[10.5px] text-primaryBlue"
                title={t.summary}
              >
                <Wrench className="h-3 w-3" />
                {t.name}
                <span className="ml-0.5 text-greenDark">✓</span>
              </motion.span>
            ) : null}
          </AnimatePresence>
        ))}
      </div>
      {reveal >= tools.length && tools.length > 0 ? (
        <div className="mt-1.5 text-[10.5px] text-ink-muted">
          Supervisor returned {tools.length} tool calls — every call recorded in{" "}
          <code className="rounded bg-[#F4F7FB] px-1 font-mono text-[10px]">
            ai_interaction_audit
          </code>
          .
        </div>
      ) : null}
    </section>
  );
}

function SqlBlock({ sql }: { sql: string }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="mt-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2 text-[11.5px] font-semibold text-deepNavy transition hover:border-primaryBlue/40 hover:bg-surface-blue"
      >
        <span className="inline-flex items-center gap-1.5">
          <Code2 className="h-3.5 w-3.5 text-primaryBlue" />
          Genie-generated SQL
          <span className="ml-1 rounded-full bg-surface-blue px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wider text-primaryBlue">
            seqwater_operations
          </span>
        </span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-ink-muted" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-ink-muted" />
        )}
      </button>
      {open ? (
        <pre className="mt-1.5 overflow-x-auto rounded-md bg-[#0e1726] p-3 text-[11.5px] leading-relaxed text-[#e6edf3]">
          <code className="font-mono whitespace-pre">{sql}</code>
        </pre>
      ) : null}
    </section>
  );
}

const SOURCE_ICON: Record<SourceChip["type"], typeof Database> = {
  table: Database,
  document: FileText,
  workflow: GitBranch,
  model: Sparkles,
  view: Layers,
};

function SourcePill({ source }: { source: SourceChip }) {
  const Icon = SOURCE_ICON[source.type];
  return (
    <span
      title={source.label}
      className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-secondary"
    >
      <Icon className="h-3 w-3 flex-none text-primaryBlue" />
      <span className="truncate">{source.label}</span>
    </span>
  );
}

function ActionButton({
  action,
  onActivate,
}: {
  action: KpiAction;
  onActivate: (a: KpiAction) => void;
}) {
  const Icon = action.icon ?? ArrowRight;
  // AquaIQ asks get the highlighted treatment; route + brief + workflow get
  // a softer secondary look so the eye lands on AquaIQ first.
  const isAquaIQ = action.kind === "aquaiq";
  return (
    <button
      type="button"
      onClick={() => onActivate(action)}
      className={cn(
        "group flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-left text-[12.5px] font-medium transition",
        isAquaIQ
          ? "border-primaryBlue/40 bg-surface-blue/70 text-primaryBlue hover:border-primaryBlue hover:bg-surface-blue"
          : "border-border bg-surface text-deepNavy hover:border-primaryBlue/40 hover:bg-surface-blue/40",
      )}
    >
      <span className="inline-flex items-center gap-2 truncate">
        <Icon
          className={cn(
            "h-4 w-4 flex-none",
            isAquaIQ ? "text-primaryBlue" : "text-ink-muted",
          )}
        />
        <span className="truncate">{action.label}</span>
      </span>
      <ArrowRight
        className={cn(
          "h-3.5 w-3.5 flex-none transition group-hover:translate-x-0.5",
          isAquaIQ ? "text-primaryBlue" : "text-ink-muted",
        )}
      />
    </button>
  );
}

// ----------------------------------------------------------------------
// Hooks
// ----------------------------------------------------------------------

function useTypewriter(text: string, intervalMs: number): string {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
  }, [text]);
  useEffect(() => {
    if (n >= text.length) return;
    // Reveal a chunk per tick — small enough to feel like streaming, large
    // enough that long narratives don't read frame-by-frame.
    const chunk = Math.max(1, Math.floor(text.length / 240));
    const t = window.setTimeout(() => {
      setN((cur) => Math.min(text.length, cur + chunk));
    }, intervalMs);
    return () => window.clearTimeout(t);
  }, [n, text, intervalMs]);
  return text.slice(0, n);
}

function useStaggeredReveal(count: number, stepMs: number): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
  }, [count]);
  useEffect(() => {
    if (n >= count) return;
    const t = window.setTimeout(() => setN((c) => c + 1), stepMs);
    return () => window.clearTimeout(t);
  }, [n, count, stepMs]);
  return n;
}
