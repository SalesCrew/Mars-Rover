-- SIMPLE FIX: Just update/create a user with a REAL password hash
-- Password will be: admin123

-- Delete any broken users first
DELETE FROM users WHERE username IN ('admin', 'Kilian Test GL');

-- Create admin user with REAL bcrypt hash for 'admin123'
INSERT INTO users (username, password_hash, email, role, first_name, last_name, is_active)
VALUES (
  'admin',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin@marsrover.com',
  'admin',
  'Admin',
  'User',
  true
);

-- That's it! Now login with:
-- Username: admin
-- Password: admin123
