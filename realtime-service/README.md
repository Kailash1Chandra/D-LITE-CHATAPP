# D-LITE ChatApp — Realtime Service

FastAPI + Socket.IO microservice for presence tracking, typing indicators, room management, and WebRTC signaling relay. Runs as an ASGI app — the Socket.IO server is mounted directly onto the FastAPI app so both share the same port.

**Port:** `5050`

---

## Tech Stack

| Layer | Library / Service |
|---|---|
| Framework | FastAPI (Python) |
| WebSocket | `python-socketio` (AsyncServer, ASGI mode) |
| ASGI mount | `socketio.ASGIApp` wrapping FastAPI |
| Presence store | In-memory `dict[sid → user_id]` |
| CORS | FastAPI `CORSMiddleware` + `socketio.AsyncServer(cors_allowed_origins=...)` |

---

## How It Works

The Socket.IO server is created with `async_mode="asgi"` and wrapped via `socketio.ASGIApp(sio, other_asgi_app=app)`. All Socket.IO traffic (WebSocket upgrade + polling fallback) hits the same process and port as the REST endpoints.

Presence is stored in `_online: dict[str, str]` — a mapping from Socket.IO session ID (`sid`) to `user_id`. When a client disconnects or reconnects, the map is updated and a broadcast goes out to all other connected clients.

---

## Connection & Authentication

Clients pass their `user_id` in the Socket.IO `auth` handshake payload:

```js
const socket = io("http://localhost:5050", {
  auth: { user_id: "uuid-of-current-user" }
});
```

On `connect`, the server:
1. Reads `auth.user_id` from the handshake
2. Registers `sid → user_id` in `_online`
3. Joins the socket to a personal room `user:<user_id>` (used for targeted events)
4. Emits `user_online` to all other sockets

Anonymous connections (no `user_id`) are allowed but not tracked — they can still join rooms.

---

## Socket.IO Events

### Client → Server

| Event | Payload | Description |
|---|---|---|
| *(connect)* | `auth: { user_id }` | Register user as online, join personal room |
| `join_room` | `{ room: "dm:<id1>_<id2>" \| "group:<group_id>" }` | Subscribe to a DM or group message room |
| `leave_room` | `{ room: str }` | Unsubscribe from a room |
| `typing_start` | `{ room: str }` | Broadcast typing start to all others in room |
| `typing_stop` | `{ room: str }` | Broadcast typing stop to all others in room |
| `get_online_users` | `{}` | Request list of all currently-online user IDs |
| `ping` | `{}` | Heartbeat ping |
| `join_call_room` | `{ roomId: str }` | Enter a WebRTC call room and notify waiting peers |
| `call_signal` | `{ roomId: str, signal: {...} }` | Relay an SDP offer/answer or ICE candidate to call peers |
| `leave_call_room` | `{ roomId: str }` | Exit the call room and notify remaining peers |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `user_online` | `{ user_id }` | A user came online (broadcast to all except sender) |
| `user_offline` | `{ user_id }` | A user went offline (broadcast on disconnect) |
| `typing_start` | `{ user_id }` | Someone started typing in a room |
| `typing_stop` | `{ user_id }` | Someone stopped typing in a room |
| `online_users` | `{ users: [user_id, ...] }` | Response to `get_online_users` — full list of online IDs |
| `pong` | `{}` | Response to `ping` |
| `peer_joined` | `{ user_id }` | Another peer joined the WebRTC call room |
| `call_signal` | `{ from: user_id, signal: {...} }` | Relayed SDP/ICE signal from a peer |
| `peer_left` | `{}` | A peer left the WebRTC call room |

---

## Room Naming Conventions

| Room type | Format | Example |
|---|---|---|
| Personal | `user:<user_id>` | `user:abc-123` |
| DM conversation | `dm:<id1>_<id2>` | `dm:abc_xyz` (sorted user IDs) |
| Group | `group:<group_id>` | `group:grp-789` |
| WebRTC call | `call:<roomId>` | `call:abc_xyz` |

---

## REST Endpoints

### `GET /health`
Returns service status and number of currently-connected sockets.
```json
{ "status": "ok", "online": 3 }
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ALLOWED_ORIGINS` | No | `*` (dev) | Comma-separated allowed CORS origins |

---

## Running Locally

```bash
pip install -r requirements.txt

cp .env.example .env   # set ALLOWED_ORIGINS

# Must use the ASGI wrapper (socket_app), not app directly
uvicorn main:socket_app --host 0.0.0.0 --port 5050 --reload
```

> **Important:** Run `main:socket_app` (not `main:app`). The `socket_app` is the `socketio.ASGIApp` wrapper that handles WebSocket upgrades. Running `main:app` alone would skip all Socket.IO events.

---

## Docker

```bash
# From project root
docker compose up realtime-service

# Or build and run directly
docker build -t dlite-realtime .
docker run -p 5050:5050 --env-file .env dlite-realtime
```

---

## WebRTC Signaling Flow

The realtime service acts as a **dumb relay** — it never inspects or interprets SDP/ICE content, just forwards it to peers in the same call room.

```
Caller                    Realtime Service              Callee
  |                             |                          |
  |-- join_call_room ---------> |                          |
  |                             |-- peer_joined ---------->|
  |<-- peer_joined -------------|                          |
  |                             |                          |
  |-- call_signal (offer) ----> |                          |
  |                             |-- call_signal (offer) -->|
  |                             |                          |
  |<-- call_signal (answer) ----|<-- call_signal (answer) -|
  |                             |                          |
  |-- call_signal (ICE) ------> |                          |
  |                             |-- call_signal (ICE) ---->|
  |                             |        (P2P established) |
```

Once ICE negotiation completes, the actual media (audio/video) flows **peer-to-peer via ZEGOCLOUD** — the realtime service is only needed for the initial handshake.

---

## Architecture Notes

- Presence is **in-memory only** — restarting the service resets all online status. Clients must reconnect and re-emit presence on page load.
- Room membership is also in-memory (managed by `python-socketio`'s room registry). Scale-out across multiple processes would require a Redis adapter.
- The `user:<user_id>` personal room enables targeted emissions to a specific user even when their `sid` is unknown.
