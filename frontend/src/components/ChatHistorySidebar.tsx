import { useEffect, useState } from "react";
import { MessageSquarePlus, Pencil, Trash2 } from "lucide-react";
import {
  type ChatThread,
  deleteThread,
  listThreads,
  renameThread,
  subscribe,
} from "@/lib/chatStore";
import { cn } from "@/lib/utils";

interface Props {
  activeThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  onNewThread: () => void;
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} h ago`;
  return `${Math.floor(diff / 86_400_000)} d ago`;
}

export default function ChatHistorySidebar({
  activeThreadId,
  onSelectThread,
  onNewThread,
}: Props) {
  const [threads, setThreads] = useState<ChatThread[]>(() => listThreads());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  useEffect(() => {
    const unsub = subscribe(() => setThreads(listThreads()));
    return () => {
      unsub();
    };
  }, []);

  return (
    <aside className="flex h-full min-h-0 w-full flex-col gap-2 rounded-lg border border-border bg-surface p-3">
      <button
        onClick={onNewThread}
        className="btn-primary w-full justify-center text-[12.5px]"
      >
        <MessageSquarePlus className="h-4 w-4" />
        New chat
      </button>

      <div className="mt-1 text-[10.5px] font-semibold uppercase tracking-wider text-ink-muted">
        Recent chats ({threads.length})
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {threads.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-3 py-4 text-center text-[12px] text-ink-muted">
            No chats yet. Start a new conversation to begin.
          </div>
        ) : (
          <ul className="space-y-1">
            {threads.map((t) => {
              const isActive = t.id === activeThreadId;
              const isEditing = editingId === t.id;
              return (
                <li key={t.id}>
                  <div
                    className={cn(
                      "group flex items-start gap-2 rounded-md border px-2 py-1.5 text-[12.5px] transition",
                      isActive
                        ? "border-primaryBlue bg-[#E8F0FB]"
                        : "border-transparent bg-surface hover:border-border hover:bg-[#F4F7FB]",
                    )}
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => onSelectThread(t.id)}
                      onDoubleClick={() => {
                        setEditingId(t.id);
                        setEditingTitle(t.title);
                      }}
                    >
                      {isEditing ? (
                        <input
                          autoFocus
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={() => {
                            renameThread(t.id, editingTitle);
                            setEditingId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              renameThread(t.id, editingTitle);
                              setEditingId(null);
                            }
                            if (e.key === "Escape") {
                              setEditingId(null);
                            }
                          }}
                          className="w-full rounded border border-border bg-white px-1 py-0.5 text-[12.5px]"
                        />
                      ) : (
                        <div className="truncate font-medium text-deepNavy">
                          {t.title || "Untitled"}
                        </div>
                      )}
                      <div className="truncate text-[11px] text-ink-muted">
                        {t.turns.length} turn{t.turns.length === 1 ? "" : "s"} ·{" "}
                        {relativeTime(t.updatedAt)}
                      </div>
                    </button>
                    <div className="flex flex-none flex-col items-center gap-1 opacity-0 group-hover:opacity-100">
                      <button
                        title="Rename chat"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(t.id);
                          setEditingTitle(t.title);
                        }}
                        className="rounded p-1 text-ink-muted hover:bg-white hover:text-primaryBlue"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        title="Delete chat"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete "${t.title}"?`)) {
                            deleteThread(t.id);
                          }
                        }}
                        className="rounded p-1 text-ink-muted hover:bg-white hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="border-t border-border pt-2 text-[10.5px] text-ink-muted">
        Chats are stored in your browser only. The
        <code className="mx-1 rounded bg-[#F4F7FB] px-1 font-mono">ai_interaction_audit</code>
        table is the immutable governance record.
      </div>
    </aside>
  );
}
