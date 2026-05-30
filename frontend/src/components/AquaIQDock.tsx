import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ExternalLink,
  Maximize2,
  Minimize2,
  Plus,
  X,
} from "lucide-react";
import AquaIQChat from "@/components/AquaIQChat";
import {
  createThread,
  getThread,
  subscribe,
  type ChatThread,
} from "@/lib/chatStore";
import {
  consumePendingQuestion,
  subscribeAsk,
  subscribeOpen,
} from "@/lib/aquaiqBridge";
import { cn } from "@/lib/utils";

/**
 * AquaIQ floating dock.
 *
 * A persistent, every-page chat surface for the AquaIQ governed assistant:
 *
 *  - Launcher: a circular button anchored bottom-right with the AquaIQ water-drop
 *    avatar. Subtle bob-and-glow animation invites the user to click.
 *  - Panel: a non-modal chat dock (~420px wide × 640px tall, expandable) that
 *    embeds the existing {@link AquaIQChat} component verbatim, so streaming,
 *    tool-call chips, citations, and markdown rendering all behave identically
 *    to the full /aquaiq assistant page.
 *  - Persistence: the dock owns one thread in {@link chatStore} (id stored in
 *    localStorage). The same thread is reachable on the /aquaiq page, so the
 *    user can "Open in full assistant" without losing context.
 *  - Mode awareness: the dock hides itself on /aquaiq (you're already there).
 */

const DOCK_THREAD_KEY = "seqwater.dock.threadId";
const DOCK_OPEN_KEY = "seqwater.dock.open";

function readBool(key: string): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(key) === "1";
}
function writeBool(key: string, v: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, v ? "1" : "0");
}

export default function AquaIQDock() {
  const location = useLocation();
  const hidden = location.pathname.startsWith("/aquaiq");

  const [open, setOpen] = useState<boolean>(() => readBool(DOCK_OPEN_KEY));
  const [expanded, setExpanded] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(DOCK_THREAD_KEY);
  });
  // Pending question dispatched from a KPI insight drawer or another
  // surface via `askAquaIQ(...)` — passed to the chat as a one-shot
  // auto-send. We bump `seq` to force the chat to send the same string
  // twice if requested.
  const [pending, setPending] = useState<{ question: string; seq: number } | null>(
    null,
  );

  // Persist open state so the dock survives page navigation.
  useEffect(() => {
    writeBool(DOCK_OPEN_KEY, open);
  }, [open]);

  // Ensure we have a live thread to write into the moment the panel opens.
  useEffect(() => {
    if (!open) return;
    if (threadId && getThread(threadId)) return;
    const t = createThread({ title: "AquaIQ quick chat" });
    setThreadId(t.id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DOCK_THREAD_KEY, t.id);
    }
  }, [open, threadId]);

  // If the underlying thread gets deleted (e.g. from the full-page sidebar),
  // drop the stale id so we'll lazy-create a fresh one on next open.
  useEffect(() => {
    const unsub = subscribe(() => {
      if (!threadId) return;
      const live = getThread(threadId);
      if (!live) setThreadId(null);
    });
    return () => {
      unsub();
    };
  }, [threadId]);

  // Wire up the cross-surface bridge: KPI drawers and other deep components
  // can call `askAquaIQ(prompt)` and expect the dock to open + auto-send.
  useEffect(() => {
    const unsubOpen = subscribeOpen(() => setOpen(true));
    const unsubAsk = subscribeAsk((q) => {
      setOpen(true);
      setPending({ question: q, seq: Date.now() });
    });
    // Drain any pending question that was queued before the dock mounted.
    const queued = consumePendingQuestion();
    if (queued) {
      setOpen(true);
      setPending({ question: queued, seq: Date.now() });
    }
    return () => {
      unsubOpen();
      unsubAsk();
    };
  }, []);

  if (hidden) return null;

  const handleClear = () => {
    const t = createThread({ title: "AquaIQ quick chat" });
    setThreadId(t.id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DOCK_THREAD_KEY, t.id);
    }
  };

  const liveThread: ChatThread | undefined = threadId
    ? getThread(threadId)
    : undefined;
  const turnCount = liveThread?.turns.length ?? 0;

  return (
    <>
      {/* ---- Launcher ---- */}
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open AquaIQ assistant"
          className={cn(
            "group fixed bottom-5 right-5 z-[60] flex h-16 w-16 items-center justify-center",
            "rounded-full bg-white shadow-[0_12px_32px_rgba(13,55,143,0.28)]",
            "ring-1 ring-primaryBlue/15 hover:ring-primaryBlue/35",
            "transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(13,55,143,0.32)]",
            "focus:outline-none focus:ring-4 focus:ring-primaryBlue/25",
          )}
        >
          {/* halo pulse to invite the click */}
          <span className="pointer-events-none absolute inset-0 rounded-full bg-primaryBlue/20 opacity-0 transition group-hover:opacity-100" />
          <span className="pointer-events-none absolute -inset-1 rounded-full bg-primaryBlue/15 blur-md opacity-60 animate-pulseSoft" />
          <span className="aquaiq-dock__bob relative flex h-12 w-12 items-center justify-center">
            <img
              src="/aquaiq.png"
              alt=""
              draggable={false}
              className="h-12 w-12 select-none rounded-full object-cover"
            />
          </span>
          {/* unread/turn count chip */}
          {turnCount > 0 ? (
            <span className="pointer-events-none absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-deepNavy px-1 text-[10px] font-semibold text-white shadow-md">
              {turnCount}
            </span>
          ) : (
            <span className="pointer-events-none absolute -right-1 -top-1 inline-flex h-3 w-3 items-center justify-center rounded-full bg-statusGreen ring-2 ring-white" />
          )}
        </button>
      ) : null}

      {/* ---- Panel ---- */}
      {open ? (
        <div
          role="dialog"
          aria-label="AquaIQ assistant"
          className={cn(
            "fixed z-[60] animate-fadeUp",
            "bottom-4 right-4",
            // mobile: nearly fullscreen
            "left-4 top-16",
            // ≥sm: anchored bottom-right with explicit size
            "sm:left-auto sm:top-auto",
            expanded
              ? "sm:h-[calc(100vh-32px)] sm:w-[min(760px,calc(100vw-32px))]"
              : "sm:h-[640px] sm:max-h-[calc(100vh-32px)] sm:w-[420px]",
          )}
        >
          <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-white shadow-[0_24px_60px_rgba(13,55,143,0.28)]">
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-border bg-gradient-to-r from-[#F4F7FB] to-white px-3 py-2">
              <div className="relative flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white ring-1 ring-primaryBlue/20">
                <img
                  src="/aquaiq.png"
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                  draggable={false}
                />
                <span className="absolute -right-0.5 -bottom-0.5 inline-flex h-2.5 w-2.5 rounded-full bg-statusGreen ring-2 ring-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-semibold text-deepNavy">
                  AquaIQ
                </div>
                <div className="truncate text-[10.5px] text-ink-muted">
                  Synthetic governed assistant · streaming
                </div>
              </div>
              <DockIconButton
                title="Start a new chat"
                onClick={handleClear}
                Icon={Plus}
              />
              <Link
                to="/aquaiq"
                className="dock-ic"
                title="Open in full assistant"
                aria-label="Open in full assistant"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
              <DockIconButton
                title={expanded ? "Shrink" : "Expand"}
                onClick={() => setExpanded((v) => !v)}
                Icon={expanded ? Minimize2 : Maximize2}
                hideOnMobile
              />
              <DockIconButton
                title="Close"
                onClick={() => setOpen(false)}
                Icon={X}
              />
            </div>

            {/* Body — embed the full chat */}
            <div className="min-h-0 flex-1">
              {threadId ? (
                <AquaIQChat
                  key={threadId}
                  threadId={threadId}
                  autoSend={pending}
                  onAutoSent={() => setPending(null)}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[13px] text-ink-muted">
                  Loading chat…
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function DockIconButton({
  Icon,
  onClick,
  title,
  hideOnMobile,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  title: string;
  hideOnMobile?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn("dock-ic", hideOnMobile ? "hidden sm:inline-flex" : "")}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
