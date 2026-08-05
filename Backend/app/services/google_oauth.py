"""Verifies a Google Identity Services ID token server-side, and exchanges
an OAuth2 authorization code for that id_token when using the popup code
flow (needed to force Google's account chooser - see GoogleAuthRequest
docstring in schemas/auth.py).

We never trust profile data (email, name, sub) that the frontend claims came
from Google - we re-verify the signed ID token against Google's public keys
ourselves via the google-auth library, which checks signature, issuer,
audience (our GOOGLE_CLIENT_ID), and expiry.
"""
from dataclasses import dataclass

import httpx
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


async def exchange_auth_code_for_id_token(auth_code: str) -> str:
    """Exchanges the authorization code from Google's OAuth2 popup code flow
    (google.accounts.oauth2.initCodeClient, ux_mode: 'popup',
    prompt: 'select_account') for tokens, and returns the id_token.

    redirect_uri MUST be the literal string 'postmessage' - that's Google's
    documented special value for the JS popup code flow, not a real URL.
    Requires GOOGLE_CLIENT_SECRET (add to Settings/.env - get it from the
    same Google Cloud Console credential GOOGLE_CLIENT_ID already comes
    from). Unlike the client ID, the secret must never reach the frontend.
    """
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise GoogleTokenInvalidException("Google Sign-In is not fully configured on the server.")

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": auth_code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": "postmessage",
                    "grant_type": "authorization_code",
                },
            )
        except httpx.HTTPError as exc:
            raise GoogleTokenInvalidException(f"Could not reach Google's token endpoint: {exc}")

    if response.status_code != 200:
        raise GoogleTokenInvalidException("Could not exchange Google authorization code.")

    raw_id_token = response.json().get("id_token")
    if not raw_id_token:
        raise GoogleTokenInvalidException("Google did not return an id_token for this code.")

    return raw_id_token


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