-- Add market_id column to fb_zusatz_zeiterfassung for Sonderaufgabe entries
-- This column is optional (only filled for sonderaufgabe reason)
ALTER TABLE fb_zusatz_zeiterfassung ADD COLUMN IF NOT EXISTS market_id VARCHAR(50);
