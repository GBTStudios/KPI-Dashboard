"""Auth routes: signup, login, google, refresh, logout, forgot/reset password,
verify/resend email verification, /me.

Routes only validate the request, call the service, and shape the response -
all business logic lives in AuthService.
"""
import logging

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.rate_limit import enforce_rate_limit
from app.dependencies.auth import get_client_ip, get_current_user, get_user_agent
from app.dependencies.db import get_db
from app.exceptions.custom_exceptions import AppException
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
    summary="Create a new account (Full Name / Email / Password / Confirm Password)",
    responses={
        409: {"description": "Email already exists"},
        422: {"description": "Passwords do not match or weak password"},
    },
)
async def signup(payload: SignupRequest, request: Request, db: AsyncSession = Depends(get_db)):
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


# ----------------------------------------------------------------------
# EMAIL VERIFICATION - Option B: the emailed link points HERE directly
# (a GET on the backend), which verifies the token itself and redirects
# the browser straight to the frontend's login page. No frontend page
# needed for this flow at all.
# ----------------------------------------------------------------------
@router.get(
    "/verify-email",
    include_in_schema=False,
    summary="Verify email via link (backend-handled, redirects to frontend login)",
)
async def verify_email_via_link(token: str, request: Request, db: AsyncSession = Depends(get_db)):
    service = _service(db, request)
    try:
        await service.verify_email(token)
        return RedirectResponse(f"{settings.FRONTEND_LOGIN_URL}?verified=true")
    except AppException as exc:
        logger.warning("Email verification link failed: %s (%s)", exc.message, exc.error_code)
        return RedirectResponse(f"{settings.FRONTEND_LOGIN_URL}?verified=false&reason={exc.error_code}")


@router.post(
    "/verify-email",
    response_model=SuccessResponse[UserOut],
    summary="Confirm an account's email address using a token (JSON API - for testing/tooling)",
    description=(
        "The real email link uses the GET version above and redirects "
        "automatically. This POST version exists for Swagger/API testing "
        "without needing to click a real email link."
    ),
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