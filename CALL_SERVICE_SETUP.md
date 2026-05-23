# Call Service Setup Guide

## Problem
The call-service was not connecting due to missing environment variables and misconfiguration in `docker-compose.yml`.

## What Was Fixed

### 1. **Call-Service Environment Variables**
Added critical missing variables to docker-compose.yml:
- `ZEGO_APP_ID` - ZEGOCLOUD app ID (defaults to 99999999 for development)
- `ZEGO_SERVER_SECRET` - ZEGOCLOUD server secret (defaults to demo_secret_key)
- `ALLOWED_ORIGINS` - CORS whitelist for frontend connections
- `PORT` - Service port (5060)

### 2. **Frontend Environment Variables**
Added missing public variables to docker-compose.yml:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase API endpoint
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_CALLS_API_URL` - Call service endpoint (http://localhost:5060)
- `NEXT_PUBLIC_REALTIME_WS_URL` - Socket.IO server for call signaling (http://localhost:5050)
- `NEXT_PUBLIC_AI_API_URL` - AI backend endpoint (http://localhost:5070)

### 3. **Realtime Service CORS**
Added `ALLOWED_ORIGINS` for proper Socket.IO CORS configuration

### 4. **AI Backend**
Added:
- `ALLOWED_ORIGINS` for CORS
- `OPENROUTER_API_KEY` environment variable support
- `OPENROUTER_MODEL` configuration
- `DEEPGRAM_API_KEY` for speech services

## Setup Instructions

### For Production/Testing with Real Credentials

Create `.env` files in each service directory:

#### `call-service/.env`
```env
NODE_ENV=production
PORT=5060
ZEGO_APP_ID=your_actual_zego_app_id
ZEGO_SERVER_SECRET=your_actual_zego_server_secret
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

#### `ai-backend/.env`
```env
ENV=production
OPENROUTER_API_KEY=sk-your_actual_key
OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b:free
DEEPGRAM_API_KEY=your_deepgram_api_key
ALLOWED_ORIGINS=https://yourdomain.com
```

#### `frontend-service/.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_CALLS_API_URL=https://api.yourdomain.com:5060
NEXT_PUBLIC_REALTIME_WS_URL=wss://api.yourdomain.com:5050
NEXT_PUBLIC_AI_API_URL=https://api.yourdomain.com:5070
```

## Testing Connectivity

### 1. Check Call Service Health
```bash
curl http://localhost:5060/health
```
Expected response:
```json
{"status": "ok", "service": "call-service"}
```

### 2. Generate a Test Token
```bash
curl "http://localhost:5060/token?roomId=test-room&userId=test-user&userName=TestUser"
```

### 3. Check Frontend Can Access Services
Open browser DevTools and verify:
- Network tab shows requests to localhost:5060 (call-service)
- Network tab shows WebSocket connection to localhost:5050 (realtime)
- Network tab shows requests to localhost:5070 (ai-backend)

## Docker Compose Startup

```bash
docker-compose up -d
```

Services will start with default development credentials. For production, set environment variables before running.

## Troubleshooting

### Call Service Won't Start
1. Check logs: `docker-compose logs call-service`
2. Ensure port 5060 is not in use: `lsof -i :5060`
3. Verify npm install runs: Check the docker build output

### Frontend Can't Connect to Call Service
1. Check `NEXT_PUBLIC_CALLS_API_URL` is set correctly
2. Verify CORS: Check `ALLOWED_ORIGINS` includes frontend origin
3. Check browser console for CORS errors

### Token Generation Fails
1. Verify `ZEGO_APP_ID` and `ZEGO_SERVER_SECRET` are set
2. Check required query params: `roomId`, `userId` (userName is optional)
