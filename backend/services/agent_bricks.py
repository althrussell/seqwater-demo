"""Streaming client for the Seqwater Supervisor Agent (Databricks Agent Bricks).

The Supervisor is a Databricks Model Serving endpoint exposing the standard
OpenAI-compatible chat completions API. We open a streaming POST against
``/serving-endpoints/{name}/invocations`` with ``stream: true`` and translate
the SSE-flavoured chunks back into a stream of typed event dictionaries.

Public surface
--------------

* :func:`stream_supervisor` — async generator yielding ``{"event": ...}``
  dicts. Event types:

    * ``{"event": "delta", "text": str}`` — token chunk to append to the
      assistant markdown body.
    * ``{"event": "tool_call", "name": str, "args": dict}`` — supervisor
      routed to a child agent.
    * ``{"event": "tool_result", "name": str, "summary": str}`` — child agent
      returned. Synthetic placeholder when the upstream omits it.
    * ``{"event": "sources", "items": list[dict]}`` — aggregated source
      citations (Volume files for KA, table refs for Genie).
    * ``{"event": "done", "trace_id": ..., "markdown": ...,
      "tools_used": [...], "sources_used": [...], "confidence": ...,
      "human_validation_required": True}`` — terminal event.

* :func:`prewarm_supervisor` — fire-and-forget 1-token ping used at FastAPI
  startup to avoid cold-start on the first user question.

Authentication mirrors :mod:`backend.services.llm`: we resolve a host and
auth headers via the Databricks SDK ``Config()`` wherever it's available.
"""
from __future__ import annotations

import asyncio
import json
import logging
import time
import uuid
from typing import Any, AsyncIterator

import httpx

from backend.config import get_settings

LOG = logging.getLogger(__name__)


def _resolve_auth() -> tuple[str | None, dict[str, str] | None]:
    s = get_settings()
    try:
        from databricks.sdk.core import Config  # type: ignore
    except ImportError:  # pragma: no cover
        if s.databricks_host and s.databricks_token:
            return s.databricks_host.rstrip("/"), {
                "Authorization": f"Bearer {s.databricks_token}",
                "Content-Type": "application/json",
            }
        return None, None

    try:
        cfg = Config(host=s.databricks_host, token=s.databricks_token)
        host = (cfg.host or s.databricks_host or "").rstrip("/")
        if not host:
            return None, None
        headers: dict[str, str] = {"Content-Type": "application/json"}
        headers.update(cfg.authenticate())
        return host, headers
    except Exception as exc:  # pragma: no cover
        LOG.warning("Could not resolve Databricks SDK auth: %s", exc)
        return None, None


def _build_messages(
    *, system_prompt: str, history: list[dict[str, Any]] | None, question: str
) -> list[dict[str, str]]:
    msgs: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]
    for turn in history or []:
        role = turn.get("role")
        content = turn.get("content")
        if role in ("user", "assistant", "system") and isinstance(content, str):
            msgs.append({"role": role, "content": content})
    msgs.append({"role": "user", "content": question})
    return msgs


def _flatten_content(content: Any) -> str:
    """Coerce OpenAI-style structured content blocks into a single string."""
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        chunks: list[str] = []
        for item in content:
            if isinstance(item, dict):
                if "text" in item:
                    chunks.append(str(item["text"]))
                elif "content" in item:
                    chunks.append(_flatten_content(item["content"]))
            elif isinstance(item, str):
                chunks.append(item)
        return "".join(chunks)
    return str(content)


def _summarize_tool_args(args: Any) -> dict[str, Any]:
    if isinstance(args, str):
        try:
            return json.loads(args) if args.strip() else {}
        except json.JSONDecodeError:
            return {"raw": args[:200]}
    if isinstance(args, dict):
        return args
    return {}


# ---------------------------------------------------------------------------
# Streaming
# ---------------------------------------------------------------------------


async def stream_supervisor(
    *,
    system_prompt: str,
    question: str,
    history: list[dict[str, Any]] | None = None,
    timeout_s: float = 120.0,
) -> AsyncIterator[dict[str, Any]]:
    """Stream events from the Supervisor endpoint.

    If the endpoint is not configured or the call fails, yields nothing — the
    caller is responsible for falling back to the local deterministic path.
    Always yields a terminal ``done`` event when it does run.
    """
    s = get_settings()
    if not s.supervisor_configured:
        return  # type: ignore[return-value]

    host, headers = _resolve_auth()
    if not host or not headers:
        return  # type: ignore[return-value]

    url = f"{host}/serving-endpoints/{s.databricks_supervisor_endpoint}/invocations"
    body = {
        "messages": _build_messages(
            system_prompt=system_prompt, history=history, question=question
        ),
        "temperature": s.databricks_llm_temperature,
        "max_tokens": s.databricks_llm_max_tokens,
        "stream": True,
    }
    trace_id = f"aquaiq-{uuid.uuid4().hex[:12]}"

    accumulated: list[str] = []
    tools_used: list[str] = []
    sources_used: list[dict[str, Any]] = []
    pending_calls: dict[str, dict[str, Any]] = {}

    try:
        async with httpx.AsyncClient(timeout=timeout_s) as client:
            async with client.stream("POST", url, headers=headers, json=body) as response:
                if response.status_code >= 400:
                    text = (await response.aread()).decode(errors="replace")
                    LOG.warning(
                        "Supervisor stream HTTP %s: %s", response.status_code, text[:400]
                    )
                    return  # type: ignore[return-value]

                content_type = response.headers.get("content-type", "")
                if "text/event-stream" in content_type or "stream" in content_type:
                    async for event in _consume_sse(response):
                        async for normalised in _normalise_event(
                            event,
                            accumulated=accumulated,
                            tools_used=tools_used,
                            sources_used=sources_used,
                            pending_calls=pending_calls,
                        ):
                            yield normalised
                else:
                    payload = json.loads(await response.aread())
                    async for normalised in _normalise_event(
                        payload,
                        accumulated=accumulated,
                        tools_used=tools_used,
                        sources_used=sources_used,
                        pending_calls=pending_calls,
                    ):
                        yield normalised
    except (httpx.TimeoutException, httpx.HTTPError) as exc:  # pragma: no cover
        LOG.warning("Supervisor stream failed: %s", exc)
        return  # type: ignore[return-value]

    yield {
        "event": "done",
        "trace_id": trace_id,
        "markdown": "".join(accumulated).strip(),
        "tools_used": tools_used,
        "sources_used": sources_used,
        "confidence": _infer_confidence(accumulated, tools_used, sources_used),
        "human_validation_required": True,
        "synthetic_demo_flag": True,
    }


async def _consume_sse(response: httpx.Response) -> AsyncIterator[dict[str, Any]]:
    """Yield JSON payloads from a server-sent-events response."""
    buffer = ""
    async for chunk in response.aiter_text():
        buffer += chunk
        while "\n" in buffer:
            line, buffer = buffer.split("\n", 1)
            line = line.strip()
            if not line:
                continue
            if line.startswith(":"):
                continue
            if line.startswith("data:"):
                data = line[len("data:") :].strip()
                if data == "[DONE]":
                    return
                try:
                    yield json.loads(data)
                except json.JSONDecodeError:
                    continue


async def _normalise_event(
    event: dict[str, Any],
    *,
    accumulated: list[str],
    tools_used: list[str],
    sources_used: list[dict[str, Any]],
    pending_calls: dict[str, dict[str, Any]],
) -> AsyncIterator[dict[str, Any]]:
    """Translate an upstream chunk into our typed event(s)."""
    if not isinstance(event, dict):
        return

    choices = event.get("choices") or []
    if not choices:
        choices = [{"delta": event.get("delta") or {}, "message": event.get("message")}]

    for choice in choices:
        delta = choice.get("delta") or {}
        message = choice.get("message") or {}

        text_chunk = ""
        if "content" in delta:
            text_chunk = _flatten_content(delta.get("content"))
        elif "content" in message:
            text_chunk = _flatten_content(message.get("content"))
        if text_chunk:
            accumulated.append(text_chunk)
            yield {"event": "delta", "text": text_chunk}

        tool_calls = delta.get("tool_calls") or message.get("tool_calls") or []
        for tc in tool_calls:
            tc_id = str(tc.get("index", tc.get("id", id(tc))))
            entry = pending_calls.setdefault(
                tc_id,
                {"name": "", "arguments": "", "emitted": False},
            )
            fn = tc.get("function") or {}
            if fn.get("name"):
                entry["name"] = fn["name"]
            if fn.get("arguments"):
                entry["arguments"] += fn["arguments"]

            if entry["name"] and not entry["emitted"]:
                entry["emitted"] = True
                if entry["name"] not in tools_used:
                    tools_used.append(entry["name"])
                yield {
                    "event": "tool_call",
                    "name": entry["name"],
                    "args": _summarize_tool_args(entry["arguments"]),
                }

        finish_reason = choice.get("finish_reason")
        if finish_reason == "tool_calls":
            for tc_id, entry in pending_calls.items():
                if entry["name"]:
                    yield {
                        "event": "tool_result",
                        "name": entry["name"],
                        "summary": "Synthetic tool returned.",
                    }

    citations = event.get("citations") or event.get("sources")
    if citations:
        items = _normalise_citations(citations)
        for item in items:
            if item not in sources_used:
                sources_used.append(item)
        if items:
            yield {"event": "sources", "items": items}


def _normalise_citations(citations: Any) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    if isinstance(citations, list):
        for c in citations:
            if isinstance(c, dict):
                source = c.get("source") or c.get("title") or c.get("name") or "synthetic source"
                detail = c.get("detail") or c.get("snippet") or ""
                href = c.get("href") or c.get("url")
                entry: dict[str, Any] = {"source": str(source), "detail": str(detail)[:240]}
                if href:
                    entry["href"] = href
                out.append(entry)
            elif isinstance(c, str):
                out.append({"source": c, "detail": ""})
    return out


def _infer_confidence(
    accumulated: list[str],
    tools_used: list[str],
    sources_used: list[dict[str, Any]],
) -> str:
    if not accumulated:
        return "Low"
    if not tools_used and not sources_used:
        return "Low"
    if len(tools_used) >= 2 and sources_used:
        return "High"
    return "Medium"


# ---------------------------------------------------------------------------
# Pre-warm
# ---------------------------------------------------------------------------


async def prewarm_supervisor(timeout_s: float = 30.0) -> dict[str, Any]:
    """Send a 1-token ping to keep the Supervisor endpoint hot.

    Returns ``{"warm": bool, "latency_ms": int}``. Safe to call repeatedly;
    the endpoint owns its own warm-pool.
    """
    s = get_settings()
    if not s.supervisor_configured:
        return {"warm": False, "latency_ms": 0, "reason": "supervisor_not_configured"}

    host, headers = _resolve_auth()
    if not host or not headers:
        return {"warm": False, "latency_ms": 0, "reason": "auth_unavailable"}

    url = f"{host}/serving-endpoints/{s.databricks_supervisor_endpoint}/invocations"
    body = {
        "messages": [
            {"role": "system", "content": "ping"},
            {"role": "user", "content": "ping"},
        ],
        "max_tokens": 1,
        "temperature": 0,
    }

    started = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=timeout_s) as client:
            response = await client.post(url, headers=headers, json=body)
        latency_ms = int((time.monotonic() - started) * 1000)
        return {
            "warm": response.status_code < 500,
            "latency_ms": latency_ms,
            "status_code": response.status_code,
        }
    except Exception as exc:  # pragma: no cover
        latency_ms = int((time.monotonic() - started) * 1000)
        LOG.info("Supervisor pre-warm skipped: %s", exc)
        return {"warm": False, "latency_ms": latency_ms, "reason": str(exc)[:120]}


def schedule_prewarm() -> None:
    """Best-effort fire-and-forget pre-warm; safe to call from FastAPI startup."""
    s = get_settings()
    if not s.supervisor_configured:
        return
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        return
    loop.create_task(prewarm_supervisor())
