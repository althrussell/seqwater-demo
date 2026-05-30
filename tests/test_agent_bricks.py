"""Unit tests for the Supervisor streaming client (`backend.services.agent_bricks`).

The Supervisor is reachable only in databricks mode against a live Agent
Bricks endpoint. These tests exercise the pure-Python normalisation helpers
(no I/O) and the high-level `stream_supervisor` async generator with a
patched HTTP client. They also verify that the public surface degrades
gracefully when no supervisor is configured (the local-mode default).
"""
from __future__ import annotations

import asyncio
import json
from typing import AsyncIterator

import httpx
import pytest

from backend.services import agent_bricks as ab


# ---------------------------------------------------------------------------
# Pure-helper tests
# ---------------------------------------------------------------------------


def test_flatten_content_handles_strings_and_blocks() -> None:
    assert ab._flatten_content("hello") == "hello"
    assert ab._flatten_content(None) == ""
    assert ab._flatten_content([{"text": "a"}, {"text": "b"}]) == "ab"
    nested = [{"content": [{"text": "x"}, {"text": "y"}]}]
    assert ab._flatten_content(nested) == "xy"


def test_summarize_tool_args_parses_json_and_falls_back() -> None:
    assert ab._summarize_tool_args('{"a": 1}') == {"a": 1}
    assert ab._summarize_tool_args({"b": 2}) == {"b": 2}
    assert ab._summarize_tool_args("") == {}
    assert ab._summarize_tool_args("not-json") == {"raw": "not-json"}


def test_normalise_citations_handles_dicts_and_strings() -> None:
    items = ab._normalise_citations(
        [
            {"source": "main.seqwater_demo.assets", "detail": "demo"},
            "raw-string-citation",
            {"title": "doc.pdf", "snippet": "snippet text", "url": "/Volumes/x/y"},
        ]
    )
    assert {"source": "main.seqwater_demo.assets", "detail": "demo"} in items
    assert any(i["source"] == "raw-string-citation" for i in items)
    pdf = next(i for i in items if i["source"] == "doc.pdf")
    assert pdf["href"] == "/Volumes/x/y"
    assert "snippet" in pdf["detail"]


def test_infer_confidence_grades_evidence() -> None:
    assert ab._infer_confidence([], [], []) == "Low"
    assert ab._infer_confidence(["body"], [], []) == "Low"
    assert ab._infer_confidence(["body"], ["seqwater_data"], []) == "Medium"
    assert (
        ab._infer_confidence(
            ["body"],
            ["seqwater_data", "operational_docs"],
            [{"source": "x", "detail": ""}],
        )
        == "High"
    )


# ---------------------------------------------------------------------------
# Event normalisation
# ---------------------------------------------------------------------------


def _drain(gen) -> list[dict]:
    """Helper to drain an async generator and return all events."""

    async def _run() -> list[dict]:
        out: list[dict] = []
        async for evt in gen:
            out.append(evt)
        return out

    return asyncio.run(_run())


def test_normalise_event_emits_delta_for_content_chunk() -> None:
    pending: dict = {}
    accumulated: list[str] = []
    tools_used: list[str] = []
    sources_used: list[dict] = []

    chunk = {"choices": [{"delta": {"content": "## Summary\nhello"}}]}
    events = _drain(
        ab._normalise_event(
            chunk,
            accumulated=accumulated,
            tools_used=tools_used,
            sources_used=sources_used,
            pending_calls=pending,
        )
    )
    assert events == [{"event": "delta", "text": "## Summary\nhello"}]
    assert accumulated == ["## Summary\nhello"]


def test_normalise_event_emits_tool_call_then_result() -> None:
    pending: dict = {}
    accumulated: list[str] = []
    tools_used: list[str] = []
    sources_used: list[dict] = []

    name_chunk = {
        "choices": [
            {
                "delta": {
                    "tool_calls": [
                        {
                            "index": 0,
                            "function": {"name": "seqwater_data", "arguments": ""},
                        }
                    ]
                }
            }
        ]
    }
    args_chunk = {
        "choices": [
            {
                "delta": {
                    "tool_calls": [
                        {"index": 0, "function": {"arguments": '{"q":"top risks"}'}}
                    ]
                }
            }
        ]
    }
    finish_chunk = {"choices": [{"finish_reason": "tool_calls", "delta": {}}]}

    events: list[dict] = []
    for chunk in (name_chunk, args_chunk, finish_chunk):
        events.extend(
            _drain(
                ab._normalise_event(
                    chunk,
                    accumulated=accumulated,
                    tools_used=tools_used,
                    sources_used=sources_used,
                    pending_calls=pending,
                )
            )
        )

    kinds = [e["event"] for e in events]
    assert "tool_call" in kinds
    assert "tool_result" in kinds
    tc = next(e for e in events if e["event"] == "tool_call")
    assert tc["name"] == "seqwater_data"
    # The args dict accumulates across deltas — first emission may be empty,
    # but the tool_call is only emitted once and tools_used dedupes by name.
    assert tools_used == ["seqwater_data"]


def test_normalise_event_emits_sources_block() -> None:
    pending: dict = {}
    accumulated: list[str] = []
    tools_used: list[str] = []
    sources_used: list[dict] = []

    chunk = {
        "citations": [
            {"source": "doc1", "detail": "demo"},
            {"source": "doc2", "detail": "demo"},
        ]
    }
    events = _drain(
        ab._normalise_event(
            chunk,
            accumulated=accumulated,
            tools_used=tools_used,
            sources_used=sources_used,
            pending_calls=pending,
        )
    )
    assert len(events) == 1
    assert events[0]["event"] == "sources"
    assert {s["source"] for s in events[0]["items"]} == {"doc1", "doc2"}
    assert sources_used == events[0]["items"]


# ---------------------------------------------------------------------------
# stream_supervisor end-to-end with a stubbed HTTP transport
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_stream_supervisor_returns_nothing_when_unconfigured(monkeypatch) -> None:
    """If no supervisor endpoint is bound, the generator must yield nothing."""

    class _Settings:
        supervisor_configured = False
        databricks_supervisor_endpoint = None
        databricks_llm_temperature = 0.0
        databricks_llm_max_tokens = 1

    monkeypatch.setattr(ab, "get_settings", lambda: _Settings())

    out = [evt async for evt in ab.stream_supervisor(system_prompt="x", question="y")]
    assert out == []


@pytest.mark.asyncio
async def test_stream_supervisor_yields_done_with_aggregated_state(monkeypatch) -> None:
    """Drive the generator with a fake SSE response and check the terminal event."""

    sse_body = (
        'data: {"choices":[{"delta":{"content":"## Summary\\n"}}]}\n'
        'data: {"choices":[{"delta":{"content":"All.\\n"}}]}\n'
        'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":'
        '{"name":"seqwater_data","arguments":"{}"}}]}}]}\n'
        'data: {"choices":[{"finish_reason":"tool_calls","delta":{}}]}\n'
        'data: {"citations":[{"source":"main.seqwater_demo.assets","detail":"demo"}]}\n'
        "data: [DONE]\n"
    )

    class _Settings:
        supervisor_configured = True
        databricks_supervisor_endpoint = "seqwater_supervisor"
        databricks_llm_temperature = 0.1
        databricks_llm_max_tokens = 8

    monkeypatch.setattr(ab, "get_settings", lambda: _Settings())
    monkeypatch.setattr(
        ab,
        "_resolve_auth",
        lambda: ("https://example.cloud.databricks.com", {"Authorization": "Bearer x"}),
    )

    def _handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            headers={"content-type": "text/event-stream"},
            content=sse_body.encode("utf-8"),
        )

    transport = httpx.MockTransport(_handler)

    class _PatchedClient(httpx.AsyncClient):
        def __init__(self, *args, **kwargs) -> None:  # noqa: D401 - test shim
            kwargs["transport"] = transport
            super().__init__(*args, **kwargs)

    monkeypatch.setattr(ab.httpx, "AsyncClient", _PatchedClient)

    events: list[dict] = []
    async for evt in ab.stream_supervisor(system_prompt="sys", question="ask"):
        events.append(evt)

    kinds = [e.get("event") for e in events]
    assert "delta" in kinds
    assert "tool_call" in kinds
    assert "tool_result" in kinds
    assert "sources" in kinds
    assert kinds[-1] == "done"

    done = events[-1]
    assert done["human_validation_required"] is True
    assert done["synthetic_demo_flag"] is True
    assert "seqwater_data" in done["tools_used"]
    assert any(
        s["source"] == "main.seqwater_demo.assets" for s in done["sources_used"]
    )
    assert "Summary" in done["markdown"]
    assert done["confidence"] in {"Low", "Medium", "High"}


@pytest.mark.asyncio
async def test_prewarm_supervisor_returns_status(monkeypatch) -> None:
    class _Settings:
        supervisor_configured = True
        databricks_supervisor_endpoint = "seqwater_supervisor"

    monkeypatch.setattr(ab, "get_settings", lambda: _Settings())
    monkeypatch.setattr(
        ab,
        "_resolve_auth",
        lambda: ("https://example.cloud.databricks.com", {"Authorization": "Bearer x"}),
    )

    def _handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"id": "ok"})

    transport = httpx.MockTransport(_handler)

    class _PatchedClient(httpx.AsyncClient):
        def __init__(self, *args, **kwargs) -> None:  # noqa: D401 - test shim
            kwargs["transport"] = transport
            super().__init__(*args, **kwargs)

    monkeypatch.setattr(ab.httpx, "AsyncClient", _PatchedClient)

    result = await ab.prewarm_supervisor(timeout_s=5)
    assert result["warm"] is True
    assert result["status_code"] == 200
    assert isinstance(result["latency_ms"], int)


@pytest.mark.asyncio
async def test_prewarm_supervisor_skips_when_unconfigured(monkeypatch) -> None:
    class _Settings:
        supervisor_configured = False
        databricks_supervisor_endpoint = None

    monkeypatch.setattr(ab, "get_settings", lambda: _Settings())

    result = await ab.prewarm_supervisor(timeout_s=1)
    assert result == {"warm": False, "latency_ms": 0, "reason": "supervisor_not_configured"}
