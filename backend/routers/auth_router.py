"""
Auth router.
- GET /auth/config : public — tells the SPA how to reach Supabase (Google sign-in).
- GET /auth/me     : verified — returns the current user's email + local role.

Sign-in/out happens client-side via Supabase; we only verify the resulting token
(see auth.py) on each API call.
"""

from __future__ import annotations

from fastapi import APIRouter, Request

import auth
from config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/config")
def config():
    return {
        "supabase_url": settings.SUPABASE_URL,
        "supabase_anon_key": settings.SUPABASE_ANON_KEY,
        "allowed_domain": settings.AUTH_ALLOWED_DOMAIN,
        "configured": bool(settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY),
        "dev_login": settings.DEV_LOGIN,
    }


@router.post("/dev-login")
def dev_login():
    """DEV-ONLY: issue a preview-admin token without Google. Disabled unless
    DEV_LOGIN is set (never in production)."""
    if not settings.DEV_LOGIN:
        raise auth.AuthError(404, "Not found")
    return {"access_token": auth.make_dev_token()}


@router.get("/me")
def me(request: Request):
    user = auth.require_user(request)
    return {"id": user["id"], "email": user["email"], "role": user["role"]}
