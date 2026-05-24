# D-LITE ChatApp — Core Backend

FastAPI microservice that provides a privileged server-side REST API on top of Supabase. Uses the **service-role key** to bypass Row Level Security — intended for operations that cannot be safely done from the frontend with the anon key.

**Port:** `5040`

---

## Tech Stack

| Layer | Library / Service |
|---|---|
| Framework | FastAPI (Python) |
| Database | Supabase Python client (`supabase` SDK) |
| Auth bypass | Supabase **service-role key** (bypasses all RLS) |
| Validation | Pydantic v2 models |
| CORS | FastAPI `CORSMiddleware` (allow-list from env) |

---

## API Endpoints

### `GET /health`
Returns service status.
```json
{ "status": "ok", "service": "core-backend" }
```

---

### Users / Profiles

#### `GET /users/search?q=<query>&limit=<n>`
Search users by `username` or `display_name` (case-insensitive).

- `q` — search string (empty returns all up to limit)
- `limit` — max results, default `10`, max `50`

**Response:**
```json
{
  "users": [
    { "id": "uuid", "username": "parshant", "display_name": "Parshant", "avatar_url": "...", "status": "online" }
  ]
}
```

---

#### `GET /users/{user_id}`
Fetch a single user's full profile row.

**Response:** Full `profiles` row as JSON. Returns `404` if not found.

---

#### `PATCH /users/{user_id}`
Update a user's profile. Only fields provided in the body are updated (partial update).

**Request body** (all fields optional):
```json
{
  "display_name": "New Name",
  "username": "newusername",
  "bio": "Hi there!",
  "avatar_url": "https://res.cloudinary.com/...",
  "status": "away"
}
```

**Response:**
```json
{ "updated": true, "data": [...] }
```

---

### Conversations (DMs)

#### `GET /users/{user_id}/conversations`
Returns the latest DM message per peer — i.e., the user's inbox collapsed to one row per conversation partner.

Fetches the most recent 200 messages where `sender_id` or `receiver_id` equals `user_id`, then collapses to the first (newest) message per peer.

**Response:**
```json
{
  "conversations": [
    {
      "id": "msg-uuid",
      "content": "Hey!",
      "created_at": "...",
      "status": "read",
      "sender_id": "...",
      "receiver_id": "..."
    }
  ]
}
```

---

### Groups

#### `GET /users/{user_id}/groups`
All groups the user is a member of, with their role and join date.

**Response:**
```json
{
  "groups": [
    {
      "role": "owner",
      "joined_at": "...",
      "groups": {
        "id": "...", "name": "Dev Team", "description": "...",
        "avatar_url": null, "is_public": false, "created_at": "..."
      }
    }
  ]
}
```

---

#### `GET /groups/{group_id}`
Full group details including all members and their profiles.

**Response includes:**
- All `groups` columns
- Nested `group_members` array with each member's `user_id`, `role`, and `profiles` (id, username, display_name, avatar_url)

Returns `404` if not found.

---

#### `POST /groups`
Create a new group and auto-add the creator as `Owner`.

**Request body:**
```json
{
  "name": "My Group",
  "description": "Optional description",
  "is_public": false,
  "created_by": "user-uuid"
}
```

**Response:** The new `groups` row.

Two inserts happen atomically:
1. `groups` table — creates the group
2. `group_members` table — adds creator with `role: "Owner"`

---

### Calls

#### `POST /calls`
Log a completed or ongoing call record.

**Request body:**
```json
{
  "caller_id": "user-uuid",
  "receiver_id": "user-uuid",
  "group_id": null,
  "type": "video",
  "status": "ended",
  "started_at": "2026-05-24T10:00:00Z",
  "ended_at": "2026-05-24T10:05:00Z"
}
```
- `receiver_id` or `group_id` — one of these is set (DM call vs group call)
- `type` — `"audio"` or `"video"`
- `status` — `"ended"`, `"missed"`, `"declined"` etc.

**Response:** The inserted `calls` row.

---

#### `GET /users/{user_id}/calls?limit=<n>`
Call history for a user (as caller or receiver), newest first.

- `limit` — default `20`, max `100`

**Response:**
```json
{
  "calls": [
    { "id": "...", "caller_id": "...", "receiver_id": "...", "type": "video", "status": "ended", ... }
  ]
}
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SUPABASE_URL` | Yes | — | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | — | Service-role key (bypasses RLS) |
| `ALLOWED_ORIGINS` or `CORS_ORIGINS` | No | no CORS headers | Comma-separated allowed origins |
| `PORT` | No | `8000` | Server port (override with `5040` in docker-compose) |
| `UVICORN_WORKERS` | No | `1` | Uvicorn worker count |
| `UVICORN_LOG_LEVEL` | No | `info` | Uvicorn log level |

---

## Running Locally

```bash
pip install -r requirements.txt

cp .env.example .env   # fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

uvicorn main:app --host 0.0.0.0 --port 5040 --reload
```

---

## Docker

```bash
# From project root
docker compose up core-backend

# Or build and run directly
docker build -t dlite-core-backend .
docker run -p 5040:5040 --env-file .env dlite-core-backend
```

---

## Security

- The **service-role key** bypasses every RLS policy in Supabase. **Never expose it to the frontend or any public client.**
- All routes should validate the caller's identity by requiring a Supabase JWT in `Authorization: Bearer <token>` and verifying it before performing any write operation. (Implementation: verify with `supabase.auth.get_user(token)` before executing privileged queries.)
- CORS is restricted to origins listed in `ALLOWED_ORIGINS` — in production, this should only include the frontend domain.

---

## Architecture Notes

- A single Supabase client instance (`_supabase`) is created at startup and reused — safe because the service-role client is stateless.
- `CORS_ORIGINS` and `ALLOWED_ORIGINS` are both supported for flexible deployment config.
- The Supabase Python client wraps PostgREST; all queries compile to HTTP calls against the project's REST API.
