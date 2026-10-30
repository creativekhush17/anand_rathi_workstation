from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel
from app.dependencies import get_scoped_db, get_current_user

router = APIRouter(prefix="/tasks", tags=["Tasks"])

class TaskOut(BaseModel):
    id: int
    title: str
    due_date: str
    status: str
    priority: str

class TaskCreate(BaseModel):
    title: str
    due_date: Optional[str] = "Today"
    priority: Optional[str] = "Medium"

@router.get("", response_model=List[TaskOut])
async def get_tasks(
    db: AsyncSession = Depends(get_scoped_db),
    current_user: dict = Depends(get_current_user)
):
    result = await db.execute(text("SELECT id, title, due_date, status, priority FROM tasks ORDER BY id DESC"))
    rows = result.fetchall()
    return [
        {
            "id": r.id,
            "title": r.title,
            "due_date": r.due_date or "Today",
            "status": r.status or "Pending",
            "priority": r.priority or "Medium"
        }
        for r in rows
    ]

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_task(
    task: TaskCreate,
    db: AsyncSession = Depends(get_scoped_db),
    current_user: dict = Depends(get_current_user)
):
    stmt = text("""
        INSERT INTO tasks (title, due_date, status, priority, assigned_to)
        VALUES (:title, :due_date, 'Pending', :priority, :assigned_to)
        RETURNING id, title, due_date, status, priority
    """)
    res = await db.execute(stmt, {
        "title": task.title,
        "due_date": task.due_date or "Today",
        "priority": task.priority or "Medium",
        "assigned_to": current_user["id"]
    })
    await db.commit()
    r = res.fetchone()
    return {"id": r.id, "title": r.title, "due_date": r.due_date, "status": r.status, "priority": r.priority}

@router.put("/{task_id}/toggle", response_model=TaskOut)
async def toggle_task_status(
    task_id: int,
    db: AsyncSession = Depends(get_scoped_db),
    current_user: dict = Depends(get_current_user)
):
    check = await db.execute(text("SELECT id, title, due_date, status, priority FROM tasks WHERE id = :id"), {"id": task_id})
    row = check.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Task not found")
    new_status = "Completed" if row.status == "Pending" else "Pending"
    await db.execute(text("UPDATE tasks SET status = :status WHERE id = :id"), {"status": new_status, "id": task_id})
    await db.commit()
    return {
        "id": row.id,
        "title": row.title,
        "due_date": row.due_date or "Today",
        "status": new_status,
        "priority": row.priority or "Medium"
    }
