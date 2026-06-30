# Frontend Environment Setup

The frontend talks only to the MarsPets+ backend API.

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:3001/api
```

For production, set `VITE_API_URL` to the deployed backend API base URL.

Do not put Supabase URL, anon keys, or service-role keys in the frontend environment.
