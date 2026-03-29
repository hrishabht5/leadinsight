"""
LeadPulse — Request Logging Middleware
Logs every request with method, path, status code, and duration.
"""
import logging
import time
from fastapi import Request

logger = logging.getLogger("leadpulse.access")


async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration = (time.perf_counter() - start) * 1000

    # Skip health checks to avoid noise
    if request.url.path not in ("/health", "/"):
        logger.info(
            f"{request.method} {request.url.path} "
            f"→ {response.status_code} "
            f"({duration:.1f}ms) "
            f"[{request.client.host if request.client else 'unknown'}]"
        )

    return response
