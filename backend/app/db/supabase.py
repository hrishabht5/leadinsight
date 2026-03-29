"""
LeadPulse — Supabase Client
Uses supabase-py (async) for all database operations.
"""
from typing import Optional
from supabase import create_client, Client
from app.core.config import settings

_client: Optional[Client] = None


async def init_supabase():
    global _client
    _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    print(f"✅ Supabase connected: {settings.SUPABASE_URL}")


def get_db() -> Client:
    """FastAPI dependency — returns the Supabase client."""
    if _client is None:
        raise RuntimeError("Supabase not initialised. Call init_supabase() first.")
    return _client
