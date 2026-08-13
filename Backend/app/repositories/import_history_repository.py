"""Data access for ImportHistory. No business logic here - see
app/services/import_service.py for status resolution, cleaning, etc."""
import uuid
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.import_history import ImportHistory


class ImportHistoryRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    def add(self, record: ImportHistory) -> None:
        self.db.add(record)

    async def flush(self) -> None:
        await self.db.flush()

    async def get_by_id(self, history_id: uuid.UUID) -> ImportHistory | None:
        result = await self.db.execute(
            select(ImportHistory)
            .options(selectinload(ImportHistory.uploaded_by))
            .where(ImportHistory.id == history_id)
        )
        return result.scalar_one_or_none()

    async def delete(self, record: ImportHistory) -> None:
        await self.db.delete(record)

    async def list_history(
        self,
        page: int = 1,
        page_size: int = 10,
        search: str | None = None,
        status_filter: str | None = None,
    ) -> tuple[list[ImportHistory], int]:
        """Search matches filename only - there's no other free-text field
        on this table worth searching."""
        query = select(ImportHistory).options(selectinload(ImportHistory.uploaded_by))
        count_query = select(func.count()).select_from(ImportHistory)

        if search:
            like = f"%{search.strip()}%"
            query = query.where(ImportHistory.filename.ilike(like))
            count_query = count_query.where(ImportHistory.filename.ilike(like))
        if status_filter:
            query = query.where(ImportHistory.status == status_filter)
            count_query = count_query.where(ImportHistory.status == status_filter)

        total = (await self.db.execute(count_query)).scalar_one()

        query = query.order_by(ImportHistory.uploaded_at.desc()).offset((page - 1) * page_size).limit(page_size)
        items = (await self.db.execute(query)).unique().scalars().all()

        return list(items), total

    async def get_summary(self, since: datetime) -> dict:
        """Backs the dashboard cards: successful/failed counts scoped to
        `since` (see ImportService for the 7-day window), plus an all-time
        total of rows processed."""
        successful_recent = (await self.db.execute(
            select(func.count()).select_from(ImportHistory).where(
                ImportHistory.status == "SUCCESS", ImportHistory.uploaded_at >= since,
            )
        )).scalar_one()

        failed_recent = (await self.db.execute(
            select(func.count()).select_from(ImportHistory).where(
                ImportHistory.status == "FAILED", ImportHistory.uploaded_at >= since,
            )
        )).scalar_one()

        total_rows = (await self.db.execute(
            select(func.coalesce(func.sum(ImportHistory.total_rows), 0))
        )).scalar_one()

        return {
            "last_7_days_successful_imports": successful_recent,
            "recent_failed_imports": failed_recent,
            "total_rows_processed": int(total_rows),
        }