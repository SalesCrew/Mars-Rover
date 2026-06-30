# Gebietsleiter Backend Setup

## Database Schema

Run the reviewed schema for `gebietsleiter` and the broader DSGVO/RLS hardening SQL with care. Production changes should happen only after backup and a short maintenance window.

## API Endpoints

Base URL: `http://localhost:3001/api/gebietsleiter`

All endpoints are behind backend authentication. Admin-only endpoints require an authenticated admin token.

### Get All Gebietsleiter

```http
GET /api/gebietsleiter
```

Admin only.

### Get Single Gebietsleiter

```http
GET /api/gebietsleiter/:id
```

Allowed for the matching GL or an admin.

### Create Gebietsleiter

```http
POST /api/gebietsleiter
Content-Type: application/json
```

```json
{
  "name": "Max Mustermann",
  "address": "Musterstrasse 123",
  "postalCode": "1010",
  "city": "Wien",
  "phone": "+43 123 456789",
  "email": "max.mustermann@example.com",
  "password": "SecurePassword123!",
  "profilePictureUrl": "https://example.com/image.jpg"
}
```

Admin only. The backend creates the Supabase Auth user, then creates matching rows in `users` and `gebietsleiter`.

### Update Gebietsleiter

```http
PUT /api/gebietsleiter/:id
Content-Type: application/json
```

```json
{
  "name": "Max Mustermann",
  "address": "Neue Strasse 456",
  "postalCode": "1020",
  "city": "Wien",
  "phone": "+43 987 654321",
  "email": "new.email@example.com",
  "password": "NewPassword123!",
  "profilePictureUrl": "https://example.com/new-image.jpg"
}
```

Admin only. If `password` is supplied, the backend updates the Supabase Auth password directly.

### Delete Gebietsleiter

```http
DELETE /api/gebietsleiter/:id
```

Admin only. The backend deletes the Supabase Auth user and marks the GL inactive so historical business data remains intact.

## Security Notes

- Passwords are managed by Supabase Auth.
- New password hashes are not stored in app tables.
- Passwords and password hashes are never returned in API responses.
- GL self endpoints are protected by self/admin middleware.
- Admin endpoints are protected by admin middleware.
- RLS remains defense in depth because the backend service-role client bypasses RLS.
