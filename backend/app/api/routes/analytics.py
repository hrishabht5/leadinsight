"""
LeadPulse — Analytics Routes
GET /api/v1/analytics/summary   Overall counts by status + source
GET /api/v1/analytics/trend     Daily lead volume for the last 30 days
"""
from fastapi import APIRouter, Depends
from supabase import Client
from app.core.security import get_current_user
from app.db.supabase import get_db
from app.services.lead_service import get_lead_stats

router = APIRouter()


@router.get("/summary")
async def analytics_summary(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    return await get_lead_stats(db, current_user["workspace_id"])


@router.get("/trend")
async def analytics_trend(
    days: int = 30,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Daily lead volume for the last N days using a Supabase RPC function."""
    result = db.rpc("leads_daily_trend", {
        "p_workspace_id": current_user["workspace_id"],
        "p_days": days,
    }).execute()
    return {"trend": result.data}
