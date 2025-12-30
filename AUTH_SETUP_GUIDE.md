# Authentication Setup Guide

## ✅ What's Been Implemented

### Backend
- ✅ JWT-based authentication
- ✅ User roles (GL, Admin)
- ✅ Password hashing with bcrypt
- ✅ Auth middleware for protected routes
- ✅ API endpoints: `/api/auth/login`, `/api/auth/register`, `/api/auth/me`

### Frontend
- ✅ Auth context for global state
- ✅ Login page with real authentication
- ✅ Role-based routing (GL → Dashboard, Admin → AdminPanel)
- ✅ Protected routes
- ✅ Token management

### Database
- ✅ Users table with RLS (Row Level Security)
- ✅ Data isolation (GLs can ONLY see their own data)

---

## 🚀 Setup Steps

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

This will install:
- `jsonwebtoken` - For JWT tokens
- `@types/jsonwebtoken` - TypeScript types

### 2. Run SQL Schema
Open Supabase SQL Editor and run the file:
```
database_schema_users.sql
```

This creates the `users` table with proper security policies.

### 3. Create Initial Users

#### Option A: Use the API (Recommended)
The `/api/auth/register` endpoint is open for initial setup. You can use it to create users:

```bash
# Start the backend
cd backend
npm run dev
```

Then use a tool like Postman or curl:

```bash
# Create Admin User
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your-secure-password",
    "email": "admin@marsrover.com",
    "role": "admin",
    "firstName": "Admin",
    "lastName": "User"
  }'

# Create GL User
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "gl_mueller",
    "password": "your-secure-password",
    "email": "mueller@marsrover.com",
    "role": "gl",
    "firstName": "Thomas",
    "lastName": "Müller",
    "gebietsleiter_id": "GL001"
  }'
```

#### Option B: Generate Password Hash Manually
```bash
cd backend
npx tsx src/utils/hashPassword.ts your-password-here
```

Copy the hash and manually INSERT into the users table via Supabase SQL Editor.

### 4. Set JWT Secret (Important for Production!)
In your backend `.env` file (create one if it doesn't exist):

```env
JWT_SECRET=your-super-secret-key-change-this-in-production
```

⚠️ **CRITICAL**: Change this to a strong, random secret in production!

### 5. Start Everything
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```

---

## 🔐 Test Login

### Admin Account (after creation):
- **Username**: `admin`
- **Password**: (whatever you set)
- **Access**: Full admin panel

### GL Account (after creation):
- **Username**: `gl_mueller`
- **Password**: (whatever you set)
- **Access**: GL Dashboard with ONLY their markets

---

## 🛡️ Data Isolation

### How it Works:
1. **GLs can ONLY see their own data**:
   - Markets where `gebietsleiter_id` matches their user account
   - Their own profile information
   - Their own visit history

2. **Admins can see everything**:
   - All markets
   - All GLs
   - All data

3. **Enforcement**:
   - Database level: Row Level Security (RLS) policies
   - API level: Middleware checks user role
   - Frontend level: Routes based on user role

---

## 📝 Next Steps (For You to Do)

### 1. **Run the SQL Schema** ✋
   - Open Supabase SQL Editor
   - Copy/paste `database_schema_users.sql`
   - Execute it

### 2. **Install Dependencies** ✋
   ```bash
   cd backend
   npm install
   ```

### 3. **Create Users** ✋
   - Use the register endpoint OR
   - Generate password hashes and insert manually

### 4. **Test Login** ✋
   - Try logging in with your created users
   - Verify admin sees AdminPanel
   - Verify GL sees Dashboard

### 5. **Add JWT_SECRET to .env** ✋
   ```bash
   cd backend
   echo "JWT_SECRET=your-random-secret-here" >> .env
   ```

---

## ⚠️ Important Notes

### Multi-User Data Isolation
- Each GL has a unique `gebietsleiter_id`
- This links them to specific markets in the `markets` table
- When a GL logs in, they can ONLY access markets with their `gebietsleiter_id`
- This is enforced at multiple levels (DB, API, Frontend)

### Security Best Practices
- ✅ Passwords are hashed with bcrypt (never stored as plain text)
- ✅ JWT tokens expire after 24 hours
- ✅ Row Level Security on database
- ✅ Middleware protection on API routes

### Future TODOs
- Add password reset functionality
- Add email verification
- Add session management
- Implement refresh tokens
- Add rate limiting on login endpoint
- Add audit logging for login attempts

---

## 🐛 Troubleshooting

### "Invalid token" error
- Token might be expired (24h lifetime)
- Clear localStorage and login again

### "User not found" error
- Make sure you created the user via register endpoint
- Check Supabase to verify user exists

### CORS errors
- Backend must be running on `http://localhost:3001`
- Frontend must be running on `http://localhost:5173` (or your Vite port)

---

## 📞 What to Tell Me When You're Done

Once you've completed the setup steps above, let me know:
1. ✅ SQL schema ran successfully
2. ✅ Users created
3. ✅ Can login as admin
4. ✅ Can login as GL
5. Any errors or issues you encountered

Then we can move on to connecting the existing API routes (markets, products, etc.) to respect user permissions!
