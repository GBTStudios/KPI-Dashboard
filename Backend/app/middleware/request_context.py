"""Contextvars for request id / user id, set by RequestContextMiddleware and
read by the logging ContextFilter, so every log line in a request can be
correlated without threading it through every function signature."""
import contextvars
import uuid

_request_id_ctx: contextvars.ContextVar[str | None] = contextvars.ContextVar("request_id", default=None)
_user_id_ctx: contextvars.ContextVar[str | None] = contextvars.ContextVar("user_id", default=None)


def new_request_id() -> str:
    return str(uuid.uuid4())


def set_request_id(value: str) -> None:
    _request_id_ctx.set(value)


def get_request_id() -> str | None:
    return _request_id_ctx.get()


def set_user_id(value: str | None) -> None:
    _user_id_ctx.set(value)


def get_user_id() -> str | None:
    return _user_id_ctx.get()
