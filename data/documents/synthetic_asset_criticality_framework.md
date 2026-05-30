# Asset Criticality Framework

**Status:** DEMO ARTEFACT — for executive demonstration only.
**Owner:** Asset Management Office
**Last reviewed:** 2026-03-12
**Classification:** Internal demo

> This framework is demo. It is provided to support a Databricks demo of governed
> AI over an asset register. It does not reflect the real Seqwater asset
> criticality framework, scoring weights, or risk thresholds.

## 1. Purpose

To enable consistent, auditable prioritisation of assets for monitoring,
maintenance, capital, and AI-assisted operational review.

## 2. Dimensions

Each asset is scored on the following dimensions:

1. **Service criticality.** Consequence of loss of service across affected zones.
2. **Public health risk.** Potential for water quality consequence.
3. **Environmental sensitivity.** Potential for environmental impact.
4. **Recovery time.** Time to restore service after failure.
5. **Substitutability.** Whether the SEQ Water Grid can carry the load.

## 3. Criticality bands

| Band     | Description                                                 |
|----------|-----------------------------------------------------------------------|
| Critical | Failure has consequence beyond a single zone or sustained service.    |
| High     | Failure materially impacts a zone or treatment capability.            |
| Medium   | Failure is localised and can be mitigated within current service envelope. |
| Low      | Recreation or non-supply assets with limited operational consequence. |

## 4. AI assistant guidance

- Always use the criticality band in conjunction with current health, open
  work orders, and predicted failure probability.
- Never combine criticality with real regulatory thresholds.
- Always state when an executive decision requires manual validation by the relevant
  asset class lead.

## 5. Human-in-the-loop validation

The AI assistant may surface ranked asset risk views and explain contributing factors.
It must not approve capital or operational decisions on its own.

---

*Demo content. Not for operational use.*
