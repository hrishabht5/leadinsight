"""
LeadPulse — Logging Setup
Call setup_logging() once at app startup.
"""
import logging
import sys
from app.core.config import settings


def setup_logging():
    level = logging.DEBUG if settings.DEBUG else logging.INFO

    fmt = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(fmt)

    root = logging.getLogger()
    root.setLevel(level)
    root.handlers = [handler]

    # Quiet noisy third-party loggers
    for noisy in ("httpx", "httpcore", "uvicorn.access"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    logging.getLogger("leadpulse").setLevel(level)
