"""Auth request/response schemas.

Password *strength* is intentionally NOT enforced here via Pydantic
constraints (e.g. min_length) - it's enforced in the service layer so every
rejection surfaces the same WEAK_PASSWORD error code instead of a generic
Pydantic validation error. See app/core/security.py:validate_password_strength.
"""
import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.user import UserOut


class SignupRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    password: str
    confirm_password: str


    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("PASSWORDS_DO_NOT_MATCH")
        return v



class VerifyEmailRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False


class GoogleAuthRequest(BaseModel):
    """Frontend obtains this authorization `code` via Google Identity
    Services' OAuth2 popup code flow (google.accounts.oauth2.initCodeClient,
    ux_mode: 'popup', prompt: 'select_account') and POSTs it here.

    CHANGED from the old id_token/One Tap flow: One Tap has no way to force
    Google's account chooser (it silently reuses whatever Google account is
    already active in the browser). The OAuth2 code flow supports
    prompt: 'select_account', which does force it - the tradeoff is the
    frontend now gets a `code` instead of an `id_token`, so the backend
    exchanges that code for the id_token itself server-side (needs
    GOOGLE_CLIENT_SECRET - see google_oauth.py:exchange_auth_code_for_id_token)
    before doing the same signature verification as before.
    """
    code: str
    remember_me: bool = False


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyResetCodeRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)


class VerifyResetCodeResponseData(BaseModel):
    reset_token: str


class ResetPasswordRequest(BaseModel):
    reset_token: str
    new_password: str
    confirm_password: str

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "new_password" in info.data and v != info.data["new_password"]:
            raise ValueError("PASSWORDS_DO_NOT_MATCH")
        return v

class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # access token lifetime, seconds


class AuthResponseData(BaseModel):
    user: UserOut
    tokens: TokenPair