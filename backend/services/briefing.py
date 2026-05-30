"""Board briefing generator service."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from backend.agents.aquaiq import log_trace
from backend.services import repository


def _md_table(rows: list[dict[str, Any]], cols: list[tuple[str, str]]) -> str:
    if not rows:
        return "_No rows available._"
    header = "| " + " | ".join(label for _, label in cols) + " |"
    sep = "|" + "|".join("---" for _ in cols) + "|"
    body_lines = []
    for r in rows:
        body_lines.append("| " + " | ".join(str(r.get(key, "")) for key, _ in cols) + " |")
    return "\n".join([header, sep, *body_lines])


def generate_board_briefing(*, audience: str = "board",
                            include_sections: list[str] | None = None,
                            scenario_id: str | None = None) -> dict[str, Any]:
    overview = repository.overview()
    risks = repository.list_asset_risk()[:5]
    quality = repository.water_quality_summary()
    capital = repository.list_capital_projects()[:5]
    scenario = repository.get_flood_scenario_detail(scenario_id) if scenario_id else None

    title = "Board Briefing — Seqwater AI Command Centre"
    generated_at = datetime.now(timezone.utc).isoformat()
    trace_id = f"briefing-{uuid.uuid4().hex[:12]}"

    posture_md = (
        f"- 72-hour risk posture: **{overview['seventy_two_hour_risk']}**.\n"
        f"- SEQ-wide storage: **{overview['storage_percent']}%**.\n"
        f"- Forecast demand today: **{overview['forecast_demand_ml']:.0f} ML/day**.\n"
        f"- Treatment capacity: **{overview['treatment_capacity_ml']:.0f} ML/day**.\n"
        f"- Open P1 work orders: **{overview['open_critical_work_orders']}**.\n"
        f"- Water quality alerts (Watch + Elevated): **{overview['quality_alerts']}**.\n"
        f"- Assets in elevated risk band: **{overview['elevated_assets']}**.\n"
    )

    risks_md = _md_table(
        risks,
        [
            ("asset_name", "Asset"),
            ("asset_type", "Type"),
            ("risk_band", "Risk band"),
            ("risk_score", "Score"),
            ("recommended_action", "Recommended action"),
        ],
    )

    actions_md = "\n".join(f"{i+1}. {a}" for i, a in enumerate(overview["top_actions"]))
    if not overview["top_actions"]:
        actions_md = "- Continue routine monitoring."

    customer_md = (
        "- Retailer customer notifications: aligned to the protocol.\n"
        "- Recreational asset advisories: no alerts.\n"
        "- Stakeholder communication drafts available via AquaIQ.\n"
    )

    capital_md = _md_table(
        capital,
        [
            ("project_name", "Project"),
            ("recommended_priority", "Priority"),
            ("risk_reduction_score", "Risk reduction"),
            ("estimated_cost_aud", "Estimated cost (AUD)"),
            ("delivery_risk", "Delivery risk"),
        ],
    )

    decisions_md = (
        "1. Endorse the monitoring posture and the top three recommended actions.\n"
        "2. Confirm capital prioritisation reflects current risk reduction.\n"
        "3. Confirm communications posture for retailer customers.\n"
    )

    assumptions_md = (
        "- All values are demo data.\n"
        "- AquaIQ outputs require qualified human validation.\n"
        "- No operational decisions should be made from this briefing.\n"
    )

    quality_md = (
        f"- Samples: **{len(quality['samples'])}** loaded.\n"
        f"- Elevated alerts: **{quality['elevated_count']}**, Watch: **{quality['watch_count']}**.\n"
        f"- Turbidity events: **{len(quality['turbidity_events'])}**.\n"
    )

    scenario_md = ""
    if scenario:
        scenario_md = (
            f"\n## Flood Scenario — {scenario.get('scenario_name')}\n\n"
            f"- 24h forecast: **{scenario.get('rainfall_forecast_mm_24h')} mm**\n"
            f"- 72h forecast: **{scenario.get('rainfall_forecast_mm_72h')} mm**\n"
            f"- Catchment saturation: **{scenario.get('catchment_saturation_index')}**\n"
            f"- Projected storage: **{scenario.get('projected_storage_percent')}%**\n"
            f"- Downstream impact: **{scenario.get('downstream_impact_score')}**\n"
            f"- Recommended actions: {scenario.get('recommended_actions')}\n"
        )

    sections = {
        "Current posture": posture_md,
        "Top risks": risks_md,
        "Recommended actions": actions_md,
        "Customer and community considerations": customer_md,
        "Capital implications": capital_md,
        "Decisions required": decisions_md,
        "Assumptions and validation": assumptions_md,
        "Water quality posture": quality_md,
    }
    if scenario_md:
        sections["Flood scenario detail"] = scenario_md

    # Map short section identifiers (used by the React UI) to the human titles above.
    SECTION_ALIASES = {
        "water_security":         "Current posture",
        "current_posture":        "Current posture",
        "asset_risk":             "Top risks",
        "actions":                "Recommended actions",
        "customer":               "Customer and community considerations",
        "investment_priorities":  "Capital implications",
        "capital":                "Capital implications",
        "decisions":              "Decisions required",
        "assumptions":            "Assumptions and validation",
        "water_quality":          "Water quality posture",
        "flood_readiness":        "Flood scenario detail",
    }

    if include_sections:
        wanted = {SECTION_ALIASES.get(s, s) for s in include_sections}
        filtered = {k: v for k, v in sections.items() if k in wanted}
        if filtered:
            sections = filtered
        # If no aliases matched (e.g. caller passed already-titled names that don't
        # appear), keep the full briefing rather than emitting an empty doc.

    md_parts = [
        f"# {title}",
        "",
        f"_Generated: {generated_at}_  |  _Audience: {audience}_  |  _Trace: {trace_id}_",
        "",
        "> DEMO DATA. Not for operational use. Human validation required.",
        "",
    ]
    for h, c in sections.items():
        md_parts.append(f"## {h}\n\n{c}")
        md_parts.append("")
    markdown = "\n".join(md_parts)

    html_sections = "".join(
        f"<section><h2>{h}</h2><pre>{c}</pre></section>" for h, c in sections.items()
    )
    html = (
        "<article class='briefing'>"
        f"<header><h1>{title}</h1>"
        f"<div class='meta'>{generated_at} · {audience} · {trace_id}</div>"
        "<div class='warning'>DEMO DATA. Not for operational use.</div>"
        "</header>"
        f"{html_sections}"
        "</article>"
    )

    sources_used = [
        {"source": "main.seqwater_demo.asset_risk_scores", "detail": "Asset risk register"},
        {"source": "main.seqwater_demo.dam_storage_daily", "detail": "Storage time series"},
        {"source": "main.seqwater_demo.water_quality_samples", "detail": "Water quality samples"},
        {"source": "main.seqwater_demo.capital_projects", "detail": "Capital projects"},
        {"source": "synthetic_flood_readiness_executive_briefing_template", "detail": "Briefing template"},
    ]

    log_trace({
        "trace_id": trace_id,
        "user_id": "demo.user@seqwater.demo",
        "timestamp": generated_at,
        "question": f"Generate {audience} briefing",
        "tools_used": "generate_board_briefing",
        "sources_used": "; ".join({s["source"] for s in sources_used}),
        "confidence": "Medium",
        "response_summary": "Briefing generated with risks, actions, and assumptions.",
        "human_validation_required": True,
        "synthetic_demo_flag": True,
    })

    return {
        "trace_id": trace_id,
        "title": title,
        "generated_at": generated_at,
        "audience": audience,
        "sections": sections,
        "markdown": markdown,
        "html": html,
        "sources_used": sources_used,
        "human_validation_required": True,
        "synthetic_demo_flag": True,
    }
