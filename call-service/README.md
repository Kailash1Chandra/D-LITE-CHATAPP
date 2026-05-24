# D-LITE ChatApp — Call Service

Node.js/TypeScript Express service that generates ZEGOCLOUD Kit Tokens for authenticated video call sessions.

**Port:** `5060`

## Tech Stack

| Layer | Library |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express |
| Token crypto | AES-CBC (Node.js `crypto` built-in) |
| Token spec | ZEGOCLOUD Kit Token v2 |

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check — returns `{ status: "ok" }` |
| `GET` | `/token` | Generate a ZEGOCLOUD Kit Token |

### `GET /token`

Query parameters:

| Param | Required | Description |
|---|---|---|
| `userId` | Yes | The calling user's ID |
| `roomId` | Yes | The room/call ID both participants must share |

Response:

```json
{
  "token": "<zegocloud-kit-token>",
  "appId": 12345678
}
```

The frontend passes `token` + `appId` directly into the ZEGOCLOUD UIKit to join the room.

## Environment Variables

```env
ZEGO_APP_ID=            # numeric app ID from ZEGOCLOUD console
ZEGO_SERVER_SECRET=     # 32-char hex secret from ZEGOCLOUD console
PORT=5060
ALLOWED_ORIGINS=http://localhost:3002
```

## Running Locally

```bash
npm install
npm run dev       # ts-node / tsx watch mode
# or
npm run build && npm start
```

## Docker

```bash
docker compose up call-service
```

## Notes

- Tokens are short-lived (default: 1 hour). The frontend requests a fresh token each time a call is initiated.
- The `roomId` is derived from the sorted pair of user IDs so both callers independently generate the same room ID without coordination.
- Never expose `ZEGO_SERVER_SECRET` to the frontend — all token generation must happen here.
