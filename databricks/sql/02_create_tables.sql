-- ============================================================================
-- Seqwater AI Command Centre — Unity Catalog tables
--
-- All values are SYNTHETIC demo data. Schema mirrors columns produced by
-- scripts/generate_synthetic_data.py. {catalog}.{schema} placeholders are
-- substituted by scripts/databricks_sql.py.
-- ============================================================================

CREATE TABLE IF NOT EXISTS {catalog}.{schema}.assets (
  asset_id            STRING NOT NULL,
  name                STRING NOT NULL,
  asset_type          STRING NOT NULL,
  region              STRING,
  criticality         STRING,
  capacity_ml         DOUBLE,
  commissioned_year   INT,
  synthetic_demo_flag BOOLEAN NOT NULL
)
COMMENT 'Synthetic asset register. Not real Seqwater data.'
TBLPROPERTIES ('synthetic_demo' = 'true');

CREATE TABLE IF NOT EXISTS {catalog}.{schema}.asset_locations (
  asset_id            STRING NOT NULL,
  lat                 DOUBLE,
  lon                 DOUBLE,
  region              STRING,
  synthetic_demo_flag BOOLEAN NOT NULL
)
COMMENT 'Synthetic asset coordinates. Approximate SEQ landmarks for demo only.'
TBLPROPERTIES ('synthetic_demo' = 'true');

CREATE TABLE IF NOT EXISTS {catalog}.{schema}.dam_storage_daily (
  asset_id            STRING NOT NULL,
  asset_name          STRING,
  date                DATE,
  current_storage_ml  DOUBLE,
  full_supply_ml      DOUBLE,
  storage_percent     DOUBLE,
  inflow_ml           DOUBLE,
  outflow_ml          DOUBLE,
  synthetic_demo_flag BOOLEAN NOT NULL
)
PARTITIONED BY (date)
COMMENT 'Synthetic daily dam storage history.'
TBLPROPERTIES ('synthetic_demo' = 'true');

CREATE TABLE IF NOT EXISTS {catalog}.{schema}.rainfall_observations (
  asset_id            STRING,
  asset_name          STRING,
  region              STRING,
  date                DATE,
  rainfall_mm         DOUBLE,
  synthetic_demo_flag BOOLEAN
)
COMMENT 'Synthetic catchment rainfall observations.';

CREATE TABLE IF NOT EXISTS {catalog}.{schema}.rainfall_forecast (
  asset_id              STRING,
  asset_name            STRING,
  region                STRING,
  horizon               STRING,
  horizon_hours         INT,
  forecast_rainfall_mm  DOUBLE,
  issued_at             TIMESTAMP,
  synthetic_demo_flag   BOOLEAN
)
COMMENT 'Synthetic catchment rainfall forecast (24h, 48h, 72h, 7d).';

CREATE TABLE IF NOT EXISTS {catalog}.{schema}.demand_forecast (
  date                DATE,
  demand_ml_day       DOUBLE,
  scenario_name       STRING,
  synthetic_demo_flag BOOLEAN
);

CREATE TABLE IF NOT EXISTS {catalog}.{schema}.supply_forecast (
  date                        DATE,
  treatment_capacity_ml_day   DOUBLE,
  scenario_name               STRING,
  synthetic_demo_flag         BOOLEAN
);

CREATE TABLE IF NOT EXISTS {catalog}.{schema}.grid_transfer_recommendations (
  from_region           STRING,
  to_region             STRING,
  grid_transfer_ml_day  DOUBLE,
  rationale             STRING,
  confidence            STRING,
  synthetic_demo_flag   BOOLEAN
);

CREATE TABLE IF NOT EXISTS {catalog}.{schema}.asset_health_daily (
  asset_id            STRING,
  date                DATE,
  health_index        DOUBLE,
  synthetic_demo_flag BOOLEAN
);

CREATE TABLE IF NOT EXISTS {catalog}.{schema}.maintenance_work_orders (
  work_order_id       STRING,
  asset_id            STRING,
  asset_name          STRING,
  priority            STRING,
  status              STRING,
  opened_at           TIMESTAMP,
  age_days            INT,
  description         STRING,
  synthetic_demo_flag BOOLEAN
);

CREATE TABLE IF NOT EXISTS {catalog}.{schema}.asset_risk_scores (
  asset_id              STRING,
  asset_name            STRING,
  asset_type            STRING,
  criticality           STRING,
  risk_score            DOUBLE,
  risk_band             STRING,
  predicted_failure_30d DOUBLE,
  open_work_orders      INT,
  health_index          DOUBLE,
  recommended_action    STRING,
  synthetic_demo_flag   BOOLEAN
)
COMMENT 'Synthetic asset risk scoreboard.';

CREATE TABLE IF NOT EXISTS {catalog}.{schema}.water_quality_samples (
  sample_id               STRING,
  asset_id                STRING,
  asset_name              STRING,
  sample_zone             STRING,
  sampled_at              TIMESTAMP,
  turbidity_NTU           DOUBLE,
  pH                      DOUBLE,
  chlorine_residual_mg_L  DOUBLE,
  conductivity_uS_cm      DOUBLE,
  temperature_c           DOUBLE,
  e_coli_detected         BOOLEAN,
  alert_level             STRING,
  recommended_action      STRING,
  synthetic_demo_flag     BOOLEAN
);

CREATE TABLE IF NOT EXISTS {catalog}.{schema}.treatment_plant_operations (
  asset_id                  STRING,
  asset_name                STRING,
  region                    STRING,
  design_capacity_ml_day    DOUBLE,
  current_throughput_ml_day DOUBLE,
  utilisation_pct           DOUBLE,
  operating_state           STRING,
  synthetic_demo_flag       BOOLEAN
);

CREATE TABLE IF NOT EXISTS {catalog}.{schema}.turbidity_events (
  event_id            STRING,
  asset_id            STRING,
  asset_name          STRING,
  started_at          TIMESTAMP,
  duration_hours      DOUBLE,
  peak_turbidity_NTU  DOUBLE,
  status              STRING,
  synthetic_demo_flag BOOLEAN
);

CREATE TABLE IF NOT EXISTS {catalog}.{schema}.quality_alerts (
  alert_id            STRING,
  asset_id            STRING,
  asset_name          STRING,
  sample_zone         STRING,
  sampled_at          TIMESTAMP,
  alert_level         STRING,
  turbidity_NTU       DOUBLE,
  recommended_action  STRING,
  synthetic_demo_flag BOOLEAN
);

CREATE TABLE IF NOT EXISTS {catalog}.{schema}.flood_scenarios (
  scenario_id                   STRING,
  scenario_name                 STRING,
  rainfall_forecast_mm_24h      DOUBLE,
  rainfall_forecast_mm_72h      DOUBLE,
  catchment_saturation_index    DOUBLE,
  current_storage_percent       DOUBLE,
  projected_storage_percent     DOUBLE,
  release_required              BOOLEAN,
  downstream_impact_score       DOUBLE,
  recommended_actions           STRING,
  action_owner                  STRING,
  status                        STRING,
  synthetic_demo_flag           BOOLEAN
)
COMMENT 'Synthetic flood readiness scenario register. NOT an operational release model.';

CREATE TABLE IF NOT EXISTS {catalog}.{schema}.catchment_conditions (
  asset_id                   STRING,
  asset_name                 STRING,
  region                     STRING,
  saturation_index           DOUBLE,
  antecedent_rainfall_mm_7d  DOUBLE,
  stream_height_m            DOUBLE,
  synthetic_demo_flag        BOOLEAN
);

CREATE TABLE IF NOT EXISTS {catalog}.{schema}.dam_release_simulation (
  scenario_id                  STRING,
  hour                         INT,
  projected_storage_percent    DOUBLE,
  projected_release_ml         DOUBLE,
  synthetic_demo_flag          BOOLEAN
);

CREATE TABLE IF NOT EXISTS {catalog}.{schema}.incident_actions (
  action_id           STRING,
  scenario_id         STRING,
  action              STRING,
  owner               STRING,
  status              STRING,
  due_in_hours        INT,
  synthetic_demo_flag BOOLEAN
);

CREATE TABLE IF NOT EXISTS {catalog}.{schema}.capital_projects (
  project_id            STRING,
  project_name          STRING,
  asset_id              STRING,
  asset_name            STRING,
  project_type          STRING,
  estimated_cost_aud    BIGINT,
  risk_reduction_score  DOUBLE,
  delivery_risk         STRING,
  community_impact      STRING,
  recommended_priority  STRING,
  synthetic_demo_flag   BOOLEAN
);

CREATE TABLE IF NOT EXISTS {catalog}.{schema}.opex_costs (
  asset_id            STRING,
  asset_name          STRING,
  quarter             STRING,
  opex_aud_m          DOUBLE,
  synthetic_demo_flag BOOLEAN
);

CREATE TABLE IF NOT EXISTS {catalog}.{schema}.asset_investment_priorities (
  rank                  INT,
  project_id            STRING,
  project_name          STRING,
  asset_name            STRING,
  estimated_cost_aud    BIGINT,
  risk_reduction_score  DOUBLE,
  recommended_priority  STRING,
  score                 DOUBLE,
  synthetic_demo_flag   BOOLEAN
);

CREATE TABLE IF NOT EXISTS {catalog}.{schema}.hourly_telemetry (
  asset_id            STRING,
  asset_name          STRING,
  ts                  TIMESTAMP,
  flow_lps            DOUBLE,
  pressure_kpa        DOUBLE,
  vibration_mm_s      DOUBLE,
  synthetic_demo_flag BOOLEAN
);

CREATE TABLE IF NOT EXISTS {catalog}.{schema}.ai_interaction_audit (
  trace_id                    STRING,
  user_id                     STRING,
  timestamp                   TIMESTAMP,
  question                    STRING,
  tools_used                  STRING,
  sources_used                STRING,
  confidence                  STRING,
  response_summary            STRING,
  human_validation_required   BOOLEAN,
  synthetic_demo_flag         BOOLEAN
)
COMMENT 'AquaIQ AI interaction audit log. Every interaction is recorded for governance.';
