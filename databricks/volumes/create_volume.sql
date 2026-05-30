-- ============================================================================
-- Seqwater AI Command Centre — Volume for operational documents.
-- {catalog}.{schema}.{volume} placeholders substituted by databricks_sql.py.
-- ============================================================================

CREATE VOLUME IF NOT EXISTS {catalog}.{schema}.{volume}
  COMMENT 'Operational documents (Markdown). Used by AquaIQ retrieval. Not real Seqwater procedures.';
