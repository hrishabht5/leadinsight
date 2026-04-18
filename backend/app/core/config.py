"""
LeadPulse — App Configuration
All settings are loaded from environment variables / .env file.
"""
import logging
import sys
from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

_INSECURE_DEFAULTS = {
    "change-me-in-production-use-openssl-rand-hex-32",
    "replace-with-openssl-rand-hex-32",
    "",
}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # ── App ─────────────────────────────────────────────────────────────────
    APP_NAME: str = "LeadPulse"
    DEBUG: bool = False
    SECRET_KEY: str = "change-me-in-production-use-openssl-rand-hex-32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours (was 7 days)

    # ── Supabase ─────────────────────────────────────────────────────────────
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""  # Used server-side only

    # ── Facebook / Meta ──────────────────────────────────────────────────────
    FACEBOOK_APP_ID: str = ""
    FACEBOOK_APP_SECRET: str = ""
    FACEBOOK_WEBHOOK_VERIFY_TOKEN: str = "leadpulse_webhook_secret"
    FACEBOOK_API_VERSION: str = "v19.0"

    # ── CORS ─────────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://app.leadpulse.io",
    ]

    # ── Rate Limiting ────────────────────────────────────────────────────────
    RATE_LIMIT_LOGIN: int = 10       # max login attempts per minute per IP
    RATE_LIMIT_REGISTER: int = 5     # max register attempts per minute per IP
    RATE_LIMIT_WINDOW: int = 60      # window in seconds

    # ── Redis (for SSE / pub-sub) ────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379"

    # ── Misc ─────────────────────────────────────────────────────────────────
    ENVIRONMENT: str = "development"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    def validate_for_production(self) -> None:
        """Crash on startup if critical settings are insecure in production."""
        logger = logging.getLogger("leadpulse.config")
        errors = []

        if self.is_production:
            if self.SECRET_KEY in _INSECURE_DEFAULTS:
                errors.append("SECRET_KEY is set to an insecure default. Generate one: openssl rand -hex 32")
            if not self.SUPABASE_URL:
                errors.append("SUPABASE_URL is not set")
            if not self.SUPABASE_SERVICE_ROLE_KEY:
                errors.append("SUPABASE_SERVICE_ROLE_KEY is not set")
            if not self.FACEBOOK_APP_SECRET:
                errors.append("FACEBOOK_APP_SECRET is not set")
            if self.DEBUG:
                logger.warning("⚠️  DEBUG=true in production — disabling.")
                self.DEBUG = False

        if errors:
            for e in errors:
                logger.critical(f"❌ CONFIG ERROR: {e}")
            sys.exit(1)

        if not self.is_production and self.SECRET_KEY in _INSECURE_DEFAULTS:
            logger.warning("⚠️  Using insecure default SECRET_KEY — OK for development only.")


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
