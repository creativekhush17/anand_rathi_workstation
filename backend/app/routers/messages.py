from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel
from app.dependencies import get_scoped_db, get_current_user

router = APIRouter(prefix="/messages", tags=["Messages"])

class MessageItem(BaseModel):
    sender: str
    text: str
    time: str

class ThreadOut(BaseModel):
    id: str
    clientName: str
    category: str
    lastMsg: str
    time: str
    unread: bool
    messages: List[MessageItem]

class SendMessagePayload(BaseModel):
    thread_id: str
    client_name: str
    text: str

@router.get("/threads", response_model=List[ThreadOut])
async def get_threads(
    db: AsyncSession = Depends(get_scoped_db),
    current_user: dict = Depends(get_current_user)
):
    threads_res = await db.execute(text("SELECT id, client_name, category, last_msg, time_str, unread FROM chat_threads ORDER BY updated_at DESC"))
    threads_rows = threads_res.fetchall()

    result = []
    for t in threads_rows:
        msgs_res = await db.execute(text("SELECT sender, text, time_str FROM chat_messages WHERE thread_id = :tid ORDER BY id ASC"), {"tid": t.id})
        msgs_rows = msgs_res.fetchall()
        msgs = [{"sender": m.sender, "text": m.text, "time": m.time_str or "Just now"} for m in msgs_rows]
        
        result.append({
            "id": t.id,
            "clientName": t.client_name,
            "category": t.category,
            "lastMsg": t.last_msg or "",
            "time": t.time_str or "10:00 AM",
            "unread": bool(t.unread),
            "messages": msgs
        })
    return result

@router.post("/send", status_code=status.HTTP_201_CREATED)
async def send_message(
    payload: SendMessagePayload,
    db: AsyncSession = Depends(get_scoped_db),
    current_user: dict = Depends(get_current_user)
):
    time_str = "Just now"
    # Ensure thread exists
    thread_check = await db.execute(text("SELECT id FROM chat_threads WHERE id = :tid"), {"tid": payload.thread_id})
    if not thread_check.fetchone():
        await db.execute(text("""
            INSERT INTO chat_threads (id, client_name, category, last_msg, time_str, unread)
            VALUES (:tid, :cname, 'UHNI', :last_msg, :tstr, false)
        """), {"tid": payload.thread_id, "cname": payload.client_name, "last_msg": payload.text, "tstr": time_str})

    # Insert message
    await db.execute(text("""
        INSERT INTO chat_messages (thread_id, sender, text, time_str)
        VALUES (:tid, 'advisor', :text, :tstr)
    """), {"tid": payload.thread_id, "text": payload.text, "tstr": time_str})

    # Update thread last msg
    await db.execute(text("""
        UPDATE chat_threads SET last_msg = :last_msg, time_str = :tstr, updated_at = now() WHERE id = :tid
    """), {"tid": payload.thread_id, "last_msg": payload.text, "tstr": time_str})

    await db.commit()
    return {"status": "Message sent and stored in PostgreSQL live database"}

@router.put("/threads/{thread_id}/read")
async def mark_thread_read(
    thread_id: str,
    db: AsyncSession = Depends(get_scoped_db),
    current_user: dict = Depends(get_current_user)
):
    await db.execute(text("UPDATE chat_threads SET unread = false, updated_at = now() WHERE id = :tid"), {"tid": thread_id})
    await db.commit()
    return {"status": "ok"}
