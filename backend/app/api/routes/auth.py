"""
LeadPulse — Auth Routes
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/facebook/connect
GET  /api/v1/auth/facebook/pages
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.core.security import hash_password, verify_password, create_access_token, get_current_user
from app.db.supabase import get_db
from app.schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse,
    FacebookConnectRequest, FacebookTokenResponse,
)
from app.services import facebook as fb_service

router = APIRouter()


# ── Register ──────────────────────────────────────────────────────────────────
@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(payload: RegisterRequest, db: Client = Depends(get_db)):
    # Check duplicate email
    existing = db.table("users").select("id").eq("email", payload.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create workspace first
    ws = db.table("workspaces").insert({"name": payload.workspace_name}).execute()
    workspace_id = ws.data[0]["id"]

    # Create user
    user = db.table("users").insert({
        "email":        payload.email,
        "full_name":    payload.full_name,
        "password_hash": hash_password(payload.password),
        "workspace_id": workspace_id,
    }).execute()
    user_data = user.data[0]

    token = create_access_token({
        "sub":          user_data["id"],
        "email":        user_data["email"],
        "workspace_id": workspace_id,
    })
    return TokenResponse(
        access_token=token,
        user_id=user_data["id"],
        workspace_id=workspace_id,
        email=user_data["email"],
    )


# ── Login ─────────────────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: Client = Depends(get_db)):
    result = db.table("users").select("*").eq("email", payload.email).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user = result.data[0]
    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({
        "sub":          user["id"],
        "email":        user["email"],
        "workspace_id": user["workspace_id"],
    })
    return TokenResponse(
        access_token=token,
        user_id=user["id"],
        workspace_id=user["workspace_id"],
        email=user["email"],
    )


# ── Facebook OAuth: exchange code → store tokens ──────────────────────────────
@router.post("/facebook/connect", response_model=FacebookTokenResponse)
async def connect_facebook(
    payload: FacebookConnectRequest,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    workspace_id = current_user["workspace_id"]

    # 1. Exchange code for short-lived token
    token_data = await fb_service.exchange_code_for_token(payload.code, payload.redirect_uri)
    short_token = token_data["access_token"]

    # 2. Exchange for long-lived token (60 days)
    long_token_data = await fb_service.get_long_lived_token(short_token)
    user_token = long_token_data["access_token"]

    # 3. Get pages and subscribe them to leadgen webhooks
    pages = await fb_service.get_pages(user_token)
    if not pages:
        raise HTTPException(status_code=400, detail="No Facebook pages found")

    connected_pages = []
    for page in pages:
        page_id = page["id"]
        page_token = page["access_token"]

        # Subscribe page to webhook
        await fb_service.subscribe_page_to_leadgen(page_id, page_token)

        # Upsert page record
        db.table("connected_pages").upsert({
            "workspace_id":      workspace_id,
            "page_id":           page_id,
            "page_name":         page["name"],
            "page_access_token": page_token,
            "user_access_token": user_token,
        }, on_conflict="workspace_id,page_id").execute()
        connected_pages.append(page)

    first = connected_pages[0]
    return FacebookTokenResponse(
        access_token=user_token,
        page_id=first["id"],
        page_name=first["name"],
        connected=True,
    )


# ── List connected pages ──────────────────────────────────────────────────────
@router.get("/facebook/pages")
async def list_pages(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    result = (
        db.table("connected_pages")
        .select("page_id, page_name, created_at")
        .eq("workspace_id", current_user["workspace_id"])
        .execute()
    )
    return {"pages": result.data}
