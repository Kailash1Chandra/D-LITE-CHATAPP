# D-LITE ChatApp — Call Service

Node.js/TypeScript Express microservice that generates **ZEGOCLOUD Kit Tokens** for authenticated video/audio call sessions. Implements the full ZEGOCLOUD Kit Token v2 signing algorithm using AES-CBC encryption — no ZEGOCLOUD SDK needed on the server.

**Port:** `5060`

---

## Tech Stack

| Layer | Library |
|---|---|
| Runtime | Node.js |
| Language | TypeScript |
| Framework | Express 4 |
| Crypto | Node.js built-in `crypto` module (AES-CBC) |
| Config | `dotenv` |
| CORS | `cors` package |

---

## API Endpoints

### `GET /health`
Returns service status.
```json
{ "status": "ok", "service": "call-service" }
```

---

### `GET /token`
Generate a ZEGOCLOUD Kit Token for a call session.

**Query parameters:**

| Param | Required | Description |
|---|---|---|
| `roomId` | Yes | The shared room identifier both participants must use |
| `userId` | Yes | The calling user's ID |
| `userName` | No | Display name (defaults to `userId`) |

**Example request:**
```
GET /token?roomId=abc123_xyz456&userId=abc123&userName=Parshant
```

**Response:**
```json
{
  "token": "04AAAA...#eyJ1c2VySUQi...",
  "appId": 12345678
}
```

The frontend passes `token` and `appId` directly into `ZegoUIKitPrebuilt.create()` to join the room.

**Error responses:**
- `400` — `roomId` or `userId` missing
- `503` — `ZEGO_APP_ID` or `ZEGO_SERVER_SECRET` not configured

---

## Token Generation Algorithm

Replicates `ZegoUIKitPrebuilt.generateKitTokenForTest()` exactly. The token has two parts joined by `#`:

```
"04" + base64(binaryBlock) + "#" + base64(JSON{userID,roomID,userName,appID})
```

### Binary block structure (28 bytes + ciphertext):

| Offset | Length | Content |
|---|---|---|
| 0 | 4 | Zeros |
| 4 | 4 | `expire` timestamp (Unix, big-endian int32) |
| 8 | 2 | IV length big-endian uint16 (always 16) |
| 10 | 16 | Random 16-byte IV (UTF-8 digit string) |
| 26 | 2 | Ciphertext length big-endian uint16 |
| 28 | n | AES-CBC ciphertext of the payload JSON |

### AES key selection:
The `ZEGO_SERVER_SECRET` (UTF-8 bytes) determines the AES variant:
- `≥ 32 bytes` → AES-256-CBC (first 32 bytes used)
- `24–31 bytes` → AES-192-CBC (first 24 bytes used)
- `< 24 bytes` → AES-128-CBC (padded to 16 bytes with zeros)

### Encrypted payload:
```json
{ "app_id": 12345678, "user_id": "abc123", "nonce": 1234567890, "ctime": 1716545000, "expire": 1716552200 }
```

Default TTL is **7200 seconds (2 hours)**.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ZEGO_APP_ID` | Yes | Numeric App ID from ZEGOCLOUD console |
| `ZEGO_SERVER_SECRET` | Yes | Server Secret from ZEGOCLOUD console (32-char hex) |
| `PORT` | No | Server port (default `5060`) |
| `ALLOWED_ORIGINS` | No | Comma-separated allowed CORS origins |

---

## Running Locally

```bash
npm install

cp .env.example .env   # fill in ZEGO_APP_ID and ZEGO_SERVER_SECRET

# Development (ts-node, no build step)
npm run dev

# Production (compile first)
npm run build
npm start
```

---

## Docker

```bash
# From project root
docker compose up call-service

# Or build and run directly
docker build -t dlite-call-service .
docker run -p 5060:5060 --env-file .env dlite-call-service
```

---

## Room ID Convention

The frontend generates `roomId` by sorting the two participant user IDs and joining with `_`:

```js
const roomId = [userId1, userId2].sort().join("_");
```

This ensures both the caller and callee independently derive the **same** room ID without any coordination. Both request a token for this room and join via ZEGOCLOUD UIKit.

---

## Security Notes

- **Never expose `ZEGO_SERVER_SECRET` to the frontend.** All token signing happens server-side here.
- Tokens expire after 2 hours. A fresh token is requested each time a call is initiated — expired tokens are rejected by ZEGOCLOUD.
- CORS is restricted to `ALLOWED_ORIGINS` — in production, set this to your frontend domain only.
- The service does not validate caller identity (no JWT check). In production, add a middleware that verifies the Supabase JWT from `Authorization: Bearer <token>` before issuing a ZEGOCLOUD token.
