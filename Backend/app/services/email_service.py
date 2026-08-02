"""Email delivery via SendGrid.

Single seam for all outbound transactional email (verification, password
reset). Failures are logged, never raised to the caller - a SendGrid outage
or missing API key should never break a signup/login/forgot-password
response.

If SENDGRID_API_KEY isn't set, this falls back to logging the link instead
of sending - so local development works without a real SendGrid account.
"""
import logging

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

from app.core.config import settings

logger = logging.getLogger("groundpulse")


def _send(to_email: str, subject: str, html_content: str) -> bool:
    if not settings.SENDGRID_API_KEY:
        logger.warning(
            "SENDGRID_API_KEY not configured - email NOT sent (dev fallback). "
            "subject=%r to=%s. Set SENDGRID_API_KEY in .env to enable real delivery.",
            subject,
            to_email,
        )
        return False

    message = Mail(
        from_email=(settings.SENDGRID_FROM_EMAIL, settings.SENDGRID_FROM_NAME),
        to_emails=to_email,
        subject=subject,
        html_content=html_content,
    )
    try:
        client = SendGridAPIClient(settings.SENDGRID_API_KEY)
        response = client.send(message)
        success = 200 <= response.status_code < 300
        if success:
            logger.info("SendGrid email sent to=%s subject=%r status=%d", to_email, subject, response.status_code)
        else:
            logger.error(
                "SendGrid rejected email to=%s subject=%r status=%d body=%s",
                to_email, subject, response.status_code, response.body,
            )
        return success
    except Exception as exc:
        logger.error("SendGrid send failed to=%s subject=%r: %s", to_email, subject, exc, exc_info=True)
        return False


def send_verification_email(to_email: str, full_name: str, verification_link: str) -> bool:
    subject = "Verify your GroundPulse account"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #0f5c4c;">Welcome to Groundbreaker Talents, {full_name}!</h2>
      <p>Please confirm your email address to activate your GroundPulse account.</p>
      <p style="text-align:center; margin: 32px 0;">
        <a href="{verification_link}"
           style="background:#5b6fee;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
          Verify Email
        </a>
      </p>
      <p style="color:#666;font-size:13px;">
        This link expires in {settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_MINUTES} minutes.
        If you didn't create this account, you can safely ignore this email.
      </p>
    </div>
    """
    sent = _send(to_email, subject, html)
    if not sent:
        # Whatever the reason (unverified sender, bad key, SendGrid outage),
        # always leave the real link somewhere you can grab it for testing.
        logger.warning("Verification email NOT delivered - link for manual testing: %s", verification_link)
    return sent


def send_password_reset_email(to_email: str, full_name: str, reset_link: str) -> bool:
    subject = "Reset your GroundPulse password"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #0f5c4c;">Password reset requested</h2>
      <p>Hi {full_name}, we received a request to reset your GroundPulse password.</p>
      <p style="text-align:center; margin: 32px 0;">
        <a href="{reset_link}"
           style="background:#5b6fee;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
          Reset Password
        </a>
      </p>
      <p style="color:#666;font-size:13px;">
        This link expires in {settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES} minutes.
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
    """
    sent = _send(to_email, subject, html)
    if not sent:
        # Whatever the reason (unverified sender, bad key, SendGrid outage),
        # always leave the real link somewhere you can grab it for testing.
        logger.warning("Verification email NOT delivered - link for manual testing: %s", reset_link)
    return sent