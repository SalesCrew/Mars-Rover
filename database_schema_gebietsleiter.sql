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

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_gebietsleiter_email ON gebietsleiter(email);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_gebietsleiter_created_at ON gebietsleiter(created_at DESC);

-- Enable Row Level Security
ALTER TABLE gebietsleiter ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating (to avoid "already exists" errors)
DROP POLICY IF EXISTS "Allow authenticated users to read gebietsleiter" ON gebietsleiter;
DROP POLICY IF EXISTS "Allow authenticated users to insert gebietsleiter" ON gebietsleiter;
DROP POLICY IF EXISTS "Allow authenticated users to update gebietsleiter" ON gebietsleiter;
DROP POLICY IF EXISTS "Allow authenticated users to delete gebietsleiter" ON gebietsleiter;

-- Create policy to allow authenticated users to read all gebietsleiter
CREATE POLICY "Allow authenticated users to read gebietsleiter"
    ON gebietsleiter
    FOR SELECT
    TO authenticated
    USING (true);

-- Create policy to allow authenticated users to insert gebietsleiter
CREATE POLICY "Allow authenticated users to insert gebietsleiter"
    ON gebietsleiter
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create policy to allow authenticated users to update gebietsleiter
CREATE POLICY "Allow authenticated users to update gebietsleiter"
    ON gebietsleiter
    FOR UPDATE
    TO authenticated
    USING (true);

-- Create policy to allow authenticated users to delete gebietsleiter
CREATE POLICY "Allow authenticated users to delete gebietsleiter"
    ON gebietsleiter
    FOR DELETE
    TO authenticated
    USING (true);

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
