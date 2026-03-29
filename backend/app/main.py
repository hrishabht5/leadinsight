"""
LeadPulse — FastAPI Application Entry Point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.core.config import settings
from app.core.logging_config import setup_logging
from app.core.middleware import log_requests
from app.core.exceptions import register_exception_handlers
from app.api.routes import auth, leads, webhook, users, analytics
from app.db.supabase import init_supabase

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_supabase()
    import logging
    logging.getLogger("leadpulse").info("✅ LeadPulse backend started.")
    yield
    logging.getLogger("leadpulse").info("🛑 LeadPulse backend shutting down.")


app = FastAPI(
    title="LeadPulse API",
    description="Real-time Lead Management CRM — Facebook & Instagram Leads",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,   # hide docs in production
    redoc_url="/redoc" if settings.DEBUG else None,
)

# ── Middleware ────────────────────────────────────────────────────────────────
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.middleware("http")(log_requests)

# ── Exception handlers ────────────────────────────────────────────────────────
register_exception_handlers(app)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,      prefix="/api/v1/auth",      tags=["Auth"])
app.include_router(users.router,     prefix="/api/v1/users",     tags=["Users"])
app.include_router(leads.router,     prefix="/api/v1/leads",     tags=["Leads"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(webhook.router,   prefix="/webhook",          tags=["Webhook"])


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "service": "LeadPulse API", "version": "1.0.0"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}
