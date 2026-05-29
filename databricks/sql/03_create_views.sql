-- ============================================================================
-- Seqwater AI Command Centre — Unity Catalog views
--
-- Convenience views for the executive command centre and AquaIQ tool calls.
-- All values are SYNTHETIC. {catalog}.{schema} placeholders are substituted by
-- scripts/databricks_sql.py.
-- ============================================================================

CREATE OR REPLACE VIEW {catalog}.{schema}.v_overview_kpis AS
WITH latest_storage AS (
  SELECT
    SUM(current_storage_ml) AS storage_ml,
    SUM(full_supply_ml)     AS full_ml
  FROM (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY asset_id ORDER BY date DESC) rn
    FROM {catalog}.{schema}.dam_storage_daily
  )
  WHERE rn = 1
),
critical_wos AS (
  SELECT COUNT(*) AS open_p1
  FROM {catalog}.{schema}.maintenance_work_orders
  WHERE status <> 'Completed' AND priority = 'P1 - Critical'
),
quality AS (
  SELECT
    SUM(CASE WHEN alert_level = 'Elevated' THEN 1 ELSE 0 END) AS elevated_count,
    SUM(CASE WHEN alert_level = 'Watch'    THEN 1 ELSE 0 END) AS watch_count
  FROM {catalog}.{schema}.water_quality_samples
),
risk AS (
  SELECT
    SUM(CASE WHEN risk_band IN ('Critical','High') THEN 1 ELSE 0 END) AS elevated_assets
  FROM {catalog}.{schema}.asset_risk_scores
),
forecast AS (
  SELECT AVG(forecast_rainfall_mm) AS forecast_72h_avg
  FROM {catalog}.{schema}.rainfall_forecast WHERE horizon = '72h'
)
SELECT
  CURRENT_TIMESTAMP() AS generated_at,
  ROUND(latest_storage.storage_ml / latest_storage.full_ml * 100, 2) AS storage_percent,
  critical_wos.open_p1,
  quality.elevated_count,
  quality.watch_count,
  risk.elevated_assets,
  ROUND(forecast.forecast_72h_avg, 1) AS forecast_72h_avg_mm,
  TRUE AS synthetic_demo_flag
FROM latest_storage, critical_wos, quality, risk, forecast;


CREATE OR REPLACE VIEW {catalog}.{schema}.v_top_asset_risks AS
SELECT
  asset_id,
  asset_name,
  asset_type,
  risk_band,
  risk_score,
  predicted_failure_30d,
  open_work_orders,
  recommended_action
FROM {catalog}.{schema}.asset_risk_scores
ORDER BY risk_score DESC;


CREATE OR REPLACE VIEW {catalog}.{schema}.v_water_quality_status AS
SELECT
  tpo.region,
  COUNT(DISTINCT tpo.asset_id)              AS plants,
  AVG(tpo.utilisation_pct)                  AS avg_utilisation_pct,
  SUM(CASE WHEN tpo.operating_state = 'Online'  THEN 1 ELSE 0 END) AS online_plants,
  SUM(CASE WHEN tpo.operating_state = 'Reduced' THEN 1 ELSE 0 END) AS reduced_plants
FROM {catalog}.{schema}.treatment_plant_operations tpo
GROUP BY tpo.region;


CREATE OR REPLACE VIEW {catalog}.{schema}.v_capital_priorities AS
SELECT
  project_id, project_name, asset_name, project_type,
  estimated_cost_aud, risk_reduction_score, delivery_risk,
  community_impact, recommended_priority
FROM {catalog}.{schema}.capital_projects
ORDER BY risk_reduction_score DESC, estimated_cost_aud ASC;


CREATE OR REPLACE VIEW {catalog}.{schema}.v_ai_audit_summary AS
SELECT
  DATE(timestamp)            AS day,
  COUNT(*)                   AS interactions,
  SUM(CASE WHEN human_validation_required THEN 1 ELSE 0 END) AS reviews_required,
  COUNT(DISTINCT user_id)    AS distinct_users
FROM {catalog}.{schema}.ai_interaction_audit
GROUP BY DATE(timestamp)
ORDER BY day DESC;
