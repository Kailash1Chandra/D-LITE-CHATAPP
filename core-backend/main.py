import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from typing import Optional
import uvicorn

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# Support both CORS_ORIGINS (deployed) and ALLOWED_ORIGINS (local .env)
_ORIGINS_ENV = os.getenv("CORS_ORIGINS") or os.getenv("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS: list[str] = [o.strip() for o in _ORIGINS_ENV.split(",") if o.strip()]

_supabase: Client | None = None


def sb() -> Client:
    global _supabase
    if _supabase is None:
        _supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supabase


@asynccontextmanager
async def lifespan(app: FastAPI):
    sb()  # warm up client at startup
    yield


app = FastAPI(title="D-Lite Core Backend", lifespan=lifespan)

if ALLOWED_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PATCH", "DELETE"],
        allow_headers=["Content-Type", "Authorization"],
    )


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "core-backend"}


# ── Users / Profiles ──────────────────────────────────────────────────────────

@app.get("/users/search")
async def search_users(q: str = Query(""), limit: int = Query(10, le=50)):
    """Search users by username or display_name."""
    try:
        res = (
            sb()
            .table("profiles")
            .select("id,username,display_name,avatar_url,status")
            .or_(f"username.ilike.%{q}%,display_name.ilike.%{q}%")
            .limit(limit)
            .execute()
        )
        return {"users": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/users/{user_id}")
async def get_user(user_id: str):
    try:
        res = sb().table("profiles").select("*").eq("id", user_id).single().execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="User not found")
        return res.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    username: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    status: Optional[str] = None


@app.patch("/users/{user_id}")
async def update_user(user_id: str, body: ProfileUpdate):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    try:
        res = sb().table("profiles").update(updates).eq("id", user_id).execute()
        return {"updated": True, "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Conversations (DMs) ───────────────────────────────────────────────────────

@app.get("/users/{user_id}/conversations")
async def get_conversations(user_id: str):
    """Latest message per peer for a user's DM inbox."""
    try:
        res = (
            sb()
            .table("direct_messages")
            .select("id,content,created_at,status,sender_id,receiver_id")
            .or_(f"sender_id.eq.{user_id},receiver_id.eq.{user_id}")
            .order("created_at", desc=True)
            .limit(200)
            .execute()
        )
        messages = res.data or []

        # Collapse to latest message per peer
        seen: dict[str, dict] = {}
        for m in messages:
            peer = m["receiver_id"] if m["sender_id"] == user_id else m["sender_id"]
            if peer not in seen:
                seen[peer] = m

        return {"conversations": list(seen.values())}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Groups ────────────────────────────────────────────────────────────────────

@app.get("/users/{user_id}/groups")
async def get_user_groups(user_id: str):
    """All groups the user belongs to."""
    try:
        res = (
            sb()
            .table("group_members")
            .select("role,joined_at,groups(id,name,description,avatar_url,is_public,created_at)")
            .eq("user_id", user_id)
            .execute()
        )
        return {"groups": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/groups/{group_id}")
async def get_group(group_id: str):
    try:
        res = (
            sb()
            .table("groups")
            .select("*,group_members(user_id,role,profiles(id,username,display_name,avatar_url))")
            .eq("id", group_id)
            .single()
            .execute()
        )
        if not res.data:
            raise HTTPException(status_code=404, detail="Group not found")
        return res.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class CreateGroup(BaseModel):
    name: str
    description: Optional[str] = ""
    is_public: Optional[bool] = False
    created_by: str


@app.post("/groups")
async def create_group(body: CreateGroup):
    try:
        client = sb()
        group_res = client.table("groups").insert({
            "name": body.name,
            "description": body.description,
            "is_public": body.is_public,
            "created_by": body.created_by,
        }).execute()

        group = group_res.data[0]
        # Auto-add creator as Owner
        client.table("group_members").insert({
            "group_id": group["id"],
            "user_id": body.created_by,
            "role": "Owner",
        }).execute()

        return group
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Calls ─────────────────────────────────────────────────────────────────────

class LogCall(BaseModel):
    caller_id: str
    receiver_id: Optional[str] = None
    group_id: Optional[str] = None
    type: str   # "audio" | "video"
    status: Optional[str] = "ended"
    started_at: Optional[str] = None
    ended_at: Optional[str] = None


@app.post("/calls")
async def log_call(body: LogCall):
    try:
        res = sb().table("calls").insert(body.model_dump(exclude_none=True)).execute()
        return res.data[0] if res.data else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/users/{user_id}/calls")
async def get_call_history(user_id: str, limit: int = Query(20, le=100)):
    try:
        res = (
            sb()
            .table("calls")
            .select("*")
            .or_(f"caller_id.eq.{user_id},receiver_id.eq.{user_id}")
            .order("started_at", desc=True)
            .limit(limit)
            .execute()
        )
        return {"calls": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        workers=int(os.getenv("UVICORN_WORKERS", "1")),
        log_level=os.getenv("UVICORN_LOG_LEVEL", "info"),
    )
