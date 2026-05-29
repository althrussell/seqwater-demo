import type { ChatStreamEvent } from "./types";

export interface ChatStreamRequest {
  question: string;
  history?: { role: string; content: string }[];
  selected_asset_id?: string;
}

/**
 * POST to /api/ai/chat and yield typed NDJSON events as the stream arrives.
 *
 * Why a generator? Each line is one structured event ({"event":"delta",...} /
 * tool_call / tool_result / sources / done). We want React to consume them
 * incrementally so the UI streams live, while still keeping a typed contract
 * for the consumer.
 *
 * Cancellation: the caller passes an AbortSignal. When the user navigates
 * away or hits "New chat" mid-stream, we abort the underlying fetch so the
 * server-side `httpx.AsyncClient` cancels propagate cleanly.
 */
export async function* streamChat(
  body: ChatStreamRequest,
  signal?: AbortSignal,
): AsyncGenerator<ChatStreamEvent, void, void> {
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/x-ndjson, application/json",
    },
    body: JSON.stringify(body),
    signal,
    cache: "no-store",
  });

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => "");
    throw new Error(`POST /api/ai/chat → ${response.status}: ${text.slice(0, 200)}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let nl = buffer.indexOf("\n");
      while (nl !== -1) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (line) {
          try {
            yield JSON.parse(line) as ChatStreamEvent;
          } catch (err) {
            console.warn("[chatStream] dropped malformed line:", line, err);
          }
        }
        nl = buffer.indexOf("\n");
      }
    }
    const tail = buffer.trim();
    if (tail) {
      try {
        yield JSON.parse(tail) as ChatStreamEvent;
      } catch (err) {
        console.warn("[chatStream] dropped malformed tail:", tail, err);
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* noop */
    }
  }
}

export interface WarmStatus {
  warm: boolean;
  latency_ms: number;
  supervisor_configured: boolean;
  reason?: string;
  status_code?: number;
}

export async function warmAgent(): Promise<WarmStatus> {
  const res = await fetch("/api/agent/warm", { headers: { Accept: "application/json" } });
  if (!res.ok) {
    return {
      warm: false,
      latency_ms: 0,
      supervisor_configured: false,
      reason: `warm_failed_${res.status}`,
    };
  }
  return (await res.json()) as WarmStatus;
}
