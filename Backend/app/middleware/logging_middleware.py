"""Request ID injection, request/response logging, execution timing, and
security headers - all as lightweight ASGI middleware."""
import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.middleware.request_context import new_request_id, set_request_id, set_user_id

logger = logging.getLogger("groundpulse")


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Assigns a request id (or reuses an inbound X-Request-ID), and logs
    method/path/status/duration/ip/user-agent for every request."""

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or new_request_id()
        set_request_id(request_id)
        set_user_id(None)

        start = time.perf_counter()
        client_ip = request.client.host if request.client else "-"
        user_agent = request.headers.get("user-agent", "-")

        try:
            response = await call_next(request)
        except Exception:
            duration_ms = (time.perf_counter() - start) * 1000
            logger.critical(
                "%s %s -> UNHANDLED_EXCEPTION (%.2fms) ip=%s ua=%s",
                request.method, request.url.path, duration_ms, client_ip, user_agent,
            )
            raise

        duration_ms = (time.perf_counter() - start) * 1000
        response.headers["X-Request-ID"] = request_id
        log_fn = logger.info if response.status_code < 400 else logger.warning
        log_fn(
            "%s %s -> %s (%.2fms) ip=%s ua=%s",
            request.method, request.url.path, response.status_code, duration_ms, client_ip, user_agent,
        )
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
        return response
