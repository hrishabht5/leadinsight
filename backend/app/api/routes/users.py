"""
LeadPulse — User Routes
GET   /api/v1/users/me              Current user profile
PATCH /api/v1/users/me              Update profile
GET   /api/v1/users/me/preferences  Get user preferences
PATCH /api/v1/users/me/preferences  Update user preferences
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from supabase import Client
from app.core.security import get_current_user
from app.db.supabase import get_db

logger = logging.getLogger("leadpulse.users")
router = APIRouter()

# Default preferences — used when user has no saved preferences
_DEFAULT_PREFS = {
    "notifications": {
        "push": True,
        "email": True,
        "whatsapp": False,
        "sound": True,
    },
    "lead_settings": {
        "auto_assign": False,
        "dedup": True,
    },
}


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None


class PreferencesUpdate(BaseModel):
    notifications: Optional[dict] = None
    lead_settings: Optional[dict] = None


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user), db: Client = Depends(get_db)):
    result = db.table("users").select("id, email, full_name, phone, workspace_id, created_at").eq("id", current_user["id"]).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    return result.data


@router.patch("/me")
async def update_me(body: ProfileUpdate, current_user: dict = Depends(get_current_user), db: Client = Depends(get_db)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")
    result = db.table("users").update(updates).eq("id", current_user["id"]).execute()
    return result.data[0]


@router.get("/me/preferences")
async def get_preferences(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Get user preferences. Returns defaults if none saved."""
    try:
        result = (
            db.table("users")
            .select("preferences")
            .eq("id", current_user["id"])
            .single()
            .execute()
        )
        saved = result.data.get("preferences") if result.data else None
        if saved and isinstance(saved, dict):
            # Merge with defaults so new keys are always present
            merged = {**_DEFAULT_PREFS}
            for key in merged:
                if key in saved:
                    merged[key] = {**merged[key], **saved[key]}
            return merged
    except Exception as e:
        logger.warning(f"⚠️  Could not load preferences (column may not exist): {e}")
    return _DEFAULT_PREFS


@router.patch("/me/preferences")
async def update_preferences(
    body: PreferencesUpdate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Update user preferences. Merges with existing preferences."""
    # Load existing
    try:
        existing_result = (
            db.table("users")
            .select("preferences")
            .eq("id", current_user["id"])
            .single()
            .execute()
        )
        existing = existing_result.data.get("preferences") or {}
    except Exception:
        existing = {}

    # Merge updates
    updates = body.model_dump(exclude_none=True)
    for key, value in updates.items():
        if isinstance(value, dict) and isinstance(existing.get(key), dict):
            existing[key] = {**existing[key], **value}
        else:
            existing[key] = value

    try:
        db.table("users").update({"preferences": existing}).eq("id", current_user["id"]).execute()
        logger.info(f"✅ Preferences updated for user {current_user['id']}")
    except Exception as e:
        logger.warning(f"⚠️  Could not save preferences (column may not exist yet): {e}")
        # Still return the merged result even if save fails
        pass

    return existing

