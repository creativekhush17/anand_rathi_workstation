from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel
from app.dependencies import get_scoped_db, get_current_user

router = APIRouter(prefix="/documents", tags=["Documents"])

class DocumentOut(BaseModel):
    id: int
    name: str
    category: str
    file_size: str
    files_count: int

class DocumentCreate(BaseModel):
    name: str
    category: str
    file_size: Optional[str] = "2.5 MB"

@router.get("", response_model=List[DocumentOut])
async def get_documents(
    db: AsyncSession = Depends(get_scoped_db),
    current_user: dict = Depends(get_current_user)
):
    result = await db.execute(text("SELECT id, name, category, file_size, files_count FROM documents ORDER BY id DESC"))
    rows = result.fetchall()
    return [
        {
            "id": r.id,
            "name": r.name,
            "category": r.category,
            "file_size": r.file_size or "2.5 MB",
            "files_count": r.files_count or 1
        }
        for r in rows
    ]

@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_document(
    doc: DocumentCreate,
    db: AsyncSession = Depends(get_scoped_db),
    current_user: dict = Depends(get_current_user)
):
    stmt = text("""
        INSERT INTO documents (name, category, file_size, files_count, uploaded_by)
        VALUES (:name, :category, :file_size, 1, :uploaded_by)
        RETURNING id, name, category, file_size, files_count
    """)
    res = await db.execute(stmt, {
        "name": doc.name,
        "category": doc.category,
        "file_size": doc.file_size or "2.5 MB",
        "uploaded_by": current_user["id"]
    })
    await db.commit()
    r = res.fetchone()
    return {"id": r.id, "name": r.name, "category": r.category, "file_size": r.file_size, "files_count": r.files_count}
