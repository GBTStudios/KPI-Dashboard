"""Centralized application configuration via environment variables."""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    ENVIRONMENT: str = "development"

    DATABASE_URL: str

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    REFRESH_TOKEN_REMEMBER_ME_EXPIRE_DAYS: int = 30

    MAX_FAILED_LOGIN_ATTEMPTS: int = 5
    ACCOUNT_LOCKOUT_MINUTES: int = 15

    PASSWORD_RESET_OTP_EXPIRE_MINUTES: int = 10
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 15  # stage-2 token, after code is verified
    MAX_RESET_CODE_ATTEMPTS: int = 5
    FRONTEND_RESET_PASSWORD_URL: str = "http://localhost:3000/reset-password"

    GOOGLE_CLIENT_ID: str = ""

    # ---- SendGrid (transactional email: verification + password reset) ----
    SENDGRID_API_KEY: str = ""
    SENDGRID_FROM_EMAIL: str = "no-reply@groundbreakerstudio.com"
    SENDGRID_FROM_NAME: str = "GroundPulse"

    # ---- Email verification ----
    EMAIL_VERIFICATION_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    FRONTEND_VERIFY_EMAIL_URL: str = "http://localhost:3000/verify-email"

    CORS_ORIGINS: str = "*"
    TRUSTED_HOSTS: str = "*"

    LOG_LEVEL: str = "INFO"
    LOG_DIR: str = "logs"

    API_V1_PREFIX: str = "/api/v1"
    APP_VERSION: str = "1.0.0"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def trusted_hosts_list(self) -> List[str]:
        return [h.strip() for h in self.TRUSTED_HOSTS.split(",") if h.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()