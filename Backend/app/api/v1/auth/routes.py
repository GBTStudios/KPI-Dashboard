"""Auth routes: signup, login, google, refresh, logout, forgot/reset password, /me.

Routes only validate the request, call the service, and shape the response -
all business logic lives in AuthService.
"""
import logging

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rate_limit import enforce_rate_limit
from app.dependencies.auth import get_client_ip, get_current_user, get_user_agent
from app.dependencies.db import get_db
from app.schemas.auth import (
    AuthResponseData,
    ForgotPasswordRequest,
    GoogleAuthRequest,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    ResetPasswordRequest,
    SignupRequest,
    TokenPair,
)
from app.schemas.common import SuccessResponse
from app.schemas.user import UserOut
from app.services.auth_service import AuthService

logger = logging.getLogger("groundpulse")
router = APIRouter(prefix="/auth", tags=["Authentication"])


def _service(db: AsyncSession, request: Request) -> AuthService:
    return AuthService(db, ip_address=get_client_ip(request), user_agent=get_user_agent(request))


@router.post(
    "/signup",
    response_model=SuccessResponse[UserOut],
    status_code=status.HTTP_201_CREATED,
    summary="Create a new account (Full Name / Email / Password / Confirm Password / Terms)",
    responses={
        409: {"description": "Email already exists"},
        422: {"description": "Passwords do not match, weak password, or terms not accepted"},
    },
)
async def signup(payload: SignupRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Matches the Signup screen exactly: full name, email, password, confirm
    password, and the required 'I agree to the Terms of Service and Privacy
    Policy' checkbox. Does NOT auto-login - frontend routes to Login after,
    per the 'Already have an account? Log in' link in the mockup."""
    service = _service(db, request)
    user = await service.signup(
        full_name=payload.full_name,
        email=payload.email,
        password=payload.password,
        accepted_terms=payload.accepted_terms,
    )
    return SuccessResponse(message="Account created successfully. Please log in.", data=UserOut.model_validate(user))


@router.post(
    "/login",
    response_model=SuccessResponse[AuthResponseData],
    summary="Log in with email/password. Supports 'Remember me'.",
    responses={401: {"description": "Invalid credentials"}, 423: {"description": "Account locked"}},
)
async def login(payload: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    enforce_rate_limit(f"login:{get_client_ip(request)}", max_attempts=10, window_seconds=60)
    service = _service(db, request)
    user, tokens = await service.login(payload.email, payload.password, payload.remember_me)
    return SuccessResponse(
        message="Login successful.",
        data=AuthResponseData(user=UserOut.model_validate(user), tokens=tokens),
    )


@router.post(
    "/google",
    response_model=SuccessResponse[AuthResponseData],
    summary="Continue with Google / Sign up with Google",
    description=(
        "Accepts the Google ID token obtained on the frontend via Google Identity "
        "Services. Verifies it server-side, then logs in an existing account, links "
        "Google to a matching email/password account, or creates a new account - "
        "used by BOTH the 'Sign up with Google' button on Signup and the "
        "'Continue with Google' button on Login."
    ),
    responses={401: {"description": "Invalid Google token"}},
)
async def google_auth(payload: GoogleAuthRequest, request: Request, db: AsyncSession = Depends(get_db)):
    enforce_rate_limit(f"google:{get_client_ip(request)}", max_attempts=20, window_seconds=60)
    service = _service(db, request)
    user, tokens, is_new = await service.google_auth(payload.id_token, payload.remember_me)
    return SuccessResponse(
        message="Account created via Google." if is_new else "Login successful.",
        data=AuthResponseData(user=UserOut.model_validate(user), tokens=tokens),
    )


@router.post("/refresh", response_model=SuccessResponse[TokenPair], summary="Rotate an access/refresh token pair")
async def refresh(payload: RefreshRequest, request: Request, db: AsyncSession = Depends(get_db)):
    service = _service(db, request)
    tokens = await service.refresh(payload.refresh_token)
    return SuccessResponse(message="Token refreshed.", data=tokens)


@router.post("/logout", response_model=SuccessResponse[None], summary="Revoke a refresh token")
async def logout(payload: LogoutRequest, request: Request, db: AsyncSession = Depends(get_db)):
    service = _service(db, request)
    await service.logout(payload.refresh_token)
    return SuccessResponse(message="Logged out.")


@router.post(
    "/forgot-password",
    response_model=SuccessResponse[None],
    summary="Request a password reset link",
    description=(
        "Always returns a generic success message regardless of whether the email "
        "is registered, to avoid leaking account existence. SMTP is not wired up "
        "yet (per project scope), so in development the reset link is written to "
        "the application log instead of being emailed - swap `_deliver_reset_link` "
        "for a real mailer when ready."
    ),
)
async def forgot_password(payload: ForgotPasswordRequest, request: Request, db: AsyncSession = Depends(get_db)):
    enforce_rate_limit(f"forgot-password:{get_client_ip(request)}", max_attempts=5, window_seconds=300)
    service = _service(db, request)
    raw_token = await service.request_password_reset(payload.email)
    if raw_token:
        _deliver_reset_link(payload.email, raw_token)
    return SuccessResponse(message="If that email is registered, a password reset link has been sent.")


@router.post(
    "/reset-password",
    response_model=SuccessResponse[None],
    summary="Complete a password reset using the token from the email",
    responses={400: {"description": "Reset token invalid or expired"}, 422: {"description": "Weak password / mismatch"}},
)
async def reset_password(payload: ResetPasswordRequest, request: Request, db: AsyncSession = Depends(get_db)):
    service = _service(db, request)
    await service.reset_password(payload.token, payload.new_password)
    return SuccessResponse(message="Password has been reset. Please log in with your new password.")


@router.get("/me", response_model=SuccessResponse[UserOut], summary="Get the current authenticated user")
async def get_me(current_user=Depends(get_current_user)):
    return SuccessResponse(message="OK", data=UserOut.model_validate(current_user))


def _deliver_reset_link(email: str, raw_token: str) -> None:
    """SMTP isn't implemented yet (out of scope per original spec) - this is
    the single seam to swap in a real mailer later without touching
    AuthService. For now it logs the link so the flow is testable end-to-end."""
    from app.core.config import settings
    link = f"{settings.FRONTEND_RESET_PASSWORD_URL}?token={raw_token}"
    logger.info("Password reset link for %s: %s", email, link)
