# syntax=docker/dockerfile:1
# ─────────────────────────────────────────────────────────────────────────
# Treadwell Systems Showcase — multi-stage image.
#   Stage 1 (node:20-slim):    build the Vite/React SPA -> frontend/dist
#   Stage 2 (python:3.11-slim): FastAPI runtime serving the API on :8892 and
#                               the built SPA via StaticFiles.
# No AI / claude CLI here (unlike the News Feed) — this app is CRUD + docs only.
# ─────────────────────────────────────────────────────────────────────────

# ── Stage 1: build the frontend ───────────────────────────────────────────
FROM node:20-slim AS frontend-builder
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY frontend/ ./
RUN npm run build


# ── Stage 2: python runtime ───────────────────────────────────────────────
FROM python:3.11-slim AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# tini for clean signal handling; curl for the healthcheck. psycopg[binary]
# bundles libpq, so no system postgres client libs are required.
RUN apt-get update \
    && apt-get install -y --no-install-recommends tini curl ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./

# Built SPA from stage 1 -> ../frontend/dist (FastAPI StaticFiles mounts this).
COPY --from=frontend-builder /build/frontend/dist /app/frontend/dist

EXPOSE 8892

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8892"]
