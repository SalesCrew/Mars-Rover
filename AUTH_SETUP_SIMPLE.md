# ✅ SIMPLE AUTH SETUP (Using Supabase Auth Properly!)

## What Changed:
- ❌ **OLD**: Custom JWT auth with password hashes in database (complicated!)
- ✅ **NEW**: Supabase Auth handles login/passwords (simple, secure, like normal people!)

---

## Setup Steps:

### 1. Run New SQL Schema
Open Supabase SQL Editor and run:
```
database_schema_users_v2.sql
```

This creates a simple `users` table (NO passwords!) that links to Supabase Auth.

### 2. Create Frontend `.env` File
Create `.env` in project root:
```env
VITE_SUPABASE_URL=https://xxaokoayfynguzqgcdox.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from: Supabase → Settings → API
- Use **anon/public key** (the long one that's NOT secret)

### 3. Create a User in Supabase Auth
Go to Supabase Dashboard → **Authentication** → **Users** → **Add User**

Create user:
- Email: `admin@test.com`
- Password: `admin123`
- ✅ Auto Confirm User

### 4. Link User to Profile Table
Copy the user's UUID from the Auth Users table, then run this SQL:

```sql
-- Replace YOUR_USER_ID with the actual UUID from auth.users
INSERT INTO users (id, role, first_name, last_name)
VALUES (
  'YOUR_USER_ID',  -- UUID from Supabase Auth
  'admin',
  'Admin',
  'User'
);
```

### 5. Login!
- **Email**: `admin@test.com`
- **Password**: `admin123`

---

## For GL Users:

Same process, but add `gebietsleiter_id`:

```sql
INSERT INTO users (id, role, first_name, last_name, gebietsleiter_id)
VALUES (
  'GL_USER_UUID',
  'gl',
  'Test',
  'GL',
  'GL001'
);
```

---

## Benefits:
- ✅ No password hashes to manage
- ✅ Supabase handles security
- ✅ Built-in password reset, email verification, etc.
- ✅ Simple, industry-standard approach
- ✅ Less code to maintain

---

**That's it! Much simpler!** 🎉
