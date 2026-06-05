"""
Treadwell Systems Showcase — FastAPI entrypoint.

Serves the JSON API under /api and the built SPA (frontend/dist) via StaticFiles
(same origin). The whole site is login-gated by an auth-gate middleware; the only
public API paths are /api/health and /api/auth/login.

Lifespan runs DB migrations -> seed -> admin bootstrap. The app still starts if
the DB is down (so /api/health reports it) — real queries raise clearly.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

import auth
from config import settings
from routers import admin, auth_router, docs, floors, health, roadmap

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger("roadmap.main")

DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Migrate -> seed -> bootstrap admin. Never crash startup on failure;
    # log loudly so /api/health can report db status.
    try:
        import migrate

        migrate.run()
    except Exception as exc:  # noqa: BLE001
        log.error("migrations failed: %s", exc)
    if settings.RUN_SEED:
        try:
            import seed

            seed.run()
        except Exception as exc:  # noqa: BLE001
            log.error("seed failed: %s", exc)
    try:
        auth.bootstrap_admin()
    except Exception as exc:  # noqa: BLE001
        log.error("admin bootstrap failed: %s", exc)
    yield


app = FastAPI(title="Treadwell Systems Showcase", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(auth.AuthError)
async def _auth_error_handler(request: Request, exc: auth.AuthError):
    return JSONResponse(status_code=exc.status, content={"detail": exc.detail})


@app.middleware("http")
async def auth_gate(request: Request, call_next):
    """Gate every /api/* request (except public paths) by verifying the
    Supabase/Google Bearer token. Non-/api paths pass through to the SPA.
    Bearer tokens aren't sent automatically by the browser, so there's no CSRF
    surface to defend here."""
    path = request.url.path
    if path.startswith("/api/") and not auth.is_public_api_path(path):
        if request.method == "OPTIONS":
            return await call_next(request)
        header = request.headers.get("authorization", "")
        token = header[7:].strip() if header.lower().startswith("bearer ") else ""
        if not token:
            return JSONResponse(status_code=401, content={"detail": "Not authenticated"})
        try:
            request.state.user = auth.resolve_user(token)
        except auth.AuthError as exc:
            return JSONResponse(status_code=exc.status, content={"detail": exc.detail})
        except Exception as exc:  # noqa: BLE001
            log.warning("auth verify failed: %s", exc)
            return JSONResponse(status_code=401, content={"detail": "Could not verify session"})
    return await call_next(request)


# ─── API routers ───────────────────────────────────────────────────────────
app.include_router(health.router, prefix="/api")
app.include_router(auth_router.router, prefix="/api")
app.include_router(floors.router, prefix="/api")
app.include_router(roadmap.router, prefix="/api")
app.include_router(docs.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


# ─── SPA (built frontend) ───────────────────────────────────────────────────
if DIST.is_dir():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def spa(full_path: str):
        # API is handled above; never let the catch-all shadow it.
        if full_path.startswith("api/"):
            return JSONResponse(status_code=404, content={"detail": "Not found"})
        candidate = DIST / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        # Never cache index.html — it references hash-named assets, so the
        # browser must always fetch the latest to pick up new builds.
        return FileResponse(
            DIST / "index.html",
            headers={"Cache-Control": "no-cache, no-store, must-revalidate", "Pragma": "no-cache"},
        )
else:
    log.info("frontend/dist not found — running API-only (SPA served by Vite in dev)")
