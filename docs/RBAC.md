# RBAC & Audit

## The permission model

Every admin action is gated by a **module × capability** check. There are 10 modules (the `PermissionModule` enum) and 5 capabilities per module (`canRead`, `canWrite`, `canApprove`, `canExport`, `canDelete`), stored as a `RoleModulePermission` row per `(role, module)` pair.

| Module | Covers | Read | Write | Approve | Export | Delete |
|---|---|:---:|:---:|:---:|:---:|:---:|
| `DIRECTORY` | Alumni Directory & 2-Way Auth — search, verify, approve records | ✓ | ✓ | ✓ | ✓ | ✓ |
| `ID_CARDS` | Smart ID Card Issuance Desk — print queue, RFID, dispatch | ✓ | ✓ | ✓ | ✓ | ✓ |
| `BROADCAST` | Omnichannel Broadcasts — SMS/WhatsApp/Email announcements | ✓ | ✓ | ✓ | ✓ | ✓ |
| `JOBS` | Job Matching & Recruiters — post jobs, review applications, select candidates | ✓ | ✓ | ✓ | ✓ | ✓ |
| `COMMERCIAL` | Ads & Commercial Banners — sponsor scheduling, invoicing | ✓ | ✓ | ✓ | ✓ | ✓ |
| `FINANCE` | Subscriptions & Finance — transactions, reconciliation | ✓ | ✓ | ✓ | ✓ | ✓ |
| `SIS_SYNC` | IPAM SIS & Central Database — sync with university systems | ✓ | ✓ | ✓ | ✓ | ✓ |
| `AUDIT_TRAILS` | Audit Trails & Security Logs — tamper-evident event history | ✓ | ✓ | ✓ | ✓ | ✓ |
| `RBAC_GOVERNANCE` | RBAC & Role Assignment — roles, admin users, permissions | ✓ | ✓ | ✓ | ✓ | ✓ |
| `SYSTEM_SETTINGS` | System Governance — theme defaults, org-wide settings | ✓ | ✓ | ✓ | ✓ | ✓ |

(The table shows all 5 capabilities exist for every module — which ones are actually *granted* is per-role, see seeded roles below. Labels/descriptions are defined in `lib/rbac-constants.ts`.)

Capability meanings, applied consistently across every admin API route:
- **`canRead`** — list/view.
- **`canWrite`** — create/update.
- **`canApprove`** — the specific "approve"/"select"/"reconcile"/"send" style action for that module (e.g. approving an alumni record, selecting a job candidate, reconciling a transaction).
- **`canExport`** — gates the Reports & Analytics tab that summarizes that module's data (see below — Reports has no `PermissionModule` of its own).
- **`canDelete`** — hard delete, where the module supports it (RBAC's admin-user endpoint deliberately has no delete — see "No hard-delete for admin users" below).

## Role vs. per-user overrides — and why edits take effect immediately

An admin's **effective permissions** are their role's `RoleModulePermission` rows, with any `customPermissionOverrides` (a `Json` field on `AdminUser`, shaped `Partial<Record<PermissionModule, Partial<Capability>>>`) merged on top per module/capability (`getEffectivePermissions()` in `lib/auth/permissions.ts`).

Critically, **this resolution happens fresh from the database on every request** — the admin JWT only carries `sub`/`email`/`roleId`/`roleSlug`, never the permission grid itself. This means editing a role's permissions (or a user's overrides) takes effect for that admin's *already-open* session immediately, with no logout/login or token refresh required. This was verified directly during development: a role's permissions were edited mid-session for a logged-in user, and their next request against a previously-403 route immediately succeeded.

## Seeded roles

| Role | Slug | Grants | Represents |
|---|---|---|---|
| Super Administrator | `super-administrator` | All 10 modules, all 5 capabilities (`isSystemDefault: true`) | Executive council / IT governance. Cannot be deleted, and blocking its deletion is enforced at the API level regardless of whether it has assigned users. |
| Registrar | `registrar` | `DIRECTORY` (read/write/approve/export), `ID_CARDS` (read/write/approve/export) | Alumni verification + ID card issuance staff. |
| Finance Officer | `finance-officer` | `FINANCE` (read/write/approve/export), `COMMERCIAL` (read/write/export, no approve) | Sponsor/banner and transaction-reconciliation staff. |

Demo users: `demo.admin@ipam.edu` (Super Administrator), `demo.registrar@ipam.edu` (Registrar). No demo user is pre-assigned to Finance Officer — create one via the RBAC screen to exercise that role.

## No hard-delete for admin users

`PATCH /api/admin/rbac/users/[id]` supports role reassignment, status changes, and override edits — there is **no `DELETE`**. `AuditLogEntry.actorAdminId` references `AdminUser`, so removing an admin outright would either orphan or cascade-delete their audit history. Deactivation is done via `status: SUSPENDED` instead, which is reversible and preserves the audit trail.

## Reports & Analytics has no dedicated module

The `PermissionModule` enum has no `REPORTS` entry — the legacy admin prototype didn't model reports as their own governable resource. Rather than adding a module solely for this, each report tab is gated by the `canExport` capability of the domain it summarizes:

| Report tab | Gated by |
|---|---|
| Cohort Demographics | `DIRECTORY.canExport` |
| Career Placement | `JOBS.canExport` |
| Financial Revenue | `FINANCE.canExport` |
| ID Bureau Logistics | `ID_CARDS.canExport` |

This is enforced server-side in `app/admin/(dashboard)/reports/page.tsx` — a tab an admin lacks export rights on simply has no data fetched for it.

## Two-factor authentication is a UI placeholder, not enforced

`AdminUser.twoFactorEnforced` (boolean) and `AdminUser.twoFactorMethod` (`SMS_OTP` | `HARDWARE_FIDO2` | `AUTHENTICATOR_APP`) exist in the schema and render in the RBAC user-management UI, matching the legacy prototype's fields. **Neither is checked anywhere in the login flow** (`app/api/auth/admin/login/route.ts`) — a correct email/password is sufficient to log in regardless of these fields. This is intentional scope for this build (see [`docs/ARCHITECTURE.md`](ARCHITECTURE.md)'s stubbed-behavior list), not a bug — don't rely on `twoFactorEnforced` for any real security guarantee until a real 2FA flow is implemented.

## Audit tamper-hash verification — a real cryptographic check

Every `AuditLogEntry` carries a `tamperHash`: a real HMAC-SHA256 (`lib/audit.ts`'s `tamperHash()`, keyed by the server-only `AUDIT_HMAC_SECRET` env var) computed over `` `${timestamp}|${actorEmail}|${action}|${target}` `` at write time. This replaces the legacy admin prototype's fake bit-shift/`Math.random()` hash, which was purely decorative.

`GET /api/admin/audit-logs/[id]/verify` recomputes this hash server-side from the entry's stored fields and compares it to the stored `tamperHash`, returning `{ valid: boolean }`. The secret never reaches the client — verification only ever happens on the server. This mechanism was tested against real tampering during development: a `beforeState` field was modified directly in MySQL, and "Verify Integrity" correctly reported the entry as invalid; after reverting, it reported valid again. This is a genuinely working integrity check, not a cosmetic one.
