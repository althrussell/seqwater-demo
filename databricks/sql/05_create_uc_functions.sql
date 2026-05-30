-- ============================================================================
-- Seqwater AI Command Centre — Unity Catalog functions
--
-- Three table-valued UC functions used as child-agent tools by the
-- Seqwater Supervisor agent. They mirror the deterministic Python tools in
-- backend/agents/tools.py so the live agent and local-mode mock answer with
-- identical semantics over identical synthetic data.
--
-- All values are SYNTHETIC demo data. {catalog}.{schema} placeholders are
-- substituted by scripts/databricks_sql.py.
-- ============================================================================

CREATE OR REPLACE FUNCTION {catalog}.{schema}.top_asset_risks(limit_n INT DEFAULT 5)
RETURNS TABLE (
  asset_id              STRING,
  asset_name            STRING,
  asset_type            STRING,
  criticality           STRING,
  risk_score            DOUBLE,
  risk_band             STRING,
  predicted_failure_30d DOUBLE,
  open_work_orders      INT,
  recommended_action    STRING
)
COMMENT 'Synthetic top-N asset risk scoreboard. Returns the highest-risk synthetic assets in descending order. SYNTHETIC DEMO DATA — NOT FOR OPERATIONAL USE.'
RETURN
  SELECT
    asset_id,
    asset_name,
    asset_type,
    criticality,
    risk_score,
    risk_band,
    predicted_failure_30d,
    open_work_orders,
    recommended_action
  FROM (
    SELECT
      asset_id,
      asset_name,
      asset_type,
      criticality,
      risk_score,
      risk_band,
      predicted_failure_30d,
      open_work_orders,
      recommended_action,
      ROW_NUMBER() OVER (ORDER BY risk_score DESC NULLS LAST) AS rn
    FROM {catalog}.{schema}.asset_risk_scores
  )
  WHERE rn <= COALESCE(limit_n, 5);

CREATE OR REPLACE FUNCTION {catalog}.{schema}.capital_priorities(limit_n INT DEFAULT 5)
RETURNS TABLE (
  project_id           STRING,
  project_name         STRING,
  asset_name           STRING,
  project_type         STRING,
  estimated_cost_aud   BIGINT,
  risk_reduction_score DOUBLE,
  delivery_risk        STRING,
  recommended_priority STRING
)
COMMENT 'Synthetic top-N capital project options ordered by risk reduction score. SYNTHETIC DEMO DATA — NOT FOR OPERATIONAL USE.'
RETURN
  SELECT
    project_id,
    project_name,
    asset_name,
    project_type,
    estimated_cost_aud,
    risk_reduction_score,
    delivery_risk,
    recommended_priority
  FROM (
    SELECT
      project_id,
      project_name,
      asset_name,
      project_type,
      estimated_cost_aud,
      risk_reduction_score,
      delivery_risk,
      recommended_priority,
      ROW_NUMBER() OVER (ORDER BY risk_reduction_score DESC NULLS LAST) AS rn
    FROM {catalog}.{schema}.capital_projects
  )
  WHERE rn <= COALESCE(limit_n, 5);

CREATE OR REPLACE FUNCTION {catalog}.{schema}.run_flood_scenario(scenario_id_in STRING)
RETURNS TABLE (
  scenario_id                STRING,
  scenario_name              STRING,
  rainfall_forecast_mm_24h   DOUBLE,
  rainfall_forecast_mm_72h   DOUBLE,
  catchment_saturation_index DOUBLE,
  current_storage_percent    DOUBLE,
  projected_storage_percent  DOUBLE,
  release_required           BOOLEAN,
  downstream_impact_score    DOUBLE,
  recommended_actions        STRING,
  action_owner               STRING,
  status                     STRING,
  peak_release_ml            DOUBLE,
  hours_simulated            INT
)
COMMENT 'Synthetic flood readiness scenario detail. Joins the synthetic scenario register with the synthetic dam release simulation summary for the requested scenario_id. SYNTHETIC DEMO DATA — NOT AN OPERATIONAL RELEASE MODEL.'
RETURN
  SELECT
    s.scenario_id,
    s.scenario_name,
    s.rainfall_forecast_mm_24h,
    s.rainfall_forecast_mm_72h,
    s.catchment_saturation_index,
    s.current_storage_percent,
    s.projected_storage_percent,
    s.release_required,
    s.downstream_impact_score,
    s.recommended_actions,
    s.action_owner,
    s.status,
    sim.peak_release_ml,
    sim.hours_simulated
  FROM {catalog}.{schema}.flood_scenarios AS s
  LEFT JOIN (
    SELECT
      scenario_id,
      MAX(projected_release_ml) AS peak_release_ml,
      COUNT(*) AS hours_simulated
    FROM {catalog}.{schema}.dam_release_simulation
    GROUP BY scenario_id
  ) AS sim
  ON sim.scenario_id = s.scenario_id
  WHERE s.scenario_id = scenario_id_in;
