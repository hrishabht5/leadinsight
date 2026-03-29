"""
LeadPulse — Lead Service
All Supabase DB interactions for leads and notes.
"""
from typing import Optional
from uuid import UUID

from supabase import Client

from app.schemas.lead import LeadStatus


# ── Leads ─────────────────────────────────────────────────────────────────────
async def create_lead(db: Client, workspace_id: str, data: dict) -> dict:
    """Insert a new lead row. Returns the created row."""
    payload = {
        "workspace_id":  workspace_id,
        "name":          data.get("name", "Unknown"),
        "phone":         data.get("phone"),
        "email":         data.get("email"),
        "city":          data.get("city"),
        "source":        data.get("source", "facebook"),
        "status":        "new",
        "fb_lead_id":    data.get("fb_lead_id"),
        "fb_page_id":    data.get("fb_page_id"),
        "fb_ad_id":      data.get("fb_ad_id"),
        "fb_adset_id":   data.get("fb_adset_id"),
        "fb_campaign_id":data.get("fb_campaign_id"),
        "fb_form_id":    data.get("fb_form_id"),
        "campaign_name": data.get("campaign_name"),
        "adset_name":    data.get("adset_name"),
        "form_name":     data.get("form_name"),
    }
    result = db.table("leads").insert(payload).execute()
    return result.data[0]


async def get_leads(
    db: Client,
    workspace_id: str,
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
) -> tuple[list, int]:
    """Paginated lead list with optional status filter and search."""
    query = (
        db.table("leads")
        .select("*, notes(*)", count="exact")
        .eq("workspace_id", workspace_id)
        .order("created_at", desc=True)
    )
    if status:
        query = query.eq("status", status)
    if search:
        query = query.or_(
            f"name.ilike.%{search}%,phone.ilike.%{search}%,email.ilike.%{search}%,campaign_name.ilike.%{search}%"
        )

    offset = (page - 1) * page_size
    result = query.range(offset, offset + page_size - 1).execute()
    return result.data, result.count or 0


async def get_lead_by_id(db: Client, lead_id: str, workspace_id: str) -> Optional[dict]:
    result = (
        db.table("leads")
        .select("*, notes(*)")
        .eq("id", lead_id)
        .eq("workspace_id", workspace_id)
        .single()
        .execute()
    )
    return result.data


async def get_lead_by_fb_id(db: Client, fb_lead_id: str, workspace_id: str) -> Optional[dict]:
    """Prevent duplicate ingestion."""
    result = (
        db.table("leads")
        .select("id")
        .eq("fb_lead_id", fb_lead_id)
        .eq("workspace_id", workspace_id)
        .execute()
    )
    return result.data[0] if result.data else None


async def update_lead_status(db: Client, lead_id: str, workspace_id: str, status: LeadStatus) -> dict:
    result = (
        db.table("leads")
        .update({"status": status.value})
        .eq("id", lead_id)
        .eq("workspace_id", workspace_id)
        .execute()
    )
    return result.data[0]


# ── Notes ─────────────────────────────────────────────────────────────────────
async def add_note(db: Client, lead_id: str, workspace_id: str, content: str, user_id: str) -> dict:
    # Verify lead belongs to workspace
    lead = await get_lead_by_id(db, lead_id, workspace_id)
    if not lead:
        return None
    result = db.table("notes").insert({
        "lead_id":    lead_id,
        "content":    content,
        "created_by": user_id,
    }).execute()
    return result.data[0]


# ── Analytics ─────────────────────────────────────────────────────────────────
async def get_lead_stats(db: Client, workspace_id: str) -> dict:
    result = db.table("leads").select("status, source", count="exact").eq("workspace_id", workspace_id).execute()
    rows = result.data or []
    stats = {"total": len(rows), "new": 0, "contacted": 0, "converted": 0, "lost": 0, "facebook": 0, "instagram": 0}
    for r in rows:
        s = r.get("status"); src = r.get("source")
        if s in stats: stats[s] += 1
        if src in stats: stats[src] += 1
    return stats
