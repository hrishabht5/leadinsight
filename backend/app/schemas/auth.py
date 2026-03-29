"""
LeadPulse — Auth Schemas
"""
from typing import Optional
from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    workspace_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    workspace_id: str
    email: str


class FacebookConnectRequest(BaseModel):
    code: str           # OAuth code from Facebook login
    redirect_uri: str


class FacebookTokenResponse(BaseModel):
    access_token: str
    page_id: str
    page_name: str
    connected: bool
