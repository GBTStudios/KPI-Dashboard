"""Data access for AuditLog."""
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
