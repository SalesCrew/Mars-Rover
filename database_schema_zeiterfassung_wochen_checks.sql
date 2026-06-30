-- ============================================================================
-- ZEITERFASSUNG WOCHEN CHECKS
-- Tracks GL confirmation that a Zeitfassung week has been reviewed.
-- ============================================================================

CREATE TABLE IF NOT EXISTS zeiterfassung_wochen_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gebietsleiter_id UUID NOT NULL REFERENCES gebietsleiter(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_zeiterfassung_wochen_checks_gl_week
  ON zeiterfassung_wochen_checks(gebietsleiter_id, week_start_date);

CREATE INDEX IF NOT EXISTS idx_zeiterfassung_wochen_checks_gl
  ON zeiterfassung_wochen_checks(gebietsleiter_id);

ALTER TABLE zeiterfassung_wochen_checks ENABLE ROW LEVEL SECURITY;

-- Do not add broad authenticated policies here.
-- Use backend/sql/dsgvo_rls_hardening.sql for the reviewed production RLS/grant model.
