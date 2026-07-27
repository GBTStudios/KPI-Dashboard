"""Password hashing, password policy, and JWT creation/verification."""
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.exceptions.custom_exceptions import TokenExpiredException, TokenInvalidException, WeakPasswordException

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

_PASSWORD_MIN_LENGTH = 8
_UPPER_RE = re.compile(r"[A-Z]")
_LOWER_RE = re.compile(r"[a-z]")
_DIGIT_RE = re.compile(r"\d")
_SPECIAL_RE = re.compile(r"[^A-Za-z0-9]")


def validate_password_strength(password: str) -> None:
    """Enforced in the service layer (not via Pydantic min_length) so every
    rejection gets a consistent WEAK_PASSWORD error code."""
    if len(password) < _PASSWORD_MIN_LENGTH:
        raise WeakPasswordException(f"Password must be at least {_PASSWORD_MIN_LENGTH} characters long.")
    if not _UPPER_RE.search(password):
        raise WeakPasswordException("Password must contain at least one uppercase letter.")
    if not _LOWER_RE.search(password):
        raise WeakPasswordException("Password must contain at least one lowercase letter.")
    if not _DIGIT_RE.search(password):
        raise WeakPasswordException("Password must contain at least one number.")
    if not _SPECIAL_RE.search(password):
        raise WeakPasswordException("Password must contain at least one special character.")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Passlib's bcrypt.verify is constant-time, mitigating timing attacks."""
    return pwd_context.verify(plain_password, password_hash)


# --------------------------------------------------------------------------
# JWT (access + refresh signing). Refresh tokens are *also* stored server
# side (hashed) in the refresh_tokens table so we can support rotation and
# revocation - the JWT alone isn't enough for that.
# --------------------------------------------------------------------------

def _create_token(subject: str, expires_delta: timedelta, token_type: Literal["access", "refresh"], extra_claims: dict[str, Any] | None = None) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
        "jti": str(uuid.uuid4()),
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(user_id: uuid.UUID, role: str) -> str:
    return _create_token(
        subject=str(user_id),
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        token_type="access",
        extra_claims={"role": role},
    )


def create_refresh_token(user_id: uuid.UUID, remember_me: bool = False) -> tuple[str, datetime]:
    days = settings.REFRESH_TOKEN_REMEMBER_ME_EXPIRE_DAYS if remember_me else settings.REFRESH_TOKEN_EXPIRE_DAYS
    expires_delta = timedelta(days=days)
    token = _create_token(subject=str(user_id), expires_delta=expires_delta, token_type="refresh")
    expires_at = datetime.now(timezone.utc) + expires_delta
    return token, expires_at


def decode_token(token: str, expected_type: Literal["access", "refresh"]) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise TokenExpiredException()
    except JWTError:
        raise TokenInvalidException()

    if payload.get("type") != expected_type:
        raise TokenInvalidException(f"Expected a {expected_type} token.")
    return payload


def hash_token(raw_token: str) -> str:
    """Refresh tokens and password-reset tokens are stored server-side only
    as a SHA-256 hash (not bcrypt - these are already high-entropy random
    JWTs/secrets, not human passwords, so a fast deterministic hash used for
    equality lookup is the right tool here), so a DB leak alone doesn't hand
    out usable credentials."""
    import hashlib
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
