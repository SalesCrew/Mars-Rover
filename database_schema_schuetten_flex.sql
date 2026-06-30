-- ============================================================================
-- Schütten Flex Mode Migration
-- Run this in Supabase SQL Editor BEFORE deploying the code changes.
-- All changes are additive (existing data preserved, new columns nullable/default).
-- ============================================================================

-- 1. Add target_number and item_value to wellen_schuetten so display-like
--    Schütten (without child products) can track progress and wave value.
ALTER TABLE wellen_schuetten
  ADD COLUMN IF NOT EXISTS target_number INTEGER NOT NULL DEFAULT 1 CHECK (target_number > 0),
  ADD COLUMN IF NOT EXISTS item_value DECIMAL(10,2) DEFAULT NULL;

-- 2. Index to speed up resolver lookups by welle
CREATE INDEX IF NOT EXISTS idx_wellen_schuetten_welle ON wellen_schuetten(welle_id);
