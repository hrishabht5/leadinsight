"""
LeadPulse — Facebook Webhook Router

Two endpoints:
  GET  /webhook/facebook  →  Verification challenge (Meta one-time setup)
  POST /webhook/facebook  →  Incoming lead events (called by Meta in real-time)
"""
import json
import logging
from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Query, Request
from fastapi.responses import PlainTextResponse
from supabase import Client

from app.core.config import settings
from app.db.supabase import get_db
from app.services import facebook as fb_service
from app.services import lead_service, notifications

logger = logging.getLogger(__name__)
router = APIRouter()


# ── GET: Webhook verification (called once by Meta during app setup) ──────────
@router.get("/facebook", response_class=PlainTextResponse)
async def verify_webhook(
    hub_mode: str = Query(alias="hub.mode"),
    hub_verify_token: str = Query(alias="hub.verify_token"),
    hub_challenge: str = Query(alias="hub.challenge"),
):
    if hub_mode == "subscribe" and hub_verify_token == settings.FACEBOOK_WEBHOOK_VERIFY_TOKEN:
        logger.info("✅ Facebook webhook verified.")
        return hub_challenge
    raise HTTPException(status_code=403, detail="Webhook verification failed")


# ── POST: Receive lead events ─────────────────────────────────────────────────
@router.post("/facebook", status_code=200)
async def receive_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_hub_signature_256: str = Header(default=""),
    db: Client = Depends(get_db),
):
    body = await request.body()

    # 1. Verify signature
    if not fb_service.verify_webhook_signature(body, x_hub_signature_256):
        logger.warning("⚠️  Invalid webhook signature — rejected.")
        raise HTTPException(status_code=401, detail="Invalid signature")

    payload = json.loads(body)
    if payload.get("object") != "page":
        return {"status": "ignored"}

    # 2. Extract lead entries (may be batched)
    entries = fb_service.extract_lead_entries(payload)
    logger.info(f"📥 Webhook received: {len(entries)} lead(s)")

    # 3. Process each lead in the background so Meta gets 200 immediately
    for entry in entries:
        background_tasks.add_task(_process_lead, db, entry)

    return {"status": "ok"}


# ── Background task: fetch + store lead ──────────────────────────────────────
async def _process_lead(db: Client, entry: dict):
    fb_lead_id = entry.get("fb_lead_id")
    fb_page_id = entry.get("fb_page_id")
    if not fb_lead_id or not fb_page_id:
        return

    try:
        # Look up which workspace owns this page
        page_row = (
            db.table("connected_pages")
            .select("workspace_id, page_access_token")
            .eq("page_id", fb_page_id)
            .single()
            .execute()
        )
        if not page_row.data:
            logger.warning(f"Page {fb_page_id} not found in any workspace.")
            return

        workspace_id = page_row.data["workspace_id"]
        page_access_token = page_row.data["page_access_token"]

        # Deduplicate
        existing = await lead_service.get_lead_by_fb_id(db, fb_lead_id, workspace_id)
        if existing:
            logger.info(f"Duplicate lead {fb_lead_id} — skipped.")
            return

        # Fetch full lead details from Graph API
        lead_detail = await fb_service.fetch_lead_detail(fb_lead_id, page_access_token)
        if not lead_detail:
            return

        # Enrich with webhook metadata
        lead_detail.update({
            "fb_page_id":   fb_page_id,
            "fb_adset_id":  entry.get("fb_adset_id"),
            "source":       "facebook",
        })

        # Persist to Supabase
        lead = await lead_service.create_lead(db, workspace_id, lead_detail)
        logger.info(f"✅ Lead saved: {lead['id']} — {lead['name']}")

        # Push real-time notification to all SSE clients in this workspace
        notified = await notifications.broadcast_new_lead(workspace_id, lead)
        logger.info(f"📡 Notified {notified} dashboard client(s).")

    except Exception as exc:
        logger.exception(f"Error processing lead {fb_lead_id}: {exc}")
