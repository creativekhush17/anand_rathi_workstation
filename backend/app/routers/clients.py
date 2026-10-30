from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, text, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import require_permission, get_scoped_db, get_current_user
from app.models import Client, ClientAssignment, User
from app.schemas import ClientOut, ClientCreate, ClientUpdate

router = APIRouter(prefix="/clients", tags=["clients"])


@router.get("", response_model=list[ClientOut])
async def list_clients(
    db: AsyncSession = Depends(get_scoped_db),
    _user=Depends(require_permission("clients", "view")),
):
    """
    Two layers of protection here:
    1. require_permission("clients", "view") -- app-level RBAC
    2. Postgres RLS on the `clients` table
    """
    result = await db.execute(select(Client).order_by(Client.id.desc()))
    return result.scalars().all()


@router.post("", response_model=ClientOut, status_code=status.HTTP_201_CREATED)
async def create_client(
    payload: ClientCreate,
    db: AsyncSession = Depends(get_scoped_db),
    _user=Depends(require_permission("clients", "create")),
    current_user: User = Depends(get_current_user),
):
    """
    Persist a newly registered client directly to PostgreSQL database.
    Requires 'clients.create' permission.
    """
    if payload.client_ref:
        client_ref = payload.client_ref
    else:
        max_id_res = await db.execute(select(func.max(Client.id)))
        max_id = (max_id_res.scalar() or 0)
        cnt = max_id + 101
        client_ref = f"AR-C-{cnt}"
        
        while True:
            existing = await db.execute(select(Client).where(Client.client_ref == client_ref))
            if not existing.scalar_one_or_none():
                break
            cnt += 1
            client_ref = f"AR-C-{cnt}"

    new_client = Client(
        client_ref=client_ref,
        name=payload.name,
        category=payload.category,
        email=payload.email,
        phone=payload.phone,
        city=payload.city or "Jodhpur",
        branch_id=1,
        total_aum=payload.total_aum,
        kyc_status="Approved",
        registered_on=datetime.utcnow()
    )
    db.add(new_client)
    await db.commit()
    await db.refresh(new_client)

    # Automatically assign newly created client to current user in client_assignments
    try:
        assignment = ClientAssignment(rm_id=current_user.id, client_id=new_client.id)
        db.add(assignment)
        await db.commit()
    except Exception:
        await db.rollback()

    return new_client


@router.put("/{client_identifier}", response_model=ClientOut)
async def update_client(
    client_identifier: str,
    payload: ClientUpdate,
    db: AsyncSession = Depends(get_scoped_db),
    _user=Depends(require_permission("clients", "edit")),
):
    """
    Update a client record directly in PostgreSQL database.
    Accepts integer id or client_ref (e.g. AR-C-101).
    Requires 'clients.edit' permission.
    """
    query = select(Client).where(or_(Client.client_ref == client_identifier, func.lower(Client.client_ref) == client_identifier.lower()))
    if client_identifier.isdigit():
        query = select(Client).where(or_(Client.id == int(client_identifier), Client.client_ref == client_identifier))
    
    result = await db.execute(query)
    client = result.scalar_one_or_none()

    if not client and "AR-C-" in client_identifier.upper():
        raw_num = client_identifier.upper().replace("AR-C-", "")
        if raw_num.isdigit():
            query_fb = select(Client).where(Client.id == int(raw_num))
            res_fb = await db.execute(query_fb)
            client = res_fb.scalar_one_or_none()

    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client record not found in PostgreSQL database")

    if payload.name is not None:
        client.name = payload.name
    if payload.category is not None:
        client.category = payload.category
    if payload.email is not None:
        client.email = payload.email
    if payload.phone is not None:
        client.phone = payload.phone
    if payload.city is not None:
        client.city = payload.city
    if payload.total_aum is not None:
        client.total_aum = str(payload.total_aum)

    await db.commit()
    await db.refresh(client)
    return client


@router.delete("/{client_identifier}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_identifier: str,
    db: AsyncSession = Depends(get_scoped_db),
    _user=Depends(require_permission("clients", "delete")),
):
    """
    Delete a client record directly from PostgreSQL database.
    Accepts integer id or client_ref (e.g. AR-C-101).
    Requires 'clients.delete' permission.
    """
    query = select(Client).where(or_(Client.client_ref == client_identifier, func.lower(Client.client_ref) == client_identifier.lower()))
    if client_identifier.isdigit():
        query = select(Client).where(or_(Client.id == int(client_identifier), Client.client_ref == client_identifier))

    result = await db.execute(query)
    client = result.scalar_one_or_none()

    if not client and "AR-C-" in client_identifier.upper():
        raw_num = client_identifier.upper().replace("AR-C-", "")
        if raw_num.isdigit():
            query_fb = select(Client).where(Client.id == int(raw_num))
            res_fb = await db.execute(query_fb)
            client = res_fb.scalar_one_or_none()

    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client record not found in PostgreSQL database")

    await db.delete(client)
    await db.commit()
    return None
