import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const app = express();

const _originsEnv = process.env.ALLOWED_ORIGINS ?? '';
const allowedOrigins = _originsEnv.split(',').map(o => o.trim()).filter(Boolean);
// If ALLOWED_ORIGINS not set, allow all origins (open API — token is the auth)
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true, credentials: false }));
app.use(express.json());


// ── ZEGOCLOUD Kit Token generation ───────────────────────────────────────────
//
// Mirrors ZegoUIKitPrebuilt.generateKitTokenForTest but runs SERVER-SIDE so
// ZEGO_SERVER_SECRET is never exposed to the browser.
//
// Token format (from ZEGOCLOUD open-source SDK):
//   "04" + Base64(JSON payload)
//   signature = MD5(`${appId}${roomId}${userId}${serverSecret}`)

function md5(str: string): string {
  return crypto.createHash('md5').update(str).digest('hex');
}

function generateKitToken(
  appId: number,
  serverSecret: string,
  roomId: string,
  userId: string,
  userName: string,
  ttlSeconds = 3600,
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    app_id: appId,
    room_id: roomId,
    user_id: userId,
    user_name: userName,
    privilege: { 1: 1, 2: 1 },
    nonce: String(10000000 + Math.floor(Math.random() * 89999999)),
    signature: md5(`${appId}${roomId}${userId}${serverSecret}`),
    ctime: now,
    expire_time: now + ttlSeconds,
  };
  return '04' + Buffer.from(JSON.stringify(payload)).toString('base64');
}


// ── Routes ───────────────────────────────────────────────────────────────────

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'call-service' });
});

// GET /token?roomId=<roomId>&userId=<userId>&userName=<userName>
app.get('/token', (req: Request, res: Response) => {
  const { roomId, userId, userName } = req.query as Record<string, string>;

  if (!roomId || !userId) {
    res.status(400).json({ error: 'roomId and userId are required' });
    return;
  }

  const appId = Number(process.env.ZEGO_APP_ID ?? 0);
  const serverSecret = process.env.ZEGO_SERVER_SECRET ?? '';

  if (!appId || !serverSecret) {
    res.status(503).json({ error: 'ZEGOCLOUD credentials are not configured on the server' });
    return;
  }

  const token = generateKitToken(appId, serverSecret, roomId, userId, userName ?? userId);
  res.json({ token, appId });
});


// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT ?? 5060);
app.listen(PORT, () => {
  console.log(`call-service listening on port ${PORT}`);
});
