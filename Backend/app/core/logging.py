"""Centralized logging: console + rotating file, structured with request
context (request id / user id) injected via a filter that reads from
contextvars set by the RequestContextMiddleware."""
import logging
import os
from logging.handlers import RotatingFileHandler

from app.core.config import settings
from app.middleware.request_context import get_request_id, get_user_id

LOG_FORMAT = (
    "%(asctime)s | %(levelname)s | req_id=%(request_id)s user_id=%(user_id)s | "
    "%(name)s | %(message)s"
)


class ContextFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = get_request_id() or "-"
        record.user_id = get_user_id() or "-"
        return True


def setup_logging() -> None:
    os.makedirs(settings.LOG_DIR, exist_ok=True)
    root = logging.getLogger("groundpulse")
    root.setLevel(settings.LOG_LEVEL)
    root.handlers.clear()

    formatter = logging.Formatter(LOG_FORMAT)
    context_filter = ContextFilter()

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.addFilter(context_filter)
    root.addHandler(console_handler)

    file_handler = RotatingFileHandler(
        os.path.join(settings.LOG_DIR, "app.log"), maxBytes=10 * 1024 * 1024, backupCount=5
    )
    file_handler.setFormatter(formatter)
    file_handler.addFilter(context_filter)
    root.addHandler(file_handler)

    root.propagate = False
