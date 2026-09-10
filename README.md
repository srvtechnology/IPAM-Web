# IPAM Alumni Unified Platform

A single Next.js application serving both the **IPAM Alumni Association's public portal** (networking, directory, jobs, events, alumni businesses, giving, digital ID pass) and its **admin back-office** (alumni verification, ID card issuance, omnichannel broadcasts, recruiting, sponsor management, finance, reporting, audit/security, and role-based access control). Backed by a real Prisma/MySQL schema, JWT authentication, and enforced RBAC — no mock data, no fake auth.

This project unifies two previously separate frontend prototypes (a public Next.js site and a standalone admin React UI) into one codebase with a real backend.

## Who this is for

- **Alumni** use the public site to find classmates, browse jobs and events, discover alumni-owned businesses, donate, and carry a digital alumni ID (QR pass).
- **Registrar / admin staff** use the back office to verify alumni records, issue physical/digital ID cards, run recruiting pipelines, manage sponsor banners and finance, send broadcasts, and govern who on staff can do what (RBAC), with every sensitive action recorded in a tamper-evident audit log.

## Architecture at a glance

One Next.js App Router app, split into two route groups with **intentionally separate visual themes** that never bleed into each other:

- `app/(public)/**` — the alumni-facing site (emerald/teal theme).
- `app/admin/(dashboard)/**` — the authenticated admin back office (a Material3-inspired dark theme, scoped under a `[data-admin-theme]` wrapper — see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for why this scoping matters).
- `app/admin/login` — sits outside the authenticated shell.
- `app/api/**` — all backend routes: `auth/*` (alumni + admin), public domain (`alumni`, `jobs`, `events`, `businesses`, `donations`), and `admin/*` (RBAC-gated back-office CRUD).

Data layer: **Prisma + MySQL** (`prisma/schema.prisma`). Auth: **JWT in httpOnly cookies**, two entirely separate identities (alumni vs. admin — different cookie names, different signing secrets, different payload shapes). Authorization: a real RBAC model (10 permission modules × 5 capabilities per role, with per-admin overrides), enforced server-side on every mutating route via `requirePermission()`. Every meaningful admin action is written to an audit log with a real HMAC-SHA256 tamper hash.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/API.md`](docs/API.md), [`docs/SCHEMA.md`](docs/SCHEMA.md), and [`docs/RBAC.md`](docs/RBAC.md) for the full depth on each of these.

## Local setup (without Docker)

Requires Node 20+, [pnpm](https://pnpm.io/), and a local MySQL 8 instance.

```bash
pnpm install
cp .env.example .env
# Edit .env: point DATABASE_URL at your local MySQL, and set the three secrets
# (see "Environment variables" below — a one-liner to generate them is included there).

pnpm prisma:generate   # generate the Prisma client
pnpm prisma:migrate    # create the schema in your local DB
pnpm prisma:seed       # seed demo alumni/admin accounts + sample data
pnpm dev                # http://localhost:3000
```

Other useful scripts:

| Script | What it does |
|---|---|
| `pnpm build` | Production build |
| `pnpm start` | Run the production build |
| `pnpm lint` | Type-check the whole project (`tsc --noEmit`) |
| `pnpm prisma:studio` | Open Prisma Studio (DB browser GUI) |
| `pnpm prisma:deploy` | Apply migrations without prompting (used by Docker at container start) |

## Docker setup (recommended)

```bash
cp .env.example .env
# Edit .env and replace the three placeholder secrets with real random values, e.g.:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

docker compose up --build
```

This brings up three services:

| Service | URL | Purpose |
|---|---|---|
| `app` | http://localhost:3000 | The Next.js app — public site at `/`, admin at `/admin/login` |
| `adminer` | http://localhost:8080 | Web-based MySQL browser (server: `mysql`, user: `ipam`) |
| `mysql` | localhost:3306 | The database itself, for direct access if needed |

On container start, `docker/entrypoint.sh` runs `prisma migrate deploy` (applies migrations) and, unless `SEED_DEMO_USERS=false`, seeds demo accounts and sample data — so the stack is fully populated on first boot with no manual steps. `app` waits for MySQL's healthcheck before starting.

Stop with `docker compose down`. Add `-v` only if you want to wipe the database volume and start from a completely empty DB next time.

## Environment variables

All documented in `.env.example`:

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | MySQL connection string. Ignored by Docker Compose, which builds its own from `MYSQL_PASSWORD` | `mysql://ipam:ipam_dev_password@localhost:3306/ipam_alumni` |
| `JWT_ALUMNI_SECRET` | Signing secret for alumni session JWTs. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | 64-char hex string |
| `JWT_ADMIN_SECRET` | Signing secret for admin session JWTs — must differ from the alumni secret | 64-char hex string |
| `AUDIT_HMAC_SECRET` | Key for the audit-log tamper-hash HMAC. Keep this secret — it's never exposed to the client | 64-char hex string |
| `NODE_ENV` | `development` or `production` — also controls the `Secure` cookie flag | `development` |
| `SEED_DEMO_USERS` | Seeds demo alumni/admin accounts + sample data when not `"false"` | `true` |
| `MYSQL_PASSWORD` | Docker Compose only — the `ipam` MySQL user's password | `ipam_dev_password` |
| `MYSQL_ROOT_PASSWORD` | Docker Compose only — MySQL root password (used for healthchecks) | `root_dev_password` |

## Folder structure

```
app/
  (public)/          Public alumni site — home, login, register, directory, jobs, events,
                      businesses, giving, about, pass. Route group (no URL prefix).
  admin/
    login/            Admin login — outside the authenticated shell.
    (dashboard)/      Authenticated admin app: layout.tsx (shell+RBAC), overview, directory,
                      id-cards, broadcast, jobs, commercial, finance, reports, audit-trails,
                      rbac, sync, settings.
  api/
    auth/{alumni,admin}/   Login/register/logout/me for each identity.
    alumni|jobs|events|businesses|donations/   Public domain routes.
    admin/                  RBAC-gated back-office routes, one folder per module.
    health/                 Liveness + DB-connectivity check.
components/
  public/            Client view components for the public site.
  admin/             Client view components for the admin back office, one subfolder per module.
hooks/
  public/, admin/    Client-side fetch hooks — the only place `fetch()` is called from client code.
lib/
  db.ts              Prisma client singleton.
  auth/              JWT signing/verification, password hashing, session cookies.
  auth/permissions.ts  requirePermission() / checkPagePermission() — RBAC enforcement.
  audit.ts           writeAuditLog() + the real HMAC tamper-hash function.
  validation/        zod schemas, one file per domain, used by every mutating route.
  rbac-constants.ts  Human-readable labels for the 10 permission modules.
styles/
  public.css, admin.css   Two independent theme stylesheets — see docs/ARCHITECTURE.md.
prisma/
  schema.prisma, seed.ts, migrations/
docker/
  entrypoint.sh      Runs migrations + seed, then starts the server.
docs/
  ARCHITECTURE.md, API.md, SCHEMA.md, RBAC.md
middleware.ts        Gates /admin/* and /api/admin/* — verifies the admin JWT at the edge.
Dockerfile, docker-compose.yml, .env.example
```

## Demo credentials

Seeded automatically unless `SEED_DEMO_USERS=false`. All passwords: `Password123!`

| Role | Email | Access |
|---|---|---|
| Alumni | `demo.alumni@ipam.edu` | Public portal (Alex Sesay) |
| Super Administrator | `demo.admin@ipam.edu` | All 12 admin modules, all capabilities (Dr. Samuel Koroma) |
| Registrar | `demo.registrar@ipam.edu` | Directory + ID Cards only — a good account for seeing RBAC restrictions in action (Mariatu Sesay) |

A third role, **Finance Officer** (Finance + Commercial), is seeded but has no demo user attached — assign it to a new admin user via the RBAC screen to try it.

## Known limitations / explicitly out of scope

This build focused on real data, real auth, and real RBAC for every module — but several "smart"/external-integration behaviors are intentionally **stubbed**, not connected to a real third party:

- **No password reset flow.** Forgotten admin passwords require a direct DB update or a new admin user.
- **No real 2FA/OTP.** `twoFactorEnforced`/`twoFactorMethod` fields exist on `AdminUser` and render in the RBAC UI, but nothing enforces them at login.
- **No real SSO.** The legacy prototypes' SSO buttons were removed rather than kept as non-functional decoration.
- **Broadcast "send" is stubbed.** It creates a real `BroadcastRecord` row with a fabricated delivery rate/cost — no real SMS/WhatsApp/Email/Push provider is called.
- **SIS Sync is stubbed.** "Trigger Sync" fabricates a plausible `SisSyncLog` row — no real Student Information System integration.
- **Donations have no real payment gateway.** `POST /api/donations` succeeds immediately with a generated payment reference — no real payment processor is involved.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for more detail and a fuller future-work list.

## Deployment

Live at [ipam.billnbite.cloud](https://ipam.billnbite.cloud) (Docker, auto-deployed on push to `main`).
