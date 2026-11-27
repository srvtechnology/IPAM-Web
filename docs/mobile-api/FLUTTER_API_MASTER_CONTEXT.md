# IPAM Alumni Mobile App — Complete Flutter API Master Context

> **Purpose:** Drop this document directly into your Flutter IDE (Cursor / Antigravity / Windsurf / Copilot) as context to implement or update all IPAM Alumni mobile features, including **Home Bottom Banners**, **Flot Dual-Currency Payments (SLE & USD)**, **Paid Event Ticketing**, **Giving/Donations**, **Physical ID Cards**, **Subscriptions**, **Jobs**, **Directory**, and **Notifications**.

---

## 1. Environments, Auth & Response Envelopes

* **Production Base URL:** `https://ipam.billnbite.cloud`
* **Local Development Base URLs:**
  * Android Emulator: `http://10.0.2.2:3000`
  * iOS Simulator / macOS Desktop: `http://localhost:3000`
  * Physical Device on LAN: `http://<YOUR_LOCAL_IP>:3000`
* **Swagger UI:** `https://ipam.billnbite.cloud/api-docs`
* **OpenAPI JSON:** `https://ipam.billnbite.cloud/api/openapi.json`

### Authentication Header
Send the JWT returned by `POST /api/auth/alumni/login` on all authenticated requests:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
Accept: application/json
```

### Standard JSON Envelope
* **Success (`200` / `201`):** `{ "data": <object | array> }`
* **Error (`400` / `401` / `403` / `404` / `409` / `500`):** `{ "error": "Human readable message", "issues": { ... } }`
* *Note:* `GET /api/payments/flot/status` returns `{ "status": "pending" | "completed" | "failed", "orderId": "...", "type": "...", "attemptId": "..." }` at the top level.

---

## 2. Home Screen, Hero Carousel & Bottom Banners APIs

The web Home screen renders **top Hero Slides** and a **bottom Promotional/Sponsor Banner Carousel** (above the footer). All of these are now exposed cleanly for Flutter.

### Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/mobile/home` | Optional Bearer | Aggregator for Home screen: `heroSlides`, `bottomBanners` (also aliased as `banners`), `featuredEvents`, `latestJobs`, `councilLeaders`, `featuredBusinesses`, `stats`, `userContext`. |
| `GET` | `/api/mobile/banners?page=/` | Public | Dedicated banner feed returning `{ page, heroSlides, bottomBanners }`. Supports `?page=/`, `?page=home`, `?page=/events`, `?page=/jobs`, `?page=/directory`, `?page=/businesses`, `?page=/giving`, `?page=ALL`. |
| `GET` | `/api/banners?page=/` | Public | Returns array of active **bottom commercial banners** for the given page (defaults to `"/"`). |
| `GET` | `/api/hero-slides` | Public | Returns array of active **top hero slides**. |
| `POST` | `/api/banners/impressions` | Public | Track views for visible bottom banners. Body: `{ "ids": ["banner-id-1"] }` (also accepts `bannerIds`). |
| `POST` | `/api/banners/{id}/click` | Public | Track tap/click when a user opens a bottom banner's `targetUrl`. |

### `GET /api/mobile/banners?page=/` Response Example
```json
{
  "data": {
    "page": "/",
    "heroSlides": [
      {
        "id": "slide-campus-01",
        "imageUrl": "/images/ipam_university_campus_1788350001937.jpg",
        "title": "Connect. Empower. Excel.",
        "subtitle": "The Official Association for IPAM Graduates Worldwide",
        "badge": "University of Sierra Leone • IPAM Global Network",
        "ctaText": "Join Alumni Network",
        "ctaLink": "/register",
        "order": 1,
        "active": true
      }
    ],
    "bottomBanners": [
      {
        "id": "cm...",
        "code": "BAN-SLCB-SME",
        "name": "Sierra Leone Commercial Bank",
        "headline": "SME Commercial Financing: Fueling Alumni Ventures",
        "description": "Concessionary credit lines, equipment leasing, and trade finance solutions...",
        "badge": "Premier Banking Partner",
        "ctaText": "Explore Commercial Credit",
        "targetUrl": "https://www.slcb.com",
        "bannerImageUrl": "/images/sponsor_banking_banner.jpg",
        "slot": "/",
        "pages": ["/", "/businesses"],
        "order": 1,
        "active": true
      }
    ]
  }
}
```
> **Image URL Rule in Flutter:** Relative paths such as `/images/sponsor_banking_banner.jpg` or `/uploads/...` must be prefixed with `ApiClient.baseUrl` (e.g., `https://ipam.billnbite.cloud/images/sponsor_banking_banner.jpg`). If `bannerImageUrl` starts with `http`, use it directly.

### Flutter Dart Model (`CommercialBanner`)
```dart
class CommercialBanner {
  final String id;
  final String code;
  final String name;
  final String headline;
  final String description;
  final String badge;
  final String ctaText;
  final String targetUrl;
  final String bannerImageUrl;
  final String slot;
  final List<String> pages;
  final int order;
  final bool active;

  CommercialBanner({
    required this.id,
    required this.code,
    required this.name,
    required this.headline,
    required this.description,
    required this.badge,
    required this.ctaText,
    required this.targetUrl,
    required this.bannerImageUrl,
    required this.slot,
    required this.pages,
    required this.order,
    required this.active,
  });

  factory CommercialBanner.fromJson(Map<String, dynamic> json) {
    return CommercialBanner(
      id: json['id'] ?? '',
      code: json['code'] ?? '',
      name: json['name'] ?? '',
      headline: json['headline'] ?? '',
      description: json['description'] ?? '',
      badge: json['badge'] ?? '',
      ctaText: json['ctaText'] ?? 'Learn More',
      targetUrl: json['targetUrl'] ?? '',
      bannerImageUrl: json['bannerImageUrl'] ?? '',
      slot: json['slot'] ?? '/',
      pages: List<String>.from(json['pages'] ?? []),
      order: (json['order'] as num?)?.toInt() ?? 1,
      active: json['active'] ?? true,
    );
  }

  String resolveImageUrl(String baseUrl) {
    if (bannerImageUrl.startsWith('http')) return bannerImageUrl;
    return '$baseUrl$bannerImageUrl';
  }
}
```

---

## 3. Flot Payment Gateway APIs (Dual Currency: SLE & USD)

The IPAM platform uses the **Flot Payment Gateway** across ALL 4 paid flows:
1. **Physical ID Card Orders** (`purpose: "physical_card"`)
2. **Paid Event Ticket Bookings** (`purpose: "event_registration"`)
3. **Membership Subscriptions** (`purpose: "subscription"`)
4. **University Giving / Donations** (`purpose: "donation"`)

### Currency & Payment Method Rules (Strict)
* **Supported Currencies:** `SLE` (Leones / NLe) and `USD` (US Dollars)
* **Conversion Rate:** Default `1 USD = 22.5 SLE` (fetch live rate from `GET /api/payments/flot/config`).
* **Allowed Methods when `currency == "SLE"`:**
  * `"in-app"` -> Open Flot mobile app deep link (`flot://...`) or display QR code
  * `"momo"` -> Display Mobile Money USSD code (e.g., `*715*4908906923#`) with Copy / Dial (`tel:...`) button
  * `"card"` -> Launch Flot secure hosted card checkout (`paymentLink`) via `url_launcher` / in-app WebView
* **Allowed Methods when `currency == "USD"`:**
  * **ONLY `"card"`** (Bank Card) is supported by Flot for USD. In-App and Mobile Money must be disabled/hidden when USD is selected!

### Payment Endpoints

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/payments/flot/config` | Public | Returns live `usdToSleRate`, `methodsByCurrency`, and SLE + USD pricing for Physical Cards & Subscriptions. |
| `POST` | `/api/payments/flot/create-payment-link` | Bearer (Public for donations) | Creates a signed Flot payment link (`paymentLink`, `code`, `orderId`, `paymentAttemptId`) and optionally pre-creates the `PENDING` DB record & Admin transaction. |
| `GET` | `/api/payments/flot/status?orderId=...&attemptId=...` | Public | Poll every **3 seconds** while user pays. Returns `status: "pending" \| "completed" \| "failed"` and auto-settles DB + Admin Transaction + Audit Log on completion! |

### Request Examples for `POST /api/payments/flot/create-payment-link`

#### A. Paid Event Tickets
```json
{
  "purpose": "event_registration",
  "eventId": "evt_123",
  "ticketCount": 2,
  "attendeePhone": "+23276123456",
  "currency": "SLE",
  "type": "momo"
}
```

#### B. Physical ID Card Order
```json
{
  "purpose": "physical_card",
  "cardTier": "GOLD_RFID_SMART",
  "currency": "SLE",
  "type": "in-app",
  "recipientName": "Amadu Kamara",
  "recipientPhone": "+23276123456",
  "deliveryAddress": "14 Wilkinson Road, Freetown",
  "createPendingOrder": true
}
```
*(Or omit `createPendingOrder` and call `POST /api/physical-card-orders` with `paymentMethod: "FLOT", paymentRef: attemptId` right after polling completes.)*

#### C. Membership Subscription Upgrade
```json
{
  "purpose": "subscription",
  "subscriptionTier": "GOLD_PATRON",
  "billingCycle": "ANNUAL",
  "currency": "USD",
  "type": "card"
}
```

#### D. University Giving / Donation
```json
{
  "purpose": "donation",
  "fund": "Undergraduate & Merit Scholarship Endowment",
  "amount": 250,
  "currency": "SLE",
  "type": "momo",
  "donorName": "Mariama Jalloh",
  "donorEmail": "mariama@example.com",
  "donorPhone": "+23276555444",
  "frequency": "ONE_TIME",
  "isAnonymous": false
}
```

### `POST /api/payments/flot/create-payment-link` Response
```json
{
  "data": {
    "orderId": "BK-EVT-MXYZ12-A1B2",
    "amount": 100,
    "currency": "SLE",
    "paymentType": "momo",
    "paymentLink": "https://app.flotme.ai/pay/...",
    "code": "*715*4908906923#",
    "paymentAttemptId": "9a1c2e...",
    "flotRequestId": "9a1c2e...",
    "status": "pending",
    "exchangeRate": 22.5,
    "sleEquivalent": 100,
    "usdEquivalent": 4.44
  }
}
```

### Polling Response (`GET /api/payments/flot/status?orderId=...&attemptId=...`)
```json
{
  "status": "completed",
  "orderId": "BK-EVT-MXYZ12-A1B2",
  "type": "event_registration"
}
```
*(When `status == "completed"` or `"succeeded"`, payment is already settled in the DB & logged in Admin Finance! Refresh the screen data.)*

### Flutter `FlotPaymentService` Starter Code
```dart
class FlotPaymentLink {
  final String orderId;
  final double amount;
  final String currency;
  final String paymentType; // 'in-app' | 'momo' | 'card'
  final String paymentLink;
  final String? code; // USSD code e.g. *715*...#
  final String? paymentAttemptId;
  final double exchangeRate;
  final double sleEquivalent;
  final double usdEquivalent;

  FlotPaymentLink({
    required this.orderId,
    required this.amount,
    required this.currency,
    required this.paymentType,
    required this.paymentLink,
    this.code,
    this.paymentAttemptId,
    required this.exchangeRate,
    required this.sleEquivalent,
    required this.usdEquivalent,
  });

  factory FlotPaymentLink.fromJson(Map<String, dynamic> json) {
    return FlotPaymentLink(
      orderId: json['orderId'] ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0,
      currency: json['currency'] ?? 'SLE',
      paymentType: json['paymentType'] ?? 'in-app',
      paymentLink: json['paymentLink'] ?? '',
      code: json['code'],
      paymentAttemptId: json['paymentAttemptId'] ?? json['flotRequestId'],
      exchangeRate: (json['exchangeRate'] as num?)?.toDouble() ?? 22.5,
      sleEquivalent: (json['sleEquivalent'] as num?)?.toDouble() ?? 0,
      usdEquivalent: (json['usdEquivalent'] as num?)?.toDouble() ?? 0,
    );
  }
}
```

---

## 4. Complete Verified API Directory (All Mobile Features)

### 4.1 Mobile Bootstrap & Content
* `GET /api/mobile/config` — App version, feature flags (`flotPayments`, `paidEventTicketing`, `bottomBanners`), `payments` exchange rate & method rules, FCM config.
* `GET /api/mobile/home` — All Home screen sections + `heroSlides` + `bottomBanners` + `userContext` (if Bearer token provided).
* `GET /api/mobile/banners?page=/` — Top `heroSlides` & page-matched `bottomBanners`.
* `GET /api/banners?page=/` — Commercial bottom banners list.
* `POST /api/banners/impressions` — Body `{ "ids": ["..."] }` or `{ "bannerIds": ["..."] }`.
* `POST /api/banners/{id}/click` — Records click analytics.
* `GET /api/hero-slides` — Active hero carousel slides.
* `GET /api/leadership` — Alumni Executive Council members & initiatives.

### 4.2 Authentication & 2FA Email Auth
* `POST /api/auth/alumni/login` — Body `{ email, password, rememberMe?, device?: { token, platform, deviceName, appVersion } }`. Returns `{ token, ...user, savedJobsCount }`.
* `POST /api/auth/alumni/register` — Registers alumni account (supports `otp` / 2FA email flow).
* `POST /api/auth/alumni/check-exists` — Body `{ email?, studentId? }`.
* `POST /api/auth/alumni/resubmit-info` — Re-submit rejected registration details.
* `POST /api/auth/2fa/send-otp` — Sends 6-digit SMTP OTP email (`purpose: "register" | "login" | "reset_password"`).
* `GET /api/auth/alumni/me` — Current authenticated user + `profile` + `savedJobsCount`.
* `POST /api/auth/refresh` — Refreshes JWT token (`BearerAuth`).
* `POST /api/auth/alumni/change-password` — Body `{ currentPassword, newPassword }`.
* `POST /api/auth/alumni/forgot-password` / `POST /api/auth/forgot-password`
* `POST /api/auth/alumni/reset-password` / `POST /api/auth/reset-password`
* `POST /api/auth/alumni/logout`

### 4.3 Profile & Media Upload
* `GET /api/profile` — Authenticated alumni profile + skills.
* `PATCH /api/profile` — Update `name`, `avatar`, `currentRole`, `company`, `industry`, `location`, `country`, `degree`, `major`, `classYear`, `bio`, `linkedin`, `isMentor`, `skills: string[]`.
* `POST /api/upload` — Supports `multipart/form-data` (`file`) OR JSON base64 `{ file, filename, mimeType }`. Returns `{ url }`. Use for avatars, CVs, enterprise logos.

### 4.4 Virtual Digital Pass & Physical ID Cards
* `GET /api/alumni/pass` (alias `/api/alumni/digital-pass`) — Returns digital card details & signed JSON `qrPayload`.
* `GET /api/alumni/pass/verify/{id}` (alias `/api/alumni/verify/{id}`) — Verifies scanned QR (`studentId` or `userId`).
* `GET /api/physical-card-orders/pricing` — Returns tiers (`STANDARD_PVC`, `GOLD_RFID_SMART`, `EXECUTIVE_TITANIUM`), `shippingFee`, `currency`, `codEnabled`, `flotEnabled`.
* `GET /api/physical-card-orders` (alias `/api/alumni/orders/card`) — Lists user's physical card orders.
* `POST /api/physical-card-orders` (alias `/api/alumni/orders/card`) — Body `{ cardTier, deliveryAddress, recipientName, recipientPhone, paymentMethod: "COD" | "FLOT", paymentRef? }`.

### 4.5 Events, Paid Ticketing & Proposals
* `GET /api/events` — Supports `?q=`, `?category=`, `?isPaid=true|false`, `?upcoming=true`. If authenticated, includes `registered` (only `true` when `PAID` or `FREE`), `registrationRef`, `registrationTicketCount`, `registrationPaymentStatus`.
* `GET /api/events/{id}` — Event detail + `agenda`, `speakers`, `faqs`, `highlights`, `registered`, `registrationRef`, `registrationTicketCount`, `registrationPaymentStatus`.
* `POST /api/events/{id}/register` (and `POST /api/events/rsvp` with `eventId` in body) — Registers for free events (`FREE`) or initiates/confirms paid events (`ticketCount`, `attendeePhone`, `bookingReference`, `paymentMethod: "FLOT"`, `paymentRef`).
* `GET /api/events/my-registrations` — User's booked event passes.
* `GET /api/events/my-registrations/{bookingRef}` — Single pass detail.
* `DELETE /api/events/my-registrations/{bookingRef}` — Cancel upcoming event registration.
* `GET /api/event-proposals` — User's submitted event proposals (`BearerAuth`).
* `POST /api/event-proposals` — Propose a new alumni event.

### 4.6 Jobs & Careers Portal
* `GET /api/jobs` — Filter with `?q=`, `?category=`, `?type=`, `?workplaceType=`, `?country=`, `?saved=true`.
* `POST /api/jobs` — Post a new job opening (`BearerAuth`).
* `GET /api/jobs/{id}` — Job detail + `saved` boolean.
* `PATCH /api/jobs/{id}` / `DELETE /api/jobs/{id}` — Manage own posted job.
* `POST /api/jobs/{id}/apply` — Submit job application (`candidateName`, `email`, `phone`, `coverNote`, `cvUrl`, `cvFileName`, `experienceYears`, `skills`, `linkedinUrl`).
* `GET /api/jobs/{id}/apply` — Check if user already applied to this job.
* `POST /api/jobs/{id}/save` — Toggle bookmark/save on job.
* `GET /api/jobs/saved` — List saved jobs.
* `GET /api/jobs/my-applications` — Track user's submitted job applications & interview status.
* `GET /api/jobs/manage` — View jobs posted by the logged-in alumni and their applicants.
* `GET /api/jobs/{id}/applications` — List applicants for a job posted by current user.
* `PATCH /api/jobs/{id}/applications/{appId}` / `POST /api/jobs/{id}/applications/{appId}/select` — Shortlist / update / select candidate.

### 4.7 Alumni Directory & Networking
* `GET /api/alumni` — Search alumni directory (`?q=`, `?classYear=`, `?industry=`, `?isMentor=true`). Automatically hides current user's own profile when authenticated and returns `isConnected: bool`.
* `GET /api/alumni/{id}` — Full alumni profile detail.
* `POST /api/alumni/{id}/connect` — Connect / bookmark an alumnus.
* `DELETE /api/alumni/{id}/connect` — Disconnect / remove bookmark.
* `GET /api/alumni/bookmarks` — List connected alumni.

### 4.8 Alumni Enterprises (Businesses Marketplace)
* `GET /api/businesses` — Approved enterprises (`?q=`, `?category=`, `?featured=true`). Pass `?mine=true` (`BearerAuth`) to view own submitted businesses (including pending/rejected).
* `POST /api/businesses` — Submit an alumni enterprise for review (`BearerAuth`).
* `GET /api/businesses/{id}` / `PATCH /api/businesses/{id}` / `DELETE /api/businesses/{id}` — View, edit, or delete own business listing.

### 4.9 Donations & Giving Hub
* `GET /api/giving` — Complete Giving Hub payload (`funds` with goals & raised totals, `stats`, `recentDonations`, `bottomBanners`).
* `GET /api/donations?summary=true` — Same fund summary & honor roll; or `?mine=true` (`BearerAuth`) for personal donation history.
* `POST /api/donations` — Record a donation (supports `paymentMethod: "FLOT" | "CARD" | "MOMO" | "BANK" | "PAYPAL"` and `paymentRef`). If using Flot one-step `create-payment-link` with `purpose: "donation"`, Flot status polling/webhook already creates & settles the record!

### 4.10 Membership & Subscriptions
* `GET /api/subscription` — Returns `currentTier`, `currentPlan`, `membershipValidUntil`, `billingCycle`, `autoRenew`, `history`, and `availableTiers`.
* `POST /api/subscription` — Activate/upgrade tier (`tier`, `billingCycle`, `paymentMethod: "FLOT" | "CARD"`, `paymentReference`, `currency: "SLE" | "USD"`).
* `PATCH /api/subscription` — Toggle `autoRenew` (`{ autoRenew: bool }`).

### 4.11 Push Notifications & FCM
* `GET /api/alumni/notifications` — Unified feed of personal notifications & delivered broadcasts + unread count.
* `PATCH /api/alumni/notifications/{id}/read` — Mark single notification read.
* `POST /api/alumni/notifications/read-all` — Mark all personal notifications read.
* `POST /api/notifications/register-token` — Register FCM token (`{ token, platform, deviceName?, appVersion?, subscribeToAll? }`).
* `POST /api/notifications/unregister-token` — Unregister FCM token on logout.
* `GET /api/notifications/devices` — View registered devices.
* `POST /api/notifications/test` — Send a test push notification to current user's devices.

### 4.12 Activities & Multi-Photo Gallery (Current & Previous Events)
* `GET /api/activities` — Public list of current & previous alumni activity galleries. Supports `?status=CURRENT|PREVIOUS`, `?q=`, `?featured=true`, `?category=`, `?limit=`. Each item includes `id`, `title`, `description`, `status` (`CURRENT` | `PREVIOUS`), `displayDate`, `location`, `category`, `photos` (`List<String>`), `coverPhoto`, `photosCount`, `featured`, `sortOrder`, `createdAt`, `updatedAt`.
* `GET /api/activities/{id}` — Single activity detail & full multi-photo array (`404` if missing).
* `GET /api/mobile/home` — Includes `recentActivities` (up to 6 ordered activities) and `stats.totalActivities`.
* `GET /api/mobile/config` — Includes `features.activitiesGallery: true`.
* Full guide + Dart models + `ActivitiesService`: see `docs/mobile-api/16-activities-gallery.md`.

---

## 5. AI IDE Prompt — Add Activities Page in Flutter Mobile App

Paste the prompt below directly into your Flutter AI IDE alongside this doc (`docs/mobile-api/16-activities-gallery.md` and `docs/mobile-api/FLUTTER_API_MASTER_CONTEXT.md`):

```text
Add a new "Activities" (Current & Previous Events Photo Gallery) feature to the IPAM Alumni Flutter app using our existing ApiClient (Dio), theme colors (Emerald & Slate), and state management pattern:

1. Model & API Service:
   - Create `AlumniActivity` (`id`, `title`, `description`, `status` ['CURRENT' | 'PREVIOUS'], `displayDate`, `location`, `category`, `photos`, `coverPhoto`, `photosCount`, `featured`, `sortOrder`, `createdAt`, `updatedAt`).
   - Normalize relative image URLs (`/images/...`, `/uploads/...`) by prefixing `ApiClient.baseUrl`.
   - Create `ActivitiesService`:
     * `fetchActivities({String? status, String? query, bool? featured, int? limit})` -> `GET /api/activities`
     * `fetchActivityById(String id)` -> `GET /api/activities/$id`
   - Update `MobileHome` parsing (if used) to read `recentActivities` and `stats.totalActivities` from `GET /api/mobile/home`.

2. UI Screens (`ActivitiesPage` + `ActivityGalleryViewer`):
   - Add an entry point from Home / Navigation Drawer / Explore menu to open `ActivitiesPage`.
   - Top summary header with counts for Total Activities, Current Events, Previous Events, and Total Photos.
   - Tabs/Filter chips: `All`, `Current Events` (`CURRENT`), `Previous Events` (`PREVIOUS`) + search bar (`q`) + `RefreshIndicator`.
   - Gallery cards showing `16:9` cover image, `CURRENT` (emerald) / `PREVIOUS` (slate) badge, photo count pill (`4 Photos`), scrollable thumbnail strip, category, `displayDate`, `location`, title, description preview, and a Share button (`https://ipam.billnbite.cloud/activities?activity=${activity.id}`).
   - Tapping a card or thumbnail opens a full-screen multi-photo gallery & story detail view with `PageView` + `InteractiveViewer` (swipe + pinch-to-zoom), thumbnail selector bar, full description, and share button.
```
