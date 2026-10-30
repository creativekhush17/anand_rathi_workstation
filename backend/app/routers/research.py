from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.dependencies import get_scoped_db, require_permission
from app.models import ResearchCall
from app.schemas import ResearchCallOut

router = APIRouter(prefix="/research", tags=["research"])


class ResearchCallCreate(BaseModel):
    type: str  # BUY / SELL / HOLD
    symbol: str
    company_name: str
    sector: str | None = ""
    entry_price: float
    target_price: float
    stop_loss: float
    timeline: str | None = "6 Months"
    rationale: str | None = ""


@router.get("/calls", response_model=list[ResearchCallOut])
async def list_research_calls(
    db: AsyncSession = Depends(get_scoped_db),
    _user=Depends(require_permission("research", "view")),
):
    """
    Returns active research and advisory recommendations directly from PostgreSQL research_calls table.
    """
    result = await db.execute(select(ResearchCall).order_by(ResearchCall.id.desc()))
    calls = result.scalars().all()

    out = []
    for c in calls:
        out.append(
            ResearchCallOut(
                id=f"RC-{c.id}",
                type=c.call_type,
                symbol=c.symbol,
                company_name=c.company_name,
                sector=c.sector or "",
                entry_price=float(c.entry_price),
                target_price=float(c.target_price),
                stop_loss=float(c.stop_loss),
                timeline=c.timeline or "6 Months",
                rationale=c.rationale or "",
                date=c.created_at.strftime("%d %b %Y") if c.created_at else "Today"
            )
        )
    return out


@router.post("/calls", response_model=ResearchCallOut, status_code=status.HTTP_201_CREATED)
async def create_research_call(
    payload: ResearchCallCreate,
    db: AsyncSession = Depends(get_scoped_db),
    _user=Depends(require_permission("research", "create")),
):
    """
    Create and persist a new research call directly into PostgreSQL database.
    """
    new_call = ResearchCall(
        call_type=payload.type,
        symbol=payload.symbol.upper(),
        company_name=payload.company_name,
        sector=payload.sector,
        entry_price=payload.entry_price,
        target_price=payload.target_price,
        stop_loss=payload.stop_loss,
        timeline=payload.timeline,
        rationale=payload.rationale,
        created_at=datetime.utcnow()
    )
    db.add(new_call)
    await db.commit()
    await db.refresh(new_call)

    return ResearchCallOut(
        id=f"RC-{new_call.id}",
        type=new_call.call_type,
        symbol=new_call.symbol,
        company_name=new_call.company_name,
        sector=new_call.sector or "",
        entry_price=float(new_call.entry_price),
        target_price=float(new_call.target_price),
        stop_loss=float(new_call.stop_loss),
        timeline=new_call.timeline or "6 Months",
        rationale=new_call.rationale or "",
        date=new_call.created_at.strftime("%d %b %Y")
    )


@router.delete("/calls/{call_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_research_call(
    call_id: str,
    db: AsyncSession = Depends(get_scoped_db),
    _user=Depends(require_permission("research", "delete")),
):
    """
    Delete research call directly from PostgreSQL database.
    """
    clean_id = call_id.replace("RC-", "")
    if not clean_id.isdigit():
        raise HTTPException(status_code=400, detail="Invalid call ID")

    stmt = select(ResearchCall).where(ResearchCall.id == int(clean_id))
    call_item = (await db.execute(stmt)).scalar_one_or_none()
    if not call_item:
        raise HTTPException(status_code=404, detail="Research call not found in PostgreSQL")

    await db.delete(call_item)
    await db.commit()
    return None
