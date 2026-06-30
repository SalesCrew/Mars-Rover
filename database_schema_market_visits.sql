-- ============================================================================
-- MARKET VISITS
-- Visit ledger used by markets, Fragebogen/Zusatz-Zeiterfassung, Vorverkauf,
-- and Wellen flows to record one market visit per market/day.
-- ============================================================================

CREATE TABLE IF NOT EXISTS market_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id TEXT NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  gebietsleiter_id UUID REFERENCES gebietsleiter(id) ON DELETE SET NULL,
  visit_date DATE NOT NULL,
  source VARCHAR(50) NOT NULL CHECK (source IN ('manual', 'zusatz', 'vorbesteller', 'vorverkauf', 'vorverkauf_wellen', 'fragebogen')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_market_visits_market_date ON market_visits(market_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_market_visits_gl ON market_visits(gebietsleiter_id);
CREATE INDEX IF NOT EXISTS idx_market_visits_visit_date ON market_visits(visit_date DESC);

ALTER TABLE market_visits ENABLE ROW LEVEL SECURITY;

-- Do not add broad authenticated policies here.
-- Use backend/sql/dsgvo_rls_hardening.sql for the reviewed production RLS/grant model.
