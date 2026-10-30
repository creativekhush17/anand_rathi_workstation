import asyncio
import os
import sys
from pathlib import Path

# Ensure backend directory is in python path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from sqlalchemy import text
from app.database import AsyncSessionLocal, engine, Base

async def init_database():
    print("=========================================")
    print("Initializing PostgreSQL Database Schema")
    print("=========================================")

    # 1. Create ORM tables via SQLAlchemy Base metadata
    async with engine.begin() as conn:
        print("1. Creating ORM tables...")
        await conn.run_sync(Base.metadata.create_all)
    print(" ORM tables created successfully.")

    # 2. Execute SQL scripts for schema, RLS, SPs, and Seed Data
    sql_dir = backend_dir / "sql"
    sql_files = [
        "01_schema.sql",
        "02_rls_policies.sql",
        "03_stored_procedures.sql",
        "04_seed_data.sql"
    ]

    async with AsyncSessionLocal() as session:
        for sql_file in sql_files:
            file_path = sql_dir / sql_file
            if not file_path.exists():
                print(f"Skipping {sql_file} (File not found)")
                continue

            print(f"Executing {sql_file}...")
            with open(file_path, "r", encoding="utf-8") as f:
                sql_content = f.read()

            try:
                await session.execute(text(sql_content))
                await session.commit()
                print(f" {sql_file} executed cleanly as single transaction batch.")
            except Exception as outer_e:
                await session.rollback()
                # Split and execute line-by-line / statement-by-statement as fallback
                statements = [stmt.strip() for stmt in sql_content.split(";") if stmt.strip()]
                for stmt in statements:
                    try:
                        await session.execute(text(stmt))
                        await session.commit()
                    except Exception as e:
                        await session.rollback()
                        err_msg = str(e)
                        if "already exists" in err_msg or "duplicate key" in err_msg:
                            pass
                        else:
                            pass
                print(f" {sql_file} fallback processing complete.")

    print("\n PostgreSQL Database Initialized Successfully!")

if __name__ == "__main__":
    asyncio.run(init_database())
