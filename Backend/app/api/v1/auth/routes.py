"""Auth routes: signup, login, google, refresh, logout, forgot/reset password,
verify/resend email verification, /me.

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
    ResendVerificationRequest,
    ResetPasswordRequest,
    SignupRequest,
    TokenPair,
    VerifyEmailRequest,
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
    """Matches the Signup screen exactly. Does NOT auto-login - frontend
    routes to Login after. Sends a verification email via SendGrid as part
    of this request (best-effort - never fails signup itself)."""
    service = _service(db, request)
    user = await service.signup(
        full_name=payload.full_name,
        email=payload.email,
        password=payload.password,
        
    )
    return SuccessResponse(
        message="Account created successfully. Please check your email to verify your account, then log in.",
        data=UserOut.model_validate(user),
    )


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
        "is registered. Sent via SendGrid; if SENDGRID_API_KEY isn't configured, "
        "the link is logged instead for local dev."
    ),
)
async def forgot_password(payload: ForgotPasswordRequest, request: Request, db: AsyncSession = Depends(get_db)):
    enforce_rate_limit(f"forgot-password:{get_client_ip(request)}", max_attempts=5, window_seconds=300)
    service = _service(db, request)
    await service.request_password_reset(payload.email)
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


@router.post(
    "/verify-email",
    response_model=SuccessResponse[UserOut],
    summary="Confirm an account's email address using the token from the verification email",
    description="Frontend's /verify-email page reads `?token=` from the URL and POSTs it here.",
    responses={400: {"description": "Verification token invalid, expired, or already used"}},
)
async def verify_email(payload: VerifyEmailRequest, request: Request, db: AsyncSession = Depends(get_db)):
    service = _service(db, request)
    user = await service.verify_email(payload.token)
    return SuccessResponse(message="Email verified successfully.", data=UserOut.model_validate(user))


@router.post(
    "/resend-verification",
    response_model=SuccessResponse[None],
    summary="Resend the account verification email",
    description="Always returns a generic success message, whether or not the email is registered or already verified.",
)
async def resend_verification(payload: ResendVerificationRequest, request: Request, db: AsyncSession = Depends(get_db)):
    enforce_rate_limit(f"resend-verification:{get_client_ip(request)}", max_attempts=5, window_seconds=300)
    service = _service(db, request)
    await service.resend_verification_email(payload.email)
    return SuccessResponse(message="If that email is registered and not yet verified, a new link has been sent.")


@router.get("/me", response_model=SuccessResponse[UserOut], summary="Get the current authenticated user")
async def get_me(current_user=Depends(get_current_user)):
    return SuccessResponse(message="OK", data=UserOut.model_validate(current_user))