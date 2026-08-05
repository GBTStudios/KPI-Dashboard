"""Business logic for the User Management screen (admin-only).

Permission model (changed): there is exactly one admin, determined by
settings.ADMIN_EMAIL - see User model docstring. Nobody can be promoted,
demoted, or otherwise have their role changed through this service; that
concept doesn't exist here anymore. The only self-protection needed is
"the admin can't suspend/delete their own account" (there's no other admin
who could ever be a target, since admin status isn't assignable).

Suspend/delete/unsuspend each send the affected user a short status-change
email (see app/services/email_service.py). Sending never blocks or fails
the action itself - same best-effort treatment as every other outbound
email in this app.
"""
import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.custom_exceptions import CannotModifySelfException, UserNotFoundException
from app.models.user import User
from app.repositories.audit_log_repository import AuditLogRepository
from app.repositories.user_repository import UserRepository
from app.services.email_service import (
    send_account_deleted_email,
    send_account_reactivated_email,
    send_account_suspended_email,
)

logger = logging.getLogger("groundpulse")


class AdminUserService:
    def __init__(self, db: AsyncSession, actor: User, ip_address: str | None = None, user_agent: str | None = None):
        self.db = db
        self.actor = actor  # the admin performing the action
        self.users = UserRepository(db)
        self.audit = AuditLogRepository(db)
        self.ip_address = ip_address
        self.user_agent = user_agent

    async def list_users(self, page: int, page_size: int, search: str | None, role: str | None, status_filter: str | None):
        return await self.users.list_users(page=page, page_size=page_size, search=search, role=role, status_filter=status_filter)

    async def get_stats(self) -> dict:
        return await self.users.get_stats()

    async def _get_target(self, user_id: uuid.UUID) -> User:
        target = await self.users.get_by_id(user_id)
        if target is None or target.is_deleted:
            raise UserNotFoundException()
        return target

    def _guard_can_modify(self, target: User) -> None:
        if target.id == self.actor.id:
            raise CannotModifySelfException()

    async def suspend_user(self, user_id: uuid.UUID, reason: str | None = None) -> User:
        target = await self._get_target(user_id)
        self._guard_can_modify(target)

        effective_reason = reason or "Suspended by admin (no reason provided)."

        target.is_suspended = True
        target.is_active = False
        target.suspended_at = datetime.now(timezone.utc)
        target.suspended_reason = effective_reason
        target.suspended_by_id = self.actor.id

        self.audit.add("USER_SUSPENDED", user_id=target.id,
                        description=f"Suspended by {self.actor.email}: {effective_reason}",
                        ip_address=self.ip_address, user_agent=self.user_agent)
        logger.warning("User suspended user_id=%s by=%s", target.id, self.actor.id)

        send_account_suspended_email(target.email, target.full_name, effective_reason)

        return target

    async def unsuspend_user(self, user_id: uuid.UUID) -> User:
        target = await self._get_target(user_id)
        self._guard_can_modify(target)

        target.is_suspended = False
        target.is_active = True
        target.suspended_at = None
        target.suspended_reason = None
        target.suspended_by_id = None

        self.audit.add("USER_UNSUSPENDED", user_id=target.id, description=f"Unsuspended by {self.actor.email}",
                        ip_address=self.ip_address, user_agent=self.user_agent)
        logger.info("User unsuspended user_id=%s by=%s", target.id, self.actor.id)

        send_account_reactivated_email(target.email, target.full_name)

        return target

    async def delete_user(self, user_id: uuid.UUID) -> None:
        """Soft delete - matches your existing `is_deleted` flag rather than
        a hard DELETE, so audit history and any FK references stay intact."""
        target = await self._get_target(user_id)
        self._guard_can_modify(target)

        target.is_deleted = True
        target.is_active = False

        self.audit.add("USER_DELETED", user_id=target.id, description=f"Deleted by {self.actor.email}",
                        ip_address=self.ip_address, user_agent=self.user_agent)
        logger.warning("User soft-deleted user_id=%s by=%s", target.id, self.actor.id)

        send_account_deleted_email(target.email, target.full_name)

    async def bulk_suspend(self, user_ids: list[uuid.UUID], reason: str | None = None) -> list[uuid.UUID]:
        succeeded = []
        for uid in user_ids:
            try:
                await self.suspend_user(uid, reason)
                succeeded.append(uid)
            except (UserNotFoundException, CannotModifySelfException) as exc:
                logger.warning("Bulk suspend skipped user_id=%s reason=%s", uid, exc.message)
        return succeeded

    async def bulk_delete(self, user_ids: list[uuid.UUID]) -> list[uuid.UUID]:
        succeeded = []
        for uid in user_ids:
            try:
                await self.delete_user(uid)
                succeeded.append(uid)
            except (UserNotFoundException, CannotModifySelfException) as exc:
                logger.warning("Bulk delete skipped user_id=%s reason=%s", uid, exc.message)
        return succeeded