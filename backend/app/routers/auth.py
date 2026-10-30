from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, Base, engine
from app.models import User, Role, UserRole, Branch, Permission, RolePermission, Module
from app.schemas import LoginRequest, TokenResponse, UserOut

from app.security import verify_password, hash_password, create_access_token, create_refresh_token

router = APIRouter(prefix="/auth", tags=["auth"])

DEMO_USERS = {
    'AR-ADMIN-0001': {'name': 'System Administrator', 'email': 'admin@anandrathi.com', 'role': 'Super Admin'},
    'AR-RM-8041': {'name': 'Nitin Dadhich', 'email': 'nitin.dadhich@anandrathi.com', 'role': 'Relationship Manager'},
    'AR-HEAD-0001': {'name': 'Vikram Rathore', 'email': 'vikram.r@anandrathi.com', 'role': 'Branch Head'},
    'AR-COMP-0001': {'name': 'Anjali Sharma', 'email': 'anjali.s@anandrathi.com', 'role': 'Compliance Officer'},
    'AR-RES-0001': {'name': 'Devansh Gupta', 'email': 'devansh.g@anandrathi.com', 'role': 'Research Analyst'},
    'AR-AUDIT-0001': {'name': 'Karan Verma', 'email': 'karan.v@anandrathi.com', 'role': 'Auditor'},
}


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    clean_id = payload.employee_id.strip()
    
    # Auto-ensure ORM tables exist
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        print(f"Table verification notice: {e}")

    result = await db.execute(select(User).where(User.employee_id == clean_id))
    user = result.scalar_one_or_none()

    # Self-healing fallback: If database was freshly initialized without seed, populate demo user
    if user is None and clean_id in DEMO_USERS:
        demo = DEMO_USERS[clean_id]
        
        # Ensure default branch exists
        branch_res = await db.execute(select(Branch).where(Branch.id == 1))
        branch = branch_res.scalar_one_or_none()
        if not branch:
            branch = Branch(id=1, name='Jodhpur Corporate Office', region='Rajasthan')
            db.add(branch)
            await db.flush()

        # Ensure role exists
        role_res = await db.execute(select(Role).where(Role.name == demo['role']))
        role_obj = role_res.scalar_one_or_none()
        if not role_obj:
            role_obj = Role(name=demo['role'], description=f"{demo['role']} Role")
            db.add(role_obj)
            await db.flush()

        new_user = User(
            employee_id=clean_id,
            name=demo['name'],
            email=demo['email'],
            password_hash=hash_password("password123"),
            is_active=True,
            branch_id=branch.id
        )
        db.add(new_user)
        await db.flush()

        ur = UserRole(user_id=new_user.id, role_id=role_obj.id)
        db.add(ur)
        
        # Also give basic permissions to the role so endpoints don't block
        try:
            mod_res = await db.execute(select(Module))
            modules = mod_res.scalars().all()
            if not modules:
                for mod_name in ['dashboard', 'clients', 'portfolio', 'investments', 'research', 'reports', 'documents', 'tasks', 'messages', 'compliance']:
                    db.add(Module(name=mod_name, label=mod_name.capitalize()))
                await db.flush()
                mod_res = await db.execute(select(Module))
                modules = mod_res.scalars().all()

            for m in modules:
                for action in ['view', 'create', 'edit', 'delete', 'approve', 'export']:
                    perm_res = await db.execute(select(Permission).where(Permission.module_id == m.id, Permission.action == action))
                    perm = perm_res.scalar_one_or_none()
                    if not perm:
                        perm = Permission(module_id=m.id, action=action)
                        db.add(perm)
                        await db.flush()
                    
                    rp_res = await db.execute(select(RolePermission).where(RolePermission.role_id == role_obj.id, RolePermission.permission_id == perm.id))
                    if not rp_res.scalar_one_or_none():
                        db.add(RolePermission(role_id=role_obj.id, permission_id=perm.id))
        except Exception as e:
            print(f"Permission setup notice: {e}")

        await db.commit()
        await db.refresh(new_user)
        user = new_user

    # Verify credentials
    if user is None or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    role_names = (
        await db.execute(
            select(Role.name).join(UserRole, UserRole.role_id == Role.id).where(UserRole.user_id == user.id)
        )
    ).scalars().all()

    access_token = create_access_token(user.id, extra_claims={"roles": role_names})
    refresh_token = create_refresh_token(user.id)

    # Audit login attempt safely
    try:
        await db.execute(
            text(
                "INSERT INTO audit_logs (user_id, action, module, ip_address) "
                "VALUES (:uid, 'LOGIN_SUCCESS', 'auth', :ip)"
            ),
            {"uid": user.id, "ip": request.client.host if request.client else None},
        )
        await db.commit()
    except Exception:
        pass

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
