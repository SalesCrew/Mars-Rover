-- ============================================
-- USER AUTHENTICATION AND AUTHORIZATION SCHEMA
-- ============================================
-- Legacy reference schema. Supabase Auth is the source of truth for passwords
-- and sessions in the current app; do not seed users or password hashes here.

-- Drop existing table if needed (for development)
-- DROP TABLE IF EXISTS users CASCADE;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- legacy bcrypt hash column
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('gl', 'admin')),

  -- Personal Information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,

  -- GL-specific field (NULL for admins)
  gebietsleiter_id VARCHAR(50), -- Links to markets.gebietsleiter_id

  -- Account Status
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_gebietsleiter_id ON users (gebietsleiter_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users (is_active);

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
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see themselves
CREATE POLICY users_select_own
  ON users
  FOR SELECT
  USING (
    id = current_setting('app.current_user_id')::UUID
    OR
    (SELECT role FROM users WHERE id = current_setting('app.current_user_id')::UUID) = 'admin'
  );

-- Policy: Users can only update themselves
CREATE POLICY users_update_own
  ON users
  FOR UPDATE
  USING (
    id = current_setting('app.current_user_id')::UUID
    OR
    (SELECT role FROM users WHERE id = current_setting('app.current_user_id')::UUID) = 'admin'
  );

-- Policy: Only admins can insert new users
CREATE POLICY users_insert_admin_only
  ON users
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM users WHERE id = current_setting('app.current_user_id')::UUID) = 'admin'
  );

-- Policy: Only admins can delete users
CREATE POLICY users_delete_admin_only
  ON users
  FOR DELETE
  USING (
    (SELECT role FROM users WHERE id = current_setting('app.current_user_id')::UUID) = 'admin'
  );

-- ============================================
-- USER SEEDING
-- ============================================
-- Do not seed users, password hashes, or test credentials from SQL files.
-- Users must be created through Supabase Auth and authenticated backend admin APIs.

-- ============================================
-- ADDITIONAL SECURITY CONSIDERATIONS
-- ============================================

-- Ensure markets table respects GL data isolation.
-- This is enforced in the backend API layer by filtering queries based on the
-- authenticated user's gebietsleiter_id.

-- Comments for future reference:
COMMENT ON TABLE users IS 'User accounts with role-based access control. GLs are linked to specific markets via gebietsleiter_id.';
COMMENT ON COLUMN users.gebietsleiter_id IS 'Links GL users to markets. NULL for admin users. Must match markets.gebietsleiter_id.';
COMMENT ON COLUMN users.role IS 'User role: gl (Gebietsleiter) or admin. Determines data access permissions.';
COMMENT ON COLUMN users.password_hash IS 'Legacy bcrypt hash column. Current app passwords are managed by Supabase Auth.';
