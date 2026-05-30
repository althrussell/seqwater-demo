-- ============================================================================
-- Seqwater AI Command Centre — Data quality checks
--
-- Each query returns rows when something is wrong. A "clean" run returns 0 rows.
-- {catalog}.{schema} placeholders are substituted by scripts/databricks_sql.py.
-- ============================================================================

-- 1. Every table must carry the synthetic_demo_flag = TRUE.
SELECT 'assets' AS table_name, COUNT(*) AS bad_rows
FROM {catalog}.{schema}.assets WHERE synthetic_demo_flag IS NULL OR synthetic_demo_flag = FALSE
UNION ALL
SELECT 'asset_risk_scores',  COUNT(*) FROM {catalog}.{schema}.asset_risk_scores  WHERE synthetic_demo_flag = FALSE
UNION ALL
SELECT 'water_quality_samples', COUNT(*) FROM {catalog}.{schema}.water_quality_samples WHERE synthetic_demo_flag = FALSE
UNION ALL
SELECT 'flood_scenarios', COUNT(*) FROM {catalog}.{schema}.flood_scenarios WHERE synthetic_demo_flag = FALSE;

-- 2. Risk scores must be between 0 and 1.
SELECT asset_id, risk_score
FROM {catalog}.{schema}.asset_risk_scores
WHERE risk_score < 0 OR risk_score > 1;

-- 3. Storage must be between 0 and full supply.
SELECT asset_id, date, current_storage_ml, full_supply_ml
FROM {catalog}.{schema}.dam_storage_daily
WHERE current_storage_ml < 0 OR current_storage_ml > full_supply_ml;

-- 4. Water quality alert level must be one of the expected values.
SELECT sample_id, alert_level
FROM {catalog}.{schema}.water_quality_samples
WHERE alert_level NOT IN ('Normal', 'Watch', 'Elevated');

-- 5. Every flood scenario must have an owner and recommended actions text.
SELECT scenario_id
FROM {catalog}.{schema}.flood_scenarios
WHERE action_owner IS NULL OR LENGTH(recommended_actions) < 20;

-- 6. AI interaction audit rows must have a trace_id and timestamp.
SELECT *
FROM {catalog}.{schema}.ai_interaction_audit
WHERE trace_id IS NULL OR timestamp IS NULL;
