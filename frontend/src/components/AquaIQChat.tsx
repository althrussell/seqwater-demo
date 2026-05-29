import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { ChatResponse } from "@/lib/types";
import {
  ArrowUp,
  Loader2,
  Sparkles,
  ShieldCheck,
  Bot,
  User,
  ThumbsDown,
  ThumbsUp,
  Hammer,
  AlertTriangle,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import SourceCitationCard from "./SourceCitationCard";

interface Turn {
  id: string;
  user: string;
  response?: ChatResponse;
  status: "pending" | "ok" | "error";
  error?: string;
}

const PROMPT_CHIPS = [
  "What are the top 5 operational risks over the next 72 hours?",
  "Which assets need executive attention this week?",
  "What is driving the elevated water quality risk?",
  "Summarise the flood readiness posture.",
  "Which capital projects reduce the most operational risk?",
  "Generate a board-ready situation briefing.",
  "Draft a stakeholder update for retailer customers.",
  "Show me what changed since yesterday.",
];

export default function AquaIQChat({
  initialQuestion,
  onAnswer,
  className,
}: {
  initialQuestion?: string;
  onAnswer?: (answer: ChatResponse) => void;
  className?: string;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const scroller = useRef<HTMLDivElement | null>(null);

  const ask = useMutation({
    mutationFn: async (question: string) => api.chat({ question }),
  });

  function send(q: string) {
    const id = crypto.randomUUID();
    const trimmed = q.trim();
    if (!trimmed) return;
    setTurns((t) => [...t, { id, user: trimmed, status: "pending" }]);
    ask.mutate(trimmed, {
      onSuccess: (response) => {
        setTurns((t) =>
          t.map((turn) =>
            turn.id === id ? { ...turn, response, status: "ok" } : turn,
          ),
        );
        onAnswer?.(response);
      },
      onError: (err: any) => {
        setTurns((t) =>
          t.map((turn) =>
            turn.id === id
              ? { ...turn, status: "error", error: err?.message ?? "Failed" }
              : turn,
          ),
        );
      },
    });
    setDraft("");
  }

  useEffect(() => {
    if (initialQuestion) {
      send(initialQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 999_999, behavior: "smooth" });
  }, [turns]);

  return (
    <div className={cn("flex h-full min-h-[640px] flex-col", className)}>
      <div
        ref={scroller}
        className="scrollbar-clean flex-1 space-y-5 overflow-y-auto px-1"
      >
        {turns.length === 0 ? <EmptyState onPick={(q) => send(q)} /> : null}
        {turns.map((t) => (
          <Turn key={t.id} turn={t} />
        ))}
      </div>

      <div className="mt-4">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {PROMPT_CHIPS.slice(0, 6).map((c) => (
            <button
              key={c}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-ink-200 transition hover:border-brand-400/30 hover:bg-brand-500/5 hover:text-ink-50"
              onClick={() => send(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2 focus-within:border-brand-400/40">
          <textarea
            ref={inputRef}
            rows={2}
            placeholder="Ask AquaIQ — synthetic demo data only…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(draft);
              }
            }}
            className="min-h-[40px] flex-1 resize-none bg-transparent px-2 py-1 text-sm text-ink-50 placeholder:text-ink-300 focus:outline-none"
          />
          <button
            onClick={() => send(draft)}
            disabled={!draft.trim() || ask.isPending}
            className="btn-primary h-10 w-10 px-0"
            aria-label="Send"
          >
            {ask.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="mt-2 px-1 text-[11px] text-ink-300">
          Shift + Enter for newline. AquaIQ refuses operational authorisation requests.
        </p>
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-water-grad shadow-glow">
        <Sparkles className="h-5 w-5 text-white" />
      </div>
      <h3 className="mt-3 text-base font-semibold text-ink-50">AquaIQ — synthetic demo</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-ink-300">
        A governed operational intelligence assistant for executive use. AquaIQ
        cites synthetic sources, states confidence, and refuses operational
        authorisation requests.
      </p>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {PROMPT_CHIPS.map((c) => (
          <button
            key={c}
            className="group flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-left text-xs text-ink-200 transition hover:border-brand-400/30 hover:bg-brand-500/[0.06] hover:text-ink-50"
            onClick={() => onPick(c)}
          >
            <span>{c}</span>
            <ArrowUp className="h-3.5 w-3.5 -rotate-45 text-ink-300 transition group-hover:text-brand-300" />
          </button>
        ))}
      </div>
    </div>
  );
}

function Turn({ turn }: { turn: Turn }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <Avatar role="user" />
        <div className="rounded-2xl rounded-tl-md border border-white/5 bg-white/[0.04] px-4 py-2 text-sm text-ink-100">
          {turn.user}
        </div>
      </div>
      <div className="flex items-start gap-3">
        <Avatar role="assistant" />
        <div className="min-w-0 flex-1 space-y-3">
          {turn.status === "pending" ? <PendingBubble /> : null}
          {turn.status === "error" ? <ErrorBubble error={turn.error} /> : null}
          {turn.response ? <ResponseBubble response={turn.response} /> : null}
        </div>
      </div>
    </div>
  );
}

function Avatar({ role }: { role: "user" | "assistant" }) {
  if (role === "user") {
    return (
      <div className="flex h-8 w-8 flex-none items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
        <User className="h-4 w-4 text-ink-200" />
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-water-grad shadow-glow">
      <Bot className="h-4 w-4 text-white" />
    </div>
  );
}

function PendingBubble() {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 text-xs text-ink-300">
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      AquaIQ is reasoning over synthetic sources…
    </div>
  );
}

function ErrorBubble({ error }: { error?: string }) {
  return (
    <div className="rounded-2xl border border-risk-500/40 bg-risk-500/10 px-4 py-3 text-xs text-risk-100">
      AquaIQ failed to answer: {error}
    </div>
  );
}

function ResponseBubble({ response }: { response: ChatResponse }) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl rounded-tl-md border border-white/5 bg-white/[0.03] px-4 py-3">
        <Header response={response} />
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-100">
          <Block title="Summary">{response.summary}</Block>
          <Block title="Key signals" list={response.key_signals} />
          <Block
            title="Recommended next actions"
            list={response.recommended_next_actions}
            ordered
          />
          <Block title="Risks / assumptions" list={response.risks_assumptions} />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="panel p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-ink-300">
              Sources used (synthetic)
            </span>
            <ShieldCheck className="h-3.5 w-3.5 text-catchment-400" />
          </div>
          <SourceCitationCard citations={response.sources_used} />
        </div>
        <div className="panel p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-ink-300">
              Confidence and assumptions
            </span>
            <ConfidenceTag confidence={response.confidence} />
          </div>
          <ul className="space-y-1.5 text-xs text-ink-200">
            {response.tools_used.length > 0 ? (
              <li className="flex items-start gap-2">
                <Hammer className="mt-0.5 h-3.5 w-3.5 flex-none text-water-300" />
                <span>
                  Tools: <span className="font-mono text-ink-100">{response.tools_used.join(", ")}</span>
                </span>
              </li>
            ) : null}
            <li className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none text-amberop-400" />
              <span>
                Human validation required.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-none text-catchment-400" />
              <span>
                Trace ID:{" "}
                <span className="font-mono text-[11px] text-ink-100">{response.trace_id}</span>
              </span>
            </li>
            {response.is_mock ? (
              <li className="flex items-start gap-2 text-ink-300">
                <Bot className="mt-0.5 h-3.5 w-3.5 flex-none text-ink-300" />
                <span>
                  Mock AI response (deterministic). Configure DATABRICKS_LLM_ENDPOINT for live model.
                </span>
              </li>
            ) : null}
          </ul>
          <div className="mt-3 flex items-center gap-2">
            <button className="btn-ghost h-8 px-2 text-[11px]">
              <ThumbsUp className="h-3.5 w-3.5" /> Helpful
            </button>
            <button className="btn-ghost h-8 px-2 text-[11px]">
              <ThumbsDown className="h-3.5 w-3.5" /> Needs review
            </button>
            <button
              className="btn-ghost ml-auto h-8 px-2 text-[11px]"
              onClick={() => navigator.clipboard.writeText(response.answer)}
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Header({ response }: { response: ChatResponse }) {
  return (
    <div className="flex items-center justify-between text-[11px] text-ink-300">
      <div className="flex items-center gap-2">
        <span className="font-mono text-ink-100">{response.trace_id}</span>
        <span className="text-ink-300">·</span>
        <span>Synthetic answer</span>
      </div>
      <div className="flex items-center gap-2">
        <ConfidenceTag confidence={response.confidence} />
      </div>
    </div>
  );
}

function ConfidenceTag({ confidence }: { confidence: string }) {
  const tone =
    confidence === "High"
      ? "bg-catchment-500/15 text-catchment-100 border-catchment-500/30"
      : confidence === "Low"
      ? "bg-risk-500/15 text-risk-100 border-risk-500/30"
      : "bg-water-500/15 text-water-100 border-water-500/30";
  return (
    <span className={cn("pill", tone)}>
      {confidence} confidence
    </span>
  );
}

function Block({
  title,
  children,
  list,
  ordered,
}: {
  title: string;
  children?: React.ReactNode;
  list?: string[];
  ordered?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-ink-300">{title}</div>
      {list ? (
        ordered ? (
          <ol className="mt-1 list-decimal pl-5 marker:text-ink-300">
            {list.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ol>
        ) : (
          <ul className="mt-1 list-disc pl-5 marker:text-ink-300">
            {list.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        )
      ) : (
        <p className="mt-1">{children}</p>
      )}
    </div>
  );
}
