"""Verifies a Google Identity Services ID token server-side.

We never trust profile data (email, name, sub) that the frontend claims came
from Google - we re-verify the signed ID token against Google's public keys
ourselves via the google-auth library, which checks signature, issuer,
audience (our GOOGLE_CLIENT_ID), and expiry.
"""
from dataclasses import dataclass

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from app.core.config import settings
from app.exceptions.custom_exceptions import GoogleTokenInvalidException

_google_request = google_requests.Request()


@dataclass
class GoogleProfile:
    sub: str
    email: str
    email_verified: bool
    full_name: str
    avatar_url: str | None


def verify_google_id_token(raw_id_token: str) -> GoogleProfile:
    if not settings.GOOGLE_CLIENT_ID:
        raise GoogleTokenInvalidException("Google Sign-In is not configured on the server.")
    try:
        claims = google_id_token.verify_oauth2_token(
            raw_id_token, _google_request, settings.GOOGLE_CLIENT_ID
        )
    except ValueError as exc:
        raise GoogleTokenInvalidException(str(exc))

    if claims.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
        raise GoogleTokenInvalidException("Unexpected token issuer.")

    email = claims.get("email")
    if not email:
        raise GoogleTokenInvalidException("Google account has no email on file.")

    return GoogleProfile(
        sub=claims["sub"],
        email=email,
        email_verified=bool(claims.get("email_verified", False)),
        full_name=claims.get("name") or email.split("@")[0],
        avatar_url=claims.get("picture"),
    )
