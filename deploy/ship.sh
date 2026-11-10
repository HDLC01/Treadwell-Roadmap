#!/usr/bin/env bash
# Off-box deploy for the Treadwell Systems Showcase (roadmap).
#
# The VPS is 1 core / 2 GB; building on it browns out every site. Build the app
# image HERE, ship it over SSH, push the compose file (the VPS dir is NOT a git
# checkout), then load + restart (NO --build). The `db` service is plain
# postgres (no build) and keeps running across the swap.
#
# Prereqs: local Docker engine running; the `treadwell-vps` alias in ~/.ssh/config.
#          The alias supplies the host, port, user and key. It logs in as hanztwell,
#          and the box runs every command, scp and stdin as root via sudo.
# Usage:   bash deploy/ship.sh
#          VPS_HOST / VPS_USER / SSH_KEY still override the target if ever needed.
set -euo pipefail

VPS_HOST="${VPS_HOST:-treadwell-vps}"
VPS_USER="${VPS_USER:-}"
SSH_KEY="${SSH_KEY:-}"
APP_DIR="/opt/treadwell-roadmap"
IMAGE="treadwell-roadmap:latest"
COMPOSE="docker-compose.yml"
SSH_OPTS=(-o ConnectTimeout=20)
if [ -n "$SSH_KEY" ]; then SSH_OPTS+=(-i "$SSH_KEY"); fi
TARGET="${VPS_USER:+${VPS_USER}@}${VPS_HOST}"
SSH=(ssh "${SSH_OPTS[@]}" "$TARGET")

cd "$(dirname "$0")/.."

echo "==> Building $IMAGE locally (off the prod box)…"
docker build --platform linux/amd64 -t "$IMAGE" .

echo "==> Shipping image + compose over SSH…"
docker save "$IMAGE" | gzip | "${SSH[@]}" "cat > /tmp/roadmap.tar.gz"
scp "${SSH_OPTS[@]}" "$COMPOSE" "$TARGET:$APP_DIR/$COMPOSE.new"

echo "==> Load + restart on the VPS (NO build)…"
"${SSH[@]}" "set -euo pipefail
  cd $APP_DIR
  cp -f $COMPOSE $COMPOSE.bak 2>/dev/null || true
  mv -f $COMPOSE.new $COMPOSE
  gunzip -c /tmp/roadmap.tar.gz | docker load
  rm -f /tmp/roadmap.tar.gz
  docker compose up -d
  for i in \$(seq 1 24); do
    if curl -fsS http://localhost:8892/api/health >/dev/null; then echo '   roadmap healthy'; exit 0; fi
    sleep 5
  done
  echo '   post-deploy healthcheck failed'; exit 1
"
echo "==> Done — roadmap.wetreadwell.com is on the freshly-shipped image."
