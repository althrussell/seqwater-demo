"""Generate branded PDFs from the demo markdown corpus.

For every ``.md`` file in ``data/documents/``, emit:

* ``data/documents/pdf/<basename>.pdf`` — A4 PDF with title page, body, watermark,
  footer, and "Demo" badge.
* ``data/documents/pdf/<basename>.json`` — Knowledge Assistant example pairs that
  ``manage_ka(action="create_or_update", add_examples_from_volume=true)`` will
  pick up automatically once the volume is uploaded.

The PDFs are deliberately conservative in styling so they read as authentic
internal demo artefacts. Every page has a "DEMO DATA — NOT FOR
OPERATIONAL USE" footer and a diagonal "DEMO" watermark.

Run from the repo root:

    python scripts/generate_synthetic_pdfs.py

This script has no Databricks dependency — it produces local artefacts that
are later staged into the Volume by ``scripts/seed_data.py``.
"""
from __future__ import annotations

import json
import logging
import re
import sys
from dataclasses import dataclass
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
DOCS_DIR = ROOT / "data" / "documents"
OUT_DIR = DOCS_DIR / "pdf"

LOG = logging.getLogger("generate_synthetic_pdfs")

BRAND_BLUE = colors.HexColor("#0F4E8C")
BRAND_TEAL = colors.HexColor("#1A7F8E")
BRAND_INK = colors.HexColor("#0E1726")
BRAND_MUTED = colors.HexColor("#5A6675")
BRAND_AMBER = colors.HexColor("#A45B00")


# ---------------------------------------------------------------------------
# Markdown → ReportLab flowables
# ---------------------------------------------------------------------------


@dataclass
class _Block:
    kind: str
    body: str | list


def _parse_markdown(md_text: str) -> tuple[str, list[_Block]]:
    """Extract a (title, blocks) tuple from the markdown.

    The parser handles the small subset we need: H1/H2/H3 headings, paragraphs,
    blockquotes, ordered/unordered lists, GFM tables, and horizontal rules.
    """
    lines = md_text.splitlines()
    title = ""
    blocks: list[_Block] = []
    i = 0

    def flush_paragraph(buffer: list[str]) -> None:
        if not buffer:
            return
        text = " ".join(s.strip() for s in buffer if s.strip())
        if text:
            blocks.append(_Block("p", text))

    paragraph: list[str] = []

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if not stripped:
            flush_paragraph(paragraph)
            paragraph = []
            i += 1
            continue

        if stripped.startswith("# ") and not title:
            title = stripped[2:].strip()
            i += 1
            continue

        if stripped.startswith("## "):
            flush_paragraph(paragraph)
            paragraph = []
            blocks.append(_Block("h2", stripped[3:].strip()))
            i += 1
            continue

        if stripped.startswith("### "):
            flush_paragraph(paragraph)
            paragraph = []
            blocks.append(_Block("h3", stripped[4:].strip()))
            i += 1
            continue

        if stripped.startswith("> "):
            flush_paragraph(paragraph)
            paragraph = []
            quote_lines = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                quote_lines.append(lines[i].strip().lstrip(">").strip())
                i += 1
            blocks.append(_Block("quote", " ".join(quote_lines).strip()))
            continue

        if stripped.startswith("---"):
            flush_paragraph(paragraph)
            paragraph = []
            blocks.append(_Block("hr", ""))
            i += 1
            continue

        if stripped.startswith("|"):
            flush_paragraph(paragraph)
            paragraph = []
            table_rows: list[list[str]] = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                row = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                table_rows.append(row)
                i += 1
            # second row is the alignment row in GFM, drop it if dashes
            if len(table_rows) >= 2 and all(set(c) <= set("-: ") for c in table_rows[1]):
                table_rows = [table_rows[0]] + table_rows[2:]
            blocks.append(_Block("table", table_rows))
            continue

        ordered_match = re.match(r"^(\d+)\.\s+(.*)$", stripped)
        if ordered_match:
            flush_paragraph(paragraph)
            paragraph = []
            items: list[str] = [ordered_match.group(2)]
            i += 1
            while i < len(lines):
                m2 = re.match(r"^(\d+)\.\s+(.*)$", lines[i].strip())
                if m2:
                    items.append(m2.group(2))
                    i += 1
                elif lines[i].startswith("   ") and items:
                    items[-1] = items[-1] + " " + lines[i].strip()
                    i += 1
                else:
                    break
            blocks.append(_Block("ol", items))
            continue

        if stripped.startswith("- "):
            flush_paragraph(paragraph)
            paragraph = []
            items = [stripped[2:].strip()]
            i += 1
            while i < len(lines):
                ls = lines[i]
                if ls.strip().startswith("- "):
                    items.append(ls.strip()[2:].strip())
                    i += 1
                elif ls.startswith("   ") and items:
                    items[-1] = items[-1] + " " + ls.strip()
                    i += 1
                else:
                    break
            blocks.append(_Block("ul", items))
            continue

        paragraph.append(stripped)
        i += 1

    flush_paragraph(paragraph)
    return title, blocks


_BOLD_RE = re.compile(r"\*\*(.+?)\*\*")
_ITALIC_RE = re.compile(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)")
_CODE_RE = re.compile(r"`([^`]+)`")


def _inline_md_to_html(text: str) -> str:
    """Convert a small subset of inline markdown to ReportLab Paragraph HTML."""
    text = (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )
    text = _BOLD_RE.sub(r"<b>\1</b>", text)
    text = _ITALIC_RE.sub(r"<i>\1</i>", text)
    text = _CODE_RE.sub(r"<font face='Courier' color='#0F4E8C'>\1</font>", text)
    return text


# ---------------------------------------------------------------------------
# PDF document construction
# ---------------------------------------------------------------------------


def _ensure_fonts() -> tuple[str, str]:
    """Register a serif body font and a sans heading font.

    Falls back to the Helvetica/Times built-ins if the platform's DejaVu fonts
    aren't available — both are already bundled with reportlab.
    """
    body_font = "Helvetica"
    heading_font = "Helvetica-Bold"
    candidates = [
        ("/System/Library/Fonts/Supplemental/Helvetica.ttc", body_font, heading_font),
        ("/Library/Fonts/Arial.ttf", body_font, heading_font),
    ]
    for path, body, heading in candidates:
        if Path(path).exists():
            try:
                pdfmetrics.registerFont(TTFont("BodyFont", path))
                body_font = "BodyFont"
                heading_font = "Helvetica-Bold"
                return body_font, heading_font
            except Exception:
                continue
    return body_font, heading_font


def _build_styles(body_font: str, heading_font: str) -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    styles: dict[str, ParagraphStyle] = {}
    styles["Title"] = ParagraphStyle(
        "Title",
        parent=base["Title"],
        fontName=heading_font,
        fontSize=22,
        leading=28,
        alignment=TA_LEFT,
        textColor=BRAND_INK,
        spaceAfter=6,
    )
    styles["Subtitle"] = ParagraphStyle(
        "Subtitle",
        parent=base["Normal"],
        fontName=body_font,
        fontSize=11,
        leading=15,
        textColor=BRAND_MUTED,
        spaceAfter=4,
    )
    styles["MetaLabel"] = ParagraphStyle(
        "MetaLabel",
        parent=base["Normal"],
        fontName=heading_font,
        fontSize=9,
        textColor=BRAND_BLUE,
        spaceAfter=2,
    )
    styles["MetaValue"] = ParagraphStyle(
        "MetaValue",
        parent=base["Normal"],
        fontName=body_font,
        fontSize=10,
        leading=13,
        textColor=BRAND_INK,
        spaceAfter=4,
    )
    styles["H2"] = ParagraphStyle(
        "H2",
        parent=base["Heading2"],
        fontName=heading_font,
        fontSize=14,
        leading=18,
        textColor=BRAND_BLUE,
        spaceBefore=12,
        spaceAfter=4,
    )
    styles["H3"] = ParagraphStyle(
        "H3",
        parent=base["Heading3"],
        fontName=heading_font,
        fontSize=11.5,
        leading=15,
        textColor=BRAND_TEAL,
        spaceBefore=8,
        spaceAfter=2,
    )
    styles["Body"] = ParagraphStyle(
        "Body",
        parent=base["Normal"],
        fontName=body_font,
        fontSize=10.5,
        leading=15,
        textColor=BRAND_INK,
        spaceAfter=6,
    )
    styles["Quote"] = ParagraphStyle(
        "Quote",
        parent=base["Normal"],
        fontName=body_font,
        fontSize=10,
        leading=14,
        leftIndent=12,
        rightIndent=12,
        textColor=BRAND_AMBER,
        spaceBefore=4,
        spaceAfter=8,
        borderPadding=4,
    )
    styles["List"] = ParagraphStyle(
        "List",
        parent=styles["Body"],
        leftIndent=14,
        bulletIndent=2,
        spaceAfter=2,
    )
    styles["TitlePageOwner"] = ParagraphStyle(
        "TitlePageOwner",
        parent=base["Normal"],
        fontName=body_font,
        fontSize=10,
        leading=14,
        textColor=BRAND_MUTED,
        spaceAfter=2,
    )
    return styles


def _draw_page_chrome(canvas, doc) -> None:
    """Header band, page footer, watermark — drawn on every page."""
    page_w, page_h = A4

    canvas.saveState()
    canvas.setFillColor(BRAND_BLUE)
    canvas.rect(0, page_h - 12 * mm, page_w, 12 * mm, stroke=0, fill=1)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 9)
    canvas.drawString(20 * mm, page_h - 8 * mm, "Seqwater AI Command Centre — Demo Document")
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(page_w - 20 * mm, page_h - 8 * mm, "DEMO — NOT FOR OPERATIONAL USE")
    canvas.restoreState()

    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(BRAND_MUTED)
    canvas.drawString(
        20 * mm,
        12 * mm,
        "DEMO DATA — NOT FOR OPERATIONAL USE — illustrative content only.",
    )
    canvas.drawRightString(page_w - 20 * mm, 12 * mm, f"Page {doc.page}")
    canvas.restoreState()

    canvas.saveState()
    canvas.translate(page_w / 2, page_h / 2)
    canvas.rotate(35)
    canvas.setFont("Helvetica-Bold", 110)
    canvas.setFillColor(colors.Color(0.85, 0.88, 0.93, alpha=0.18))
    canvas.drawCentredString(0, 0, "DEMO")
    canvas.restoreState()


def _build_doc(out_path: Path) -> BaseDocTemplate:
    doc = BaseDocTemplate(
        str(out_path),
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
        title="Seqwater Demo Document",
        author="Seqwater AI Command Centre (demo)",
        subject="Demo content",
    )
    frame = Frame(
        doc.leftMargin,
        doc.bottomMargin,
        doc.width,
        doc.height,
        id="content",
        showBoundary=0,
    )
    doc.addPageTemplates([PageTemplate(id="default", frames=[frame], onPage=_draw_page_chrome)])
    return doc


def _flowables_for_blocks(
    title: str,
    blocks: list[_Block],
    styles: dict[str, ParagraphStyle],
) -> list:
    flow: list = []

    flow.append(Paragraph("DEMO EXECUTIVE DEMO DOCUMENT", styles["MetaLabel"]))
    flow.append(Paragraph(title, styles["Title"]))
    flow.append(
        Paragraph(
            "Generated for the Seqwater AI Command Centre Databricks demo. "
            "All content is demo and must not be used for any operational purpose.",
            styles["Subtitle"],
        )
    )
    flow.append(Spacer(1, 8))
    flow.append(_brand_rule())
    flow.append(Spacer(1, 12))

    for block in blocks:
        if block.kind == "h2":
            flow.append(Paragraph(_inline_md_to_html(block.body), styles["H2"]))
        elif block.kind == "h3":
            flow.append(Paragraph(_inline_md_to_html(block.body), styles["H3"]))
        elif block.kind == "p":
            flow.append(Paragraph(_inline_md_to_html(block.body), styles["Body"]))
        elif block.kind == "quote":
            flow.append(Paragraph(_inline_md_to_html(block.body), styles["Quote"]))
        elif block.kind == "ul":
            for item in block.body:
                flow.append(
                    Paragraph(
                        f"&bull;&nbsp;&nbsp;{_inline_md_to_html(item)}",
                        styles["List"],
                    )
                )
            flow.append(Spacer(1, 4))
        elif block.kind == "ol":
            for n, item in enumerate(block.body, start=1):
                flow.append(
                    Paragraph(
                        f"<b>{n}.</b>&nbsp;&nbsp;{_inline_md_to_html(item)}",
                        styles["List"],
                    )
                )
            flow.append(Spacer(1, 4))
        elif block.kind == "table":
            flow.append(_render_table(block.body, styles))
            flow.append(Spacer(1, 6))
        elif block.kind == "hr":
            flow.append(Spacer(1, 4))
            flow.append(_brand_rule())
            flow.append(Spacer(1, 6))

    return flow


def _brand_rule() -> Table:
    rule = Table([[""]], colWidths=[16 * cm], rowHeights=[0.6])
    rule.setStyle(
        TableStyle(
            [
                ("LINEABOVE", (0, 0), (-1, -1), 0.6, BRAND_BLUE),
            ]
        )
    )
    return rule


def _render_table(rows: list[list[str]], styles: dict[str, ParagraphStyle]) -> Table:
    if not rows:
        return Table([[""]])
    body_style = ParagraphStyle(
        "TableBody",
        parent=styles["Body"],
        fontSize=9,
        leading=12,
        spaceAfter=0,
    )
    head_style = ParagraphStyle(
        "TableHead",
        parent=body_style,
        textColor=colors.white,
    )
    paragraphed: list[list] = []
    for r_idx, row in enumerate(rows):
        styled_row: list = []
        for cell in row:
            html = _inline_md_to_html(cell)
            styled_row.append(Paragraph(html, head_style if r_idx == 0 else body_style))
        paragraphed.append(styled_row)

    n_cols = max(len(r) for r in paragraphed)
    paragraphed = [r + [Paragraph("", body_style)] * (n_cols - len(r)) for r in paragraphed]

    available_width = A4[0] - 40 * mm
    col_width = available_width / n_cols
    table = Table(paragraphed, colWidths=[col_width] * n_cols, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), BRAND_BLUE),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, BRAND_MUTED),
                ("BOX", (0, 0), (-1, -1), 0.4, BRAND_INK),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#F4F7FB"), colors.white]),
            ]
        )
    )
    return table


# ---------------------------------------------------------------------------
# KA companion JSON
# ---------------------------------------------------------------------------


KA_EXAMPLES: dict[str, list[dict[str, str]]] = {
    "synthetic_dam_operations_playbook": [
        {
            "question": "What checklist applies during a Watch posture for dams?",
            "guideline": (
                "Cite the Dam Operations Playbook section 3 (Watch checklist). "
                "List the five checklist items verbatim. Note data and require "
                "human-in-the-loop validation."
            ),
        },
        {
            "question": "Which posture levels does the dam playbook define?",
            "guideline": (
                "Cite the four bands from section 2 (Routine, Watch, Respond, Coordinate) "
                "with their indicative responses. State nature."
            ),
        },
    ],
    "synthetic_water_quality_response_procedure": [
        {
            "question": "What indicators are monitored under the water quality procedure?",
            "guideline": (
                "Cite section 2: turbidity, pH, chlorine residual, conductivity, temperature, "
                "E. coli detections. State nature and require human review for any "
                "operational interpretation."
            ),
        },
        {
            "question": "What actions are recommended at the Watch alert level?",
            "guideline": (
                "Cite section 3: Increase sampling frequency and notify treatment supervisor. "
                "State the source."
            ),
        },
    ],
    "synthetic_asset_criticality_framework": [
        {
            "question": "How does the asset criticality framework rank assets?",
            "guideline": (
                "Cite the framework's tiering scheme. Note nature. "
                "Reference the asset_risk_scores table for the live ranking."
            ),
        },
    ],
    "synthetic_capital_prioritisation_framework": [
        {
            "question": "What factors drive capital prioritisation in the framework?",
            "guideline": (
                "Cite the framework. Mention risk reduction score and "
                "alignment with the asset criticality framework."
            ),
        },
    ],
    "synthetic_flood_readiness_executive_briefing_template": [
        {
            "question": "Generate a flood readiness briefing for the executive team.",
            "guideline": (
                "Use the template structure verbatim. Populate with "
                "context but flag that all values are demo and require validation."
            ),
        },
    ],
    "synthetic_retailer_customer_communications_protocol": [
        {
            "question": "What communications are required during a Watch posture?",
            "guideline": (
                "Cite the protocol. Highlight notification timing and "
                "approver roles. Defer external comms to designated leads."
            ),
        },
    ],
    "synthetic_dam_safety_inspection_north_pine_2026": [
        {
            "question": "What findings were recorded for North Pine Dam in May 2026?",
            "guideline": (
                "Cite the inspection report section 3. List the three findings "
                "verbatim with their recommendations. State nature."
            ),
        },
        {
            "question": "What is the aggregate risk band for North Pine Dam after the inspection?",
            "guideline": (
                "Cite section 4: Watch. State that the risk would migrate to "
                "Respond if the 72h forecast were realised. Require human review."
            ),
        },
    ],
    "synthetic_incident_report_pmp014_caboolture_2026q2": [
        {
            "question": "Summarise the PMP-014 incident report.",
            "guideline": (
                "Cite the incident report. Quote the timeline, root cause "
                "hypotheses, and the four recommended next actions. Note data."
            ),
        },
        {
            "question": "What capital options are linked to PMP-014?",
            "guideline": (
                "Cite the incident report section 4 and the capital "
                "business case for the PMP-014 Replacement and Reliability Programme."
            ),
        },
    ],
    "synthetic_monthly_water_quality_report_2026_05": [
        {
            "question": "Which plants were on a Watch indicator in May 2026?",
            "guideline": (
                "Cite section 3 of the monthly report. Name the North "
                "Pine WTP and Landers Shute WTP and their context."
            ),
        },
        {
            "question": "What recommended actions follow from the May water quality report?",
            "guideline": (
                "Cite section 5 verbatim. Note nature and require qualified review."
            ),
        },
    ],
    "synthetic_capital_business_case_pump_replacement": [
        {
            "question": "What options were considered for PMP-014 replacement?",
            "guideline": (
                "Cite the options table (Option 0 through Option 3) with "
                "capital costs and risk reduction scores. Note Option 3 is the "
                "recommended option."
            ),
        },
    ],
    "synthetic_board_paper_q2_2026_water_security": [
        {
            "question": "What supply position is reported for Q2 FY2026?",
            "guideline": (
                "Cite the board paper section 3 metrics: 71.4% storage, 62 mm "
                "72h forecast, 0.68 catchment saturation index, 1,210 ML/day demand."
            ),
        },
        {
            "question": "What recommended actions does the board paper request?",
            "guideline": (
                "Cite section 8: note posture, endorse PMP-014 programme, note AI "
                "governance update, confirm next reporting cycle."
            ),
        },
    ],
    "synthetic_regulator_correspondence_dnrme_2026_04": [
        {
            "question": "What regulatory follow-up items are outstanding?",
            "guideline": (
                "Cite section 3 of the regulator correspondence: CMS-PINE-04 "
                "telemetry continuity remediation plan and AI-assisted decision "
                "support disclosures."
            ),
        },
    ],
    "synthetic_climate_outlook_seq_winter_2026": [
        {
            "question": "What catchment regions are forecast above-average rainfall?",
            "guideline": (
                "Cite section 2 of the outlook: Pine Rivers and "
                "Sunshine Coast catchments. Note above-average overnight minima."
            ),
        },
    ],
}


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------


def generate_pdf(md_path: Path, out_dir: Path) -> tuple[Path, Path]:
    md_text = md_path.read_text(encoding="utf-8")
    title, blocks = _parse_markdown(md_text)
    if not title:
        title = md_path.stem.replace("_", " ").title()

    body_font, heading_font = _ensure_fonts()
    styles = _build_styles(body_font, heading_font)

    out_pdf = out_dir / f"{md_path.stem}.pdf"
    doc = _build_doc(out_pdf)
    flowables = _flowables_for_blocks(title, blocks, styles)
    doc.build(flowables)

    examples = KA_EXAMPLES.get(md_path.stem, [])
    out_json = out_dir / f"{md_path.stem}.json"
    out_json.write_text(
        json.dumps(
            {
                "doc_id": md_path.stem,
                "title": title,
                "synthetic_demo": True,
                "examples": examples,
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    return out_pdf, out_json


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    if not DOCS_DIR.exists():
        LOG.error("Documents dir %s missing", DOCS_DIR)
        sys.exit(1)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    md_files = sorted(DOCS_DIR.glob("synthetic_*.md"))
    if not md_files:
        LOG.error("No markdown files found in %s", DOCS_DIR)
        sys.exit(1)

    LOG.info("Generating PDFs for %d markdown files", len(md_files))
    summary: list[dict[str, str]] = []
    for md in md_files:
        try:
            pdf_path, json_path = generate_pdf(md, OUT_DIR)
            LOG.info("  %s -> %s", md.name, pdf_path.name)
            summary.append(
                {
                    "doc_id": md.stem,
                    "pdf": str(pdf_path.relative_to(ROOT)),
                    "json": str(json_path.relative_to(ROOT)),
                    "size_bytes": str(pdf_path.stat().st_size),
                }
            )
        except Exception as exc:
            LOG.exception("Failed to generate %s: %s", md.name, exc)
            sys.exit(1)

    manifest = OUT_DIR / "manifest.json"
    manifest.write_text(
        json.dumps(
            {
                "generated_count": len(summary),
                "synthetic_demo": True,
                "documents": summary,
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    LOG.info("Wrote %s with %d entries", manifest, len(summary))


if __name__ == "__main__":
    main()
