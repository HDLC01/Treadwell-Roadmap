# Deploy — roadmap.wetreadwell.com

> Golden rule: **test locally first**, deploy only after Hanz approves. Separate from the
> proposal tool (`/opt/treadwell`) and news feed (`/opt/treadwell-newsfeed`).

## 1. DNS (Bluehost, wetreadwell.com zone)
Add an A-record `roadmap` → `50.6.110.215`. Verify: `dig +short roadmap.wetreadwell.com`.

## 2. First-time setup on the VPS
```bash
ssh -i ~/.ssh/treadwell_vps root@50.6.110.215
mkdir -p /opt/treadwell-roadmap && cd /opt/treadwell-roadmap
git clone https://github.com/HDLC01/Treadwell-Roadmap.git .
cp backend/.env.example .env && nano .env
#   POSTGRES_PASSWORD=<openssl rand -hex 24>
#   DATABASE_URL is set from POSTGRES_PASSWORD by docker-compose (host=db)
#   JWT_SECRET=<openssl rand -hex 32>
#   SEED_ADMIN_PASSWORD=<initial admin password — change after first login>
#   ENVIRONMENT=production
#   PUBLIC_BASE_URL=https://roadmap.wetreadwell.com
#   CORS_ORIGINS=https://roadmap.wetreadwell.com
```

## 3. Build + run (Postgres + app; migrations + seed run automatically)
```bash
docker compose up -d --build
docker compose logs -f app           # watch "applied 00X_*.sql", "seeded ... floors"
curl -fsS http://127.0.0.1:8892/api/health    # {"status":"ok","db":"ok"}
```

## 4. nginx + TLS
```bash
cp deploy/nginx-roadmap.conf /etc/nginx/sites-available/roadmap.wetreadwell.com
ln -sf /etc/nginx/sites-available/roadmap.wetreadwell.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d roadmap.wetreadwell.com --redirect --non-interactive --agree-tos -m hanz@wetreadwell.com
curl -fsS https://roadmap.wetreadwell.com/api/health
```

## 5. Update flow
```bash
cd /opt/treadwell-roadmap && git pull && docker compose up -d --build
docker compose logs -f --tail=100 app
```
New `migrations/NNN_*.sql` apply automatically on startup; the `pgdata` volume persists.

## 6. Backup / restore
```bash
# Backup (run before risky migrations; good as a daily cron)
docker compose exec db pg_dump -U roadmap roadmap > backups/roadmap_$(date +%F).sql
# Restore
cat backups/roadmap_YYYY-MM-DD.sql | docker compose exec -T db psql -U roadmap roadmap
```

## Notes
- The app binds `127.0.0.1:8892`; Postgres is **not** published to the host (only on the
  compose network). nginx is the sole public surface.
- Re-seed docs from the authored markdown without clobbering edits:
  `docker compose exec app python -m seed --force-docs`.
