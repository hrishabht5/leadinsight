"""
LeadPulse — Request Middleware
- Request ID for traceability
- Security headers for production
- Request logging with duration
"""
import logging
import time
import uuid
from fastapi import Request

from app.core.config import settings

logger = logging.getLogger("leadpulse.access")


async def log_requests(request: Request, call_next):
    # Generate unique request ID for traceability
    request_id = str(uuid.uuid4())[:8]
    request.state.request_id = request_id

    start = time.perf_counter()
    response = await call_next(request)
    duration = (time.perf_counter() - start) * 1000

    # ── Security headers (always applied) ───────────────────────────────────
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"

    # HSTS only in production (requires HTTPS)
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

    # Skip health checks to avoid noise
    if request.url.path not in ("/health", "/"):
        logger.info(
            f"[{request_id}] {request.method} {request.url.path} "
            f"→ {response.status_code} "
            f"({duration:.1f}ms) "
            f"[{request.client.host if request.client else 'unknown'}]"
        )

    return response

