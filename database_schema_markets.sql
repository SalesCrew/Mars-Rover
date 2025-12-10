-- ============================================
-- Mars Rover Admin - Markets Database Schema
-- For Supabase (PostgreSQL)
-- ============================================
-- 
-- INSTRUCTIONS FOR SUPABASE:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Create a new query
-- 4. Copy and paste this entire SQL script
-- 5. Click "Run" to execute
--
-- ============================================

-- Drop existing table if you want to recreate it
-- DROP TABLE IF EXISTS markets CASCADE;

CREATE TABLE IF NOT EXISTS markets (
  -- Primary identification
  id VARCHAR(50) PRIMARY KEY,
  internal_id VARCHAR(50) NOT NULL UNIQUE,
  
  -- Basic market information
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255),
  city VARCHAR(100),
  postal_code VARCHAR(20),
  chain VARCHAR(100),
  
  -- Contact information
  phone VARCHAR(50),
  email VARCHAR(255),
  
  -- Organizational structure
  gebietsleiter VARCHAR(100),
  channel VARCHAR(100),
  banner VARCHAR(100),
  branch VARCHAR(100),
  maingroup VARCHAR(100),
  subgroup VARCHAR(100),
  
  -- Visit information
  frequency INTEGER DEFAULT 12,
  current_visits INTEGER DEFAULT 0,
  visit_day VARCHAR(50),
  visit_duration VARCHAR(50),
  last_visit_date DATE,
  
  -- Classification
  customer_type VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  is_completed BOOLEAN DEFAULT false,
  
  -- Location coordinates (optional)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_markets_gebietsleiter ON markets(gebietsleiter);
CREATE INDEX IF NOT EXISTS idx_markets_chain ON markets(chain);
CREATE INDEX IF NOT EXISTS idx_markets_is_active ON markets(is_active);
CREATE INDEX IF NOT EXISTS idx_markets_subgroup ON markets(subgroup);
CREATE INDEX IF NOT EXISTS idx_markets_city ON markets(city);

-- ============================================
-- Function to update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Trigger to auto-update updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_markets_updated_at ON markets;
CREATE TRIGGER update_markets_updated_at
BEFORE UPDATE ON markets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
-- You can customize these policies based on your security needs
CREATE POLICY "Allow all operations for authenticated users" ON markets
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Optional: Allow service role full access
CREATE POLICY "Allow all operations for service role" ON markets
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- Sample data (optional - for testing)
-- ============================================
-- Uncomment below to insert sample data

/*
INSERT INTO markets (
  id, internal_id, name, address, city, postal_code, chain,
  gebietsleiter, is_active, frequency, subgroup
) VALUES
  ('MKT-001', 'MKT-001', 'Billa+ Hauptstraße', 'Hauptstraße 45', 'Wien', '1010', 'Billa+', 'Max Mustermann', true, 12, '3R - BILLA Plus'),
  ('MKT-002', 'MKT-002', 'Spar Mariahilfer Straße', 'Mariahilfer Straße 123', 'Wien', '1060', 'Spar', 'Anna Schmidt', true, 24, '2A - Spar'),
  ('MKT-003', 'MKT-003', 'Adeg Leopoldstadt', 'Taborstraße 67', 'Wien', '1020', 'Adeg', 'Peter Weber', true, 12, '3F - Adeg')
ON CONFLICT (id) DO NOTHING;
*/


