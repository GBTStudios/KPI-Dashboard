"""Authentication business logic. Routes call this; this never touches
request/response objects directly - only DTOs in, DTOs out.

All datetime comparisons against DB-stored timestamps are done in UTC and
explicitly normalized to timezone-aware values before comparison, since
SQLite (used in tests) does not preserve tzinfo the way Postgres does.
"""
import logging
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_token,
    validate_password_strength,
    verify_password,
)
from app.exceptions.custom_exceptions import (
    AccountInactiveException,
    AccountLockedException,
    EmailAlreadyExistsException,
    InvalidCredentialsException,
    PasswordResetTokenInvalidException,
    TokenRevokedException,
    UnauthorizedException,
)
from app.models.password_reset_token import PasswordResetToken
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.repositories.audit_log_repository import AuditLogRepository
from app.repositories.password_reset_repository import PasswordResetRepository
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import TokenPair
from app.services.google_oauth import verify_google_id_token

logger = logging.getLogger("groundpulse")


def _aware(dt: datetime | None) -> datetime | None:
    """Normalize a possibly-naive datetime (as SQLite hands back) to UTC-aware."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class AuthService:
    def __init__(self, db: AsyncSession, ip_address: str | None = None, user_agent: str | None = None):
        self.db = db
        self.users = UserRepository(db)
        self.refresh_tokens = RefreshTokenRepository(db)
        self.audit = AuditLogRepository(db)
        self.password_resets = PasswordResetRepository(db)
        self.ip_address = ip_address
        self.user_agent = user_agent

    # ------------------------------------------------------------------
    # SIGNUP
    # ------------------------------------------------------------------
    async def signup(self, full_name: str, email: str, password: str, accepted_terms: bool) -> User:
        email = email.lower().strip()
        logger.info("Signup attempt email=%s", email)

        existing = await self.users.get_by_email(email)
        if existing is not None:
            logger.warning("Signup rejected - duplicate email=%s", email)
            self.audit.add("DUPLICATE_EMAIL", description=f"Signup attempt with existing email {email}",
                            ip_address=self.ip_address, user_agent=self.user_agent)
            raise EmailAlreadyExistsException()

        validate_password_strength(password)

        user = User(
            full_name=full_name.strip(),
            email=email,
            password_hash=hash_password(password),
            accepted_terms=True,
            accepted_terms_at=datetime.now(timezone.utc),
            is_active=True,
            is_verified=False,  # email verification not yet wired to SMTP; see docstring below
        )
        self.users.add(user)
        await self.users.flush()

        self.audit.add("SIGNUP", user_id=user.id, description="Account created",
                        ip_address=self.ip_address, user_agent=self.user_agent)
        logger.info("Signup success user_id=%s email=%s", user.id, email)
        return user

    # ------------------------------------------------------------------
    # LOGIN
    # ------------------------------------------------------------------
    async def login(self, email: str, password: str, remember_me: bool) -> tuple[User, TokenPair]:
        email = email.lower().strip()
        logger.info("Login attempt email=%s", email)

        user = await self.users.get_by_email(email)

        if user is None or user.password_hash is None:
            # Constant work done regardless of whether the user exists, so the
            # response-time difference doesn't leak which emails are registered.
            hash_password(password)
            self.audit.add("LOGIN_FAILED", description=f"Unknown email {email}",
                            ip_address=self.ip_address, user_agent=self.user_agent)
            raise InvalidCredentialsException()

        locked_until = _aware(user.locked_until)
        if locked_until and locked_until > datetime.now(timezone.utc):
            minutes_remaining = max(1, int((locked_until - datetime.now(timezone.utc)).total_seconds() // 60) + 1)
            self.audit.add("LOGIN_FAILED", user_id=user.id, description="Account locked",
                            ip_address=self.ip_address, user_agent=self.user_agent)
            raise AccountLockedException(minutes_remaining)

        if not verify_password(password, user.password_hash):
            await self._register_failed_attempt(user)
            raise InvalidCredentialsException()

        if not user.is_active:
            self.audit.add("LOGIN_FAILED", user_id=user.id, description="Inactive account",
                            ip_address=self.ip_address, user_agent=self.user_agent)
            raise AccountInactiveException()

        # Successful login resets lockout counters.
        user.failed_login_attempts = 0
        user.locked_until = None
        user.last_login = datetime.now(timezone.utc)

        tokens = await self._issue_tokens(user, remember_me)

        self.audit.add("LOGIN_SUCCESS", user_id=user.id, description="Login successful",
                        ip_address=self.ip_address, user_agent=self.user_agent)
        logger.info("Login success user_id=%s", user.id)
        return user, tokens

    async def _register_failed_attempt(self, user: User) -> None:
        user.failed_login_attempts += 1
        logger.warning("Failed login attempt #%d user_id=%s", user.failed_login_attempts, user.id)
        self.audit.add("LOGIN_FAILED", user_id=user.id, description="Incorrect password",
                        ip_address=self.ip_address, user_agent=self.user_agent)
        if user.failed_login_attempts >= settings.MAX_FAILED_LOGIN_ATTEMPTS:
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCOUNT_LOCKOUT_MINUTES)
            self.audit.add("ACCOUNT_LOCKED", user_id=user.id,
                            description=f"Locked for {settings.ACCOUNT_LOCKOUT_MINUTES} minutes",
                            ip_address=self.ip_address, user_agent=self.user_agent)
            logger.warning("Account locked user_id=%s", user.id)

    # ------------------------------------------------------------------
    # GOOGLE SIGN-IN / SIGN-UP  ("Continue with Google" / "Sign up with Google")
    # ------------------------------------------------------------------
    async def google_auth(self, raw_id_token: str, remember_me: bool) -> tuple[User, TokenPair, bool]:
        """Verifies the Google ID token, then either:
          - logs into an existing Google-linked account, or
          - auto-links Google to an existing email/password account with the
            same (Google-verified) email, or
          - creates a brand new account.

        Returns (user, tokens, is_new_account). Auto-linking by verified email
        is a deliberate product choice here (single account per email, matches
        "Sign up with Google" and "Continue with Google" being the *same*
        button/flow on both screens) - if you'd rather require an explicit
        "link this account" confirmation step instead, raise
        GoogleAccountConflictException in the branch below instead of linking.
        """
        profile = verify_google_id_token(raw_id_token)

        user = await self.users.get_by_oauth("google", profile.sub)
        is_new_account = False

        if user is None:
            user = await self.users.get_by_email(profile.email)
            if user is not None:
                # Link Google to the existing account.
                user.oauth_provider = "google"
                user.oauth_id = profile.sub
                user.avatar_url = user.avatar_url or profile.avatar_url
                if profile.email_verified:
                    user.is_verified = True
                self.audit.add("GOOGLE_ACCOUNT_LINKED", user_id=user.id,
                                description="Linked Google account to existing user",
                                ip_address=self.ip_address, user_agent=self.user_agent)
            else:
                user = User(
                    full_name=profile.full_name,
                    email=profile.email.lower(),
                    password_hash=None,
                    oauth_provider="google",
                    oauth_id=profile.sub,
                    avatar_url=profile.avatar_url,
                    is_active=True,
                    is_verified=profile.email_verified,
                    accepted_terms=True,  # Google button lives right below the ToS checkbox on Signup
                    accepted_terms_at=datetime.now(timezone.utc),
                )
                self.users.add(user)
                await self.users.flush()
                is_new_account = True
                self.audit.add("SIGNUP", user_id=user.id, description="Account created via Google",
                                ip_address=self.ip_address, user_agent=self.user_agent)

        if not user.is_active:
            raise AccountInactiveException()

        user.last_login = datetime.now(timezone.utc)
        tokens = await self._issue_tokens(user, remember_me)

        self.audit.add("GOOGLE_LOGIN", user_id=user.id, description="Google sign-in",
                        ip_address=self.ip_address, user_agent=self.user_agent)
        logger.info("Google auth success user_id=%s new_account=%s", user.id, is_new_account)
        return user, tokens, is_new_account

    # ------------------------------------------------------------------
    # TOKEN ISSUANCE / REFRESH / LOGOUT
    # ------------------------------------------------------------------
    async def _issue_tokens(self, user: User, remember_me: bool) -> TokenPair:
        access_token = create_access_token(user.id, user.role)
        raw_refresh, expires_at = create_refresh_token(user.id, remember_me)

        refresh_row = RefreshToken(
            user_id=user.id,
            token_hash=hash_token(raw_refresh),
            remember_me=remember_me,
            expires_at=expires_at,
        )
        self.refresh_tokens.add(refresh_row)
        await self.db.flush()

        logger.info("JWT created user_id=%s remember_me=%s", user.id, remember_me)
        return TokenPair(
            access_token=access_token,
            refresh_token=raw_refresh,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def refresh(self, raw_refresh_token: str) -> TokenPair:
        payload = decode_token(raw_refresh_token, expected_type="refresh")
        token_hash = hash_token(raw_refresh_token)

        stored = await self.refresh_tokens.get_by_hash(token_hash)
        if stored is None:
            raise TokenRevokedException()

        if stored.revoked or _aware(stored.expires_at) <= datetime.now(timezone.utc):
            # Reuse of an already-rotated/revoked token: treat as a possible
            # replay attack and revoke the whole chain for this user.
            await self.refresh_tokens.revoke_all_for_user(stored.user_id)
            logger.warning("Refresh token reuse detected user_id=%s - revoking all sessions", stored.user_id)
            raise TokenRevokedException()

        user = await self.users.get_by_id(uuid.UUID(payload["sub"]))
        if user is None or not user.is_active:
            raise UnauthorizedException("Account no longer active.")

        new_access = create_access_token(user.id, user.role)
        new_raw_refresh, new_expires_at = create_refresh_token(user.id, stored.remember_me)

        new_row = RefreshToken(
            user_id=user.id,
            token_hash=hash_token(new_raw_refresh),
            remember_me=stored.remember_me,
            expires_at=new_expires_at,
        )
        self.refresh_tokens.add(new_row)
        await self.db.flush()

        await self.refresh_tokens.revoke(stored, replaced_by_id=new_row.id)

        logger.info("JWT refreshed user_id=%s", user.id)
        return TokenPair(
            access_token=new_access,
            refresh_token=new_raw_refresh,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def logout(self, raw_refresh_token: str, user_id: uuid.UUID | None = None) -> None:
        token_hash = hash_token(raw_refresh_token)
        stored = await self.refresh_tokens.get_by_hash(token_hash)
        if stored is not None and not stored.revoked:
            await self.refresh_tokens.revoke(stored)
        self.audit.add("LOGOUT", user_id=user_id or (stored.user_id if stored else None),
                        description="User logged out", ip_address=self.ip_address, user_agent=self.user_agent)
        logger.info("Logout user_id=%s", user_id or (stored.user_id if stored else "unknown"))

    # ------------------------------------------------------------------
    # FORGOT PASSWORD / RESET PASSWORD
    # ------------------------------------------------------------------
    async def request_password_reset(self, email: str) -> str | None:
        """Returns the raw reset token so the caller (route) can email it -
        or None if the email isn't registered. The route/response never
        reveals which case happened (always returns a generic "if this email
        exists..." message) to avoid leaking which emails are registered.
        """
        email = email.lower().strip()
        user = await self.users.get_by_email(email)
        if user is None or user.password_hash is None:
            # Also applies to Google-only accounts, which have no local
            # password to reset.
            logger.info("Password reset requested for non-resettable/unknown email=%s", email)
            return None

        import secrets
        raw_token = secrets.token_urlsafe(32)
        reset_row = PasswordResetToken(
            user_id=user.id,
            token_hash=hash_token(raw_token),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES),
        )
        self.password_resets.add(reset_row)
        await self.db.flush()

        self.audit.add("PASSWORD_RESET_REQUESTED", user_id=user.id, description="Reset token issued",
                        ip_address=self.ip_address, user_agent=self.user_agent)
        logger.info("Password reset token issued user_id=%s", user.id)
        return raw_token

    async def reset_password(self, raw_token: str, new_password: str) -> None:
        validate_password_strength(new_password)

        token_hash = hash_token(raw_token)
        stored = await self.password_resets.get_by_hash(token_hash)
        if stored is None or stored.used or _aware(stored.expires_at) <= datetime.now(timezone.utc):
            raise PasswordResetTokenInvalidException()

        user = await self.users.get_by_id(stored.user_id)
        if user is None:
            raise PasswordResetTokenInvalidException()

        user.password_hash = hash_password(new_password)
        user.failed_login_attempts = 0
        user.locked_until = None
        stored.used = True
        stored.used_at = datetime.now(timezone.utc)

        # Reset password -> invalidate all existing sessions for safety.
        await self.refresh_tokens.revoke_all_for_user(user.id)

        self.audit.add("PASSWORD_RESET_COMPLETED", user_id=user.id, description="Password reset",
                        ip_address=self.ip_address, user_agent=self.user_agent)
        logger.info("Password reset completed user_id=%s", user.id)
