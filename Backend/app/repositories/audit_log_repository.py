"""Data access for AuditLog."""
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.user import User
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


class AuditLogRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    def add(
        self,
        event_type: str,
        user_id: uuid.UUID | None = None,
        description: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> None:
        entry = AuditLog(
            event_type=event_type,
            user_id=user_id,
            description=description,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.db.add(entry)

    async def list_recent(self, limit: int = 10, event_types: list[str] | None = None) -> list[AuditLog]:
        """Most recent audit log rows, newest first - backs the
        Dashboard's Recent Activity feed (see app/services/dashboard_service.py).

        UNVERIFIED, same caveat as before: I still don't have your actual
        AuditLog model file, so two things here are inferred rather than
        confirmed:
          - `AuditLog.created_at` - every other table in this project
            (users, kpi_indicators, kpi_monthly_values, departments,
            parameters) uses created_at/updated_at, so this is a
            reasonably confident guess, not a blind one - but if your
            AuditLog model calls it something else (`timestamp`,
            `occurred_at`), this line needs that name instead.
          - Whether AuditLog even HAS a `created_at` at all - if it
            doesn't, ordering falls back to `AuditLog.id`, which is
            wrong if your primary key isn't a time-ordered type (e.g. a
            random UUID) - only correct if it's an auto-incrementing int
            or a time-ordered UUID (uuid7/ULID-style).

        Sidestepped one previous assumption entirely: rather than relying
        on a `AuditLog.user` relationship (whose attribute name I'd have
        had to guess), this does an explicit JOIN against User by
        user_id - so it only depends on the FK column, which `add()`
        above already proves exists.
        """
        stmt = (
            select(AuditLog, User.full_name)
            .join(User, AuditLog.user_id == User.id, isouter=True)
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
        )
        if event_types:
            stmt = stmt.where(AuditLog.event_type.in_(event_types))

        result = await self.db.execute(stmt)
        rows = result.all()

        # Stash the joined name directly on each entry so callers (the
        # dashboard service) don't need to know about this join at all -
        # just entry.actor_name.
        entries = []
        for audit_log, full_name in rows:
            audit_log.actor_name = full_name or "Unknown user"
            entries.append(audit_log)
        return entries