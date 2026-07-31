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
    """Frontend obtains this id_token via Google Identity Services
    (google.accounts.id.initialize / One Tap / the 'Sign up with Google' button)
    and POSTs it here. The backend verifies it server-side against Google's
    public keys - the frontend never talks to our backend with anything but
    this signed token, and we never trust a Google profile handed to us
    without verifying the signature ourselves.
    """
    id_token: str
    remember_me: bool = False


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
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
