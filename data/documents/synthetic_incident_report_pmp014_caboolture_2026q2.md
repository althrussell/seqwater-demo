# Incident Report — Caboolture Pump Station PMP-014

**Status:** DEMO ARTEFACT — for executive demonstration only.
**Owner:** Network Operations
**Incident reference:** INC-2026-Q2-0142
**Asset:** PMP-014 (Caboolture Pump Station)
**Period covered:** 2026-04-29 to 2026-05-26
**Classification:** Internal demo

> This incident report is demo. It was generated for a Databricks demo
> of governed AI-assisted operational summaries. It does not describe a real
> incident at any Seqwater asset, and does not represent any real procedure
> or finding. Do not use this content for any operational purpose.

## 1. Incident summary

The Caboolture Pump Station (`PMP-014`) recorded a sequence of
short-duration trip events during the reporting window. The
failure-probability score on the asset risk scoreboard rose from
0.18 at the start of the window to 0.47 at the close. The asset is
classified **High** risk band as of the latest refresh.

## 2. Timeline of events (illustrative only)

| Date | Event                                                  | Outcome                                  |
|------------------|---------------------------------------------------------------------|----------------------------------------------------|
| 2026-04-29       | Vibration sensor reported elevated harmonic at 1.4× spec  | Watch raised; work order created         |
| 2026-05-04       | Motor current excursion 11% above baseline for 6 minutes  | Trip event; auto-restart succeeded                 |
| 2026-05-12       | Seal water flow trended 18% below minimum band  | Preventive maintenance escalated         |
| 2026-05-19       | Two trip events in a 14-hour window                       | On-call engineer attended; temp clamp    |
| 2026-05-26       | Asset risk score recalculated at 0.47, band **High**      | Capital options refreshed; investment review queued |

## 3. Root cause hypotheses

1. Bearing-pack wear approaching life-of-asset midpoint.
2. Mechanical seal degradation under dry-run conditions during the
   April low-flow window.
3. Possible VFD harmonic interaction with upstream
   substation switching.

These hypotheses are illustrative. Confirmation requires a
vibration spectrum analysis and a strip-down inspection.

## 4. Recommended next actions

1. Convene asset reliability review with operations, maintenance,
   and reliability engineering.
2. Sequence a short-window outage to enable strip-down inspection
   within 21 days.
3. Stage the recommended capital project (`PMP-014
   Replacement / Refurbishment Programme`) for the next investment review.
4. Maintain Watch posture and keep redundancy paths
   pre-staged.

## 5. Implications for downstream supply

The Caboolture supply zone has a single dependency on
PMP-014 during peak demand windows. If the failure probability
exceeds 0.55 in subsequent refreshes, the continuity-of-supply risk
indicator will move from Amber to Red on the Asset Risk dashboard.

## 6. Human-in-the-loop validation

All recommendations in this report must be validated by qualified
operations and reliability personnel before any operational change
is implemented. AI-generated summaries of this incident must cite
this report and explicitly state the nature of the data.

---

*Demo content. Not for operational use.*
