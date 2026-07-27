"""Simple in-memory fixed-window rate limiter for auth endpoints.

NOTE: this is per-process. It's fine for a single Uvicorn worker / dev-prod,
but if you scale to multiple workers or instances, swap the _hits store for
Redis (INCR + EXPIRE) - the interface below is written so that's a drop-in
change (only _hits access needs to move).
"""
import time
from collections import defaultdict

from app.exceptions.custom_exceptions import RateLimitExceededException

_hits: dict[str, list[float]] = defaultdict(list)


def enforce_rate_limit(key: str, max_attempts: int, window_seconds: int) -> None:
    now = time.time()
    window_start = now - window_seconds
    attempts = [t for t in _hits[key] if t > window_start]
    if len(attempts) >= max_attempts:
        retry_after = int(window_seconds - (now - attempts[0]))
        raise RateLimitExceededException(retry_after_seconds=max(retry_after, 1))
    attempts.append(now)
    _hits[key] = attempts
