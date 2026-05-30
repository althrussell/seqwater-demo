"""AquaIQ — governed operational intelligence assistant.

Two execution paths:

* **Supervisor path** (``settings.supervisor_configured`` is True): stream the
  AquaIQ answer from the Databricks Agent Bricks Supervisor endpoint. The
  supervisor itself orchestrates the Knowledge Assistant (operational
  documents), the Genie space (SEQ Water Grid tables), and three
  UC functions (top_asset_risks, capital_priorities, run_flood_scenario).

* **Local path** (default): assemble a deterministic markdown answer from the
  Python tools in :mod:`backend.agents.tools` plus TF-IDF retrieval over the
 markdown corpus. Drives offline demos and tests.

Both paths produce the same shape of events
(``delta`` / ``tool_call`` / ``tool_result`` / ``sources`` / ``done``)
and the same final ``ChatResponse`` schema, including the new ``markdown``
body. Guardrails (refusal patterns) and the MLflow / CSV trace pipeline are
preserved verbatim from the prior implementation.
"""
from __future__ import annotations

import asyncio
import logging
import re
import uuid
from datetime import datetime, timezone
from typing import Any, AsyncIterator

from backend.agents.retrieval import retrieve_documents
from backend.agents.tools import TOOLS
from backend.config import get_settings

LOG = logging.getLogger(__name__)


SYSTEM_PROMPT = """You are AquaIQ, a governed operational intelligence assistant for the Seqwater AI Command Centre demo.

Hard rules:
- All data is demo data. Never claim it is real Seqwater data.
- Never recommend real-world operational instructions, releases, or restrictions.
- Never invent regulatory thresholds or quote real-world public health advice.
- If the user asks for an operational decision, refuse and require human validation.
- Always cite which data sources or documents you used.
- Always state confidence and assumptions.
- Always state when human validation is required.

Always respond in well-formed GitHub-flavoured markdown using H2 headings for the six required sections:

## Summary
## Key signals
## Recommended next actions
## Risks / assumptions
## Sources used
## Human validation required

Use bullet lists, ordered lists, and GFM tables where appropriate. Never emit raw JSON or plain text without markdown.
"""


REFUSAL_PATTERNS = [
    r"\bopen the (gates|spillway)\b",
    r"\brelease water\b",
    r"\bissue a boil[- ]water\b",
    r"\bshut\s*down\b",
    r"\bauthorise\b",
    r"\bauthoris[ae] the\b",
    r"\bapprove the (release|capital|spend)\b",
]


def _looks_like_unsafe_request(question: str) -> bool:
    q = question.lower()
    return any(re.search(p, q) for p in REFUSAL_PATTERNS)


def _route_tools(question: str) -> list[str]:
    q = question.lower()
    tools: list[str] = []
    if any(k in q for k in ["overview", "posture", "status", "what changed",
                             "since yesterday", "summary", "next 72", "next 48",
                             "next 24", "operational risk", "this week",
                             "executive attention", "executive team"]):
        tools.append("get_overview")
    if any(k in q for k in ["risk", "asset", "executive attention", "top 5", "top five"]):
        tools.append("get_top_asset_risks")
    if any(k in q for k in ["security", "supply", "rainfall", "demand", "storage", "reliable"]):
        tools.append("get_water_security_summary")
    if any(k in q for k in ["water quality", "turbidity", "ph ", "chlorine", "treatment"]):
        tools.append("get_water_quality_alerts")
    if any(k in q for k in ["flood", "scenario", "release", "catchment"]):
        tools.append("run_flood_readiness_scenario")
    if any(k in q for k in ["capital", "investment", "project", "spend"]):
        tools.append("get_capital_priorities")
    if not tools:
        tools.append("get_overview")
    seen, ordered = set(), []
    for t in tools:
        if t not in seen:
            seen.add(t)
            ordered.append(t)
    return ordered


# ---------------------------------------------------------------------------
# Tracing
# ---------------------------------------------------------------------------


def log_trace(record: dict[str, Any]) -> None:
    """Persist a structured trace.

    Always logs to local memory + a CSV file for the Governance page. If MLflow
    is configured, also emits a span via mlflow.
    """
    try:
        import csv

        from backend.config import ROOT_DIR
        path = ROOT_DIR / "data" / "synthetic" / "ai_interaction_audit.csv"
        path.parent.mkdir(parents=True, exist_ok=True)
        write_header = not path.exists()
        with path.open("a", newline="", encoding="utf-8") as f:
            cols = [
                "trace_id", "user_id", "timestamp", "question", "tools_used",
                "sources_used", "confidence", "response_summary",
                "human_validation_required", "synthetic_demo_flag",
            ]
            writer = csv.DictWriter(f, fieldnames=cols)
            if write_header:
                writer.writeheader()
            writer.writerow({c: record.get(c, "") for c in cols})
    except Exception as exc:  # pragma: no cover
        LOG.warning("Trace write failed: %s", exc)

    settings = get_settings()
    if settings.mlflow_tracking_uri:
        try:
            import mlflow  # type: ignore

            mlflow.set_tracking_uri(settings.mlflow_tracking_uri)
            mlflow.set_experiment(settings.mlflow_experiment_name)
            with mlflow.start_run(run_name=record.get("trace_id", "aquaiq")) as run:
                mlflow.log_dict(record, "trace.json")
                mlflow.log_text(record.get("response_summary", ""), "response.md")
                mlflow.set_tags({"app": "seqwater-aquaiq", "demo": "true"})
                LOG.info("Logged AquaIQ trace to MLflow run %s", run.info.run_id)
        except Exception as exc:  # pragma: no cover
            LOG.warning("MLflow logging failed: %s", exc)


# ---------------------------------------------------------------------------
# Local-mode response composition
# ---------------------------------------------------------------------------


def _compose_local_parts(
    question: str,
    tool_outputs: dict[str, Any],
    retrieved: list[dict[str, Any]],
) -> dict[str, Any]:
    summary_parts: list[str] = []
    key_signals: list[str] = []
    actions: list[str] = []
    risks_assumptions = [
        "All values are demo data and not real Seqwater operational data.",
        "Forecasts and risk scores are illustrative and must be validated by qualified personnel.",
    ]
    sources: list[dict[str, Any]] = []

    if "get_overview" in tool_outputs:
        o = tool_outputs["get_overview"]["data"]
        summary_parts.append(o["ai_executive_summary"])
        key_signals.append(
            f"72-hour risk band: {o['seventy_two_hour_risk']}."
        )
        key_signals.append(
            f"Storage at {o['storage_percent']}% across the SEQ Water Grid."
        )
        actions.extend(o["top_actions"][:3])
        sources.append({"source": "main.seqwater_demo.asset_risk_scores", "detail": "Asset risk scoreboard"})
        sources.append({"source": "main.seqwater_demo.dam_storage_daily", "detail": "Daily storage trend"})

    if "get_water_security_summary" in tool_outputs:
        s = tool_outputs["get_water_security_summary"]["data"]
        key_signals.append(
            f"Mean 72h rainfall forecast: {s['forecast_rainfall_mm_72h_avg']} mm."
        )
        if s.get("transfers"):
            key_signals.append(
                f"{len(s['transfers'])} grid transfer recommendations are available."
            )
        sources.append({"source": "main.seqwater_demo.rainfall_forecast", "detail": "Catchment rainfall forecast"})
        sources.append({"source": "main.seqwater_demo.demand_forecast", "detail": "Demand baseline"})

    if "get_top_asset_risks" in tool_outputs:
        risks = tool_outputs["get_top_asset_risks"]["data"]
        if risks:
            key_signals.append(
                f"Top risk: {risks[0]['asset_name']} ({risks[0]['risk_band']}, "
                f"score {risks[0]['risk_score']:.2f})."
            )
            for r in risks[:3]:
                actions.append(
                    f"Review {r['asset_name']}: {r['recommended_action']}"
                )
        sources.append({"source": "main.seqwater_demo.asset_risk_scores", "detail": "Top asset risks"})

    if "get_water_quality_alerts" in tool_outputs:
        q = tool_outputs["get_water_quality_alerts"]["data"]
        key_signals.append(
            f"Water quality: {q['elevated_count']} elevated, {q['watch_count']} watch."
        )
        if q.get("turbidity_events"):
            key_signals.append(
                f"{len(q['turbidity_events'])} turbidity events detected."
            )
        actions.append(
            "Ask water quality lead to validate analyser calibration and treatment margins."
        )
        sources.append({"source": "main.seqwater_demo.water_quality_samples", "detail": "Sample register"})

    if "run_flood_readiness_scenario" in tool_outputs:
        s = tool_outputs["run_flood_readiness_scenario"]["data"]
        if s:
            key_signals.append(
                f"Scenario {s.get('scenario_name')}: projected storage "
                f"{s.get('projected_storage_percent')}%, downstream impact "
                f"{s.get('downstream_impact_score')}."
            )
            actions.append(
                "Confirm scenario assumptions with duty hydrologist."
            )
            risks_assumptions.append(
                "Flood scenario is illustrative only; not an operational release model."
            )
        sources.append({"source": "main.seqwater_demo.flood_scenarios", "detail": "Scenario register"})

    if "get_capital_priorities" in tool_outputs:
        projects = tool_outputs["get_capital_priorities"]["data"]
        if projects:
            top = projects[0]
            key_signals.append(
                f"Top capital option: {top['project_name']} (priority {top['recommended_priority']}, "
                f"risk reduction {top['risk_reduction_score']:.2f})."
            )
        sources.append({"source": "main.seqwater_demo.capital_projects", "detail": "Capital options"})

    for r in retrieved:
        sources.append({
            "source": r["title"],
            "detail": r["text"][:200] + ("…" if len(r["text"]) > 200 else ""),
            "href": r.get("href"),
        })

    if not summary_parts:
        summary_parts.append(
            "Posture appears stable. Continue routine monitoring and validate with operations."
        )
    if not actions:
        actions.append("Continue routine monitoring.")

    return {
        "summary": " ".join(summary_parts),
        "key_signals": key_signals[:6],
        "recommended_next_actions": actions[:6],
        "risks_assumptions": risks_assumptions,
        "sources_used": sources,
    }


def _format_markdown(parts: dict[str, Any]) -> str:
    """Render the structured response into the canonical six-section markdown."""
    lines: list[str] = []
    lines.append("## Summary")
    lines.append("")
    lines.append(parts["summary"])
    lines.append("")

    lines.append("## Key signals")
    lines.append("")
    if parts["key_signals"]:
        for k in parts["key_signals"]:
            lines.append(f"- {k}")
    else:
        lines.append("- No notable signals.")
    lines.append("")

    lines.append("## Recommended next actions")
    lines.append("")
    if parts["recommended_next_actions"]:
        for i, a in enumerate(parts["recommended_next_actions"], start=1):
            lines.append(f"{i}. {a}")
    else:
        lines.append("1. Continue routine monitoring.")
    lines.append("")

    lines.append("## Risks / assumptions")
    lines.append("")
    for r in parts["risks_assumptions"]:
        lines.append(f"- {r}")
    lines.append("")

    lines.append("## Sources used")
    lines.append("")
    if parts["sources_used"]:
        lines.append("| Source | Detail |")
        lines.append("|---|---|")
        for s in parts["sources_used"]:
            source = str(s.get("source", "")).replace("|", "\\|")
            detail = str(s.get("detail", "")).replace("|", "\\|").replace("\n", " ")
            if len(detail) > 220:
                detail = detail[:217] + "…"
            lines.append(f"| {source} | {detail} |")
    else:
        lines.append("- No sources referenced.")
    lines.append("")

    lines.append("## Human validation required")
    lines.append("")
    lines.append(
        "Yes — this is demo output. A qualified human must validate "
        "before any operational use."
    )
    return "\n".join(lines).rstrip() + "\n"


def _legacy_answer_text(parts: dict[str, Any]) -> str:
    """Backwards-compatible plain-text rendering for the ``answer`` field."""
    lines = ["Summary", parts["summary"], "", "Key signals"]
    lines.extend(f"- {k}" for k in parts["key_signals"])
    lines.append("")
    lines.append("Recommended next actions")
    for i, a in enumerate(parts["recommended_next_actions"], start=1):
        lines.append(f"{i}. {a}")
    lines.append("")
    lines.append("Risks / assumptions")
    lines.extend(f"- {r}" for r in parts["risks_assumptions"])
    lines.append("")
    lines.append("Sources used")
    for s in parts["sources_used"]:
        lines.append(f"- {s['source']} — {s['detail']}")
    lines.append("")
    lines.append("Human validation required")
    lines.append(
        "Yes — this is demo output. A qualified human must validate "
        "before any operational use."
    )
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Streaming
# ---------------------------------------------------------------------------


_REFUSAL_PARTS: dict[str, Any] = {
    "summary": (
        "AquaIQ will not recommend or authorise operational decisions in this demo. "
        "All outputs require qualified human review."
    ),
    "key_signals": [
        "Request appears to ask for an operational decision.",
        "Demo is restricted to decision-support summaries only.",
    ],
    "recommended_next_actions": [
        "Engage the appropriate Seqwater operational role for this decision.",
        "Use AquaIQ to summarise context only.",
    ],
    "risks_assumptions": [
        "AquaIQ is a demo assistant.",
        "It cannot authorise releases, restrictions, or other operational changes.",
    ],
    "sources_used": [
        {"source": "AquaIQ guardrail policy", "detail": "Refuse operational authorisation requests."},
    ],
}


async def stream_answer(
    question: str,
    *,
    history: list[dict[str, Any]] | None = None,
    selected_asset_id: str | None = None,
) -> AsyncIterator[dict[str, Any]]:
    """Yield typed events for an AquaIQ answer.

    Events:

    * ``{"event": "delta", "text": str}`` — markdown chunk to append.
    * ``{"event": "tool_call", "name": str, "args": dict}``
    * ``{"event": "tool_result", "name": str, "summary": str}``
    * ``{"event": "sources", "items": list[dict]}``
    * ``{"event": "done", ...}`` — terminal event with the full response.
    """
    settings = get_settings()
    trace_id = f"aquaiq-{uuid.uuid4().hex[:12]}"
    started_at = datetime.now(timezone.utc).isoformat()

    if _looks_like_unsafe_request(question):
        markdown = _format_markdown(_REFUSAL_PARTS)
        # Stream the refusal as deltas so the UX matches a normal answer.
        for chunk in _split_for_stream(markdown):
            yield {"event": "delta", "text": chunk}
            await asyncio.sleep(0)
        result = {
            "trace_id": trace_id,
            "answer": _legacy_answer_text(_REFUSAL_PARTS),
            "markdown": markdown,
            "summary": _REFUSAL_PARTS["summary"],
            "key_signals": _REFUSAL_PARTS["key_signals"],
            "recommended_next_actions": _REFUSAL_PARTS["recommended_next_actions"],
            "risks_assumptions": _REFUSAL_PARTS["risks_assumptions"],
            "sources_used": _REFUSAL_PARTS["sources_used"],
            "human_validation_required": True,
            "confidence": "Low",
            "tools_used": [],
            "is_mock": True,
            "synthetic_demo_flag": True,
        }
        yield {"event": "sources", "items": _REFUSAL_PARTS["sources_used"]}
        yield {"event": "done", **result}
        log_trace(
            {
                "trace_id": trace_id,
                "user_id": "demo.user@seqwater.demo",
                "timestamp": started_at,
                "question": question,
                "tools_used": "guardrail_refusal",
                "sources_used": "AquaIQ guardrail policy",
                "confidence": "Low",
                "response_summary": _REFUSAL_PARTS["summary"][:500],
                "human_validation_required": True,
                "synthetic_demo_flag": True,
            }
        )
        return

    if settings.supervisor_configured:
        async for evt in _stream_via_supervisor(
            question, history=history, trace_id=trace_id, started_at=started_at
        ):
            yield evt
        return

    async for evt in _stream_local(
        question, history=history, trace_id=trace_id, started_at=started_at
    ):
        yield evt


async def _stream_via_supervisor(
    question: str,
    *,
    history: list[dict[str, Any]] | None,
    trace_id: str,
    started_at: str,
) -> AsyncIterator[dict[str, Any]]:
    """Run the question through the Databricks Agent Bricks Supervisor."""
    from backend.services.agent_bricks import stream_supervisor

    accumulated: list[str] = []
    tools_used: list[str] = []
    sources_used: list[dict[str, Any]] = []
    upstream_done: dict[str, Any] | None = None
    received_anything = False

    try:
        async for event in stream_supervisor(
            system_prompt=SYSTEM_PROMPT, question=question, history=history
        ):
            received_anything = True
            kind = event.get("event")
            if kind == "delta":
                accumulated.append(event.get("text", ""))
                yield event
            elif kind == "tool_call":
                name = event.get("name", "")
                if name and name not in tools_used:
                    tools_used.append(name)
                yield event
            elif kind == "tool_result":
                yield event
            elif kind == "sources":
                items = event.get("items") or []
                for item in items:
                    if item not in sources_used:
                        sources_used.append(item)
                yield event
            elif kind == "done":
                upstream_done = event
                break
    except Exception as exc:  # pragma: no cover
        LOG.warning("Supervisor streaming failed; falling back to local: %s", exc)
        received_anything = False

    if not received_anything or not accumulated:
        LOG.info("Supervisor returned nothing; falling back to local AquaIQ path.")
        async for evt in _stream_local(
            question, history=history, trace_id=trace_id, started_at=started_at
        ):
            yield evt
        return

    markdown = (upstream_done.get("markdown") if upstream_done else None) or "".join(
        accumulated
    ).strip()
    confidence = (upstream_done.get("confidence") if upstream_done else None) or "Medium"
    parts = _parts_from_markdown(markdown, sources_used)
    result = {
        "trace_id": trace_id,
        "answer": _legacy_answer_text(parts),
        "markdown": markdown,
        "summary": parts["summary"],
        "key_signals": parts["key_signals"],
        "recommended_next_actions": parts["recommended_next_actions"],
        "risks_assumptions": parts["risks_assumptions"],
        "sources_used": sources_used or parts["sources_used"],
        "human_validation_required": True,
        "confidence": confidence,
        "tools_used": tools_used,
        "is_mock": False,
        "synthetic_demo_flag": True,
    }
    yield {"event": "done", **result}

    log_trace(
        {
            "trace_id": trace_id,
            "user_id": "demo.user@seqwater.demo",
            "timestamp": started_at,
            "question": question,
            "tools_used": "; ".join(tools_used),
            "sources_used": "; ".join({s.get("source", "") for s in sources_used}),
            "confidence": confidence,
            "response_summary": parts["summary"][:500],
            "human_validation_required": True,
            "synthetic_demo_flag": True,
        }
    )


async def _stream_local(
    question: str,
    *,
    history: list[dict[str, Any]] | None,
    trace_id: str,
    started_at: str,
) -> AsyncIterator[dict[str, Any]]:
    """Deterministic local-mode answer stream."""
    tool_calls = _route_tools(question)
    tool_outputs: dict[str, Any] = {}
    for name in tool_calls:
        yield {"event": "tool_call", "name": name, "args": {}}
        try:
            tool_outputs[name] = TOOLS[name]()
            yield {
                "event": "tool_result",
                "name": name,
                "summary": tool_outputs[name].get("summary", "")[:240],
            }
        except Exception as exc:
            LOG.exception("Tool %s failed: %s", name, exc)
            yield {
                "event": "tool_result",
                "name": name,
                "summary": f"Tool {name} failed: {exc}",
            }
        await asyncio.sleep(0)

    retrieved = retrieve_documents(question, k=4)["data"]
    parts = _compose_local_parts(question, tool_outputs, retrieved)
    sources = parts["sources_used"]
    if sources:
        yield {"event": "sources", "items": sources}

    markdown = _format_markdown(parts)
    for chunk in _split_for_stream(markdown):
        yield {"event": "delta", "text": chunk}
        await asyncio.sleep(0)

    confidence = "Medium"
    if len(retrieved) == 0 and len(tool_outputs) <= 1:
        confidence = "Low"

    result = {
        "trace_id": trace_id,
        "answer": _legacy_answer_text(parts),
        "markdown": markdown,
        "summary": parts["summary"],
        "key_signals": parts["key_signals"],
        "recommended_next_actions": parts["recommended_next_actions"],
        "risks_assumptions": parts["risks_assumptions"],
        "sources_used": sources,
        "human_validation_required": True,
        "confidence": confidence,
        "tools_used": tool_calls,
        "is_mock": True,
        "synthetic_demo_flag": True,
    }
    yield {"event": "done", **result}

    log_trace(
        {
            "trace_id": trace_id,
            "user_id": "demo.user@seqwater.demo",
            "timestamp": started_at,
            "question": question,
            "tools_used": "; ".join(tool_calls),
            "sources_used": "; ".join({s["source"] for s in sources}),
            "confidence": confidence,
            "response_summary": parts["summary"][:500],
            "human_validation_required": True,
            "synthetic_demo_flag": True,
        }
    )


def _split_for_stream(text: str, target_chunk: int = 48) -> list[str]:
    """Split a markdown body into chunks small enough to feel like streaming."""
    chunks: list[str] = []
    buffer: list[str] = []
    size = 0
    for token in re.split(r"(\s+)", text):
        if not token:
            continue
        buffer.append(token)
        size += len(token)
        if size >= target_chunk and token.strip():
            chunks.append("".join(buffer))
            buffer, size = [], 0
    if buffer:
        chunks.append("".join(buffer))
    return chunks


_SECTION_RE = re.compile(r"^##\s+(.+?)\s*$", re.MULTILINE)


def _parts_from_markdown(
    markdown: str, sources: list[dict[str, Any]]
) -> dict[str, Any]:
    """Extract the structured fields from a markdown body produced upstream.

    The Supervisor is instructed to emit the canonical six-section schema. We
    parse it back out for the legacy structured fields the UI sidebar still
    consumes; if parsing fails, we degrade gracefully to permissive defaults.
    """
    sections: dict[str, str] = {}
    matches = list(_SECTION_RE.finditer(markdown))
    for i, m in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(markdown)
        sections[m.group(1).strip().lower()] = markdown[m.end():end].strip()

    summary = sections.get("summary", "").strip()
    key_signals = _extract_list(sections.get("key signals", ""))
    actions = _extract_list(sections.get("recommended next actions", ""))
    risks = _extract_list(sections.get("risks / assumptions", ""))
    if not summary:
        # Fall back to the first non-empty line of the markdown body.
        for line in markdown.splitlines():
            if line.strip() and not line.strip().startswith("#"):
                summary = line.strip()
                break
    if not summary:
        summary = "AquaIQ response."
    if not risks:
        risks = ["All values are demo data."]
    return {
        "summary": summary,
        "key_signals": key_signals[:8],
        "recommended_next_actions": actions[:8],
        "risks_assumptions": risks[:8],
        "sources_used": sources,
    }


def _extract_list(block: str) -> list[str]:
    items: list[str] = []
    for raw in block.splitlines():
        s = raw.strip()
        if not s:
            continue
        m = re.match(r"^(?:[-*•]|\d+\.)\s+(.*)$", s)
        if m:
            items.append(m.group(1).strip())
    return items


# ---------------------------------------------------------------------------
# Synchronous wrapper (legacy / tests / non-streaming callers)
# ---------------------------------------------------------------------------


def answer(
    question: str,
    *,
    history: list[dict[str, Any]] | None = None,
    selected_asset_id: str | None = None,
) -> dict[str, Any]:
    """Drain :func:`stream_answer` into a single response dict.

    Preserves the prior synchronous contract used by tests and any non-streaming
    callers. The ``answer`` field is the legacy plain-text body, ``markdown``
    is the new GFM body, and the structured fields are unchanged.
    """

    async def _drain() -> dict[str, Any]:
        final: dict[str, Any] = {}
        async for evt in stream_answer(
            question, history=history, selected_asset_id=selected_asset_id
        ):
            if evt.get("event") == "done":
                final = {k: v for k, v in evt.items() if k != "event"}
        return final

    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # Fall back to a fresh loop in a thread when called from inside a
            # running event loop (e.g. FastAPI). This path is only used in
            # tests and synchronous callers; production uses stream_answer.
            import concurrent.futures

            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                return pool.submit(asyncio.run, _drain()).result()
    except RuntimeError:
        pass
    return asyncio.run(_drain())
