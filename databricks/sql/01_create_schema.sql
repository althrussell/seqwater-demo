-- ============================================================================
-- Seqwater AI Command Centre — Unity Catalog schema
--
-- All data is demo data. Do NOT treat any output as real Seqwater
-- operational data. The {catalog} and {schema} placeholders are substituted by
-- scripts/databricks_sql.py from DATABRICKS_CATALOG / DATABRICKS_SCHEMA.
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS {catalog}.{schema}
  COMMENT 'Demo schema for the Seqwater AI Command Centre. Not real data.'
  WITH DBPROPERTIES ('synthetic_demo' = 'true', 'managed_by' = 'field-engineering-demo');
