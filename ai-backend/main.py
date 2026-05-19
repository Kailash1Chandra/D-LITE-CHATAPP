import os
import json
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import httpx
from typing import Optional

load_dotenv()

_ORIGINS_ENV = os.getenv("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS: list[str] = (
    [o.strip() for o in _ORIGINS_ENV.split(",") if o.strip()]
    if _ORIGINS_ENV
    else []
)

_http: httpx.AsyncClient | None = None


def get_http() -> httpx.AsyncClient:
    global _http
    if _http is None:
        _http = httpx.AsyncClient(timeout=30)
    return _http


@asynccontextmanager
async def lifespan(app: FastAPI):
    get_http()
    yield
    if _http:
        await _http.aclose()


app = FastAPI(title="D-Lite AI Backend", lifespan=lifespan)

if ALLOWED_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type", "Authorization"],
    )

SYSTEM_PROMPT = (
    "You're D-Lite, a casual, warm, friendly chat buddy. "
    "Talk like a helpful friend, not a formal assistant: use simple words, be concise, upbeat, and natural. "
    "When it fits, add a light conversational touch, but keep answers clear and useful. "
    "Help users manage conversations, summarize chats, draft messages, and answer questions."
)


# ── Models ────────────────────────────────────────────────────────────────────

class MessageItem(BaseModel):
    role: str        # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[list[MessageItem]] = []
    model: Optional[str] = "gpt"   # model set via OPENROUTER_MODEL env var
    stream: Optional[bool] = False

class TTSRequest(BaseModel):
    text: str
    voice_id: Optional[str] = None


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai-backend"}


# ── Chat (non-streaming) ──────────────────────────────────────────────────────

@app.post("/chat")
async def chat(req: ChatRequest):
    history = [{"role": m.role, "content": m.content} for m in (req.history or [])]
    history.append({"role": "user", "content": req.message})

    try:
        key = os.getenv("OPENROUTER_API_KEY")
        if not key:
            raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY not configured")

        model = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-super-120b-a12b:free")
        resp = await get_http().post(
            "https://openrouter.ai/api/v1/chat/completions",
            json={
                "model": model,
                "messages": [{"role": "system", "content": SYSTEM_PROMPT}, *history],
                "max_tokens": 1024,
            },
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        )
        resp.raise_for_status()
        data = resp.json()

        try:
            content = data["choices"][0]["message"]["content"]
        except Exception:
            content = data["choices"][0].get("text") or json.dumps(data)

        return {"content": content}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Chat (streaming SSE) ──────────────────────────────────────────────────────

@app.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    history = [{"role": m.role, "content": m.content} for m in (req.history or [])]
    history.append({"role": "user", "content": req.message})

    async def generate():
        try:
            key = os.getenv("OPENROUTER_API_KEY")
            if not key:
                yield f"data: {json.dumps({'error': 'OPENROUTER_API_KEY not configured'})}\n\n"
                return

            model = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-super-120b-a12b:free")
            async with httpx.AsyncClient(timeout=None) as client:
                async with client.stream(
                    "POST",
                    "https://openrouter.ai/api/v1/chat/completions",
                    json={
                        "model": model,
                        "messages": [{"role": "system", "content": SYSTEM_PROMPT}, *history],
                        "max_tokens": 1024,
                        "stream": True,
                    },
                    headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                ) as resp:
                    resp.raise_for_status()

                    buffer = ""
                    async for chunk in resp.aiter_text():
                        if not chunk:
                            continue

                        buffer += chunk

                        while "\n" in buffer:
                            line, buffer = buffer.split("\n", 1)
                            line = line.strip()
                            if not line.startswith("data:"):
                                continue

                            payload = line[5:].strip()
                            if not payload or payload == "[DONE]":
                                continue

                            try:
                                data = json.loads(payload)
                            except Exception:
                                continue

                            choice = (data.get("choices") or [{}])[0]
                            delta = choice.get("delta") or {}
                            content = delta.get("content")

                            # Skip reasoning/tool metadata and only stream visible assistant text.
                            if content:
                                yield f"data: {json.dumps({'delta': content})}\n\n"

            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Text-to-Speech (Deepgram) ─────────────────────────────────────────────────

@app.post("/tts")
async def tts(req: TTSRequest):
    try:
        dg_key = os.getenv("DEEPGRAM_API_KEY")
        if not dg_key:
            raise HTTPException(status_code=500, detail="DEEPGRAM_API_KEY not configured")

        voice = req.voice_id or os.getenv("DEEPGRAM_TTS_VOICE", "alloy")
        model = os.getenv("DEEPGRAM_TTS_MODEL", "gpt-tts")
        resp = await get_http().post(
            f"https://api.deepgram.com/v1/text-to-speech?voice={voice}&model={model}&format=mp3",
            json={"text": req.text},
            headers={"Authorization": f"Token {dg_key}", "Content-Type": "application/json"},
        )
        resp.raise_for_status()
        return StreamingResponse(
            iter([resp.content]),
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=speech.mp3"},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Speech-to-Text (Deepgram) ─────────────────────────────────────────────────

@app.post("/stt")
async def stt(request: Request):
    try:
        from deepgram import DeepgramClient, PrerecordedOptions
        body = await request.body()
        content_type = request.headers.get("content-type", "audio/webm")

        dg_client = DeepgramClient(api_key=os.getenv("DEEPGRAM_API_KEY"))
        stt_model = os.getenv("DEEPGRAM_STT_MODEL", "nova-2")
        options = PrerecordedOptions(model=stt_model, smart_format=True, language="en")
        response = dg_client.listen.prerecorded.v("1").transcribe_file(
            {"buffer": body, "mimetype": content_type}, options
        )
        transcript = response.results.channels[0].alternatives[0].transcript
        return {"transcript": transcript}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
