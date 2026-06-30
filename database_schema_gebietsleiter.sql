-- Gebietsleiter (Area Managers) Table
CREATE TABLE IF NOT EXISTS gebietsleiter (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    city VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    profile_picture_url TEXT,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true, -- Set to false when GL is "deleted" to preserve progress data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration: Add is_active column if it doesn't exist (run this on existing databases)
ALTER TABLE gebietsleiter ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Migration: Add is_test column for test GL accounts (excluded from statistics)
ALTER TABLE gebietsleiter ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_gebietsleiter_email ON gebietsleiter(email);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_gebietsleiter_created_at ON gebietsleiter(created_at DESC);

-- Enable Row Level Security
ALTER TABLE gebietsleiter ENABLE ROW LEVEL SECURITY;

-- Do not add broad authenticated GL profile policies here.
-- Use backend/sql/dsgvo_rls_hardening.sql for the reviewed production RLS/grant model.

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gebietsleiter_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before update (drop first to avoid duplicates)
DROP TRIGGER IF EXISTS trigger_update_gebietsleiter_updated_at ON gebietsleiter;
CREATE TRIGGER trigger_update_gebietsleiter_updated_at
    BEFORE UPDATE ON gebietsleiter
    FOR EACH ROW
    EXECUTE FUNCTION update_gebietsleiter_updated_at();
