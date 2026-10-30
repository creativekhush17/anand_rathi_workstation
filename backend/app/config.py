from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
import os


class Settings(BaseSettings):
    database_url: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:Post%40123@localhost:5432/anandrathi_workstation")
    sync_database_url: str = os.getenv("SYNC_DATABASE_URL", "")
    jwt_secret: str = os.getenv("JWT_SECRET", "super_secret_anandrathi_jwt_key_2026_x89f")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 480
    refresh_token_expire_days: int = 7
    env: str = os.getenv("ENV", "production")

    @model_validator(mode="after")
    def assemble_db_urls(self):
        # Auto-convert standard postgres:// or postgresql:// to asyncpg for async engine
        if self.database_url.startswith("postgres://"):
            self.database_url = self.database_url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif self.database_url.startswith("postgresql://") and not self.database_url.startswith("postgresql+asyncpg://"):
            self.database_url = self.database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

        # Ensure sync_database_url is available
        if not self.sync_database_url:
            self.sync_database_url = self.database_url.replace("+asyncpg", "+psycopg2")

        return self

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
