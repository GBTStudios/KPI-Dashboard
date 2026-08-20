"""Import routes. Any authenticated user can access these, matching the
KPI module's philosophy - Import Data / Import History have no admin gate
in the sidebar."""
import io
import uuid

from fastapi import APIRouter, Depends, File, Form, Query, Request, UploadFile
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import get_client_ip, get_current_user, get_user_agent
from app.dependencies.db import get_db
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.schemas.imports import (
    EXPECTED_COLUMNS,
    ExpectedColumnsOut,
    ImportHistoryListResponse,
    ImportHistoryOut,
    ImportResultOut,
    ImportSummaryOut,
)
from app.services.import_service import ImportService

router = APIRouter(prefix="/imports", tags=["Imports"])


def _service(db: AsyncSession, request: Request, actor: User) -> ImportService:
    return ImportService(db, actor, ip_address=get_client_ip(request), user_agent=get_user_agent(request))


@router.post("", response_model=SuccessResponse[ImportResultOut], summary="Upload a KPI spreadsheet")
async def upload_import(
    request: Request,
    file: UploadFile = File(...),
    year: int | None = Form(None, ge=2000, le=2100, description="Only used for wide-format sheets, which have no Year column of their own; ignored for long-format sheets, which carry Year per row"),
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(get_current_user),
):
    service = _service(db, request, actor)
    result = await service.process_import(file, year)
    return SuccessResponse(message="Import processed.", data=result)


@router.get("/history", response_model=SuccessResponse[ImportHistoryListResponse], summary="List import history")
async def list_history(
    request: Request,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str | None = Query(None, description="Matches filename"),
    status: str | None = Query(None, description="SUCCESS | PARTIAL_SUCCESS | FAILED"),
):
    service = _service(db, request, actor)
    items, total = await service.list_history(page, page_size, search, status)
    return SuccessResponse(
        message="OK",
        data=ImportHistoryListResponse(items=items, total=total, page=page, page_size=page_size),
    )


@router.get("/history/{history_id}", response_model=SuccessResponse[ImportHistoryOut], summary="Get one import history record")
async def get_history(
    history_id: uuid.UUID, request: Request,
    db: AsyncSession = Depends(get_db), actor: User = Depends(get_current_user),
):
    service = _service(db, request, actor)
    record = await service.get_history(history_id)
    return SuccessResponse(message="OK", data=record)


@router.delete("/history/{history_id}", response_model=SuccessResponse[None], summary="Delete an import history record")
async def delete_history(
    history_id: uuid.UUID, request: Request,
    db: AsyncSession = Depends(get_db), actor: User = Depends(get_current_user),
):
    service = _service(db, request, actor)
    await service.delete_history(history_id)
    return SuccessResponse(message="Import history deleted.")


@router.get("/summary", response_model=SuccessResponse[ImportSummaryOut], summary="Dashboard cards for Import Data / Import History")
async def get_summary(
    request: Request,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(get_current_user),
):
    service = _service(db, request, actor)
    summary = await service.get_summary()
    return SuccessResponse(message="OK", data=summary)


@router.get("/expected-columns", response_model=SuccessResponse[ExpectedColumnsOut], summary="Required spreadsheet columns")
async def get_expected_columns(
    actor: User = Depends(get_current_user),
):
    return SuccessResponse(message="OK", data=ExpectedColumnsOut())


@router.get("/template", summary="Download a blank KPI import template")
async def download_template(
    request: Request,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(get_current_user),
):
    service = _service(db, request, actor)
    service.record_template_download()

    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "KPI Import"
    sheet.append(EXPECTED_COLUMNS)

    buffer = io.BytesIO()
    workbook.save(buffer)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=kpi_import_template.xlsx"},
    )