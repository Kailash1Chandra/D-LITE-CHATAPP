# D-LITE ChatApp — Core Backend

FastAPI service that acts as a privileged server-side layer on top of Supabase. Uses the service-role key to perform operations that bypass RLS (e.g., admin lookups, cross-user writes).

**Port:** `5040`

## Tech Stack

| Layer | Library |
|---|---|
| Framework | FastAPI (Python) |
| Database | Supabase Python client (service-role key) |
| Auth | Supabase Admin API |

## Responsibilities

- User profile management (create, update, lookup)
- Group management (create groups, manage memberships server-side)
- Call record logging
- Any operation that needs service-role privileges and must not be exposed via the Supabase anon key

## Environment Variables

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=    # never expose this to the frontend
ALLOWED_ORIGINS=http://localhost:3002
```

## Running Locally

```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 5040 --reload
```

## Docker

```bash
docker compose up core-backend
```

## Security Note

This service holds the Supabase **service-role key** which bypasses all RLS policies. It must never be called directly from the browser. All routes should validate the caller's identity (e.g., via a Supabase JWT passed in `Authorization: Bearer <token>`) before performing privileged operations.
