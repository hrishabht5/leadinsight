"""
LeadPulse — Lead Schemas (Pydantic v2)
"""
from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


class LeadStatus(str, Enum):
    new = "new"
    contacted = "contacted"
    converted = "converted"
    lost = "lost"


class LeadSource(str, Enum):
    facebook = "facebook"
    instagram = "instagram"


# ── Inbound (Facebook Webhook payload, after parsing) ─────────────────────────
class FacebookLeadPayload(BaseModel):
    fb_lead_id: str
    fb_form_id: str
    fb_page_id: str
    fb_ad_id: Optional[str] = None
    fb_adset_id: Optional[str] = None
    fb_campaign_id: Optional[str] = None
    source: LeadSource = LeadSource.facebook


# ── Note sub-model ────────────────────────────────────────────────────────────
class NoteCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)


class NoteOut(BaseModel):
    id: UUID
    content: str
    created_at: datetime
    created_by: Optional[str] = None


# ── Lead CRUD schemas ─────────────────────────────────────────────────────────
class LeadOut(BaseModel):
    id: UUID
    workspace_id: UUID
    name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    city: Optional[str] = None
    source: LeadSource
    status: LeadStatus
    campaign_name: Optional[str] = None
    adset_name: Optional[str] = None
    form_name: Optional[str] = None
    fb_lead_id: Optional[str] = None
    fb_page_id: Optional[str] = None
    notes: List[NoteOut] = []
    created_at: datetime
    updated_at: datetime


class LeadCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[EmailStr] = None
    city: Optional[str] = Field(None, max_length=100)
    source: LeadSource = LeadSource.facebook
    campaign_name: Optional[str] = Field(None, max_length=200)


class LeadImportRow(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[EmailStr] = None
    city: Optional[str] = Field(None, max_length=100)
    source: LeadSource = LeadSource.facebook
    campaign_name: Optional[str] = Field(None, max_length=200)


class LeadImportRequest(BaseModel):
    leads: List[LeadImportRow] = Field(..., min_length=1, max_length=500)


class CsvImportResult(BaseModel):
    imported: int
    skipped: int
    errors: List[str]


class LeadStatusUpdate(BaseModel):
    status: LeadStatus


class LeadListResponse(BaseModel):
    leads: List[LeadOut]
    total: int
    page: int
    page_size: int
