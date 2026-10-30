from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text

from app.config import settings

engine = create_async_engine(settings.database_url, echo=False, pool_size=10, max_overflow=20)
AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)

Base = declarative_base()


async def get_db():
    """
    Plain DB session dependency (no RLS context set).
    Use get_db_for_user instead inside authenticated routes.
    """
    async with AsyncSessionLocal() as session:
        yield session


async def get_db_for_user(user_id: int):
    """
    Yields a session where app.current_user_id is set for the duration of the
    transaction. This is what Postgres Row Level Security policies read via
    fn_current_user_id() (see sql/02_rls_policies.sql). Because it's SET LOCAL,
    it automatically resets at transaction end -- it can never leak across
    requests/connections in the pool.
    """
    async with AsyncSessionLocal() as session:
        async with session.begin():
            await session.execute(text("SET LOCAL app.current_user_id = :uid"), {"uid": str(user_id)})
            yield session
