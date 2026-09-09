# API Reference

All routes live under `app/api/**`. Every response is JSON, shaped `{ "data": ... }` on success or `{ "error": "message", ...extra }` on failure (`lib/api-response.ts`). Mutating routes validate their body with `zod` (`lib/validation/**`) and return `400` with `{ error, issues }` on a validation failure.

**Auth column**: `none` = no session required · `alumni` = requires a valid `ipam_alumni_session` cookie · `admin` = requires a valid `ipam_admin_session` cookie (enforced by `middleware.ts` for every `/api/admin/*` route before the handler even runs).

**RBAC column** (admin routes only): `module.capability` checked by `requirePermission()` inside the handler. A request that fails this check gets `403 Forbidden`; a request with no admin session at all gets `401` from `middleware.ts` before reaching the handler.

## Health

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | none | Liveness probe. Returns `{ status, app, timestamp, framework, db: "ok"|"error" }` — `db` reflects a live `SELECT 1` via Prisma, used as the Docker healthcheck target. |

## Auth — Alumni

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/alumni/register` | none | Create an `AlumniUser` + linked `AlumniMember` profile in one transaction. Body: `{ email, password, studentId, name, classYear, degree, major, currentRole?, company?, location?, country?, industry?, bio? }`. Sets the `ipam_alumni_session` cookie on success. |
| POST | `/api/auth/alumni/login` | none | Body: `{ email, password }`. Sets the session cookie, returns the user + profile. |
| POST | `/api/auth/alumni/logout` | alumni | Clears the session cookie. |
| GET | `/api/auth/alumni/me` | alumni | Returns the current `AlumniUser` + `AlumniMember` profile, or `401`. |

## Auth — Admin

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/admin/login` | none | Body: `{ email, password }`. Rejects non-`ACTIVE` accounts. Sets the `ipam_admin_session` cookie, updates `lastLoginAt`/`lastLoginIp`, writes an audit log (`SECURITY_RBAC`), returns the admin + resolved effective permissions. |
| POST | `/api/auth/admin/logout` | admin | Clears the admin session cookie. |
| GET | `/api/auth/admin/me` | admin | Returns the current `AdminUser` + role + resolved effective permissions (see [`docs/RBAC.md`](RBAC.md) for how overrides merge), or `401`. |

## Public — Alumni Directory

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/alumni` | none | List `AlumniMember`s. |
| GET | `/api/alumni/[id]` | none | One alumni profile. |

## Public — Jobs (alumni self-posted, model `JobOpening`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/jobs` | none | List job openings. |
| GET | `/api/jobs/[id]` | none | One job detail. |
| POST | `/api/jobs` | alumni | Post a job as the current alumni. Body (`createJobSchema`): `{ title, company, companyLogo?, location, type: FULL_TIME\|PART_TIME\|CONTRACT\|REMOTE, workplaceType?: REMOTE\|HYBRID\|ON_SITE, salary, category: ENGINEERING\|DATA_AI\|FINANCE_BANKING\|OPERATIONS\|PRODUCT_DESIGN\|LEGAL_PUBLIC_POLICY, description, responsibilities?[], requirements[], benefits?[], aboutCompany?, deadline, applyUrl? }`. |
| POST | `/api/jobs/[id]/save` | alumni | Toggle a `SavedJob` row for the current alumni. |

> Note: this is a **separate model** from the admin-managed recruiting pipeline below (`AdminJobListing`) — see [`docs/SCHEMA.md`](SCHEMA.md).

## Public — Events

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/events` | none | List events. |
| GET | `/api/events/[id]` | none | One event detail. |
| POST | `/api/events/[id]/register` | alumni | Register the current alumni (`registerForEventSchema`: `{ guestName? }`). Enforces `capacity`; idempotent per `(eventId, userId)` via a unique constraint. |

## Public — Businesses

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/businesses` | none | List alumni-owned businesses. |
| GET | `/api/businesses/[id]` | none | One business detail. |
| POST | `/api/businesses` | alumni | Submit a business (`createBusinessSchema`): `{ name, founders, classYear, category, industry, tagline?, description, about?, services?[], yearFounded?, companySize?, website, image?, logo?, location, contactEmail, contactPhone?, linkedin?, certifications?[] }`. |

## Public — Donations

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/donations` | none / alumni | Lists recent donations (`take: 100`). With `?mine=true`, requires an alumni session and returns only that alumni's donations. |
| POST | `/api/donations` | none (session optional) | Records a donation (`createDonationSchema`: `{ donorName, donorEmail, amount, currency?, fund }`). If an alumni session is present, `userId` is set; guest giving is allowed. **Stubbed payment**: generates a `paymentRef` and sets `status: SUCCEEDED` immediately — no real gateway. Also creates a linked `Transaction` row (`status: SETTLED`) so Finance stays the single source of truth for money movement. |

## Admin — Alumni Directory & Verification

| Method | Path | RBAC | Purpose |
|---|---|---|---|
| GET | `/api/admin/directory` | `DIRECTORY.canRead` | List `AlumniRecord`s. |
| POST | `/api/admin/directory` | `DIRECTORY.canWrite` | Create a record (`createAlumniRecordSchema`). |
| GET | `/api/admin/directory/[id]` | `DIRECTORY.canRead` | One record. |
| PATCH | `/api/admin/directory/[id]` | `DIRECTORY.canWrite` | Update (`updateAlumniRecordSchema`, includes `authStatus`, `status`, `digitalPassIssued`). |
| DELETE | `/api/admin/directory/[id]` | `DIRECTORY.canDelete` | Delete a record. |
| PATCH | `/api/admin/directory/[id]/approve` | `DIRECTORY.canApprove` | Approves the record; writes an audit log (`ALUMNI_VERIFICATION`). |

## Admin — ID Card Issuance Desk

| Method | Path | RBAC | Purpose |
|---|---|---|---|
| GET | `/api/admin/id-cards` | `ID_CARDS.canRead` | List orders. |
| POST | `/api/admin/id-cards` | `ID_CARDS.canWrite` | Create an order (`createIdCardOrderSchema`: `{ alumniRecordId?, studentName, regNo, deliveryAddress, courierType, cardTier, faculty?, degree?, gradYear? }`). |
| GET | `/api/admin/id-cards/[id]` | `ID_CARDS.canRead` | One order. |
| PATCH | `/api/admin/id-cards/[id]` | `ID_CARDS.canWrite` | Update status/tracking/notes (`updateIdCardOrderSchema`). Status changes auto-stamp the relevant date field and write an audit log (`SMART_ID_BUREAU`) — see the worked example in [`docs/ARCHITECTURE.md`](ARCHITECTURE.md). |

## Admin — Omnichannel Broadcast

| Method | Path | RBAC | Purpose |
|---|---|---|---|
| GET / POST | `/api/admin/broadcast/templates` | `BROADCAST.canRead` / `canWrite` | List / create message templates (`createTemplateSchema`). |
| PATCH / DELETE | `/api/admin/broadcast/templates/[id]` | `BROADCAST.canWrite` / `canDelete` | Update / delete a template. |
| GET / POST | `/api/admin/broadcast/audience-groups` | `BROADCAST.canRead` / `canWrite` | List / create audience groups (`createAudienceGroupSchema`: `{ name, description, criteria: { faculties?, cohorts?, authStatuses?, chapter?, digitalPassOnly? }, estimatedCount? }`). |
| DELETE | `/api/admin/broadcast/audience-groups/[id]` | `BROADCAST.canDelete` | Delete a group. |
| GET | `/api/admin/broadcast/records` | `BROADCAST.canRead` | Broadcast send history. |
| POST | `/api/admin/broadcast/records` | `BROADCAST.canWrite` | "Send" a broadcast (`sendBroadcastSchema`). **Stubbed**: creates a `BroadcastRecord` immediately with `status: DELIVERED` and a fabricated delivery rate/cost — no real SMS/WhatsApp/Email/Push provider is called. Audit-logged (`OMNICHANNEL_BROADCAST`). |

## Admin — Job Matching & Recruiters (model `AdminJobListing` — separate from public `JobOpening`)

| Method | Path | RBAC | Purpose |
|---|---|---|---|
| GET / POST | `/api/admin/jobs` | `JOBS.canRead` / `canWrite` | List / create admin job listings (`createAdminJobSchema`). |
| GET / PATCH / DELETE | `/api/admin/jobs/[id]` | `JOBS.canRead` / `canWrite` / `canDelete` | Single listing. |
| GET / POST | `/api/admin/jobs/[id]/applications` | `JOBS.canRead` / `canWrite` | List applications for a job / manually register a candidate (`createJobApplicationSchema`). |
| GET / PATCH | `/api/admin/jobs/[id]/applications/[appId]` | `JOBS.canRead` / `canWrite` | One application; status/notes/interview updates (`updateJobApplicationSchema`). |
| POST | `/api/admin/jobs/[id]/applications/[appId]/select` | `JOBS.canApprove` | Record a selection/offer (`selectApplicationSchema`: `{ offerSalary, startDate, decisionStatus: OFFER_EXTENDED\|OFFER_ACCEPTED\|PLACEMENT_CONFIRMED, recruiterRemarks? }`). |
| GET / POST | `/api/admin/employers` | `JOBS.canRead` / `canWrite` | List / create employers (`createEmployerSchema`). |
| GET / PATCH / DELETE | `/api/admin/employers/[id]` | `JOBS.canRead` / `canWrite` / `canDelete` | One employer. |

## Admin — Ads & Commercial Banners

| Method | Path | RBAC | Purpose |
|---|---|---|---|
| GET / POST | `/api/admin/banners` | `COMMERCIAL.canRead` / `canWrite` | List / create sponsor banners (`createBannerSchema`). |
| GET / PATCH / DELETE | `/api/admin/banners/[id]` | `COMMERCIAL.canRead` / `canWrite` / `canDelete` | One banner. |
| PATCH | `/api/admin/banners/[id]/toggle` | `COMMERCIAL.canWrite` | Toggle active/paused. |

## Admin — Subscriptions & Finance

| Method | Path | RBAC | Purpose |
|---|---|---|---|
| GET | `/api/admin/transactions` | `FINANCE.canRead` | List transactions (includes those auto-created by public donations). |
| GET | `/api/admin/transactions/[id]` | `FINANCE.canRead` | One transaction. |
| PATCH | `/api/admin/transactions/[id]/reconcile` | `FINANCE.canApprove` | Marks a transaction `RECONCILED`. Audit-logged (`COMMERCIAL_FINANCE`). |

## Admin — Reports & Analytics

**No dedicated API routes.** `app/admin/(dashboard)/reports/page.tsx` is a Server Component that queries Prisma directly (aggregations for cohort demographics, career placement, financial revenue, ID bureau logistics). Since `PermissionModule` has no dedicated `reports` entry, each tab is gated by the `canExport` capability of the domain module it summarizes: cohort → `DIRECTORY`, career placement → `JOBS`, financial → `FINANCE`, ID bureau → `ID_CARDS`. A tab an admin lacks export rights on simply doesn't render its data.

## Admin — Audit Trails & Security

| Method | Path | RBAC | Purpose |
|---|---|---|---|
| GET | `/api/admin/audit-logs` | `AUDIT_TRAILS.canRead` | List/filter audit log entries (category, severity, status, actor, date range). Read-only — this module is fed entirely by every other module's `writeAuditLog()` calls. |
| GET | `/api/admin/audit-logs/[id]/verify` | `AUDIT_TRAILS.canRead` | Recomputes the HMAC-SHA256 tamper hash for that entry server-side (`AUDIT_HMAC_SECRET` never leaves the server) and compares it to the stored `tamperHash`. Returns `{ valid: boolean }`. See [`docs/RBAC.md`](RBAC.md) for how this mechanism works and how it was verified against real tampering. |

## Admin — RBAC & Access Control

| Method | Path | RBAC | Purpose |
|---|---|---|---|
| GET / POST | `/api/admin/rbac/roles` | `RBAC_GOVERNANCE.canRead` / `canWrite` | List roles (with permissions) / create a role (`createRoleSchema`: full 10-module × 5-capability grid). |
| GET / PATCH / DELETE | `/api/admin/rbac/roles/[id]` | `RBAC_GOVERNANCE.canRead` / `canWrite` / `canDelete` | One role. PATCH replaces its `RoleModulePermission` rows and audit-logs a `beforeState`/`afterState` diff (`SECURITY_RBAC`). DELETE refuses `isSystemDefault` roles and roles with assigned users. |
| GET / POST | `/api/admin/rbac/users` | `RBAC_GOVERNANCE.canRead` / `canWrite` | List admin users / create one (`createAdminUserSchema`, requires a real initial password — there's no invite-by-email flow). |
| GET / PATCH | `/api/admin/rbac/users/[id]` | `RBAC_GOVERNANCE.canRead` / `canWrite` | One admin user. PATCH handles role reassignment, status change, and `customPermissionOverrides` edits. **No DELETE** — `AuditLogEntry.actorAdminId` references admins, so removal is via `status: SUSPENDED` (soft-delete) rather than destroying history. |

## Admin — IPAM API Sync & Logs

| Method | Path | RBAC | Purpose |
|---|---|---|---|
| GET | `/api/admin/sis-sync` | `SIS_SYNC.canRead` | List `SisSyncLog` rows. |
| POST | `/api/admin/sis-sync/trigger` | `SIS_SYNC.canWrite` | **Stubbed**: fabricates one plausible log row (randomized node/operation/recordsSynced/latency/status). No real SIS is contacted. Audit-logged (`SYSTEM_CORE`). |

## Admin — System Settings

| Method | Path | RBAC | Purpose |
|---|---|---|---|
| GET | `/api/admin/settings` | `SYSTEM_SETTINGS.canRead` | Current `SystemSetting` key/value rows (currently just `defaultTheme`). |
| PUT | `/api/admin/settings` | `SYSTEM_SETTINGS.canWrite` | Upsert settings (`updateSettingsSchema`: `{ defaultTheme?: "dark"|"light" }`). Audit-logged (`SYSTEM_CORE`). This is the org-wide default; each admin's browser also keeps a personal `localStorage` override. |

## Admin — RBAC smoke test

| Method | Path | RBAC | Purpose |
|---|---|---|---|
| GET | `/api/admin/rbac-ping` | `SYSTEM_SETTINGS.canRead` | Trivial route kept as a lightweight "is `requirePermission()` wired correctly" check — not part of any UI flow. |
