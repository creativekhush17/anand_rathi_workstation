from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_scoped_db, require_permission
from app.models import AuditLog, User
from app.schemas import AuditLogOut

router = APIRouter(prefix="/compliance", tags=["compliance"])


@router.get("/logs", response_model=list[AuditLogOut])
async def list_compliance_logs(
    db: AsyncSession = Depends(get_scoped_db),
    _user=Depends(require_permission("clients", "view")),
):
    """
    Query AML & compliance audit logs directly from PostgreSQL `audit_logs` table.
    """
    result = await db.execute(
        select(AuditLog, User.name)
        .outerjoin(User, AuditLog.user_id == User.id)
        .order_by(AuditLog.id.desc())
        .limit(50)
    )
    rows = result.all()

    logs_out = []
    for log_item, user_name in rows:
        formatted_date = log_item.created_at.strftime("%d %b %Y") if log_item.created_at else "Today"
        logs_out.append(
            AuditLogOut(
                id=log_item.id,
                client=f"Ref #{log_item.record_id}" if log_item.record_id else "System Wide",
                type=log_item.action.replace("_", " ").title(),
                date=formatted_date,
                status="Approved" if "SUCCESS" in log_item.action or "CREATE" in log_item.action else "Recorded",
                auditor=user_name or "System Auditor"
            )
        )

    return logs_out
