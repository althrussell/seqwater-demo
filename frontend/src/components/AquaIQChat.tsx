import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowDown,
  ArrowUp,
  CircleDot,
  Loader2,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { streamChat } from "@/lib/chatStream";
import {
  appendDelta,
  appendToolEvent,
  appendTurn,
  getThread,
  subscribe,
  type ChatThread,
  type Turn,
  updateTurn,
} from "@/lib/chatStore";
import { cn } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";

interface Props {
  threadId: string;
  /** Pre-populate the input with a suggested question. */
  defaultQuestion?: string;
  /**
   * One-shot programmatic send. When `seq` changes, the question is sent
   * to the chat as a new turn without user interaction. Used by the
   * AquaIQ dock when a KPI insight drawer invokes `askAquaIQ(prompt)`.
   */
  autoSend?: { question: string; seq: number } | null;
  /** Called once the auto-send has been dispatched. */
  onAutoSent?: () => void;
}

const SUGGESTIONS = [
  "What are the top 5 operational risks over the next 72 hours?",
  "Summarise the flood readiness posture for scenario FS-001.",
  "Which capital projects reduce the most operational risk?",
  "What is driving the elevated water quality risk this month?",
];

export default function AquaIQChat({
  threadId,
  defaultQuestion,
  autoSend,
  onAutoSent,
}: Props) {
  const [thread, setThread] = useState<ChatThread | undefined>(() => getThread(threadId));
  const [input, setInput] = useState(defaultQuestion ?? "");
  const [isStreaming, setIsStreaming] = useState(false);
  const [pinnedToBottom, setPinnedToBottom] = useState(true);
  const [unseenTokens, setUnseenTokens] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastAutoSentSeqRef = useRef<number | null>(null);

  // Sync thread on store changes (works for cross-tab updates too)
  useEffect(() => {
    setThread(getThread(threadId));
    const unsub = subscribe(() => {
      setThread(getThread(threadId));
    });
    return () => {
      unsub();
    };
  }, [threadId]);

  // Cancel in-flight stream when thread changes (new chat / switch)
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, [threadId]);

  const scrollToBottom = useCallback((behaviour: ScrollBehavior = "smooth") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: behaviour });
    setUnseenTokens(0);
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const pinned = distance < 80;
    setPinnedToBottom(pinned);
    if (pinned) setUnseenTokens(0);
  }, []);

  // Auto-follow when pinned, while streaming.
  useEffect(() => {
    if (!isStreaming) return;
    if (!pinnedToBottom) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [thread?.turns, isStreaming, pinnedToBottom]);

  const send = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || isStreaming) return;

      const { turn } = appendTurn(threadId, { user: trimmed });
      updateTurn(threadId, turn.id, { status: "streaming" });
      setInput("");
      setIsStreaming(true);
      setUnseenTokens(0);
      setPinnedToBottom(true);

      const ctrl = new AbortController();
      abortRef.current?.abort();
      abortRef.current = ctrl;

      try {
        for await (const evt of streamChat(
          {
            question: trimmed,
            history: (thread?.turns ?? []).flatMap((t) => [
              { role: "user", content: t.user },
              { role: "assistant", content: t.assistantMarkdown || t.user },
            ]),
          },
          ctrl.signal,
        )) {
          switch (evt.event) {
            case "delta": {
              appendDelta(threadId, turn.id, evt.text);
              if (!pinnedToBottom) {
                setUnseenTokens((n) => n + 1);
              }
              break;
            }
            case "tool_call": {
              appendToolEvent(threadId, turn.id, {
                name: evt.name,
                args: evt.args,
              });
              break;
            }
            case "tool_result": {
              appendToolEvent(threadId, turn.id, {
                name: evt.name,
                summary: evt.summary,
              });
              break;
            }
            case "sources": {
              updateTurn(threadId, turn.id, { sources: evt.items ?? [] });
              break;
            }
            case "done": {
              updateTurn(threadId, turn.id, {
                status: "done",
                assistantMarkdown:
                  evt.markdown && evt.markdown.length > 0
                    ? evt.markdown
                    : evt.summary,
                sources: evt.sources_used ?? [],
                toolsUsed: evt.tools_used ?? [],
                confidence: evt.confidence,
                traceId: evt.trace_id,
              });
              break;
            }
          }
        }
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          console.error("[AquaIQChat] stream failed", err);
          updateTurn(threadId, turn.id, {
            status: "error",
            error: (err as Error)?.message ?? "Stream failed",
          });
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [isStreaming, pinnedToBottom, thread?.turns, threadId],
  );

  const turns = thread?.turns ?? [];

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  // Auto-send pending questions handed in from another surface
  // (e.g. a KPI insight drawer via `askAquaIQ`). We gate on `seq` so the
  // same string can be dispatched twice if needed; we never re-send for
  // the same seq, even on re-renders.
  useEffect(() => {
    if (!autoSend) return;
    if (lastAutoSentSeqRef.current === autoSend.seq) return;
    if (isStreaming) return;
    lastAutoSentSeqRef.current = autoSend.seq;
    void send(autoSend.question);
    onAutoSent?.();
  }, [autoSend, isStreaming, send, onAutoSent]);

  const showSuggestions = turns.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-border bg-white">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div>
          <div className="text-[12px] font-semibold text-deepNavy">AquaIQ</div>
          <div className="text-[10.5px] text-ink-muted">
            Streaming via the Supervisor → Genie + Knowledge Assistant + UC functions
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isStreaming ? (
            <button onClick={cancel} className="btn-ghost text-[12px]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Stop
            </button>
          ) : null}
          <StatusBadge status="watch" label="Demo" size="sm" />
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto px-4 py-4"
      >
        {showSuggestions ? (
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="rounded-md border border-border bg-[#F4F7FB] p-4 text-[13px] text-ink-secondary">
              <strong className="text-deepNavy">Welcome to AquaIQ.</strong> Ask
              anything about SEQ Water Grid storage, water quality,
              risk, capital priorities, or operational playbooks. Every answer
              is governed, cited, and requires human validation.
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-md border border-border bg-white px-3 py-2 text-left text-[13px] text-ink-primary transition hover:border-primaryBlue hover:bg-[#F4F7FB]"
                >
                  <Sparkles className="mr-1 inline h-3.5 w-3.5 text-primaryBlue" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-5">
            {turns.map((turn) => (
              <TurnView key={turn.id} turn={turn} />
            ))}
          </div>
        )}

        {!pinnedToBottom && turns.length > 0 ? (
          <button
            onClick={() => scrollToBottom("smooth")}
            className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-deepNavy px-3 py-1.5 text-[12px] font-medium text-white shadow-md hover:bg-primaryBlue"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            Jump to latest{unseenTokens > 0 ? ` (${unseenTokens} new)` : ""}
          </button>
        ) : null}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) send(input);
        }}
        className="border-t border-border bg-surface p-3"
      >
        <div className="flex items-end gap-2">
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (input.trim()) send(input);
              }
            }}
            placeholder="Ask AquaIQ a question…  (Enter to send, Shift+Enter for newline)"
            disabled={isStreaming}
            className="input min-h-[60px] flex-1 resize-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="btn-primary"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
            Send
          </button>
        </div>
        <div className="mt-1.5 text-[10.5px] text-ink-muted">
          AquaIQ outputs are illustrative. Every answer requires human validation.
        </div>
      </form>
    </div>
  );
}

function TurnView({ turn }: { turn: Turn }) {
  const status = turn.status;
  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-deepNavy px-3.5 py-2 text-[13.5px] text-white shadow-sm">
          {turn.user}
        </div>
      </div>

      {turn.toolEvents.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {turn.toolEvents.map((evt, idx) => (
            <span
              key={`${turn.id}-tool-${idx}`}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10.5px]",
                evt.summary
                  ? "bg-[#E8F0FB] text-primaryBlue"
                  : "bg-white text-ink-muted",
              )}
              title={evt.summary || JSON.stringify(evt.args ?? {})}
            >
              <Wrench className="h-3 w-3" />
              {evt.name}
              {evt.summary ? " ✓" : ""}
            </span>
          ))}
        </div>
      ) : null}

      <div
        className={cn(
          "rounded-2xl rounded-bl-sm border px-4 py-3 shadow-sm",
          status === "error"
            ? "border-red-200 bg-red-50"
            : "border-border bg-white",
        )}
      >
        {status === "pending" && !turn.assistantMarkdown ? (
          <div className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Routing to the Supervisor…
          </div>
        ) : null}
        {turn.assistantMarkdown ? (
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {turn.assistantMarkdown}
            </ReactMarkdown>
          </div>
        ) : null}
        {status === "error" ? (
          <div className="text-[12.5px] text-red-700">
            {turn.error || "Something went wrong."}
          </div>
        ) : null}
      </div>

      {turn.sources.length > 0 ? (
        <div className="rounded-md border border-border bg-surface px-3 py-2.5 text-[12px]">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-muted">
            Sources used ({turn.sources.length})
          </div>
          <ul className="mt-1 space-y-1">
            {turn.sources.map((src, idx) => (
              <li
                key={`${turn.id}-src-${idx}`}
                className="flex items-start gap-2 text-ink-secondary"
              >
                <CircleDot className="mt-0.5 h-3 w-3 flex-none text-primaryBlue" />
                <span className="min-w-0">
                  <span className="font-medium text-deepNavy">{src.source}</span>
                  {src.detail ? <> — {src.detail}</> : null}
                  {src.href ? (
                    <a
                      className="ml-1 text-primaryBlue underline"
                      href={src.href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      open
                    </a>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {status === "done" ? (
        <div className="flex flex-wrap items-center gap-2 text-[10.5px] text-ink-muted">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-primaryBlue" />
            Confidence: {turn.confidence ?? "Medium"}
          </span>
          {turn.traceId ? (
            <span className="font-mono">trace {turn.traceId}</span>
          ) : null}
          <span>Human validation required.</span>
        </div>
      ) : null}
    </div>
  );
}
