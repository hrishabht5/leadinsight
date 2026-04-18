"""
LeadPulse — Supabase Client
Uses supabase-py for all database operations.
Includes connection validation with retry on startup.
"""
import logging
from typing import Optional
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger("leadpulse.db")

_client: Optional[Client] = None

_MAX_RETRIES = 3


async def init_supabase():
    """Initialize and validate the Supabase connection."""
    global _client

    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        logger.error("❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured")
        raise RuntimeError("Supabase credentials missing — check your .env file")

    for attempt in range(1, _MAX_RETRIES + 1):
        try:
            _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
            # Validate connection by making a simple query
            _client.table("users").select("id").limit(1).execute()
            logger.info(f"✅ Supabase connected: {settings.SUPABASE_URL}")
            return
        except Exception as e:
            logger.warning(
                f"⚠️  Supabase connection attempt {attempt}/{_MAX_RETRIES} failed: {e}"
            )
            if attempt == _MAX_RETRIES:
                logger.error(f"❌ Could not connect to Supabase after {_MAX_RETRIES} attempts")
                raise


def get_db() -> Client:
    """FastAPI dependency — returns the Supabase client."""
    if _client is None:
        raise RuntimeError("Supabase not initialised. Call init_supabase() first.")
    return _client

