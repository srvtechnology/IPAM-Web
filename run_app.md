Running the IPAM Alumni Unified Platform

Option A — Docker (recommended, one command)

cd /Users/rishavkumar/Developer/Work/ipam-alumni-system/ipam-alumni-unified
cp .env.example .env   # then edit the three secrets below
docker compose up --build

Before starting, edit .env and replace the three placeholder secrets with real random values:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
Run that three times for JWT_ALUMNI_SECRET, JWT_ADMIN_SECRET, AUDIT_HMAC_SECRET.

On startup the app container automatically runs prisma migrate deploy then seeds demo data (unless SEED_DEMO_USERS=false), so the stack is fully populated on first boot.

What comes up:

┌─────────┬───────────────────────┬─────────────────────────────────────────────────┐
│ Service │          URL          │                     Purpose                     │
├─────────┼───────────────────────┼─────────────────────────────────────────────────┤
│ App     │ http://localhost:3000 │ Public site at /, admin at /admin/login         │
├─────────┼───────────────────────┼─────────────────────────────────────────────────┤
│ Adminer │ http://localhost:8080 │ Browse the MySQL DB (server: mysql, user: ipam) │
├─────────┼───────────────────────┼─────────────────────────────────────────────────┤
│ MySQL   │ localhost:3306        │ Direct DB access if needed                      │
└─────────┴───────────────────────┴─────────────────────────────────────────────────┘

Stop with docker compose down (add -v only if you want to wipe the DB volume and reseed from scratch).

Option B — Local dev (no Docker, faster iteration)

Requires a local MySQL instance running.

cd /Users/rishavkumar/Developer/Work/ipam-alumni-system/ipam-alumni-unified
pnpm install
cp .env.example .env   # set DATABASE_URL to your local MySQL + the 3 secrets as above
pnpm prisma:generate
pnpm prisma:migrate     # creates schema
pnpm prisma:seed        # seeds demo data
pnpm dev                # http://localhost:3000

Other useful scripts: pnpm prisma:studio (DB GUI), pnpm build && pnpm start (production mode), pnpm lint (typecheck).

Demo credentials (password Password123! for all)

┌─────────────────┬─────────────────────────┬─────────────────────────────────────────────────────────────────────────────────────────┐
│     Account     │          Email          │                                         Access                                          │
├─────────────────┼─────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────┤
│ Alumni          │ demo.alumni@ipam.edu    │ Public portal — directory, jobs, events, giving, virtual pass                           │
├─────────────────┼─────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────┤
│ Admin (full)    │ demo.admin@ipam.edu     │ Super Administrator — all 12 admin modules                                              │
├─────────────────┼─────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────┤
│ Admin (limited) │ demo.registrar@ipam.edu │ Registrar role — directory + ID cards only, good for seeing RBAC restrictions in action │
└─────────────────┴─────────────────────────┴─────────────────────────────────────────────────────────────────────────────────────────┘

Where to go

- Public site: /, /directory, /jobs, /events, /businesses, /giving, /about, /pass
- Admin: /admin/login, then Overview, Directory & Verification, ID Cards, Broadcast, Jobs & Recruiters, Commercial Banners, Finance, Reports, Audit Trails, RBAC, SIS Sync, Settings — all in the sidebar (only modules your logged-in role has access to are shown).