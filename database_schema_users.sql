-- ============================================
-- USER AUTHENTICATION AND AUTHORIZATION SCHEMA
-- ============================================
-- This schema supports multi-user access with strict data isolation
-- GLs can ONLY see their own data, Admins can see everything

-- Drop existing table if needed (for development)
-- DROP TABLE IF EXISTS users CASCADE;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- bcrypt hash
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
-- This ensures GLs can ONLY access their own data

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
-- SAMPLE DATA (FOR TESTING)
-- ============================================
-- Note: Password is 'password123' for all test users (bcrypt hash)
-- In production, you would create users through the API with properly hashed passwords

-- Sample Admin User
-- Username: admin
-- Password: password123
INSERT INTO users (username, password_hash, email, role, first_name, last_name, is_active)
VALUES (
  'admin',
  '$2b$10$rKJ5Z3Z5Z5Z5Z5Z5Z5Z5Z.eK5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Zu', -- placeholder, will be properly hashed via API
  'admin@marsrover.com',
  'admin',
  'Admin',
  'User',
  true
) ON CONFLICT (username) DO NOTHING;

-- Sample GL User 1
-- Username: gl_mueller
-- Password: password123
INSERT INTO users (username, password_hash, email, role, first_name, last_name, gebietsleiter_id, is_active)
VALUES (
  'gl_mueller',
  '$2b$10$rKJ5Z3Z5Z5Z5Z5Z5Z5Z5Z.eK5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Zu', -- placeholder
  'mueller@marsrover.com',
  'gl',
  'Thomas',
  'Müller',
  'GL001', -- This should match a gebietsleiter_id in the markets table
  true
) ON CONFLICT (username) DO NOTHING;

-- Sample GL User 2
-- Username: gl_schmidt
-- Password: password123
INSERT INTO users (username, password_hash, email, role, first_name, last_name, gebietsleiter_id, is_active)
VALUES (
  'gl_schmidt',
  '$2b$10$rKJ5Z3Z5Z5Z5Z5Z5Z5Z5Z.eK5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Zu', -- placeholder
  'schmidt@marsrover.com',
  'gl',
  'Anna',
  'Schmidt',
  'GL002', -- Different GL
  true
) ON CONFLICT (username) DO NOTHING;

-- ============================================
-- ADDITIONAL SECURITY CONSIDERATIONS
-- ============================================

-- Ensure markets table respects GL data isolation
-- This will be enforced in the backend API layer by filtering queries
-- based on the authenticated user's gebietsleiter_id

-- Comments for future reference:
COMMENT ON TABLE users IS 'User accounts with role-based access control. GLs are linked to specific markets via gebietsleiter_id.';
COMMENT ON COLUMN users.gebietsleiter_id IS 'Links GL users to markets. NULL for admin users. Must match markets.gebietsleiter_id.';
COMMENT ON COLUMN users.role IS 'User role: gl (Gebietsleiter) or admin. Determines data access permissions.';
COMMENT ON COLUMN users.password_hash IS 'bcrypt hashed password. NEVER store plain text passwords.';
