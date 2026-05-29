"""Board briefing generator service."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from backend.agents.aquaiq import log_trace
from backend.services import repository


def _md_table(rows: list[dict[str, Any]], cols: list[tuple[str, str]]) -> str:
    if not rows:
        return "_No synthetic rows available._"
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

    title = "Synthetic Board Briefing — Seqwater AI Command Centre"
    generated_at = datetime.now(timezone.utc).isoformat()
    trace_id = f"briefing-{uuid.uuid4().hex[:12]}"

    posture_md = (
        f"- Synthetic 72-hour risk posture: **{overview['seventy_two_hour_risk']}**.\n"
        f"- Synthetic SEQ-wide storage: **{overview['storage_percent']}%**.\n"
        f"- Synthetic forecast demand today: **{overview['forecast_demand_ml']:.0f} ML/day**.\n"
        f"- Synthetic treatment capacity: **{overview['treatment_capacity_ml']:.0f} ML/day**.\n"
        f"- Open synthetic P1 work orders: **{overview['open_critical_work_orders']}**.\n"
        f"- Synthetic water quality alerts (Watch + Elevated): **{overview['quality_alerts']}**.\n"
        f"- Synthetic assets in elevated risk band: **{overview['elevated_assets']}**.\n"
    )

    risks_md = _md_table(
        risks,
        [
            ("asset_name", "Synthetic Asset"),
            ("asset_type", "Type"),
            ("risk_band", "Risk band"),
            ("risk_score", "Score"),
            ("recommended_action", "Recommended action"),
        ],
    )

    actions_md = "\n".join(f"{i+1}. {a}" for i, a in enumerate(overview["top_actions"]))
    if not overview["top_actions"]:
        actions_md = "- Continue routine synthetic monitoring."

    customer_md = (
        "- Synthetic retailer customer notifications: aligned to the synthetic protocol.\n"
        "- Synthetic recreational asset advisories: no synthetic alerts.\n"
        "- Synthetic stakeholder communication drafts available via AquaIQ.\n"
    )

    capital_md = _md_table(
        capital,
        [
            ("project_name", "Synthetic Project"),
            ("recommended_priority", "Priority"),
            ("risk_reduction_score", "Risk reduction"),
            ("estimated_cost_aud", "Estimated cost (AUD)"),
            ("delivery_risk", "Delivery risk"),
        ],
    )

    decisions_md = (
        "1. Endorse the synthetic monitoring posture and the top three recommended actions.\n"
        "2. Confirm synthetic capital prioritisation reflects current synthetic risk reduction.\n"
        "3. Confirm synthetic communications posture for retailer customers.\n"
    )

    assumptions_md = (
        "- All values are SYNTHETIC demo data.\n"
        "- AquaIQ outputs require qualified human validation.\n"
        "- No operational decisions should be made from this briefing.\n"
    )

    quality_md = (
        f"- Synthetic samples: **{len(quality['samples'])}** loaded.\n"
        f"- Elevated alerts: **{quality['elevated_count']}**, Watch: **{quality['watch_count']}**.\n"
        f"- Synthetic turbidity events: **{len(quality['turbidity_events'])}**.\n"
    )

    scenario_md = ""
    if scenario:
        scenario_md = (
            f"\n## Synthetic Flood Scenario — {scenario.get('scenario_name')}\n\n"
            f"- 24h forecast: **{scenario.get('rainfall_forecast_mm_24h')} mm**\n"
            f"- 72h forecast: **{scenario.get('rainfall_forecast_mm_72h')} mm**\n"
            f"- Catchment saturation: **{scenario.get('catchment_saturation_index')}**\n"
            f"- Projected synthetic storage: **{scenario.get('projected_storage_percent')}%**\n"
            f"- Synthetic downstream impact: **{scenario.get('downstream_impact_score')}**\n"
            f"- Synthetic recommended actions: {scenario.get('recommended_actions')}\n"
        )

    sections = {
        "Current synthetic posture": posture_md,
        "Top synthetic risks": risks_md,
        "Recommended synthetic actions": actions_md,
        "Synthetic customer and community considerations": customer_md,
        "Synthetic capital implications": capital_md,
        "Synthetic decisions required": decisions_md,
        "Assumptions and validation": assumptions_md,
        "Synthetic water quality posture": quality_md,
    }
    if scenario_md:
        sections["Synthetic flood scenario detail"] = scenario_md

    # Map short section identifiers (used by the React UI) to the human titles above.
    SECTION_ALIASES = {
        "water_security":         "Current synthetic posture",
        "current_posture":        "Current synthetic posture",
        "asset_risk":             "Top synthetic risks",
        "actions":                "Recommended synthetic actions",
        "customer":               "Synthetic customer and community considerations",
        "investment_priorities":  "Synthetic capital implications",
        "capital":                "Synthetic capital implications",
        "decisions":              "Synthetic decisions required",
        "assumptions":            "Assumptions and validation",
        "water_quality":          "Synthetic water quality posture",
        "flood_readiness":        "Synthetic flood scenario detail",
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
        f"_Generated (synthetic): {generated_at}_  |  _Audience: {audience}_  |  _Trace: {trace_id}_",
        "",
        "> SYNTHETIC DEMO DATA. Not for operational use. Human validation required.",
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
        "<div class='warning'>SYNTHETIC DEMO DATA. Not for operational use.</div>"
        "</header>"
        f"{html_sections}"
        "</article>"
    )

    sources_used = [
        {"source": "main.seqwater_demo.asset_risk_scores", "detail": "Synthetic asset risk register"},
        {"source": "main.seqwater_demo.dam_storage_daily", "detail": "Synthetic storage time series"},
        {"source": "main.seqwater_demo.water_quality_samples", "detail": "Synthetic water quality samples"},
        {"source": "main.seqwater_demo.capital_projects", "detail": "Synthetic capital projects"},
        {"source": "synthetic_flood_readiness_executive_briefing_template", "detail": "Synthetic briefing template"},
    ]

    log_trace({
        "trace_id": trace_id,
        "user_id": "demo.user@seqwater.demo",
        "timestamp": generated_at,
        "question": f"Generate {audience} briefing",
        "tools_used": "generate_board_briefing",
        "sources_used": "; ".join({s["source"] for s in sources_used}),
        "confidence": "Medium",
        "response_summary": "Synthetic briefing generated with risks, actions, and assumptions.",
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
