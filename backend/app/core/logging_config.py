"""
LeadPulse — Logging Setup
Call setup_logging() once at app startup.

Production: JSON structured logging (machine-parsable for log aggregators)
Development: Human-readable colorful output
"""
import json
import logging
import sys
from datetime import datetime, timezone
from app.core.config import settings


class JSONFormatter(logging.Formatter):
    """Structured JSON log formatter for production log aggregators."""
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        if record.exc_info and record.exc_info[0]:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry)


def setup_logging():
    level = logging.DEBUG if settings.DEBUG else logging.INFO

    # Use JSON in production, human-readable in dev
    if settings.is_production:
        fmt = JSONFormatter()
    else:
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

