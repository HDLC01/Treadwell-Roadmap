"""Health — public; reports DB reachability without raising."""

from __future__ import annotations

from fastapi import APIRouter

from config import settings
from db import ping

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    return {
        "status": "ok",
        "env": settings.ENVIRONMENT,
        "db": "ok" if ping() else "down",
    }
