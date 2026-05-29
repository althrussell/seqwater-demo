"""AquaIQ — governed operational intelligence assistant.

The agent has two execution paths:

* ``LiveAgent``  uses the Databricks Foundation Model API (OpenAI-compatible) to
  drive tool calls via simple keyword routing plus a final structured prompt.
* ``MockAgent``  produces a deterministic, conservative response built from the
  same tool outputs. This is the default in local mode so the demo always runs.

Both paths emit MLflow-style trace records via ``log_trace``.
"""
from __future__ import annotations

import logging
import re
import uuid
from datetime import datetime, timezone
from typing import Any

from backend.agents.retrieval import retrieve_documents
from backend.agents.tools import TOOLS
from backend.config import get_settings

LOG = logging.getLogger(__name__)


SYSTEM_PROMPT = """You are AquaIQ, a governed operational intelligence assistant for the Seqwater AI Command Centre demo.

Hard rules:
- All data is SYNTHETIC demo data. Never claim it is real Seqwater data.
- Never recommend real-world operational instructions, releases, or restrictions.
- Never invent regulatory thresholds or quote real-world public health advice.
- If the user asks for an operational decision, refuse and require human validation.
- Always cite which synthetic data sources or documents you used.
- Always state confidence and assumptions.
- Always state when human validation is required.

Respond using this exact section structure:

Summary
Key signals
Recommended next actions
Risks / assumptions
Sources used
Human validation required
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
                mlflow.set_tags({"app": "seqwater-aquaiq", "synthetic": "true"})
                LOG.info("Logged AquaIQ trace to MLflow run %s", run.info.run_id)
        except Exception as exc:  # pragma: no cover
            LOG.warning("MLflow logging failed: %s", exc)


def _build_response(question: str, tool_calls: list[str], tool_outputs: dict[str, Any],
                    retrieved: list[dict[str, Any]]) -> dict[str, Any]:
    summary_parts: list[str] = []
    key_signals: list[str] = []
    actions: list[str] = []
    risks_assumptions = [
        "All values are synthetic demo data and not real Seqwater operational data.",
        "Forecasts and risk scores are illustrative and must be validated by qualified personnel.",
    ]
    sources: list[dict[str, Any]] = []

    if "get_overview" in tool_outputs:
        o = tool_outputs["get_overview"]["data"]
        summary_parts.append(o["ai_executive_summary"])
        key_signals.append(
            f"72-hour synthetic risk band: {o['seventy_two_hour_risk']}."
        )
        key_signals.append(
            f"Synthetic storage at {o['storage_percent']}% across the SEQ Water Grid."
        )
        actions.extend(o["top_actions"][:3])
        sources.append({"source": "main.seqwater_demo.asset_risk_scores", "detail": "Synthetic asset risk scoreboard"})
        sources.append({"source": "main.seqwater_demo.dam_storage_daily", "detail": "Synthetic daily storage trend"})

    if "get_water_security_summary" in tool_outputs:
        s = tool_outputs["get_water_security_summary"]["data"]
        key_signals.append(
            f"Mean synthetic 72h rainfall forecast: {s['forecast_rainfall_mm_72h_avg']} mm."
        )
        if s.get("transfers"):
            key_signals.append(
                f"{len(s['transfers'])} synthetic grid transfer recommendations are available."
            )
        sources.append({"source": "main.seqwater_demo.rainfall_forecast", "detail": "Synthetic catchment rainfall forecast"})
        sources.append({"source": "main.seqwater_demo.demand_forecast", "detail": "Synthetic demand baseline"})

    if "get_top_asset_risks" in tool_outputs:
        risks = tool_outputs["get_top_asset_risks"]["data"]
        if risks:
            key_signals.append(
                f"Top synthetic risk: {risks[0]['asset_name']} ({risks[0]['risk_band']}, "
                f"score {risks[0]['risk_score']:.2f})."
            )
            for r in risks[:3]:
                actions.append(
                    f"Review {r['asset_name']} (synthetic): {r['recommended_action']}"
                )
        sources.append({"source": "main.seqwater_demo.asset_risk_scores", "detail": "Top synthetic asset risks"})

    if "get_water_quality_alerts" in tool_outputs:
        q = tool_outputs["get_water_quality_alerts"]["data"]
        key_signals.append(
            f"Synthetic water quality: {q['elevated_count']} elevated, {q['watch_count']} watch."
        )
        if q.get("turbidity_events"):
            key_signals.append(
                f"{len(q['turbidity_events'])} synthetic turbidity events detected."
            )
        actions.append(
            "Ask synthetic water quality lead to validate analyser calibration and treatment margins."
        )
        sources.append({"source": "main.seqwater_demo.water_quality_samples", "detail": "Synthetic sample register"})

    if "run_flood_readiness_scenario" in tool_outputs:
        s = tool_outputs["run_flood_readiness_scenario"]["data"]
        if s:
            key_signals.append(
                f"Synthetic scenario {s.get('scenario_name')}: projected storage "
                f"{s.get('projected_storage_percent')}%, downstream impact "
                f"{s.get('downstream_impact_score')}."
            )
            actions.append(
                "Confirm synthetic scenario assumptions with duty hydrologist."
            )
            risks_assumptions.append(
                "Synthetic flood scenario is illustrative only; not an operational release model."
            )
        sources.append({"source": "main.seqwater_demo.flood_scenarios", "detail": "Synthetic scenario register"})

    if "get_capital_priorities" in tool_outputs:
        projects = tool_outputs["get_capital_priorities"]["data"]
        if projects:
            top = projects[0]
            key_signals.append(
                f"Top synthetic capital option: {top['project_name']} (priority {top['recommended_priority']}, "
                f"risk reduction {top['risk_reduction_score']:.2f})."
            )
        sources.append({"source": "main.seqwater_demo.capital_projects", "detail": "Synthetic capital options"})

    for r in retrieved:
        sources.append({
            "source": r["title"],
            "detail": r["text"][:200] + ("…" if len(r["text"]) > 200 else ""),
            "href": r.get("href"),
        })

    if not summary_parts:
        summary_parts.append(
            "Synthetic posture appears stable. Continue routine monitoring and validate with operations."
        )
    if not actions:
        actions.append("Continue routine synthetic monitoring.")

    return {
        "summary": " ".join(summary_parts),
        "key_signals": key_signals[:6],
        "recommended_next_actions": actions[:6],
        "risks_assumptions": risks_assumptions,
        "sources_used": sources,
    }


def _format_answer(parts: dict[str, Any]) -> str:
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
    lines.append("Yes — this is synthetic demo output. A qualified human must validate before any operational use.")
    return "\n".join(lines)


def answer(question: str, *, history: list[dict[str, Any]] | None = None,
           selected_asset_id: str | None = None) -> dict[str, Any]:
    settings = get_settings()
    trace_id = f"aquaiq-{uuid.uuid4().hex[:12]}"
    started_at = datetime.now(timezone.utc).isoformat()

    if _looks_like_unsafe_request(question):
        parts = {
            "summary": (
                "AquaIQ will not recommend or authorise operational decisions in this demo. "
                "All synthetic outputs require qualified human review."
            ),
            "key_signals": [
                "Request appears to ask for an operational decision.",
                "Demo is restricted to synthetic decision-support summaries only.",
            ],
            "recommended_next_actions": [
                "Engage the appropriate Seqwater operational role for this decision.",
                "Use AquaIQ to summarise synthetic context only.",
            ],
            "risks_assumptions": [
                "AquaIQ is a synthetic demo assistant.",
                "It cannot authorise releases, restrictions, or other operational changes.",
            ],
            "sources_used": [
                {"source": "AquaIQ guardrail policy", "detail": "Refuse operational authorisation requests."},
            ],
        }
        formatted = _format_answer(parts)
        result = {
            "trace_id": trace_id,
            "answer": formatted,
            "summary": parts["summary"],
            "key_signals": parts["key_signals"],
            "recommended_next_actions": parts["recommended_next_actions"],
            "risks_assumptions": parts["risks_assumptions"],
            "sources_used": parts["sources_used"],
            "human_validation_required": True,
            "confidence": "Low",
            "tools_used": [],
            "is_mock": True,
            "synthetic_demo_flag": True,
        }
        log_trace({
            "trace_id": trace_id,
            "user_id": "demo.user@seqwater.demo",
            "timestamp": started_at,
            "question": question,
            "tools_used": "guardrail_refusal",
            "sources_used": "AquaIQ guardrail policy",
            "confidence": "Low",
            "response_summary": parts["summary"],
            "human_validation_required": True,
            "synthetic_demo_flag": True,
        })
        return result

    tool_calls = _route_tools(question)
    tool_outputs: dict[str, Any] = {}
    for name in tool_calls:
        try:
            tool_outputs[name] = TOOLS[name]()
        except Exception as exc:
            LOG.exception("Tool %s failed: %s", name, exc)

    retrieved = retrieve_documents(question, k=4)["data"]

    parts = _build_response(question, tool_calls, tool_outputs, retrieved)

    is_mock = True
    if settings.is_databricks_mode:
        try:
            from backend.services.llm import call_foundation_model

            llm_summary = call_foundation_model(
                system=SYSTEM_PROMPT,
                user=_build_llm_user_prompt(question, tool_outputs, retrieved),
            )
            if llm_summary:
                parts["summary"] = llm_summary
                is_mock = False
        except Exception as exc:  # pragma: no cover
            LOG.warning("LLM call failed; using mock response: %s", exc)

    formatted = _format_answer(parts)
    confidence = "Medium"
    if len(retrieved) == 0 and len(tool_outputs) <= 1:
        confidence = "Low"

    result = {
        "trace_id": trace_id,
        "answer": formatted,
        "summary": parts["summary"],
        "key_signals": parts["key_signals"],
        "recommended_next_actions": parts["recommended_next_actions"],
        "risks_assumptions": parts["risks_assumptions"],
        "sources_used": parts["sources_used"],
        "human_validation_required": True,
        "confidence": confidence,
        "tools_used": tool_calls,
        "is_mock": is_mock,
        "synthetic_demo_flag": True,
    }

    log_trace({
        "trace_id": trace_id,
        "user_id": "demo.user@seqwater.demo",
        "timestamp": started_at,
        "question": question,
        "tools_used": "; ".join(tool_calls),
        "sources_used": "; ".join({s["source"] for s in parts["sources_used"]}),
        "confidence": confidence,
        "response_summary": parts["summary"][:500],
        "human_validation_required": True,
        "synthetic_demo_flag": True,
    })
    return result


def _build_llm_user_prompt(question: str, tool_outputs: dict[str, Any],
                           retrieved: list[dict[str, Any]]) -> str:
    parts = [f"User question: {question}", "", "Synthetic context:"]
    for name, output in tool_outputs.items():
        parts.append(f"\n[{name}]\n{output.get('summary', '')}")
    if retrieved:
        parts.append("\nRetrieved synthetic documents:")
        for r in retrieved:
            parts.append(f"- {r['title']}: {r['text']}")
    parts.append(
        "\nWrite the response strictly in the required section structure. "
        "Be conservative, cite synthetic sources, and require human validation."
    )
    return "\n".join(parts)
