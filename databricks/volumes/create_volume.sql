-- ============================================================================
-- Seqwater AI Command Centre — Volume for synthetic operational documents.
-- {catalog}.{schema}.{volume} placeholders substituted by databricks_sql.py.
-- ============================================================================

CREATE VOLUME IF NOT EXISTS {catalog}.{schema}.{volume}
  COMMENT 'Synthetic operational documents (Markdown). Used by AquaIQ retrieval. Not real Seqwater procedures.';
