"""
Application configuration via pydantic-settings.

All settings have safe defaults so the app can import/start even before the DB
is reachable (the health endpoint stays green; real queries raise clearly).
Working directory is `backend/`, so this is imported as top-level `config`.
"""

from __future__ import annotations

from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ─── Database ────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+psycopg://roadmap:roadmap@127.0.0.1:5433/roadmap"

    # ─── Auth (Supabase / Google — reuses Treadwell's sign-in) ───────────
    # The Supabase project whose Google sign-in we trust (the Proposal Tool's).
    SUPABASE_URL: str = ""               # https://<ref>.supabase.co  (for JWKS + frontend)
    SUPABASE_ANON_KEY: str = ""          # public anon key (sent to the SPA)
    SUPABASE_JWT_SECRET: str = ""        # legacy HS256 secret (fallback verification)
    AUTH_ALLOWED_DOMAIN: str = "wetreadwell.com"
    # Emails that get the admin role on first login (comma-separated).
    ADMIN_EMAILS: str = "hanz@wetreadwell.com"
    # DEV-ONLY: enables a "Preview as admin" sign-in that bypasses Google.
    # MUST stay false in production (never set in the prod .env).
    DEV_LOGIN: bool = False

    # ─── Environment / CORS ──────────────────────────────────────────────
    ENVIRONMENT: str = "production"
    PUBLIC_BASE_URL: str = "http://localhost:8892"
    CORS_ORIGINS: str = "http://localhost:5174,http://localhost:8892"

    # ─── Seeding ─────────────────────────────────────────────────────────
    RUN_SEED: bool = True

    # ─── Derived ─────────────────────────────────────────────────────────
    @property
    def cors_origins_list(self) -> List[str]:
        raw = self.CORS_ORIGINS or ""
        return [o.strip() for o in raw.split(",") if o.strip()] or ["http://localhost:5174"]

    @property
    def admin_email_set(self) -> set[str]:
        return {e.strip().lower() for e in (self.ADMIN_EMAILS or "").split(",") if e.strip()}


settings = Settings()
