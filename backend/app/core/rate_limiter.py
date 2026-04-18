"""
LeadPulse — In-Memory Rate Limiter (Sliding Window)

No external dependencies — uses a dict of timestamps.
Thread-safe via asyncio (single-threaded event loop).

Usage:
    from app.core.rate_limiter import rate_limit
    await rate_limit(key="login:{ip}", limit=10, window=60)
"""
import time
from collections import defaultdict
from fastapi import HTTPException, status

# key → list of timestamps
_hits: dict[str, list[float]] = defaultdict(list)


async def rate_limit(key: str, limit: int = 10, window: int = 60) -> None:
    """
    Raise 429 if `key` has exceeded `limit` requests in the last `window` seconds.
    """
    now = time.time()
    cutoff = now - window

    # Prune old entries
    _hits[key] = [t for t in _hits[key] if t > cutoff]

    if len(_hits[key]) >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many requests. Try again in {window} seconds.",
        )

    _hits[key].append(now)


def cleanup_old_entries(max_age: int = 300) -> None:
    """Periodic cleanup — call from a background task if needed."""
    now = time.time()
    cutoff = now - max_age
    stale_keys = [k for k, v in _hits.items() if not v or v[-1] < cutoff]
    for k in stale_keys:
        del _hits[k]
