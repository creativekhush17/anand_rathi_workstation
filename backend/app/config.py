from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
import os
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse


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
        raw_url = self.database_url

        # Ensure scheme is postgresql+asyncpg for async SQLAlchemy
        if raw_url.startswith("postgres://"):
            raw_url = raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif raw_url.startswith("postgresql://") and not raw_url.startswith("postgresql+asyncpg://"):
            raw_url = raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)

        # Parse query params and sanitize for asyncpg
        # asyncpg does NOT accept sslmode or channel_binding (it accepts ssl=require)
        try:
            parsed = urlparse(raw_url)
            query = parse_qs(parsed.query)

            clean_query = {}
            for k, v in query.items():
                if k == "sslmode":
                    clean_query["ssl"] = ["require"]
                elif k in ("channel_binding", "target_session_attrs"):
                    continue
                else:
                    clean_query[k] = v

            if "neon.tech" in raw_url or "render.com" in raw_url:
                clean_query["ssl"] = ["require"]

            new_query = urlencode(clean_query, doseq=True)
            self.database_url = urlunparse(parsed._replace(query=new_query))
        except Exception:
            self.database_url = raw_url

        # Ensure sync_database_url is available for psycopg2
        if not self.sync_database_url:
            self.sync_database_url = self.database_url.replace("+asyncpg", "+psycopg2").replace("?ssl=require", "?sslmode=require")

        return self

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
