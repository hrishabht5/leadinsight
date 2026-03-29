"""
LeadPulse — User Routes
GET   /api/v1/users/me        Current user profile
PATCH /api/v1/users/me        Update profile
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from supabase import Client
from app.core.security import get_current_user
from app.db.supabase import get_db

router = APIRouter()


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None


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
