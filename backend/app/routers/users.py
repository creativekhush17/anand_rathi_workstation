from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_scoped_db, get_current_user
from app.models import User, Role, UserRole, AuditLog, ClientAssignment
from app.schemas import UserOut, UserCreate, ClientAssignRequest, SystemAuditLogOut
from app.security import hash_password

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserOut])
async def list_users(
    db: AsyncSession = Depends(get_scoped_db),
    _current_user: User = Depends(get_current_user),
):
    """
    List all registered employees/RMs in the workstation.
    Includes their assigned roles.
    """
    stmt = select(User).order_by(User.id.desc())
    result = await db.execute(stmt)
    users = result.scalars().all()

    user_list = []
    for user in users:
        role_stmt = (
            select(Role.name)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(UserRole.user_id == user.id)
        )
        roles = (await db.execute(role_stmt)).scalars().all()

        user_list.append(
            UserOut(
                id=user.id,
                employee_id=user.employee_id,
                name=user.name,
                email=user.email,
                branch_id=user.branch_id,
                roles=list(roles),
            )
        )

    return user_list


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreate,
    db: AsyncSession = Depends(get_scoped_db),
    current_user: User = Depends(get_current_user),
):
    """
    Register a new Relationship Manager (RM) or staff member in PostgreSQL.
    Hashes password securely with bcrypt and assigns role.
    """
    # Check if employee_id already exists
    existing = await db.execute(
        select(User).where(User.employee_id == payload.employee_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Employee ID '{payload.employee_id}' is already registered.",
        )

    # Hash password
    pwd_hash = hash_password(payload.password)

    new_user = User(
        employee_id=payload.employee_id,
        name=payload.name,
        email=payload.email,
        password_hash=pwd_hash,
        branch_id=payload.branch_id,
        is_active=True,
        created_at=datetime.utcnow(),
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Fetch role ID
    role_res = await db.execute(
        select(Role).where(Role.name == payload.role_name)
    )
    role_obj = role_res.scalar_one_or_none()
    if not role_obj:
        # Default to Relationship Manager
        role_res = await db.execute(
            select(Role).where(Role.name == "Relationship Manager")
        )
        role_obj = role_res.scalar_one_or_none()

    if role_obj:
        user_role = UserRole(user_id=new_user.id, role_id=role_obj.id)
        db.add(user_role)
        await db.commit()

    # Log audit entry
    try:
        await db.execute(
            text(
                "INSERT INTO audit_logs (user_id, action, module, record_id, new_value) "
                "VALUES (:uid, 'CREATE_USER', 'users', :rid, :val)"
            ),
            {
                "uid": current_user.id,
                "rid": new_user.id,
                "val": f"emp_id={new_user.employee_id}, role={payload.role_name}",
            },
        )
        await db.commit()
    except Exception:
        pass

    return UserOut(
        id=new_user.id,
        employee_id=new_user.employee_id,
        name=new_user.name,
        email=new_user.email,
        branch_id=new_user.branch_id,
        roles=[payload.role_name],
    )


@router.post("/assign")
async def assign_client_to_rm(
    payload: ClientAssignRequest,
    db: AsyncSession = Depends(get_scoped_db),
    current_user: User = Depends(get_current_user),
):
    """
    Assign a client to a Relationship Manager (RM).
    Executes stored procedure / client_assignments insertion.
    """
    try:
        await db.execute(
            text("SELECT sp_assign_client_to_rm(:rm_id, :client_id, :actor_id)"),
            {
                "rm_id": payload.rm_id,
                "client_id": payload.client_id,
                "actor_id": current_user.id,
            },
        )
        await db.commit()
    except Exception:
        # Fallback to direct insertion if SP isn't initialized in DB
        assignment = ClientAssignment(rm_id=payload.rm_id, client_id=payload.client_id)
        db.add(assignment)
        await db.commit()

    return {
        "status": "success",
        "message": f"Client ID {payload.client_id} successfully assigned to RM ID {payload.rm_id}",
    }


@router.get("/audit-logs", response_model=list[SystemAuditLogOut])
async def list_system_audit_logs(
    db: AsyncSession = Depends(get_scoped_db),
    _current_user: User = Depends(get_current_user),
):
    """
    Fetch real-time system audit logs for Super Admin monitoring.
    """
    stmt = (
        select(AuditLog, User.name)
        .outerjoin(User, User.id == AuditLog.user_id)
        .order_by(AuditLog.id.desc())
        .limit(50)
    )
    result = await db.execute(stmt)
    rows = result.all()

    logs = []
    for audit, user_name in rows:
        if isinstance(audit.created_at, datetime):
            created_str = audit.created_at.strftime("%Y-%m-%d %H:%M:%S")
        elif audit.created_at:
            created_str = str(audit.created_at)
        else:
            created_str = "Recent"

        logs.append(
            SystemAuditLogOut(
                id=audit.id,
                user_id=audit.user_id,
                user_name=user_name or f"User #{audit.user_id}",
                action=audit.action,
                module=audit.module,
                record_id=audit.record_id,
                ip_address=audit.ip_address,
                old_value=audit.old_value,
                new_value=audit.new_value,
                created_at=created_str,
            )
        )

    return logs


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_scoped_db),
    _current_user: User = Depends(get_current_user),
):
    """
    Delete employee/user record from PostgreSQL database.
    """
    stmt = select(User).where(User.id == user_id)
    user_obj = (await db.execute(stmt)).scalar_one_or_none()
    if not user_obj:
        raise HTTPException(status_code=404, detail="User not found in PostgreSQL")

    # Delete assigned roles first
    await db.execute(text("DELETE FROM user_roles WHERE user_id = :uid"), {"uid": user_id})
    await db.delete(user_obj)
    await db.commit()
    return None
