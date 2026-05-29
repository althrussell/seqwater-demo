# Seqwater AI Command Centre — Demo Script

**Audience:** Seqwater executive team (CEO, COO, CIO, GM Operations, GM
Strategy and Planning, GM Asset Management, GM Water Quality and Treatment).

**Length:** 8–12 minutes. Designed to feel like a polished executive walk-through, not a feature tour.

**Setting:** Single browser, full screen, on a recent laptop. Keep the
"Synthetic demo data" banner visible at all times.

**Opening line (memorise):**

> "The point of this demo is not that AI replaces operational experts. The
> point is that Databricks gives Seqwater a governed intelligence layer where
> executives, engineers, planners, and operators can interrogate trusted
> data, understand risk faster, and turn fragmented information into
> traceable action."

> Synthetic demo data only. Not real Seqwater data. Not for operational use.

---

## 0. Pre-flight (30 seconds, before the meeting)

- App running in production mode at `http://localhost:8000` so it shows the
  built SPA with a stable URL.
- All eight pages preloaded.
- Click into the AquaIQ assistant once before the demo so the empty-state
  prompt chips appear instantly when you visit it.

---

## 1. Executive Overview — set the scene (90 seconds)

**Page:** Executive Overview (`/overview`).

**What to click:**

- Land on the page.
- Pause for a beat. Let the executive eye scan the hero, KPI tiles, and the
  AquaIQ summary.

**What to say:**

- "Imagine walking into the office and one screen tells you whether SEQ-wide
  supply is okay, what's developing in the next 72 hours, and what your team
  should be paying attention to today."
- "Every tile here is backed by a synthetic Unity Catalog table. So storage
  comes from `dam_storage_daily`, the risk band comes from
  `asset_risk_scores`, the rainfall forecast from `rainfall_forecast`, and
  so on."
- "Notice the synthetic AI executive summary on the left. It's written in
  the same six-section structure every time — summary, signals, actions,
  risks, sources, human validation."

**Wow moment:** The KPI cards animate, sparklines pulse, the hero says
**Watch**, and the recommended actions are concrete. It feels like a
command centre, not a dashboard.

---

## 2. A potential weather event is developing (60 seconds)

**Page:** Water Security Map (`/map`).

**What to click:**

- Switch to the map page.
- Hover over Brisbane North and the Sunshine Coast region.
- Click on **North Pine Dam** to open the asset drawer.

**What to say:**

- "We can see the synthetic SEQ Water Grid as it sits today. Markers are
  sized and coloured by synthetic risk band."
- "The synthetic North Pine catchment is showing a rising rainfall forecast
  and the dam is approaching its synthetic attention threshold."
- "When I click into the asset, I see the same synthetic governed data
  cabinet — storage trend, health trend, recent work orders, recent quality
  samples."

**Wow moment:** Click an asset, and the right-hand drawer streams in trend
sparklines and a synthetic AI risk narrative — without leaving the page.

---

## 3. Asset risk and the rising failure trend (60 seconds)

**Page:** Asset Risk (`/assets`).

**What to click:**

- Show the three top charts (risk by type, work orders by status, capital
  investment curve).
- Search "Caboolture" and click **Explain risk** on the row.

**What to say:**

- "This is the synthetic asset risk scoreboard. We can see the synthetic
  Caboolture Pump Station has moved into the critical band — its synthetic
  health index is trending down and there's a synthetic 30-day failure
  probability above demo attention."
- "Notice how the recommended action is conservative — engage operations,
  validate redundancy, pre-stage spares. AquaIQ never tells you to do an
  operational action without a named human."
- "The capital investment curve underneath shows synthetic projects ranked
  by risk reduction. The pump replacement project is the largest synthetic
  risk reducer."

**Wow moment:** "Explain risk" opens the same governed drawer with the
synthetic AI narrative grounded in the same UC tables.

---

## 4. Water quality (45 seconds)

**Page:** Water Quality (`/quality`).

**What to click:**

- Show the synthetic 14-day turbidity trend.
- Show the AI explanation panel and the synthetic operational review
  checklist.

**What to say:**

- "Two synthetic water treatment plants are showing elevated turbidity.
  AquaIQ explains the likely synthetic drivers and surfaces a synthetic
  operational review checklist drawn from the synthetic Water Quality
  Response Procedure stored in the Volume."
- "The wording is deliberately conservative. AquaIQ never gives public
  health advice and never invents regulatory thresholds."

**Wow moment:** A water quality executive nods at the conservative
language. It feels operationally credible.

---

## 5. Flood readiness scenario (90 seconds)

**Page:** Flood Readiness (`/flood`).

**What to click:**

- Point at the disclaimer banner.
- Show the synthetic scenario register card for **Severe Coastal Rainfall —
  72 Hour Watch**.
- Run the simulator with the preloaded inputs.
- Drop the rainfall_72h slider to 80 mm and run again to show the risk
  classification dropping from **Coordinate** to **Watch**.

**What to say:**

- "This is a **synthetic** scenario simulator. It is not, and we will not
  pretend it is, an operational flood-release model. Real flood operations
  at Seqwater are governed by approved procedures, licensed operators, and
  the Bureau of Meteorology."
- "What this demo is showing is how Databricks makes it cheap and quick to
  prototype scenario analytics, with full lineage and human-in-the-loop
  governance, on top of the same governed lakehouse the executive overview
  is built on."
- "Watch how the recommended actions change as I change the inputs. The
  language stays conservative. The communications checklist is grounded in
  the synthetic retailer customer protocol stored in the Volume."

**Wow moment:** The simulator updates the synthetic 72-hour storage
trajectory chart and recommended actions live. The risk band drops as the
rainfall input drops. Every output is traced.

---

## 6. AquaIQ assistant — Agent Bricks in action (2 minutes)

**Page:** AquaIQ Assistant (`/aquaiq`).

**What to click:**

- Land on the page. Note the "Agent Bricks at work" strip — Supervisor,
  Knowledge Assistant, Genie, UC functions. Watch the warm-up pill flip from
  "Warming…" to "Supervisor warm (xxx ms)".
- Click the suggestion chip: *"What are the synthetic top 5 operational
  risks over the next 72 hours?"*
- **Demo beat 1 — ask the data**: as the Supervisor streams, point out the
  `seqwater_data` tool pill lighting up (Genie returns the synthetic risk
  scoreboard). The markdown answer renders live, section by section.
- Click: *"Summarise the synthetic flood readiness posture for scenario
  FS-001."* The `flood_scenario_runner` UC function pill lights up.
- **Demo beat 2 — ask the playbook**: type *"What does the dam operations
  playbook require during a Watch posture?"* The `operational_docs` pill
  lights up — that's the Knowledge Assistant retrieving the synthetic PDF.
- **Demo beat 3 — ask both**: click *"Which synthetic capital projects
  reduce the most operational risk?"* — watch `seqwater_data` and
  `operational_docs` and `capital_priorities` light up in sequence as the
  Supervisor chains them.
- Type: *"Open the spillway at Wivenhoe Dam"* — show the refusal stream
  back as markdown.
- Hit "+ New chat" in the left sidebar, then delete a previous chat. Note
  the audit trail tile: deleting a chat does **not** delete the synthetic
  governance record.

**What to say:**

- "AquaIQ is now a *Supervisor agent* on Databricks Agent Bricks. It
  orchestrates a Knowledge Assistant over synthetic playbooks, a Genie space
  over synthetic operational tables, and three synthetic Unity Catalog
  functions for deterministic scenario lookups."
- "Every answer has the same structure: summary, key signals, recommended
  actions, risks and assumptions, sources used, and an explicit human
  validation requirement. Streaming markdown means the answer feels
  immediate even on a first cold-start."
- "The trace ID, the tool palette, the source citations, the confidence
  band — every part is auditable."
- "Now watch what happens when an executive asks AquaIQ to authorise an
  operational action. It refuses — politely and predictably — and routes
  the user back to the appropriate Seqwater function."
- "Three primitives, one supervisor, one governed answer."

**Wow moment:** The tool palette lighting up live as the Supervisor decides
where to route — and the refusal at the end. Executives often expect AI to
be overconfident; AquaIQ visibly refuses, cites its policy, and asks for
named human review.

---

## 6b. (Optional) Data Explorer — Genie embedded directly (45 seconds)

**Page:** Data Explorer (`/genie`).

**What to click:**

- Land on the page. The synthetic *Seqwater Operations* Genie Space is
  embedded as an iframe — no tab-switching, no copy-paste between tools.
- Pick one of the suggestion chips, e.g. *"Show the synthetic 7-day storage
  trend for North Pine Dam vs Wivenhoe."*
- Let Genie generate the SQL, run it, and chart the result inline.

**What to say:**

- "AquaIQ gives you the governed, citation-rich synthesis. Genie gives you
  the underlying numbers in 30 seconds, in your data analysts' language."
- "Both are powered by the same Unity Catalog data and the same governance
  policies. Users only see synthetic data they have permission on."
- "The whole Genie Space is embedded right inside this app via the
  Databricks embed-as-iframe API — no separate tool to learn, no second
  login."

**Wow moment:** Genie generates SQL live and the chart renders inside the
Seqwater app. The audience sees Databricks and the customer's UI as one
coherent surface.

---

## 7. Board briefing generator — insight to action (60 seconds)

**Page:** Board Briefing (`/briefing`).

**What to click:**

- Click **Generate briefing**.
- Scroll briefly through the Markdown.
- Click **Copy** — show the toast.
- Click **Markdown** to download.

**What to say:**

- "From command-centre context to a board-ready briefing in one click. It's
  a real Markdown artefact you can paste into a board pack or a confidential
  Slack channel."
- "Critically — every section cites synthetic sources, calls out
  assumptions, and ends with a human validation requirement."

**Wow moment:** The board document is well-structured, calm, and
professional. It feels like something the GM Strategy could actually take
into a board meeting (after human validation).

---

## 8. Governance and lineage — the differentiator (90 seconds)

**Page:** Governance & Lineage (`/governance`).

**What to click:**

- Walk through the five governance tiles.
- Pause on the lineage diagram showing source → UC table → Volume document
  → AquaIQ tool → Foundation Model → executive answer.
- Show the synthetic AI interaction audit log.

**What to say:**

- "This is what makes Databricks credible for Seqwater. Every output the
  executives just saw is traceable back to a Unity Catalog table, a
  governed document in a Volume, and an audited AI interaction."
- "Governed data. Governed AI. Governed actions. Governed access. Governed
  cost. One platform."
- "Real-world operational decisions remain with Seqwater experts. Databricks
  gives those experts a faster, calmer, more defensible operating picture."

**Wow moment:** The audit log shows every AquaIQ interaction this session,
with trace IDs, tools used, sources, confidence, and human-validation flag
— so executives understand the AI is auditable, not magical.

---

## 9. Closing (60 seconds)

**Where to land:** Back on Executive Overview.

**What to say:**

- "From fragmented systems and manual reporting to governed, AI-assisted
  operational intelligence. That's the value pillar shift."
- "**Faster executive situational awareness.** The first 60 seconds of
  every morning."
- "**Better risk prioritisation.** Across operations, assets, water quality,
  catchments, and capital, ranked consistently."
- "**Governed AI over operational data.** With the same controls Seqwater
  already trusts for SCADA and OT — applied to AI."
- "**Reduced manual reporting effort.** Briefings, summaries, drafts — all
  governed and traceable."
- "**Cross-functional alignment.** One operating picture for executives,
  engineers, planners, and operators."

---

## Discovery questions for follow-up

Use these to set up the next conversation, not to score the demo.

1. Where in your operating week is the most painful manual reporting effort
   you would replace first?
2. Where do executives currently rely on tribal knowledge to know which
   asset is at risk this week?
3. Which existing Seqwater data products are mature enough to land into a
   governed lakehouse first (SCADA history, work order systems, GIS,
   hydrologic models, financial)?
4. What does your current AI policy say about source citation, confidence,
   and refusal behaviour for operational assistants?
5. Who would own the executive operating picture — Strategy, Operations,
   Asset Management, or a new function?
6. Which scenario simulators — flood, drought, water quality, demand, supply
   reliability — would deliver the largest near-term value if prototyped
   over the lakehouse?
7. What would it take to run a 6-week synthetic-then-real pilot on one
   high-value workflow with executive sponsorship?

## Wow-moment cheat sheet

| Page | Wow moment |
|------|------------|
| Executive Overview | KPI grid + AquaIQ summary + Generate Board Briefing CTA all live in 60 seconds. |
| Water Security Map | Click to drill, drawer streams in trend + AI narrative. |
| Asset Risk | Caboolture Pump Station rising failure trend + capital project that reduces it. |
| Water Quality | Conservative AI explanation + synthetic operational checklist. |
| Flood Readiness | Slider changes risk band live; synthetic disclaimer remains visible. |
| AquaIQ Assistant | Prompt chips, citations, confidence band, **and the refusal**. |
| Board Briefing | One-click Markdown briefing with sources and human validation. |
| Governance & Lineage | Lineage diagram + audit log + five governance pillars in one view. |
