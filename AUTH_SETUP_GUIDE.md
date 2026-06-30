# Authentication Setup Guide

MarsPets+ uses Supabase Auth for identities and a Node/Express backend for all app data access.

## Current Model

- Frontend calls the backend API through `VITE_API_URL`.
- Frontend does not use a Supabase client, anon key, or service-role key.
- Backend stores `SUPABASE_SERVICE_KEY` or the legacy/common alias `SUPABASE_SERVICE_ROLE_KEY` only in `backend/.env` / production environment variables.
- Backend verifies Supabase access tokens with `supabase.auth.getUser()`.
- Backend loads the matching row from `public.users` to get the app role (`admin` or `gl`).
- Backend routes enforce admin/self/GL ownership checks before using the service-role database client.
- Database RLS is defense in depth for accidental direct Data API exposure.

## Required Environment

Backend `backend/.env`:

```env
PORT=3001
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
CORS_ORIGINS=http://localhost:5173,https://mars-rover-mu.vercel.app
FRONTEND_URL=https://mars-rover-mu.vercel.app
```

Frontend `.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

Production frontend should set `VITE_API_URL` to the deployed backend API URL.

Do not add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, or any service-role key to the frontend environment.

## Setup

1. Install backend dependencies:

```bash
cd backend
npm install
```

2. Install frontend dependencies:

```bash
npm install
```

3. Start backend:

```bash
cd backend
npm run dev
```

4. Start frontend:

```bash
npm run dev
```

## User Creation

Admins create GL/admin users through the admin UI or protected backend auth routes. The backend creates the Supabase Auth user and the matching `public.users` profile.

Direct `/api/auth/register`, `/api/auth/create-admin`, `/api/auth/admins`, and admin deletion routes require an authenticated admin token.

For GL users, the `public.users.gebietsleiter_id` must point to the corresponding `public.gebietsleiter.id`.

## Route Security

- `/api/auth/login` and `/api/auth/refresh` are public but rate-limited.
- `/api/auth/me` and `/api/auth/logout` require a valid Supabase access token.
- All business routes under `/api` require authentication.
- Admin-only route groups are mounted behind `requireAdmin`.
- GL write/read routes use the authenticated GL id from the token/profile, not a trusted client-supplied id.
- GL users intentionally retain access to all market master data because markets are not treated as sensitive in this app.

## Database Security

Use `backend/sql/dsgvo_rls_hardening.sql` as the reviewed RLS/grants hardening script. Do not run it directly on production without a backup and a short maintenance window.

The backend service role bypasses RLS, so route-level authorization remains mandatory even after RLS is enabled.
