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
    VerifyResetCodeRequest,
    VerifyResetCodeResponseData,
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
    summary="Request a 6-digit password reset code by email",
)
async def forgot_password(payload: ForgotPasswordRequest, request: Request, db: AsyncSession = Depends(get_db)):
    enforce_rate_limit(f"forgot-password:{get_client_ip(request)}", max_attempts=5, window_seconds=300)
    service = _service(db, request)
    await service.request_password_reset(payload.email)
    return SuccessResponse(message="If that email is registered, a reset code has been sent.")


@router.post(
    "/verify-reset-code",
    response_model=SuccessResponse[VerifyResetCodeResponseData],
    summary="Verify the 6-digit reset code, returns a reset_token for the next step",
    responses={400: {"description": "Code invalid or expired"}, 429: {"description": "Too many attempts"}},
)
async def verify_reset_code(payload: VerifyResetCodeRequest, request: Request, db: AsyncSession = Depends(get_db)):
    enforce_rate_limit(f"verify-reset-code:{get_client_ip(request)}", max_attempts=10, window_seconds=300)
    service = _service(db, request)
    reset_token = await service.verify_reset_code(payload.email, payload.code)
    return SuccessResponse(message="Code verified.", data=VerifyResetCodeResponseData(reset_token=reset_token))


@router.post(
    "/reset-password",
    response_model=SuccessResponse[None],
    summary="Set a new password using the reset_token from verify-reset-code",
    responses={400: {"description": "Reset token invalid or expired"}, 422: {"description": "Weak password / mismatch"}},
)
async def reset_password(payload: ResetPasswordRequest, request: Request, db: AsyncSession = Depends(get_db)):
    service = _service(db, request)
    await service.reset_password(payload.reset_token, payload.new_password)
    return SuccessResponse(message="Password has been reset. Please log in with your new password.")