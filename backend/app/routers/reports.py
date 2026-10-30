from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_scoped_db, require_permission
from app.models import ReportModel, DocumentModel
from app.schemas import ReportOut, DocumentOut, ReportCreate, DocumentCreate

router = APIRouter(prefix="/reports", tags=["reports"])


def _format_date(val) -> str:
    if isinstance(val, datetime):
        return val.strftime("%d %b %Y")
    elif val:
        return str(val)[:10]
    return "Today"


@router.get("", response_model=list[ReportOut])
async def list_reports(
    db: AsyncSession = Depends(get_scoped_db),
    _user=Depends(require_permission("reports", "view")),
):
    """
    Returns wealth advisory, tax audit, and portfolio performance reports directly from PostgreSQL reports table.
    """
    result = await db.execute(select(ReportModel).order_by(ReportModel.id.desc()))
    reps = result.scalars().all()

    out = []
    for r in reps:
        out.append(
            ReportOut(
                id=f"REP-{r.id}",
                title=r.title,
                type=r.report_type,
                client_name=r.client_name or "General",
                generated_on=_format_date(r.generated_on),
                status=r.status or "Ready"
            )
        )
    return out


@router.post("", response_model=ReportOut, status_code=201)
async def create_report(
    payload: ReportCreate,
    db: AsyncSession = Depends(get_scoped_db),
    _user=Depends(require_permission("reports", "create")),
):
    """
    Create and store a report record in PostgreSQL database.
    """
    new_report = ReportModel(
        title=payload.title,
        report_type=payload.report_type,
        client_name=payload.client_name or "General",
        status=payload.status or "Generated"
    )
    db.add(new_report)
    await db.commit()
    await db.refresh(new_report)

    return ReportOut(
        id=f"REP-{new_report.id}",
        title=new_report.title,
        type=new_report.report_type,
        client_name=new_report.client_name or "General",
        generated_on=_format_date(new_report.generated_on),
        status=new_report.status or "Ready"
    )


@router.get("/documents", response_model=list[DocumentOut])
async def list_documents(
    db: AsyncSession = Depends(get_scoped_db),
    _user=Depends(require_permission("documents", "view")),
):
    """
    Returns document locker records directly from PostgreSQL documents table.
    """
    result = await db.execute(select(DocumentModel).order_by(DocumentModel.id.desc()))
    docs = result.scalars().all()

    out = []
    for d in docs:
        out.append(
            DocumentOut(
                id=f"DOC-{d.id}",
                name=d.name,
                category=d.category,
                file_size=d.file_size or "5 MB",
                files_count=d.files_count or 1,
                updated_at=_format_date(d.updated_at)
            )
        )
    return out


@router.post("/documents", response_model=DocumentOut, status_code=201)
async def create_document(
    payload: DocumentCreate,
    db: AsyncSession = Depends(get_scoped_db),
    _user=Depends(require_permission("documents", "create")),
):
    """
    Create and store a secure locker document directly in PostgreSQL database.
    """
    new_doc = DocumentModel(
        name=payload.name,
        category=payload.category,
        file_size=payload.file_size or "1.5 MB",
        files_count=payload.files_count or 1
    )
    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)

    return DocumentOut(
        id=f"DOC-{new_doc.id}",
        name=new_doc.name,
        category=new_doc.category,
        file_size=new_doc.file_size or "1.5 MB",
        files_count=new_doc.files_count or 1,
        updated_at=_format_date(new_doc.updated_at)
    )


@router.delete("/documents/{doc_id}", status_code=204)
async def delete_document(
    doc_id: str,
    db: AsyncSession = Depends(get_scoped_db),
    _user=Depends(require_permission("documents", "delete")),
):
    """
    Delete document record from PostgreSQL database.
    """
    clean_id = doc_id.replace("DOC-", "")
    if not clean_id.isdigit():
        raise HTTPException(status_code=400, detail="Invalid document ID")

    stmt = select(DocumentModel).where(DocumentModel.id == int(clean_id))
    doc_item = (await db.execute(stmt)).scalar_one_or_none()
    if not doc_item:
        raise HTTPException(status_code=404, detail="Document not found in PostgreSQL")

    await db.delete(doc_item)
    await db.commit()
    return None

