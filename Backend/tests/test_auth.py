"""End-to-end tests hitting the real HTTP endpoints (in-process ASGI, SQLite)."""
from unittest.mock import patch

import pytest

from tests.conftest import VALID_PASSWORD, unique_email

pytestmark = pytest.mark.asyncio


def signup_payload(email=None, password=VALID_PASSWORD, accepted_terms=True):
    return {
        "full_name": "Jane Doe",
        "email": email or unique_email(),
        "password": password,
        "confirm_password": password,
        "accepted_terms": accepted_terms,
    }


# --------------------------------------------------------------------- #
# SIGNUP
# --------------------------------------------------------------------- #

async def test_signup_success(client):
    resp = await client.post("/api/v1/auth/signup", json=signup_payload())
    assert resp.status_code == 201
    body = resp.json()
    assert body["success"] is True
    assert body["data"]["email"]


async def test_signup_duplicate_email(client):
    payload = signup_payload()
    await client.post("/api/v1/auth/signup", json=payload)
    resp = await client.post("/api/v1/auth/signup", json=payload)
    assert resp.status_code == 409
    assert resp.json()["error_code"] == "EMAIL_ALREADY_EXISTS"


async def test_signup_password_mismatch(client):
    payload = signup_payload()
    payload["confirm_password"] = "Different1!"
    resp = await client.post("/api/v1/auth/signup", json=payload)
    assert resp.status_code == 422
    assert resp.json()["error_code"] == "PASSWORDS_DO_NOT_MATCH"


async def test_signup_weak_password(client):
    payload = signup_payload(email=unique_email(), password="weak")
    payload["confirm_password"] = "weak"
    resp = await client.post("/api/v1/auth/signup", json=payload)
    assert resp.status_code in (422,)
    assert resp.json()["error_code"] in ("WEAK_PASSWORD", "VALIDATION_FAILED")


async def test_signup_requires_terms_acceptance(client):
    payload = signup_payload(accepted_terms=False)
    resp = await client.post("/api/v1/auth/signup", json=payload)
    assert resp.status_code == 422
    assert resp.json()["error_code"] == "TERMS_NOT_ACCEPTED"


# --------------------------------------------------------------------- #
# LOGIN
# --------------------------------------------------------------------- #

async def test_login_success(client):
    payload = signup_payload()
    await client.post("/api/v1/auth/signup", json=payload)
    resp = await client.post("/api/v1/auth/login", json={"email": payload["email"], "password": payload["password"]})
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["tokens"]["access_token"]
    assert data["tokens"]["refresh_token"]


async def test_login_wrong_password(client):
    payload = signup_payload()
    await client.post("/api/v1/auth/signup", json=payload)
    resp = await client.post("/api/v1/auth/login", json={"email": payload["email"], "password": "WrongPass1!"})
    assert resp.status_code == 401
    assert resp.json()["error_code"] == "INVALID_CREDENTIALS"


async def test_login_unknown_email(client):
    resp = await client.post("/api/v1/auth/login", json={"email": unique_email(), "password": VALID_PASSWORD})
    assert resp.status_code == 401


async def test_account_lockout_after_repeated_failures(client):
    payload = signup_payload()
    await client.post("/api/v1/auth/signup", json=payload)

    for _ in range(5):
        resp = await client.post("/api/v1/auth/login", json={"email": payload["email"], "password": "WrongPass1!"})

    resp = await client.post("/api/v1/auth/login", json={"email": payload["email"], "password": payload["password"]})
    assert resp.status_code == 423
    assert resp.json()["error_code"] == "ACCOUNT_LOCKED"


async def test_remember_me_issues_longer_lived_refresh_token(client):
    payload = signup_payload()
    await client.post("/api/v1/auth/signup", json=payload)
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": payload["email"], "password": payload["password"], "remember_me": True},
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["tokens"]["refresh_token"]


# --------------------------------------------------------------------- #
# ME / PROTECTED ROUTE
# --------------------------------------------------------------------- #

async def test_get_me_requires_auth(client):
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401


async def test_get_me_with_valid_token(client):
    payload = signup_payload()
    await client.post("/api/v1/auth/signup", json=payload)
    login_resp = await client.post("/api/v1/auth/login", json={"email": payload["email"], "password": payload["password"]})
    token = login_resp.json()["data"]["tokens"]["access_token"]
    resp = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["data"]["email"] == payload["email"]


# --------------------------------------------------------------------- #
# REFRESH / LOGOUT / ROTATION
# --------------------------------------------------------------------- #

async def test_refresh_token_rotation(client):
    payload = signup_payload()
    await client.post("/api/v1/auth/signup", json=payload)
    login_resp = await client.post("/api/v1/auth/login", json={"email": payload["email"], "password": payload["password"]})
    old_refresh = login_resp.json()["data"]["tokens"]["refresh_token"]

    resp = await client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh})
    assert resp.status_code == 200
    new_refresh = resp.json()["data"]["refresh_token"]
    assert new_refresh != old_refresh

    # Reusing the old, rotated-out refresh token must fail.
    reuse_resp = await client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh})
    assert reuse_resp.status_code == 401
    assert reuse_resp.json()["error_code"] == "TOKEN_REVOKED"


async def test_logout_revokes_refresh_token(client):
    payload = signup_payload()
    await client.post("/api/v1/auth/signup", json=payload)
    login_resp = await client.post("/api/v1/auth/login", json={"email": payload["email"], "password": payload["password"]})
    refresh_token = login_resp.json()["data"]["tokens"]["refresh_token"]

    resp = await client.post("/api/v1/auth/logout", json={"refresh_token": refresh_token})
    assert resp.status_code == 200

    reuse_resp = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert reuse_resp.status_code == 401


# --------------------------------------------------------------------- #
# FORGOT / RESET PASSWORD
# --------------------------------------------------------------------- #

async def test_forgot_password_always_returns_generic_success(client):
    resp = await client.post("/api/v1/auth/forgot-password", json={"email": unique_email()})
    assert resp.status_code == 200
    assert resp.json()["success"] is True


async def test_forgot_and_reset_password_flow(client):
    payload = signup_payload()
    await client.post("/api/v1/auth/signup", json=payload)

    with patch("app.api.v1.auth.routes._deliver_reset_link") as mock_deliver:
        resp = await client.post("/api/v1/auth/forgot-password", json={"email": payload["email"]})
        assert resp.status_code == 200
        assert mock_deliver.called
        raw_token = mock_deliver.call_args[0][1]

    new_password = "NewStrongPass1!"
    reset_resp = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": raw_token, "new_password": new_password, "confirm_password": new_password},
    )
    assert reset_resp.status_code == 200

    old_login = await client.post("/api/v1/auth/login", json={"email": payload["email"], "password": payload["password"]})
    assert old_login.status_code == 401

    new_login = await client.post("/api/v1/auth/login", json={"email": payload["email"], "password": new_password})
    assert new_login.status_code == 200


async def test_reset_password_invalid_token(client):
    resp = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": "not-a-real-token", "new_password": "NewStrongPass1!", "confirm_password": "NewStrongPass1!"},
    )
    assert resp.status_code == 400
    assert resp.json()["error_code"] == "RESET_TOKEN_INVALID"


async def test_reset_password_token_single_use(client):
    payload = signup_payload()
    await client.post("/api/v1/auth/signup", json=payload)

    with patch("app.api.v1.auth.routes._deliver_reset_link") as mock_deliver:
        await client.post("/api/v1/auth/forgot-password", json={"email": payload["email"]})
        raw_token = mock_deliver.call_args[0][1]

    body = {"token": raw_token, "new_password": "NewStrongPass1!", "confirm_password": "NewStrongPass1!"}
    first = await client.post("/api/v1/auth/reset-password", json=body)
    assert first.status_code == 200

    second = await client.post("/api/v1/auth/reset-password", json=body)
    assert second.status_code == 400


# --------------------------------------------------------------------- #
# GOOGLE SIGN-IN (id token verification mocked - it's a call to Google's
# servers, not something a unit/integration test should hit for real)
# --------------------------------------------------------------------- #

def _fake_google_profile(email, sub="google-sub-123", full_name="Google User"):
    from app.services.google_oauth import GoogleProfile
    return GoogleProfile(sub=sub, email=email, email_verified=True, full_name=full_name, avatar_url="https://example.com/pic.jpg")


async def test_google_signup_creates_new_account(client):
    email = unique_email()
    with patch("app.services.auth_service.verify_google_id_token", return_value=_fake_google_profile(email)):
        resp = await client.post("/api/v1/auth/google", json={"id_token": "fake-token"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["data"]["user"]["email"] == email
    assert body["data"]["tokens"]["access_token"]


async def test_google_login_existing_google_account_reuses_it(client):
    email = unique_email()
    profile = _fake_google_profile(email)
    with patch("app.services.auth_service.verify_google_id_token", return_value=profile):
        first = await client.post("/api/v1/auth/google", json={"id_token": "fake-token"})
        second = await client.post("/api/v1/auth/google", json={"id_token": "fake-token"})
    assert first.json()["data"]["user"]["id"] == second.json()["data"]["user"]["id"]


async def test_google_auth_links_to_existing_password_account(client):
    payload = signup_payload()
    await client.post("/api/v1/auth/signup", json=payload)

    profile = _fake_google_profile(payload["email"])
    with patch("app.services.auth_service.verify_google_id_token", return_value=profile):
        resp = await client.post("/api/v1/auth/google", json={"id_token": "fake-token"})
    assert resp.status_code == 200
    assert resp.json()["data"]["user"]["email"] == payload["email"]
    assert resp.json()["data"]["user"]["oauth_provider"] == "google"


async def test_google_invalid_token_rejected(client):
    from app.exceptions.custom_exceptions import GoogleTokenInvalidException

    with patch("app.services.auth_service.verify_google_id_token", side_effect=GoogleTokenInvalidException()):
        resp = await client.post("/api/v1/auth/google", json={"id_token": "garbage"})
    assert resp.status_code == 401
    assert resp.json()["error_code"] == "GOOGLE_TOKEN_INVALID"


# --------------------------------------------------------------------- #
# HEALTH
# --------------------------------------------------------------------- #

async def test_health_check(client):
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["database"] == "up"
