/**
 * Cross-component bridge that lets any UI surface (KPI drawer, executive
 * priority card, etc.) request that the floating AquaIQ dock open and
 * auto-send a pre-canned question on behalf of the user.
 *
 * Two pieces of state are exposed:
 *
 *  1. Open the dock — implemented as a custom DOM event the dock listens
 *     for. The dock toggles its `open` state to `true` on receipt.
 *  2. Auto-send a pending question — held in an in-memory pub/sub plus a
 *     localStorage backstop. The dock subscribes; on receipt it forwards
 *     the question into the active chat thread which then streams the
 *     answer through the usual Supervisor/Genie/Knowledge-Assistant path.
 *
 * Why a bridge rather than props? The dock is mounted high up in the tree
 * and persistent across navigations. KPI cards live deep inside pages
 * that come and go. The cleanest contract is fire-and-forget: pages
 * dispatch `askAquaIQ(question)`, and the dock handles the rest.
 */

const ASK_EVENT = "aquaiq:ask";
const OPEN_EVENT = "aquaiq:open";
const PENDING_KEY = "seqwater.aquaiq.pending";

const pendingListeners = new Set<(question: string) => void>();

function notify(question: string) {
  pendingListeners.forEach((fn) => {
    try {
      fn(question);
    } catch {
      /* noop */
    }
  });
}

/**
 * Request that the AquaIQ dock open and immediately send `question` as
 * a new turn. Falls back to localStorage if the dock isn't yet mounted
 * (e.g. the user clicks an action during initial page load).
 */
export function askAquaIQ(question: string): void {
  const trimmed = question.trim();
  if (!trimmed) return;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(PENDING_KEY, trimmed);
    } catch {
      /* noop */
    }
    window.dispatchEvent(new CustomEvent(OPEN_EVENT));
    window.dispatchEvent(new CustomEvent(ASK_EVENT, { detail: trimmed }));
  }

  notify(trimmed);
}

/** Force the dock open without sending a question. */
export function openAquaIQ(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

/**
 * Subscribe to ask requests. Called by the dock. The handler is
 * responsible for actually sending the question to the chat thread.
 */
export function subscribeAsk(
  fn: (question: string) => void,
): () => void {
  pendingListeners.add(fn);

  if (typeof window !== "undefined") {
    const onAsk = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === "string" && detail.trim().length > 0) {
        fn(detail);
      }
    };
    window.addEventListener(ASK_EVENT, onAsk);
    return () => {
      window.removeEventListener(ASK_EVENT, onAsk);
      pendingListeners.delete(fn);
    };
  }

  return () => {
    pendingListeners.delete(fn);
  };
}

/** Subscribe to "open the dock" pings. */
export function subscribeOpen(fn: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handler = () => fn();
  window.addEventListener(OPEN_EVENT, handler);
  return () => {
    window.removeEventListener(OPEN_EVENT, handler);
  };
}

/**
 * If a question was queued before the dock listener attached, return it
 * and clear the slot. Called by the dock on mount.
 */
export function consumePendingQuestion(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(PENDING_KEY);
    if (!v) return null;
    window.localStorage.removeItem(PENDING_KEY);
    return v;
  } catch {
    return null;
  }
}
