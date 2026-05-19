import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

load_dotenv()

_ORIGINS_ENV = os.getenv("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS: list[str] = (
    [o.strip() for o in _ORIGINS_ENV.split(",") if o.strip()]
    if _ORIGINS_ENV
    else []
)

# Socket.IO requires explicit origins for browser WebSocket connections.
# Falls back to "*" only when no env var is set (dev mode).
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS else "*",
)

app = FastAPI(title="D-Lite Realtime Service")

if ALLOWED_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type", "Authorization"],
    )

socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

# sid → user_id
_online: dict[str, str] = {}


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "online": len(_online)}


# ── Connection lifecycle ───────────────────────────────────────────────────────

@sio.event
async def connect(sid, environ, auth):
    user_id = (auth or {}).get("user_id")
    if not user_id:
        return  # anonymous — still connected but not tracked
    _online[sid] = user_id
    await sio.enter_room(sid, f"user:{user_id}")
    # Broadcast to everyone else that this user came online
    await sio.emit("user_online", {"user_id": user_id}, skip_sid=sid)


@sio.event
async def disconnect(sid):
    user_id = _online.pop(sid, None)
    if user_id:
        await sio.emit("user_offline", {"user_id": user_id}, skip_sid=sid)


# ── Room management ───────────────────────────────────────────────────────────

@sio.event
async def join_room(sid, data):
    """data: { room: "dm:<id1>_<id2>" | "group:<group_id>" }"""
    room = (data or {}).get("room")
    if room:
        await sio.enter_room(sid, room)


@sio.event
async def leave_room(sid, data):
    room = (data or {}).get("room")
    if room:
        await sio.leave_room(sid, room)


# ── Typing indicators ─────────────────────────────────────────────────────────

@sio.event
async def typing_start(sid, data):
    """data: { room: str }"""
    room = (data or {}).get("room")
    user_id = _online.get(sid)
    if room and user_id:
        await sio.emit("typing_start", {"user_id": user_id}, room=room, skip_sid=sid)


@sio.event
async def typing_stop(sid, data):
    """data: { room: str }"""
    room = (data or {}).get("room")
    user_id = _online.get(sid)
    if room and user_id:
        await sio.emit("typing_stop", {"user_id": user_id}, room=room, skip_sid=sid)


# ── Presence ──────────────────────────────────────────────────────────────────

@sio.event
async def get_online_users(sid, data):
    """Return list of all currently-online user IDs to the caller."""
    await sio.emit("online_users", {"users": list(set(_online.values()))}, to=sid)


@sio.event
async def ping(sid, data):
    await sio.emit("pong", {}, to=sid)


# ── WebRTC signaling relay ────────────────────────────────────────────────────
# Simple relay — server never inspects the signal content, just forwards it.

@sio.event
async def join_call_room(sid, data):
    """data: { roomId: str }
    Join a WebRTC call room. Notifies any peer already waiting so they
    can initiate the offer/answer handshake."""
    room = f"call:{(data or {}).get('roomId')}"
    await sio.enter_room(sid, room)
    user_id = _online.get(sid)
    await sio.emit("peer_joined", {"user_id": user_id}, room=room, skip_sid=sid)


@sio.event
async def call_signal(sid, data):
    """data: { roomId: str, signal: { type: offer|answer|candidate, ... } }
    Relay any WebRTC signal to all other peers in the call room."""
    room = f"call:{(data or {}).get('roomId')}"
    signal = (data or {}).get("signal")
    user_id = _online.get(sid)
    await sio.emit("call_signal", {"from": user_id, "signal": signal}, room=room, skip_sid=sid)


@sio.event
async def leave_call_room(sid, data):
    """data: { roomId: str }"""
    room = f"call:{(data or {}).get('roomId')}"
    await sio.leave_room(sid, room)
    await sio.emit("peer_left", {}, room=room, skip_sid=sid)
