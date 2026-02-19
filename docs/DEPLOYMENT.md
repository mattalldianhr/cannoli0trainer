# Deployment Guide

Cannoli Trainer deploys to Railway (Node.js + PostgreSQL). This guide covers the full deployment lifecycle and common pitfalls.

## Architecture

```
┌─────────────────────────┐     ┌──────────────────────────┐
│  Railway App Service    │     │  Railway Postgres        │
│  (Node.js)              │────▶│  (PostgreSQL)            │
│                         │     │                          │
│  Build: prisma generate │     │  Internal hostname:      │
│         + next build    │     │  postgres.railway.internal│
│                         │     │                          │
│  Start: prisma migrate  │     │  Public proxy:           │
│         deploy          │     │  maglev.proxy.rlwy.net   │
│         + next start    │     │  (TCP proxy, may timeout)│
└─────────────────────────┘     └──────────────────────────┘
         │
         ▼
  https://cannoli.mattalldian.com
```

## Environment Variables

### Required (Railway Dashboard)

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Railway auto-links from Postgres plugin |
| `AUTH_SECRET` | `openssl rand -base64 32` | NextAuth session encryption |
| `AUTH_URL` | `https://cannoli.mattalldian.com` | Full production URL |
| `SENDGRID_API_KEY` | SendGrid API key | For magic link emails |
| `EMAIL_FROM` | `Cannoli Trainer <noreply@cannoli.mattalldian.com>` | Sender address |

### Optional

| Variable | Value | Notes |
|----------|-------|-------|
| `ENABLE_DEV_LOGIN` | `true` / `false` | Dev bypass login buttons. Set `false` in prod when ready |
| `NEXT_PUBLIC_ENABLE_DEV_LOGIN` | `true` / `false` | Client-side toggle for dev buttons |
| `SEED_ATHLETE_EMAIL` | `matt@mattalldian.com` | Links first athlete to User for auth |
| `SEED_COACH_EMAIL` | `joe@cannolistrength.com` | Links coach to User for auth (default) |

## How Deployment Works

### 1. Push to `main`

Railway auto-deploys on push to `main`. Or trigger manually:

```bash
railway up
```

### 2. Build Phase (Railway runs `npm run build`)

```
prisma generate    →  Generates Prisma client from schema
next build         →  Compiles Next.js production bundle
```

### 3. Start Phase (Railway runs `npm run start`)

```
prisma migrate deploy  →  Applies pending migrations from prisma/migrations/
next start             →  Starts production server
```

### 4. Health Check

Railway pings `GET /api/health` (60s timeout). Returns `{ status: "ok", db: "connected" }` if Postgres is reachable.

## Database Operations

### The `railway run` vs `railway connect` Problem

**`railway run <command>`** injects Railway env vars but runs code **locally**. The `DATABASE_URL` uses `postgres.railway.internal` which is only reachable from within Railway's network. This means:

```bash
# WILL FAIL — runs Prisma locally, can't reach internal hostname
railway run npx prisma db seed
railway run npx tsx scripts/my-script.ts

# WORKS — connects via Railway's TCP proxy using psql
railway connect postgres
```

### Running SQL Directly

Use `railway connect postgres` for direct database operations:

```bash
# Interactive SQL session
railway connect postgres

# Piped SQL (non-interactive)
railway connect postgres <<'SQL'
SELECT * FROM "Coach";
SQL
```

**Gotcha:** The TCP proxy (`maglev.proxy.rlwy.net`) can be flaky — connections may time out on the first attempt. Retry if you get `Operation timed out`.

### Running Migrations

Migrations run automatically on every deploy via `prisma migrate deploy` in the start script. No manual migration step needed.

To check migration status:

```bash
railway connect postgres <<'SQL'
SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;
SQL
```

### Seeding

The seed script (`npx prisma db seed`) **cannot be run via `railway run`** because it uses Prisma which needs the internal DATABASE_URL. Options:

**Option A: Direct SQL via `railway connect postgres`**

```bash
# Example: Link coach to User record
railway connect postgres <<'SQL'
INSERT INTO "User" (id, email, name, "emailVerified")
VALUES (gen_random_uuid(), 'joe@cannolistrength.com', 'Joe Cristando', NOW())
ON CONFLICT (email) DO UPDATE SET name = 'Joe Cristando'
RETURNING id;

UPDATE "Coach"
SET "userId" = (SELECT id FROM "User" WHERE email = 'joe@cannolistrength.com')
WHERE email = 'joe@cannolistrength.com' AND "userId" IS NULL;
SQL
```

**Option B: One-off Railway service** (for complex seed operations)

Create a temporary one-off service in Railway that runs the seed, using the same Postgres plugin reference. Delete after seeding.

## Common Deployment Issues

### 1. Migration Not Applied

**Symptom:** `column "userId" does not exist` errors after deploy.

**Cause:** The deploy used a cached image or the migration file wasn't committed to git.

**Fix:** Verify the migration file exists in `prisma/migrations/`, commit it, push again. Check deploy logs for `Applying migration ...` confirmation.

```bash
railway logs -n 30
# Look for: "X migrations found" and "Applying migration ..."
```

### 2. Coach/Athlete Not Linked to User

**Symptom:** Dev login fails, `getCurrentCoachId()` falls back to first coach (log warning: "No coachId in session").

**Cause:** The `Coach.userId` or `Athlete.userId` is NULL — no User record linked.

**Fix:** Run the linking SQL via `railway connect postgres`:

```bash
# Check current state
railway connect postgres <<'SQL'
SELECT c.name, c."userId", u.email
FROM "Coach" c
LEFT JOIN "User" u ON c."userId" = u.id;
SQL

# Link if needed
railway connect postgres <<'SQL'
INSERT INTO "User" (id, email, name, "emailVerified")
VALUES (gen_random_uuid(), 'joe@cannolistrength.com', 'Joe Cristando', NOW())
ON CONFLICT (email) DO NOTHING;

UPDATE "Coach"
SET "userId" = (SELECT id FROM "User" WHERE email = 'joe@cannolistrength.com')
WHERE email = 'joe@cannolistrength.com' AND "userId" IS NULL;
SQL
```

### 3. TCP Proxy Timeout on `railway connect postgres`

**Symptom:** `connection to server at "maglev.proxy.rlwy.net" ... failed: Operation timed out`

**Cause:** Railway's public TCP proxy for Postgres is flaky.

**Fix:** Retry. If persistent, check Railway's status page or try again in a few minutes.

### 4. Auth Callbacks Fail in Edge Runtime

**Symptom:** Middleware crashes with Prisma errors.

**Cause:** The `auth()` wrapper runs in Edge Runtime for middleware. Prisma callbacks (`signIn`, `jwt`) must only do DB calls during actual sign-in, never during JWT validation in middleware.

**Current safeguard:** The `jwt` callback only runs Prisma queries when `trigger === "signIn"`. The middleware only decodes the JWT — no Prisma calls.

### 5. Dev Login Not Working

**Symptom:** "Dev Login (Coach)" or "Dev Login (Athlete)" button fails silently.

**Checklist:**
1. `ENABLE_DEV_LOGIN=true` in env vars
2. Coach/Athlete has a linked User record (`userId` not NULL)
3. The `authorize()` function in auth.ts includes `{ user: true }` — if User is null, it returns null
4. Check browser console for errors (login page logs them)

## Deployment Checklist

### First-time Setup

- [ ] Create Railway project with Postgres plugin
- [ ] Set all required environment variables (see table above)
- [ ] Push code to trigger first deploy
- [ ] Verify migration applied: `railway logs -n 30`
- [ ] Verify health check: `curl https://cannoli.mattalldian.com/api/health`
- [ ] Link coach to User record via `railway connect postgres`
- [ ] Link athlete to User record (if SEED_ATHLETE_EMAIL is set, seed handles this)
- [ ] Test login flow

### Subsequent Deploys

- [ ] Push to `main` (or `railway up` for direct deploy)
- [ ] Watch logs: `railway logs -n 30`
- [ ] Confirm migration applied (if any new migrations)
- [ ] Smoke test: visit `https://cannoli.mattalldian.com/`

### After Schema Changes

- [ ] Run `npx prisma migrate dev --name description` locally
- [ ] Commit the migration file in `prisma/migrations/`
- [ ] Push to deploy — migration applies automatically on start
- [ ] If the migration adds required data linking (like Coach-User), run SQL via `railway connect postgres`

## Quick Reference

```bash
# Deploy
git push origin main          # Auto-deploy via Railway
railway up                    # Manual deploy from local

# Logs
railway logs -n 50            # Recent logs

# Database
railway connect postgres      # Interactive psql session

# Status
railway status                # Current project/service/environment

# Env vars
railway run printenv | grep AUTH  # Check env vars (runs locally with Railway env)
```
