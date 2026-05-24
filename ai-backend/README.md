# D-LITE ChatApp — AI Backend

FastAPI microservice that powers the in-app AI assistant **D-Lite**. Handles multi-turn streaming chat via OpenRouter, text-to-speech via Deepgram, and speech-to-text via Deepgram.

**Port:** `5070`

---

## Tech Stack

| Layer | Library / Service |
|---|---|
| Framework | FastAPI (Python) |
| HTTP client | `httpx` (async, shared client with connection pooling) |
| AI chat | OpenRouter API — OpenAI-compatible `/chat/completions` |
| TTS | Deepgram Text-to-Speech REST API |
| STT | Deepgram `deepgram-sdk` (pre-recorded) |
| Streaming | `StreamingResponse` + `aiter_lines()` for SSE forwarding |
| CORS | FastAPI `CORSMiddleware` (allow-list from env; falls back to `*` in dev) |

---

## AI Personality

The assistant uses a fixed system prompt that defines its persona:

> *"You're D-Lite, a casual, warm, friendly chat buddy. Talk like a helpful friend, not a formal assistant: use simple words, be concise, upbeat, and natural. Help users manage conversations, summarize chats, draft messages, and answer questions."*

This system prompt is prepended to every request sent to OpenRouter.

---

## API Endpoints

### `GET /health`
Returns service status.
```json
{ "status": "ok", "service": "ai-backend" }
```

---

### `POST /chat`
Single-turn or multi-turn chat. Returns the complete response once the model finishes.

**Request body:**
```json
{
  "message": "Summarize my last conversation",
  "history": [
    { "role": "user", "content": "Hey" },
    { "role": "assistant", "content": "Hey! What's up?" }
  ],
  "model": "gpt",
  "stream": false
}
```
- `history` — optional array of prior `{ role, content }` pairs sent as conversation context
- `model` — ignored at runtime; actual model is taken from `OPENROUTER_MODEL` env var
- `stream` — field exists but `/chat` always returns a single JSON response; use `/chat/stream` for streaming

**Response:**
```json
{ "content": "Your last conversation was about..." }
```

---

### `POST /chat/stream`
Streaming chat — identical request body to `/chat`. Returns an SSE stream.

**Response stream (`text/event-stream`):**

Each chunk:
```
data: {"delta": "Your "}
data: {"delta": "last "}
data: {"delta": "conversation..."}
data: {"done": true}
```

On error:
```
data: {"error": "some error message"}
```

**How it works:**
1. Opens an `httpx` streaming connection to OpenRouter with `"stream": true`
2. Iterates lines with `aiter_lines()` — no manual buffering
3. Parses each `data: {...}` SSE line, extracts `choices[0].delta.content`, re-emits as `{"delta": "..."}` to the frontend
4. Sends `{"done": true}` when OpenRouter sends `[DONE]`

**Response headers set to prevent proxy buffering:**
```
Cache-Control: no-cache, no-transform
X-Accel-Buffering: no
Connection: keep-alive
```

---

### `POST /tts`
Convert text to MP3 audio using Deepgram TTS.

**Request body:**
```json
{
  "text": "Hello! How can I help you today?",
  "voice_id": "alloy"
}
```
- `voice_id` — optional; falls back to `DEEPGRAM_TTS_VOICE` env var, then `alloy`

**Response:** `audio/mpeg` binary stream (inline MP3).

**Deepgram call:** `POST https://api.deepgram.com/v1/text-to-speech?voice=<voice>&model=<model>&format=mp3`

---

### `POST /stt`
Transcribe audio to text using Deepgram pre-recorded STT.

**Request:** Raw audio bytes in the request body. Set `Content-Type` to match the audio format (e.g., `audio/webm`, `audio/mp4`).

**Response:**
```json
{ "transcript": "What's the weather like today?" }
```

**STT model:** configured via `DEEPGRAM_STT_MODEL` (default: `nova-2`). `smart_format: true` is always enabled.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENROUTER_API_KEY` | Yes | — | OpenRouter API key |
| `OPENROUTER_MODEL` | No | `nvidia/nemotron-3-super-120b-a12b:free` | Model slug passed to OpenRouter |
| `DEEPGRAM_API_KEY` | Yes (for TTS/STT) | — | Deepgram API key |
| `DEEPGRAM_TTS_VOICE` | No | `alloy` | Default TTS voice |
| `DEEPGRAM_TTS_MODEL` | No | `gpt-tts` | Deepgram TTS model |
| `DEEPGRAM_STT_MODEL` | No | `nova-2` | Deepgram STT model |
| `ALLOWED_ORIGINS` | No | `*` | Comma-separated allowed CORS origins |

---

## Running Locally

```bash
pip install -r requirements.txt

# Create .env (see .env.example)
cp .env.example .env

uvicorn main:app --host 0.0.0.0 --port 5070 --reload
```

---

## Docker

```bash
# From project root
docker compose up ai-backend

# Or build and run directly
docker build -t dlite-ai-backend .
docker run -p 5070:5070 --env-file .env dlite-ai-backend
```

---

## Architecture Notes

- A single `httpx.AsyncClient` is created at startup (via FastAPI `lifespan`) and reused for all non-streaming `/chat` requests — avoids connection overhead per request.
- The streaming endpoint creates a fresh `httpx.AsyncClient` per request with an infinite read timeout (`Timeout(None, connect=15.0)`) so long responses don't get cut off.
- TTS returns raw bytes in a single response (Deepgram's response is not streamed further).
- STT uses the `deepgram-sdk` synchronous prerecorded client, which blocks in the async handler — acceptable for voice messages which are short.
