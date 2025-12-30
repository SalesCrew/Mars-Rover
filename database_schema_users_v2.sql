-- ============================================
-- USER PROFILE TABLE (using Supabase Auth)
-- ============================================
-- Supabase Auth handles passwords, we just store user metadata
-- This is the CORRECT way to use Supabase!

-- Drop old table if it exists
DROP TABLE IF EXISTS users CASCADE;

-- User profiles table (extends Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('gl', 'admin')),
  
  -- Personal Information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  
  -- GL-specific field (NULL for admins)
  gebietsleiter_id VARCHAR(50), -- Links to markets.gebietsleiter_id
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_gebietsleiter_id ON users (gebietsleiter_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY users_select_own
  ON users
  FOR SELECT
  USING (
    auth.uid() = id
    OR 
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Users can update their own profile
CREATE POLICY users_update_own
  ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Only admins can insert/delete
CREATE POLICY users_insert_admin_only
  ON users
  FOR INSERT
  WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY users_delete_admin_only
  ON users
  FOR DELETE
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE users IS 'User profiles linked to Supabase Auth. Auth handles passwords, this stores metadata.';
COMMENT ON COLUMN users.id IS 'References auth.users(id). Created automatically by Supabase Auth.';
COMMENT ON COLUMN users.role IS 'User role: gl or admin. Determines data access.';
COMMENT ON COLUMN users.gebietsleiter_id IS 'Links GL users to markets. NULL for admins.';
