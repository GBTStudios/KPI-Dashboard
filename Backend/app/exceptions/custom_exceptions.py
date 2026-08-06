"""Application-level exceptions.

AppException and its subclasses represent *expected* business outcomes
(bad password, locked account, etc). They map to a specific HTTP status +
error_code. Critically: side effects recorded before one of these is raised
(failed-attempt counters, audit log rows) must still be committed - see
app/dependencies/db.py for how get_db distinguishes these from genuinely
unexpected errors.
"""
from fastapi import status


class AppException(Exception):
    status_code: int = status.HTTP_400_BAD_REQUEST
    error_code: str = "APP_ERROR"

    def __init__(self, message: str, error_code: str | None = None, status_code: int | None = None):
        self.message = message
        if error_code:
            self.error_code = error_code
        if status_code:
            self.status_code = status_code
        super().__init__(message)


class EmailAlreadyExistsException(AppException):
    status_code = status.HTTP_409_CONFLICT
    error_code = "EMAIL_ALREADY_EXISTS"

    def __init__(self):
        super().__init__("An account with this email already exists.")


class PasswordsDoNotMatchException(AppException):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    error_code = "PASSWORDS_DO_NOT_MATCH"

    def __init__(self):
        super().__init__("Password and confirm password do not match.")


class WeakPasswordException(AppException):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    error_code = "WEAK_PASSWORD"

    def __init__(self, reason: str = "Password does not meet the required strength policy."):
        super().__init__(reason)





class InvalidCredentialsException(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    error_code = "INVALID_CREDENTIALS"

    def __init__(self):
        super().__init__("Invalid email or password.")

class EmailVerificationTokenInvalidException(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    error_code = "EMAIL_VERIFICATION_TOKEN_INVALID"

    def __init__(self):
        super().__init__("This verification link is invalid, expired, or already used.")

class AccountInactiveException(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    error_code = "ACCOUNT_INACTIVE"

    def __init__(self):
        super().__init__("This account has been deactivated.")


class AccountLockedException(AppException):
    status_code = status.HTTP_423_LOCKED
    error_code = "ACCOUNT_LOCKED"

    def __init__(self, minutes_remaining: int):
        super().__init__(f"Account locked due to repeated failed logins. Try again in {minutes_remaining} minute(s).")


class TokenExpiredException(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    error_code = "TOKEN_EXPIRED"

    def __init__(self):
        super().__init__("Token has expired.")


class TokenInvalidException(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    error_code = "TOKEN_INVALID"

    def __init__(self, message: str = "Token is invalid."):
        super().__init__(message)


class TokenRevokedException(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    error_code = "TOKEN_REVOKED"

    def __init__(self):
        super().__init__("This refresh token has already been used or revoked. Please log in again.")


class UnauthorizedException(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    error_code = "UNAUTHORIZED"

    def __init__(self, message: str = "Authentication required."):
        super().__init__(message)


class ForbiddenException(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    error_code = "FORBIDDEN"

    def __init__(self, message: str = "You do not have permission to perform this action."):
        super().__init__(message)


class RateLimitExceededException(AppException):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    error_code = "RATE_LIMIT_EXCEEDED"

    def __init__(self, retry_after_seconds: int):
        self.retry_after_seconds = retry_after_seconds
        super().__init__(f"Too many requests. Try again in {retry_after_seconds} second(s).")


class GoogleTokenInvalidException(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    error_code = "GOOGLE_TOKEN_INVALID"

    def __init__(self, message: str = "Could not verify Google sign-in token."):
        super().__init__(message)


class GoogleAccountConflictException(AppException):
    """Raised if a Google login matches an existing email/password account and
    we don't want to silently auto-link it (e.g. if you require an explicit
    'link account' confirmation step). Not raised by default - see
    AuthService.google_auth docstring - but kept available since teams differ
    on whether auto-linking by email is acceptable.
    """
    status_code = status.HTTP_409_CONFLICT
    error_code = "GOOGLE_ACCOUNT_CONFLICT"

    def __init__(self):
        super().__init__("An account with this email already exists. Log in with your password first, then link Google from settings.")


class ResetCodeInvalidException(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    error_code = "RESET_CODE_INVALID"

    def __init__(self):
        super().__init__("That code is incorrect or has expired.")


class ResetCodeLockedException(AppException):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    error_code = "RESET_CODE_LOCKED"

    def __init__(self):
        super().__init__("Too many incorrect attempts. Please request a new code.")

class PasswordResetTokenInvalidException(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    error_code = "RESET_TOKEN_INVALID"

    def __init__(self):
        super().__init__("This password reset link is invalid or has expired.")
class AccountSuspendedException(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    error_code = "ACCOUNT_SUSPENDED"

    def __init__(self, reason: str | None = None):
        message = "This account has been suspended." + (f" Reason: {reason}" if reason else "")
        super().__init__(message)


class InsufficientRoleException(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    error_code = "INSUFFICIENT_ROLE"

    def __init__(self, message: str = "You do not have permission to perform this action."):
        super().__init__(message)


class InvalidRoleException(AppException):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    error_code = "INVALID_ROLE"

    def __init__(self, message: str = "Invalid role specified."):
        super().__init__(message)
class UserNotFoundException(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    error_code = "USER_NOT_FOUND"

    def __init__(self):
        super().__init__("User not found.")


class CannotModifySelfException(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    error_code = "CANNOT_MODIFY_SELF"

    def __init__(self):
        super().__init__("You cannot perform this action on your own account.")


class IncorrectPasswordException(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    error_code = "INCORRECT_PASSWORD"

    def __init__(self):
        super().__init__("Current password is incorrect.")


class KpiIndicatorNotFoundException(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    error_code = "KPI_INDICATOR_NOT_FOUND"

    def __init__(self):
        super().__init__("KPI indicator not found.")