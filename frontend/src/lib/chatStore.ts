import type { Citation } from "./types";

/**
 * Local-only chat history (per-browser) for the AquaIQ assistant.
 *
 * Why localStorage and not the backend?
 *  - Demo speed: no extra round-trip on chat open.
 *  - The immutable audit trail in `ai_interaction_audit` already captures
 *    every interaction for governance — deleting a thread here does not
 *    delete the governance record (which is the right story).
 *
 * Storage layout: a single JSON document keyed by `STORAGE_KEY` containing
 * `{ threads: ChatThread[] }`. Threads are capped at MAX_THREADS with FIFO
 * eviction so we don't blow past the localStorage quota.
 */

const STORAGE_KEY = "seqwater.chats.v1";
const MAX_THREADS = 50;

export type TurnStatus = "pending" | "streaming" | "done" | "error";

export interface Turn {
  id: string;
  user: string;
  assistantMarkdown: string;
  status: TurnStatus;
  sources: Citation[];
  toolsUsed: string[];
  toolEvents: { name: string; args?: Record<string, unknown>; summary?: string }[];
  confidence?: "Low" | "Medium" | "High";
  traceId?: string;
  error?: string;
  createdAt: number;
}

export interface ChatThread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  turns: Turn[];
}

interface ChatStoreShape {
  threads: ChatThread[];
}

function read(): ChatStoreShape {
  if (typeof window === "undefined") return { threads: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { threads: [] };
    const parsed = JSON.parse(raw) as ChatStoreShape;
    if (!parsed.threads || !Array.isArray(parsed.threads)) return { threads: [] };
    return parsed;
  } catch {
    return { threads: [] };
  }
}

function write(state: ChatStoreShape) {
  if (typeof window === "undefined") return;
  try {
    if (state.threads.length > MAX_THREADS) {
      state.threads = state.threads
        .slice()
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, MAX_THREADS);
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    notify();
  } catch (err) {
    console.warn("[chatStore] failed to persist:", err);
  }
}

function id(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function autoTitle(question: string): string {
  const trimmed = question.replace(/\s+/g, " ").trim();
  if (!trimmed) return "New chat";
  return trimmed.length > 60 ? trimmed.slice(0, 57) + "…" : trimmed;
}

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* noop */
    }
  });
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) notify();
  });
}

export function listThreads(): ChatThread[] {
  return read().threads.slice().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getThread(id: string): ChatThread | undefined {
  return read().threads.find((t) => t.id === id);
}

export function createThread(seed?: { title?: string }): ChatThread {
  const now = Date.now();
  const thread: ChatThread = {
    id: id(),
    title: seed?.title || "New chat",
    createdAt: now,
    updatedAt: now,
    turns: [],
  };
  const state = read();
  state.threads.push(thread);
  write(state);
  return thread;
}

export function renameThread(threadId: string, title: string): void {
  const state = read();
  const t = state.threads.find((x) => x.id === threadId);
  if (!t) return;
  t.title = title.trim() || t.title;
  t.updatedAt = Date.now();
  write(state);
}

export function deleteThread(threadId: string): void {
  const state = read();
  state.threads = state.threads.filter((t) => t.id !== threadId);
  write(state);
}

export function appendTurn(
  threadId: string,
  partial: { user: string; turnId?: string },
): { thread: ChatThread; turn: Turn } {
  const state = read();
  const t = state.threads.find((x) => x.id === threadId);
  if (!t) throw new Error(`thread ${threadId} not found`);
  const turn: Turn = {
    id: partial.turnId ?? id(),
    user: partial.user,
    assistantMarkdown: "",
    status: "pending",
    sources: [],
    toolsUsed: [],
    toolEvents: [],
    createdAt: Date.now(),
  };
  t.turns.push(turn);
  t.updatedAt = turn.createdAt;
  if (t.turns.length === 1) {
    t.title = autoTitle(partial.user);
  }
  write(state);
  return { thread: t, turn };
}

export function updateTurn(
  threadId: string,
  turnId: string,
  patch: Partial<Turn>,
): void {
  const state = read();
  const t = state.threads.find((x) => x.id === threadId);
  if (!t) return;
  const turn = t.turns.find((x) => x.id === turnId);
  if (!turn) return;
  Object.assign(turn, patch);
  t.updatedAt = Date.now();
  write(state);
}

export function appendDelta(threadId: string, turnId: string, text: string): void {
  const state = read();
  const t = state.threads.find((x) => x.id === threadId);
  if (!t) return;
  const turn = t.turns.find((x) => x.id === turnId);
  if (!turn) return;
  turn.assistantMarkdown += text;
  turn.status = "streaming";
  t.updatedAt = Date.now();
  write(state);
}

export function appendToolEvent(
  threadId: string,
  turnId: string,
  evt: { name: string; args?: Record<string, unknown>; summary?: string },
): void {
  const state = read();
  const t = state.threads.find((x) => x.id === threadId);
  if (!t) return;
  const turn = t.turns.find((x) => x.id === turnId);
  if (!turn) return;
  turn.toolEvents.push(evt);
  if (evt.name && !turn.toolsUsed.includes(evt.name)) {
    turn.toolsUsed.push(evt.name);
  }
  t.updatedAt = Date.now();
  write(state);
}
