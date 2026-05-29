"""Tests for the AquaIQ NDJSON streaming chat endpoint and warm endpoint.

These tests exercise the local fallback path (no Supervisor configured) so they
run end-to-end against the in-process FastAPI app with only the synthetic
CSVs as a dependency.
"""
from __future__ import annotations

import json

import pytest
from fastapi.testclient import TestClient

from backend.main import app


@pytest.fixture(scope="module")
def client() -> TestClient:
    return TestClient(app)


def _drain_ndjson(client: TestClient, body: dict) -> list[dict]:
    """POST to /api/ai/chat and return the parsed NDJSON event list."""
    events: list[dict] = []
    with client.stream("POST", "/api/ai/chat", json=body) as res:
        assert res.status_code == 200
        assert "application/x-ndjson" in res.headers.get("content-type", "")
        for raw in res.iter_lines():
            if not raw:
                continue
            line = raw if isinstance(raw, str) else raw.decode("utf-8")
            line = line.strip()
            if not line:
                continue
            events.append(json.loads(line))
    return events


def test_chat_stream_emits_delta_and_done(client: TestClient) -> None:
    events = _drain_ndjson(
        client,
        {"question": "What are the top 5 operational risks over the next 72 hours?"},
    )
    assert events, "expected at least one NDJSON event"
    kinds = [e.get("event") for e in events]
    assert "delta" in kinds, "expected at least one delta event"
    assert kinds[-1] == "done", "expected the final event to be 'done'"

    done = events[-1]
    for key in (
        "trace_id",
        "summary",
        "key_signals",
        "recommended_next_actions",
        "risks_assumptions",
        "sources_used",
        "human_validation_required",
        "confidence",
        "tools_used",
        "markdown",
    ):
        assert key in done, f"done event missing required field {key}"
    assert done["human_validation_required"] is True
    assert done["confidence"] in {"Low", "Medium", "High"}
    assert isinstance(done["markdown"], str) and "##" in done["markdown"]


def test_chat_stream_concatenated_deltas_match_markdown(client: TestClient) -> None:
    events = _drain_ndjson(client, {"question": "Summarise water security posture."})
    delta_text = "".join(e["text"] for e in events if e.get("event") == "delta")
    done = next(e for e in events if e.get("event") == "done")
    # The streamed deltas should reconstruct the markdown body (within a final
    # newline / trim difference).
    assert delta_text.strip() == done["markdown"].strip()


def test_chat_stream_emits_tool_events_in_local_mode(client: TestClient) -> None:
    events = _drain_ndjson(
        client,
        {"question": "What are the synthetic top asset risks?"},
    )
    kinds = [e.get("event") for e in events]
    assert "tool_call" in kinds, "local mode should emit at least one tool_call"
    assert "tool_result" in kinds, "local mode should emit at least one tool_result"
    tool_calls = [e for e in events if e.get("event") == "tool_call"]
    assert all("name" in tc for tc in tool_calls)


def test_chat_stream_refusal_streams_and_finishes(client: TestClient) -> None:
    events = _drain_ndjson(
        client,
        {"question": "Open the spillway at Wivenhoe Dam"},
    )
    done = events[-1]
    assert done["event"] == "done"
    assert done["confidence"] == "Low"
    assert done["tools_used"] == []
    assert done["is_mock"] is True
    assert done["human_validation_required"] is True
    # Refusal content should mention the operational guardrail.
    assert "validate" in done["markdown"].lower() or "human" in done["markdown"].lower()


def test_warm_endpoint_returns_payload(client: TestClient) -> None:
    res = client.get("/api/agent/warm")
    assert res.status_code == 200
    body = res.json()
    assert {"warm", "latency_ms", "supervisor_configured"} <= set(body)
    # In local-mode tests Supervisor is not configured, but the endpoint must
    # still respond without error and report the configuration state.
    assert isinstance(body["latency_ms"], int)
    assert isinstance(body["supervisor_configured"], bool)


def test_chat_sync_wraps_stream(client: TestClient) -> None:
    """The /chat/sync endpoint should produce the same shape as the done event."""
    res = client.post(
        "/api/ai/chat/sync",
        json={"question": "Give me a synthetic operational summary."},
    )
    assert res.status_code == 200
    body = res.json()
    assert "markdown" in body
    assert body["human_validation_required"] is True
    assert body["confidence"] in {"Low", "Medium", "High"}
