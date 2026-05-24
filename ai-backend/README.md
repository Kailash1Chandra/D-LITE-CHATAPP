# D-LITE ChatApp — AI Backend

FastAPI service powering the AI assistant: streaming chat via OpenRouter and TTS/STT via Deepgram.

**Port:** `5070`

## Tech Stack

| Layer | Library |
|---|---|
| Framework | FastAPI (Python) |
| AI chat | OpenRouter API (OpenAI-compatible) |
| TTS | Deepgram Text-to-Speech |
| STT | Deepgram Speech-to-Text |
| Streaming | `httpx` async client + `StreamingResponse` |

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/chat` | Single-turn AI chat (non-streaming) |
| `POST` | `/chat/stream` | Streaming AI chat (SSE / chunked) |
| `POST` | `/tts` | Text → speech audio |
| `POST` | `/stt` | Speech audio → text |

## Environment Variables

```env
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-4o-mini     # or any OpenRouter model slug
DEEPGRAM_API_KEY=
ALLOWED_ORIGINS=http://localhost:3002    # comma-separated
```

## Running Locally

```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 5070 --reload
```

## Docker

```bash
docker compose up ai-backend
```

## Notes

- All endpoints include unconditional CORS headers so the frontend can call them directly from the browser.
- Streaming endpoint uses `aiter_lines()` on the OpenRouter response and forwards chunks as they arrive — the frontend renders them with a typewriter animation.
- TTS returns raw audio bytes; the frontend plays them via the Web Audio API.
