"""Global exception handlers - every error returns the same JSON shape:
{ "success": false, "message": "...", "error_code": "..." }
Never leaks stack traces to the client; unexpected errors are logged with
full detail server-side and returned to the client as a generic message.
"""
import logging

from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from jose import JWTError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.exceptions.custom_exceptions import AppException

logger = logging.getLogger("groundpulse")


def _error(message: str, error_code: str, status_code: int, details=None) -> JSONResponse:
    body = {"success": False, "message": message, "error_code": error_code}
    if details is not None:
        body["details"] = details
    return JSONResponse(status_code=status_code, content=body)


def register_exception_handlers(app):

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        logger.warning("AppException: %s (%s) path=%s", exc.message, exc.error_code, request.url.path)
        return _error(exc.message, exc.error_code, exc.status_code)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        logger.info("Validation error path=%s errors=%s", request.url.path, exc.errors())
        # Surface our own field-level error codes (e.g. PASSWORDS_DO_NOT_MATCH,
        # TERMS_NOT_ACCEPTED) when a field_validator raised one, instead of a
        # generic message.
        for err in exc.errors():
            msg = str(err.get("ctx", {}).get("error", "")) or err.get("msg", "")
            for code in ("PASSWORDS_DO_NOT_MATCH", "TERMS_NOT_ACCEPTED"):
                if code in msg:
                    return _error(
                        "Passwords do not match." if code == "PASSWORDS_DO_NOT_MATCH" else "You must accept the Terms of Service and Privacy Policy.",
                        code,
                        status.HTTP_422_UNPROCESSABLE_ENTITY,
                    )
        return _error("Validation failed.", "VALIDATION_FAILED", status.HTTP_422_UNPROCESSABLE_ENTITY, details=exc.errors())

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        return _error(str(exc.detail), "HTTP_ERROR", exc.status_code)

    @app.exception_handler(IntegrityError)
    async def integrity_error_handler(request: Request, exc: IntegrityError):
        logger.error("IntegrityError path=%s: %s", request.url.path, exc, exc_info=True)
        return _error("A record with this data already exists.", "INTEGRITY_ERROR", status.HTTP_409_CONFLICT)

    @app.exception_handler(SQLAlchemyError)
    async def sqlalchemy_error_handler(request: Request, exc: SQLAlchemyError):
        logger.error("Database error path=%s: %s", request.url.path, exc, exc_info=True)
        return _error("A database error occurred. Please try again.", "DATABASE_ERROR", status.HTTP_500_INTERNAL_SERVER_ERROR)

    @app.exception_handler(JWTError)
    async def jwt_error_handler(request: Request, exc: JWTError):
        logger.warning("JWTError path=%s: %s", request.url.path, exc)
        return _error("Invalid or expired token.", "TOKEN_INVALID", status.HTTP_401_UNAUTHORIZED)

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.critical("Unhandled exception path=%s: %s", request.url.path, exc, exc_info=True)
        return _error("Internal server error.", "INTERNAL_SERVER_ERROR", status.HTTP_500_INTERNAL_SERVER_ERROR)
