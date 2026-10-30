import sys
from pathlib import Path

# Ensure backend directory is in python path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, clients, dashboard, portfolio, research, reports, tasks, messages, compliance, users, documents

app = FastAPI(title="AnandRathi Workstation API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(clients.router)
app.include_router(dashboard.router)
app.include_router(portfolio.router)
app.include_router(research.router)
app.include_router(reports.router)
app.include_router(tasks.router)
app.include_router(messages.router)
app.include_router(documents.router)
app.include_router(compliance.router)
app.include_router(users.router)







@app.on_event("startup")
async def on_startup():
    try:
        from init_db import init_database
        await init_database()
        print("Database schema and seed verified on startup.")
    except Exception as e:
        print(f"Database startup notice: {e}")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/db/init")
async def trigger_init_db():
    try:
        from init_db import init_database
        await init_database()
        return {"status": "ok", "message": "Database schema and seed executed successfully"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}


@app.get("/debug/db-users")
async def debug_db_users():
    from app.database import AsyncSessionLocal
    from app.models import User
    from app.security import verify_password
    from sqlalchemy import select
    
    async with AsyncSessionLocal() as session:
        try:
            res = await session.execute(select(User))
            users = res.scalars().all()
            user_list = []
            for u in users:
                user_list.append({
                    "id": u.id,
                    "employee_id": u.employee_id,
                    "is_active": u.is_active,
                    "password_hash": u.password_hash[:15] if u.password_hash else None,
                    "verify_test": verify_password("password123", u.password_hash) if u.password_hash else False
                })
            return {"count": len(users), "users": user_list}
        except Exception as e:
            return {"error": str(e)}
