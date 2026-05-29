# Synthetic Asset Criticality Framework

**Status:** SYNTHETIC DEMO ARTEFACT — for executive demonstration only.
**Owner (synthetic):** Asset Management Office
**Last reviewed (synthetic):** 2026-03-12
**Classification:** Internal demo

> This framework is synthetic. It is provided to support a Databricks demo of governed
> AI over a synthetic asset register. It does not reflect the real Seqwater asset
> criticality framework, scoring weights, or risk thresholds.

## 1. Purpose

To enable consistent, auditable prioritisation of synthetic assets for monitoring,
maintenance, capital, and AI-assisted operational review.

## 2. Synthetic dimensions

Each asset is scored on the following synthetic dimensions:

1. **Service criticality.** Consequence of loss of service across affected zones.
2. **Public health risk.** Synthetic potential for water quality consequence.
3. **Environmental sensitivity.** Synthetic potential for environmental impact.
4. **Recovery time.** Synthetic time to restore service after failure.
5. **Substitutability.** Whether the synthetic SEQ Water Grid can carry the load.

## 3. Synthetic criticality bands

| Band     | Synthetic description                                                 |
|----------|-----------------------------------------------------------------------|
| Critical | Failure has consequence beyond a single zone or sustained service.    |
| High     | Failure materially impacts a zone or treatment capability.            |
| Medium   | Failure is localised and can be mitigated within current service envelope. |
| Low      | Recreation or non-supply assets with limited operational consequence. |

## 4. AI assistant guidance

- Always use the synthetic criticality band in conjunction with current health, open
  work orders, and predicted failure probability.
- Never combine synthetic criticality with real regulatory thresholds.
- Always state when an executive decision requires manual validation by the relevant
  asset class lead.

## 5. Human-in-the-loop validation

The AI assistant may surface ranked asset risk views and explain contributing factors.
It must not approve capital or operational decisions on its own.

---

*Synthetic demo content. Not for operational use.*
