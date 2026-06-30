# Simple Auth Setup

The app now uses the backend API as the only browser-facing data/auth boundary.

## Frontend

Create a root `.env` with only the API URL:

```env
VITE_API_URL=http://localhost:3001/api
```

Do not configure Supabase URL/anon/service keys in the frontend.

## Backend

Create `backend/.env`:

```env
PORT=3001
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
CORS_ORIGINS=http://localhost:5173,https://mars-rover-mu.vercel.app
FRONTEND_URL=https://mars-rover-mu.vercel.app
```

Supabase Auth still handles passwords and sessions, but the frontend receives tokens only through backend `/api/auth/login` and `/api/auth/refresh`.

See `AUTH_SETUP_GUIDE.md` for the full current model.
