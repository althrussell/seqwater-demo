import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  Database,
  FileText,
  GitBranch,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import AquaIQChat from "@/components/AquaIQChat";
import ChatHistorySidebar from "@/components/ChatHistorySidebar";
import SectionCard from "@/components/ui/SectionCard";
import {
  createThread,
  listThreads,
  subscribe,
} from "@/lib/chatStore";
import { warmAgent, type WarmStatus } from "@/lib/chatStream";

const ARCH = [
  {
    label: "Supervisor",
    body: "seqwater_supervisor — orchestrates Genie + Knowledge Assistant + 3 UC functions.",
    icon: Workflow,
  },
  {
    label: "Knowledge Assistant",
    body: "seqwater_operational_docs — playbooks, board papers, incident reports.",
    icon: FileText,
  },
  {
    label: "Genie space",
    body: "Seqwater Operations — SEQ Water Grid storage, water quality, asset risk.",
    icon: Database,
  },
  {
    label: "UC functions",
    body: "top_asset_risks, capital_priorities, run_flood_scenario.",
    icon: GitBranch,
  },
];

export default function AquaIQAssistant() {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(() => {
    const existing = listThreads();
    return existing[0]?.id ?? null;
  });
  const [warmStatus, setWarmStatus] = useState<WarmStatus | null>(null);

  useEffect(() => {
    const unsub = subscribe(() => {
      const existing = listThreads();
      setActiveThreadId((curr) => {
        if (curr && existing.some((t) => t.id === curr)) return curr;
        return existing[0]?.id ?? null;
      });
    });
    return () => {
      unsub();
    };
  }, []);

  // Best-effort pre-warm; renders a tiny status pill in the sidebar.
  useEffect(() => {
    let cancelled = false;
    void warmAgent().then((s) => {
      if (!cancelled) setWarmStatus(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNewThread = () => {
    const t = createThread();
    setActiveThreadId(t.id);
  };

  // Lazy-create a thread on first open so the chat has somewhere to write.
  useEffect(() => {
    if (!activeThreadId) {
      const t = createThread();
      setActiveThreadId(t.id);
    }
  }, [activeThreadId]);

  const threadKey = activeThreadId ?? "empty";

  const warmLabel = useMemo(() => {
    if (!warmStatus) return "Warming…";
    if (!warmStatus.supervisor_configured) return "Local mode (no Supervisor)";
    if (warmStatus.warm) return `Supervisor warm (${warmStatus.latency_ms} ms)`;
    return `Supervisor cold — ${warmStatus.reason ?? "first request will pay cold-start"}`;
  }, [warmStatus]);

  return (
    <div className="flex h-[var(--page-h)] min-h-0 flex-col gap-2">
      <SectionCard
        title="Agent Bricks at work"
        description="Streaming, governed, evidence-led. Data only."
        className="flex-none"
        bodyClassName="p-3"
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {ARCH.map((a) => {
            const Icon = a.icon;
            return (
              <div
                key={a.label}
                className="rounded-md border border-border bg-surface px-2.5 py-2"
              >
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-deepNavy">
                  <Icon className="h-3 w-3 text-primaryBlue" />
                  {a.label}
                </div>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-ink-secondary">
                  {a.body}
                </p>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10.5px] text-ink-muted">
          <Bot className="h-3 w-3 text-primaryBlue" />
          {warmLabel}
          <span className="ml-auto inline-flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-primaryBlue" />
            Logged in{" "}
            <code className="rounded bg-[#F4F7FB] px-1 font-mono">ai_interaction_audit</code>
          </span>
        </div>
      </SectionCard>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-12">
        <div className="min-h-0 lg:col-span-3">
          <ChatHistorySidebar
            activeThreadId={activeThreadId}
            onSelectThread={setActiveThreadId}
            onNewThread={handleNewThread}
          />
        </div>
        <div className="min-h-0 lg:col-span-9">
          {activeThreadId ? (
            <AquaIQChat key={threadKey} threadId={activeThreadId} />
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-surface p-10 text-center text-[13px] text-ink-muted">
              Loading chat…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
