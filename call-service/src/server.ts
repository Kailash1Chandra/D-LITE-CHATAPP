import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const app = express();

const _originsEnv = process.env.ALLOWED_ORIGINS ?? '';
const allowedOrigins = _originsEnv.split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true, credentials: false }));
app.use(express.json());


// ── ZEGOCLOUD Kit Token generation ───────────────────────────────────────────
//
// Replicates ZegoUIKitPrebuilt.generateKitTokenForTest exactly:
//   1. AES-CBC encrypt { app_id, user_id, nonce, ctime, expire } using
//      serverSecret (UTF-8 bytes) as key and a random 16-char IV
//   2. Pack into binary: [0×4][expire×4][ivLen×2][iv×16][ctLen×2][ciphertext]
//   3. Token = "04" + base64(binary) + "#" + base64(JSON{userID,roomID,userName,appID})
//
// This matches the format ZegoUIKitPrebuilt.create() validates on the client.

function generateKitToken(
  appId: number,
  serverSecret: string,
  roomId: string,
  userId: string,
  userName: string,
  ttlSeconds = 7200,
): string {
  const now = Math.floor(Date.now() / 1000);
  const nonce = Math.floor(Math.random() * 2147483647);
  const expire = now + ttlSeconds;

  const payload = JSON.stringify({ app_id: appId, user_id: userId, nonce, ctime: now, expire });

  // 16-char random IV (same logic as SDK)
  let iv = Math.random().toString().substring(2, 18);
  while (iv.length < 16) iv += iv.substring(0, 16 - iv.length);
  const ivBuf = Buffer.from(iv, 'utf8'); // exactly 16 bytes

  // Key: UTF-8 bytes of serverSecret → determine AES variant by length
  const rawKey = Buffer.from(serverSecret, 'utf8');
  let keyBuf: Buffer;
  let algo: string;
  if (rawKey.length >= 32) {
    keyBuf = rawKey.slice(0, 32); algo = 'aes-256-cbc';
  } else if (rawKey.length >= 24) {
    keyBuf = rawKey.slice(0, 24); algo = 'aes-192-cbc';
  } else {
    // pad to 16 bytes
    keyBuf = Buffer.concat([rawKey, Buffer.alloc(16 - rawKey.length)]);
    algo = 'aes-128-cbc';
  }

  const cipher = crypto.createCipheriv(algo, keyBuf, ivBuf);
  const ciphertext = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()]);

  // Binary header (28 bytes) + ciphertext
  const bin = Buffer.alloc(28 + ciphertext.length);
  bin.fill(0, 0, 4);                        // bytes 0-3: zeros
  bin.writeInt32BE(expire, 4);              // bytes 4-7: expire big-endian
  bin.writeUInt8(iv.length >> 8, 8);        // bytes 8-9: IV len big-endian uint16
  bin.writeUInt8(iv.length & 0xff, 9);
  ivBuf.copy(bin, 10);                      // bytes 10-25: IV
  bin.writeUInt8(ciphertext.length >> 8, 26); // bytes 26-27: ct len big-endian uint16
  bin.writeUInt8(ciphertext.length & 0xff, 27);
  ciphertext.copy(bin, 28);                // bytes 28+: ciphertext

  const binaryPart = '04' + bin.toString('base64');
  const metaPart = Buffer.from(JSON.stringify({
    userID: userId,
    roomID: roomId,
    userName: encodeURIComponent(userName),
    appID: appId,
  })).toString('base64');

  return binaryPart + '#' + metaPart;
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
    res.status(503).json({ error: 'ZEGOCLOUD credentials not configured' });
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
