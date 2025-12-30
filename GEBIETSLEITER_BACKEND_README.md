# Gebietsleiter Backend Setup

## Database Schema

Run the SQL schema in your Supabase database:

```sql
-- Execute the contents of database_schema_gebietsleiter.sql
```

This creates:
- `gebietsleiter` table with all required fields
- Indexes for performance (email, created_at)
- Row Level Security policies
- Auto-update trigger for `updated_at` field

## API Endpoints

Base URL: `http://localhost:3001/api/gebietsleiter`

### Get All Gebietsleiter
```
GET /api/gebietsleiter
```

### Get Single Gebietsleiter
```
GET /api/gebietsleiter/:id
```

### Create Gebietsleiter
```
POST /api/gebietsleiter
Content-Type: application/json

{
  "name": "Max Mustermann",
  "address": "Musterstraße 123",
  "postalCode": "1010",
  "city": "Wien",
  "phone": "+43 123 456789",
  "email": "max.mustermann@example.com",
  "password": "SecurePassword123!",
  "profilePictureUrl": "https://example.com/image.jpg" // optional
}
```

### Update Gebietsleiter
```
PUT /api/gebietsleiter/:id
Content-Type: application/json

{
  "name": "Max Mustermann", // optional
  "address": "Neue Straße 456", // optional
  "postalCode": "1020", // optional
  "city": "Wien", // optional
  "phone": "+43 987 654321", // optional
  "email": "new.email@example.com", // optional
  "password": "NewPassword123!", // optional
  "profilePictureUrl": "https://example.com/new-image.jpg" // optional
}
```

### Delete Gebietsleiter
```
DELETE /api/gebietsleiter/:id
```

## Features

- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ Email uniqueness validation
- ✅ Auto-generated UUIDs for IDs
- ✅ Timestamps (created_at, updated_at)
- ✅ Profile picture URL support
- ✅ Error handling for duplicate emails (409 status)
- ✅ Password never returned in responses

## Frontend Integration

The `GebietsleiterPage` component is fully integrated with:
- Loading state while fetching data
- Create new Gebietsleiter with email notification flow
- Auto-refresh after creation
- Profile picture upload support
- Form validation

## Security Notes

- Passwords are hashed using bcrypt before storage
- Password hashes are never returned in API responses
- Row Level Security enabled on the table
- Email field has unique constraint



