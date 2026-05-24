# D-LITE ChatApp — Realtime Service

FastAPI + Socket.IO service for presence tracking, typing indicators, and WebRTC signaling relay.

**Port:** `5050`

## Tech Stack

| Layer | Library |
|---|---|
| Framework | FastAPI + `python-socketio` (ASGI mount) |
| Transport | WebSocket (Socket.IO) |
| Presence | In-memory user→socket map |

## Features

- **Online presence** — Users emit `user:online` on connect; server broadcasts presence updates to all clients
- **Typing indicators** — `typing:start` / `typing:stop` events relayed to the conversation partner
- **WebRTC signaling relay** — `call:offer`, `call:answer`, `call:ice-candidate`, `call:end` forwarded to the target socket so peers can negotiate a direct connection

## Socket.IO Events

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `user:online` | `{ userId }` | Register user as online |
| `typing:start` | `{ toUserId }` | Start typing in a DM |
| `typing:stop` | `{ toUserId }` | Stop typing |
| `call:offer` | `{ toUserId, offer }` | Send WebRTC offer |
| `call:answer` | `{ toUserId, answer }` | Send WebRTC answer |
| `call:ice-candidate` | `{ toUserId, candidate }` | Relay ICE candidate |
| `call:end` | `{ toUserId }` | End / reject call |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `presence:update` | `{ userId, online }` | Broadcast presence change |
| `typing:start` | `{ fromUserId }` | Partner started typing |
| `typing:stop` | `{ fromUserId }` | Partner stopped typing |
| `call:offer` | `{ fromUserId, offer }` | Incoming call offer |
| `call:answer` | `{ fromUserId, answer }` | Call answered |
| `call:ice-candidate` | `{ fromUserId, candidate }` | ICE candidate |
| `call:end` | `{ fromUserId }` | Call ended/rejected |

## Environment Variables

```env
ALLOWED_ORIGINS=http://localhost:3002    # comma-separated
```

## Running Locally

```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 5050 --reload
```

## Docker

```bash
docker compose up realtime-service
```

## Notes

- Presence is stored in memory — restarting the service resets all online status. Supabase Realtime `postgres_changes` subscriptions in the frontend handle message delivery; this service only handles presence and signaling.
- ZEGOCLOUD handles the actual media (audio/video) streams; this service only relays the SDP/ICE negotiation for the custom WebRTC path.
