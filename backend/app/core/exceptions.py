"""
LeadPulse — Global Exception Handlers
Registered on the FastAPI app to return consistent JSON error shapes.
Includes request ID for traceability and sanitized errors in production.
"""
import logging
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings

logger = logging.getLogger("leadpulse.errors")


def _get_request_id(request: Request) -> str:
    """Get request ID from middleware state."""
    return getattr(request.state, "request_id", "unknown")


def register_exception_handlers(app: FastAPI) -> None:

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.detail,
                "status_code": exc.status_code,
                "request_id": _get_request_id(request),
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        errors = [
            {"field": ".".join(str(l) for l in e["loc"]), "message": e["msg"]}
            for e in exc.errors()
        ]
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "detail": "Validation error",
                "errors": errors,
                "request_id": _get_request_id(request),
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        request_id = _get_request_id(request)
        logger.exception(
            f"[{request_id}] Unhandled exception on {request.method} {request.url.path}: {exc}"
        )
        # Don't leak internal details in production
        detail = (
            "An internal server error occurred."
            if settings.is_production
            else f"Internal error: {str(exc)}"
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": detail,
                "request_id": request_id,
            },
        )

