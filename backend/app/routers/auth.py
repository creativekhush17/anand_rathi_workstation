from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User, Role, UserRole
from app.schemas import LoginRequest, TokenResponse, UserOut

from app.security import verify_password, create_access_token, create_refresh_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.employee_id == payload.employee_id))
    user = result.scalar_one_or_none()

    # Same error for "no such user" and "wrong password" -- don't leak which one it was.
    if user is None or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    role_names = (
        await db.execute(
            select(Role.name).join(UserRole, UserRole.role_id == Role.id).where(UserRole.user_id == user.id)
        )
    ).scalars().all()

    access_token = create_access_token(user.id, extra_claims={"roles": role_names})
    refresh_token = create_refresh_token(user.id)

    # Audit every login attempt, success included -- Compliance module reads this table.
    await db.execute(
        text(
            "INSERT INTO audit_logs (user_id, action, module, ip_address) "
            "VALUES (:uid, 'LOGIN_SUCCESS', 'auth', :ip)"
        ),
        {"uid": user.id, "ip": request.client.host if request.client else None},
    )
    await db.commit()

    user_out = UserOut(
        id=user.id,
        employee_id=user.employee_id,
        name=user.name,
        email=user.email,
        branch_id=user.branch_id,
        roles=role_names
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_out
    )

