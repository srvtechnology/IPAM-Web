# Architecture

## Two apps, one codebase

The public alumni portal and the admin back office are deliberately built as one Next.js App Router project rather than two services, but they're kept visually and structurally distinct:

- `app/(public)/**` — a route group (no URL prefix) for the public site.
- `app/admin/(dashboard)/**` — a route group for the authenticated admin app.
- `app/admin/login/**` — sits *outside* the `(dashboard)` group, so the login screen never tries to render inside a shell built for an already-authenticated admin.

## Theme scoping: why `[data-admin-theme]` instead of `:root`

The admin back office ports a Material3-inspired dark design system (`styles/admin.css`) from the legacy admin prototype, which originally defined its CSS custom properties at `:root` and `html.light`. The public site (`styles/public.css`) has its own, completely different emerald/teal token set.

If both stylesheets defined their tokens at `:root`, whichever one loaded last on a given page would win — global CSS custom properties don't respect Next.js route-group boundaries, since everything ends up in the same document `<head>` at runtime. The fix: `styles/admin.css` defines every `--app-*` token under `[data-admin-theme]` (dark, the default) and `[data-admin-theme="light"]` instead of `:root`/`html.light`. The admin dashboard layout wraps its content in a `<div data-admin-theme="dark">` (or `"light"`, toggled and persisted to `localStorage`), so the tokens only ever apply inside that subtree. `styles/public.css` is only ever imported by `app/(public)/layout.tsx`; `styles/admin.css` only by the admin dashboard layout. Neither page ever loads the other's stylesheet, and even if both were present in the same document, the attribute-scoping means they can't collide.

## Data-fetching pattern

Every page in this app follows the same shape:

1. **`page.tsx` is a Server Component.** It reads the session (`getAlumniSession()` / `getAdminSession()`), fetches data directly via Prisma (`lib/db.ts`) — no internal HTTP round-trip to its own API — and passes the result as props into a client view component.
2. **The view component is `'use client'`** and lives under `components/public/**` or `components/admin/**`. It renders the UI and owns local interaction state (which modal is open, form inputs, etc.).
3. **Mutations go through a hook** in `hooks/public/**` or `hooks/admin/**` — the *only* place `fetch()` is called from client code. A hook posts to the relevant `app/api/**` route and, on success, calls `router.refresh()` so Next.js re-runs the Server Component fetch and the page reflects the new DB state. No client-side cache library (SWR/React Query) is used — `router.refresh()` plus Prisma-on-the-server is judged sufficient for this app's scale.
4. **Every API route validates its input with `zod`** (`lib/validation/**`), and every response uses `lib/api-response.ts`'s `ok(data)` / `fail(status, message)` helpers for a consistent `{ data }` / `{ error }` shape.

### Worked example: ID card status transitions

Tracing one real mutation end to end:

- **Page**: `app/admin/(dashboard)/id-cards/page.tsx` (Server Component) fetches all `IdCardOrder` rows via Prisma and renders `IdCardIssuanceDeskView` (`components/admin/id-cards/IdCardIssuanceDeskView.tsx`), a Kanban-style board grouped by `IdCardStatus`.
- **Interaction**: moving a card to a new column calls `useIdCardOrders()` (`hooks/admin/useIdCardOrders.ts`), which does `PATCH /api/admin/id-cards/[id]`.
- **API route** (`app/api/admin/id-cards/[id]/route.ts`):
  1. `requirePermission(req, "ID_CARDS", "canWrite")` — 401 if there's no valid admin session, 403 if the admin's role lacks write access to `ID_CARDS`.
  2. Validates the body against `updateIdCardOrderSchema` (`lib/validation/idcards.ts`).
  3. Applies the update via Prisma, and — because certain status values correspond to a meaningful timestamp (`QUALITY_CHECK` → `printedDate`, `DISPATCHED` → `dispatchedDate`, `DELIVERED`/`COLLECTED` → `issueDate`) — stamps that field automatically.
  4. If the status actually changed, calls `writeAuditLog()` with category `SMART_ID_BUREAU`, recording `beforeState`/`afterState` as `{ status: <old> }` / `{ status: <new> }`.
  5. Returns the updated row via `ok(updated)`.
- **Back on the client**, the hook calls `router.refresh()`; the Server Component re-fetches, and the board re-renders with the order in its new column.

Every other mutating admin route (directory approval, banner CRUD, RBAC role edits, broadcast "send", etc.) follows this exact same five-step shape: permission gate → validate → mutate → audit-log if it's a real business action → return.

### Page-level RBAC gating

Hiding a nav link from the Sidebar for an admin who lacks a module's `canRead` isn't enough on its own — a guessed URL would still render the page shell before any data fetch fails. For the two most sensitive screens, **Audit Trails** and **RBAC & Access Control**, the `page.tsx` Server Component calls `checkPagePermission(module, capability)` (`lib/auth/permissions.ts`) before rendering anything, redirecting/blocking if the check fails — the same DB-backed resolution `requirePermission()` uses for API routes, just invoked from a page instead of a route handler. Other admin pages rely on their underlying API routes' `requirePermission()` checks (a page can render its shell, but every fetch/mutation against it will 401/403), which is judged sufficient for lower-sensitivity modules.

## Stubbed behaviors (exact list)

These are real database writes with a fully working UI, but the "smart"/external part of the behavior is faked rather than calling a real third-party service:

| Feature | What's real | What's stubbed | Where |
|---|---|---|---|
| Broadcast "Send" | Creates a real `BroadcastRecord` row, status `DELIVERED` | Fabricated `deliveryRate`/`cost`, no real SMS/WhatsApp/Email/Push call | `app/api/admin/broadcast/records/route.ts` |
| SIS Sync trigger | Creates a real `SisSyncLog` row | Randomized-but-plausible `node`/`operation`/`recordsSynced`/`latencyMs` — no real Student Information System is contacted | `app/api/admin/sis-sync/trigger/route.ts` |
| Donations | Creates a real `Donation` row (and a linked `Transaction` row) | `status: SUCCEEDED` and a generated `paymentRef` immediately — no real payment gateway | `app/api/donations/route.ts` |
| Password reset | — | Not implemented at all | — |
| 2FA / OTP | `twoFactorEnforced`/`twoFactorMethod` fields exist and render in the RBAC UI | Never enforced at login — any password-correct login succeeds regardless of these fields | `prisma/schema.prisma` (`AdminUser`), `app/api/auth/admin/login/route.ts` |
| SSO | — | Removed entirely from the ported login UI (the legacy prototype's SSO buttons were cosmetic `alert()`s) | — |

## Future work

- **Refresh tokens / token rotation.** Both JWTs are single long-lived access tokens (7 days alumni, 8 hours admin) with no rotation or revocation list.
- **Password reset flow** for both identities.
- **Real 2FA** (TOTP authenticator app is the most natural fit given the existing `twoFactorMethod` enum).
- **Real integrations**: an SMS/WhatsApp/email provider for broadcast, a real SIS connector, a real payment gateway for donations.
- **Server-side pagination.** Directory and other list views currently fetch the full table and filter client-side — fine at seed-data scale, worth revisiting before a large real alumni base is loaded in.
- **Admin invite flow.** New admin users are currently created with a password set directly by the creating admin (`POST /api/admin/rbac/users`), rather than an email-invite-then-set-your-own-password flow.
