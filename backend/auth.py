"""
Authentication — reuses Treadwell's Supabase/Google sign-in (same as the
Proposal Tool). The SPA signs in with Google via Supabase and sends the access
token as `Authorization: Bearer <jwt>`. We verify it (RS256 via the project's
JWKS, falling back to the legacy HS256 secret), gate to @wetreadwell.com, and
store the role locally in our own Postgres `users` table (auto-provisioned on
first login). No passwords live here.
"""

from __future__ import annotations

import datetime
import logging
from typing import Optional

import jwt
from fastapi import Request
from jwt import PyJWKClient
from sqlalchemy import text

from config import settings
from db import connect

log = logging.getLogger("roadmap.auth")

# Public API paths (no token required).
PUBLIC_API_PATHS = {"/api/health", "/api/auth/config", "/api/auth/dev-login"}

# DEV-ONLY signing secret for the "Preview as admin" bypass. Tokens signed with
# it are ONLY accepted when settings.DEV_LOGIN is true (never in production).
_DEV_SECRET = "treadwell-roadmap-dev-login-only"

_jwks_client: Optional[PyJWKClient] = None


class AuthError(Exception):
    def __init__(self, status: int, detail: str):
        self.status = status
        self.detail = detail
        super().__init__(detail)


def _allowed_domain(email: str) -> bool:
    return email.lower().endswith("@" + settings.AUTH_ALLOWED_DOMAIN.lower())


def _get_jwks() -> Optional[PyJWKClient]:
    global _jwks_client
    if _jwks_client is None and settings.SUPABASE_URL:
        url = settings.SUPABASE_URL.rstrip("/") + "/auth/v1/.well-known/jwks.json"
        try:
            _jwks_client = PyJWKClient(url)
        except Exception as exc:  # noqa: BLE001
            log.warning("could not init JWKS client: %s", exc)
    return _jwks_client


def verify_supabase_jwt(token: str) -> dict:
    """Verify a Supabase access token. Tries asymmetric (JWKS) first, then the
    legacy HS256 project secret. Returns the claims, or raises AuthError."""
    # 1) Asymmetric (RS256/ES256) via the project JWKS.
    client = _get_jwks()
    if client is not None:
        try:
            key = client.get_signing_key_from_jwt(token).key
            return jwt.decode(token, key, algorithms=["RS256", "ES256"], audience="authenticated")
        except Exception:  # noqa: BLE001 — fall through to HS256
            pass
    # 2) Legacy symmetric HS256 secret.
    if settings.SUPABASE_JWT_SECRET:
        try:
            return jwt.decode(token, settings.SUPABASE_JWT_SECRET,
                              algorithms=["HS256"], audience="authenticated")
        except jwt.ExpiredSignatureError:
            raise AuthError(401, "Session expired — sign in again")
        except jwt.InvalidTokenError:
            pass  # not a Supabase HS256 token; maybe a dev token below
    # 3) DEV-ONLY preview token (gated by DEV_LOGIN; never accepted in prod).
    if settings.DEV_LOGIN:
        try:
            return jwt.decode(token, _DEV_SECRET, algorithms=["HS256"], audience="authenticated")
        except jwt.ExpiredSignatureError:
            raise AuthError(401, "Session expired — sign in again")
        except jwt.InvalidTokenError:
            pass
    raise AuthError(401, "Sign-in is not configured on the server yet")


def make_dev_token() -> str:
    """Mint a 12h DEV preview token for the first admin email. DEV_LOGIN only."""
    email = (next(iter(settings.admin_email_set), None) or "admin@" + settings.AUTH_ALLOWED_DOMAIN)
    now = datetime.datetime.now(datetime.timezone.utc)
    return jwt.encode(
        {"sub": "dev-preview", "email": email, "aud": "authenticated",
         "iat": now, "exp": now + datetime.timedelta(hours=12)},
        _DEV_SECRET, algorithm="HS256",
    )


def resolve_user(token: str) -> dict:
    """Verify the token, enforce the domain, and look up / provision the local
    role. Returns {id, email, role}."""
    claims = verify_supabase_jwt(token)
    email = (claims.get("email") or "").strip().lower()
    if not email:
        raise AuthError(403, "No email on this account")
    if not _allowed_domain(email):
        raise AuthError(403, f"Use your @{settings.AUTH_ALLOWED_DOMAIN} account")

    with connect() as conn:
        row = conn.execute(
            text("select id, role, status, full_name from users where email = :e"),
            {"e": email},
        ).mappings().first()
        if row is None:
            # New @wetreadwell.com users default to read-only 'viewer'. An admin
            # promotes trusted people to 'member' (can edit) or 'admin' explicitly.
            role = "admin" if email in settings.admin_email_set else "viewer"
            new = conn.execute(
                text("insert into users (email, full_name, role, status, last_login_at) "
                     "values (:e, :n, :r, 'active', now()) returning id"),
                {"e": email, "n": claims.get("user_metadata", {}).get("full_name"), "r": role},
            ).mappings().first()
            log.info("provisioned user %s as %s", email, role)
            return {"id": str(new["id"]), "email": email, "role": role}
        if row["status"] == "disabled":
            raise AuthError(403, "Your access has been disabled")
        conn.execute(text("update users set last_login_at = now() where id = :id"), {"id": row["id"]})
        return {"id": str(row["id"]), "email": email, "role": row["role"]}


# ─── request helpers ───────────────────────────────────────────────────────
def current_user(request: Request) -> Optional[dict]:
    return getattr(request.state, "user", None)


def require_user(request: Request) -> dict:
    user = current_user(request)
    if not user:
        raise AuthError(401, "Not authenticated")
    return user


def require_editor(request: Request) -> dict:
    """Any editor — admin or member — may add / edit / star / delete projects.
    Read-only 'viewer' accounts are rejected."""
    user = require_user(request)
    if user.get("role") not in ("admin", "member"):
        raise AuthError(403, "Your account is view-only")
    return user


def require_admin(request: Request) -> dict:
    user = require_user(request)
    if user.get("role") != "admin":
        raise AuthError(403, "Admin only")
    return user


def is_public_api_path(path: str) -> bool:
    return path in PUBLIC_API_PATHS


def bootstrap_admin() -> None:
    """Ensure the configured admin emails exist with the admin role (idempotent).
    Lets the primary admin manage users before anyone else has logged in."""
    emails = settings.admin_email_set
    if not emails:
        return
    with connect() as conn:
        for email in emails:
            exists = conn.execute(text("select 1 from users where email = :e"), {"e": email}).first()
            if not exists:
                conn.execute(
                    text("insert into users (email, role, status) values (:e, 'admin', 'active')"),
                    {"e": email},
                )
                log.info("bootstrapped admin %s", email)


def can_modify_account(actor: dict, target_user: dict) -> tuple[bool, str]:
    """Anti-lockout: an admin can't disable/delete themselves or a configured admin email."""
    if str(actor["id"]) == str(target_user["id"]):
        return False, "You can't disable or delete your own account."
    if target_user.get("email", "").lower() in settings.admin_email_set:
        return False, "The primary admin account is protected."
    return True, ""
