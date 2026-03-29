"""
LeadPulse — Leads Routes
GET    /api/v1/leads              List leads (paginated, filterable)
GET    /api/v1/leads/stream       SSE — real-time lead events
GET    /api/v1/leads/{id}         Single lead detail
PATCH  /api/v1/leads/{id}/status  Update status
POST   /api/v1/leads/{id}/notes   Add a note
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from supabase import Client

from app.core.security import get_current_user, decode_token
from app.db.supabase import get_db
from app.schemas.lead import LeadListResponse, LeadStatus, LeadStatusUpdate, NoteCreate
from app.services import lead_service, notifications

router = APIRouter()


@router.get("", response_model=LeadListResponse)
async def list_leads(
    status: str | None = Query(None),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    leads, total = await lead_service.get_leads(
        db, current_user["workspace_id"],
        status=status, search=search,
        page=page, page_size=page_size,
    )
    return LeadListResponse(leads=leads, total=total, page=page, page_size=page_size)


@router.get("/stream")
async def stream_leads(
    request: Request,
    token: str | None = Query(None),
    db: Client = Depends(get_db),
):
    """SSE endpoint — accepts JWT as ?token= query param for EventSource compatibility."""
    auth_header = request.headers.get("Authorization", "")
    raw_token   = token or (auth_header.removeprefix("Bearer ").strip() or None)
    if not raw_token:
        raise HTTPException(status_code=401, detail="Missing token")
    payload      = decode_token(raw_token)
    workspace_id = payload.get("workspace_id")
    if not workspace_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    _, generator = await notifications.subscribe(workspace_id)
    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
    )


@router.get("/{lead_id}")
async def get_lead(
    lead_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    lead = await lead_service.get_lead_by_id(db, lead_id, current_user["workspace_id"])
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.patch("/{lead_id}/status")
async def update_status(
    lead_id: str,
    body: LeadStatusUpdate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    lead = await lead_service.update_lead_status(
        db, lead_id, current_user["workspace_id"], body.status
    )
    await notifications.broadcast_status_change(
        current_user["workspace_id"], lead_id, body.status.value
    )
    return lead


@router.post("/{lead_id}/notes", status_code=201)
async def add_note(
    lead_id: str,
    body: NoteCreate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    note = await lead_service.add_note(
        db, lead_id, current_user["workspace_id"],
        body.content, current_user["id"]
    )
    if not note:
        raise HTTPException(status_code=404, detail="Lead not found")
    return note
