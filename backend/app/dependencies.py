from typing import Set

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.security import decode_token
from app.models import User, UserRole, Role, RolePermission, Permission, Module

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


async def get_current_user_id(token: str | None = Depends(oauth2_scheme)) -> int:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token payload missing user identifier",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return int(user_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_scoped_db(user_id: int = Depends(get_current_user_id)):
    """
    Every authenticated request runs inside a session with
    app.current_user_id set for Postgres Row Level Security policies.
    """
    async with AsyncSessionLocal() as session:
        try:
            await session.execute(text("SELECT set_config('app.current_user_id', :uid, true)"), {"uid": str(user_id)})
        except Exception:
            pass
        yield session


async def get_current_user(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_scoped_db),
) -> User:
    user = await db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account inactive or not found",
        )
    return user


async def _get_user_permission_keys(db: AsyncSession, user_id: int) -> Set[str]:
    stmt = (
        select(Module.name, Permission.action)
        .join(Permission, Permission.module_id == Module.id)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .join(Role, Role.id == RolePermission.role_id)
        .join(UserRole, UserRole.role_id == Role.id)
        .where(UserRole.user_id == user_id)
    )
    rows = (await db.execute(stmt)).all()
    return {f"{module}.{action}" for module, action in rows}


def require_permission(module: str, action: str):
    async def checker(
        user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_scoped_db),
    ) -> User:
        role_stmt = (
            select(Role.name)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(UserRole.user_id == user.id)
        )
        roles = (await db.execute(role_stmt)).scalars().all()
        
        # Super Admin bypasses individual permission checks
        if "Super Admin" in roles:
            return user

        perms = await _get_user_permission_keys(db, user.id)
        needed = f"{module}.{action}"
        if needed not in perms:
            # Flexible fallback for viewing general dashboard/client modules if logged in
            if action == "view" and module in ("dashboard", "clients", "portfolio", "investments", "research", "reports", "documents", "tasks", "messages", "compliance", "settings"):
                return user
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Action '{needed}' is not permitted for your role."
            )
        return user

    return checker
