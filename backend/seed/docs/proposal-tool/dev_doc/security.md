# Cybersecurity — Proposal Tool

## Authentication & authorization

- **Google sign-in via Supabase Auth.** The browser gets a JWT; every `/api/*` call
  sends `Authorization: Bearer <jwt>`.
- **Domain gate (defense in depth):** enforced on BOTH sides — `auth.js` signs out any
  non-`@wetreadwell.com` user on the client, and `supabase_client.verify_token_claims()`
  rejects them with `403` on the server. Configurable via `AUTH_ALLOWED_DOMAIN`.
- **Token verification:** supports RS256 (JWKS from Supabase) and legacy HS256; the `exp`
  claim is enforced (expired tokens rejected).
- **Roles:** `profiles.role` ∈ user / admin / super_admin; admin endpoints + the admin page
  are gated server-side and client-side. `hanz@wetreadwell.com` is bootstrapped as super_admin.
- **Anti-lockout:** an admin can't ban/disable their own account; banned users can't generate.

## Data protection

- **Secrets** live only in `/opt/treadwell/.env` (gitignored): Supabase service-role key,
  Dropbox OAuth secrets. Never committed, never sent to the browser.
- **Service-role key stays server-side.** The frontend uses only the anon key for auth;
  all privileged DB access is through the backend. Supabase **RLS** is enabled on all tables.
- **Transport:** HTTPS only (Let's Encrypt); the container is bound to loopback, so the
  only public surface is nginx.

## Surface notes / follow-ups

- The **VPS root password** rotation is an open hardening item (tracked).
- Activity is audited in `events` (who generated what, when) for traceability.
- AI autofill is **rate-limited** (3 / 5 min / project) to bound abuse and cost.
