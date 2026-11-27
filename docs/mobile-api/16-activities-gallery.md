# 16. Activities & Multi-Photo Gallery API Integration

* **Base URL (Production):** `https://ipam.billnbite.cloud`
* **Base URL (Local Android Emulator):** `http://10.0.2.2:3000`
* **Base URL (Local iOS Simulator / Desktop):** `http://localhost:3000`
* **Security Scheme:** `Public` (No authentication required to browse or view activity galleries)

---

## 📌 Overview

The **Activities & Photo Gallery** module powers the **Current Events** and **Previous Events** visual showcase on the IPAM Alumni mobile application, mirroring the web `/activities` portal and Admin `/admin/activities` gallery desk.

Each Activity item contains:
* **Title & Detailed Description** (multi-paragraph story & highlights)
* **Timeline Status:** `"CURRENT"` (Ongoing / Upcoming) or `"PREVIOUS"` (Past Event Archive)
* **Metadata:** `displayDate`, `location`, `category`, `featured`, `sortOrder`
* **Multi-Photo Gallery:** `photos` (`List<String>`), `coverPhoto` (`String?`), and `photosCount` (`int`)

---

## 🛣️ Endpoints Breakdown

### 1. List Activities (With Filter & Search)
* **Method & Path:** `GET /api/activities`
* **Auth Required:** `None` (Public)
* **Query Parameters:**
  * `status` *(optional)*: `"CURRENT"`, `"PREVIOUS"`, or `"ALL"` (omit for all)
  * `q` *(optional)*: Case-insensitive search across `title`, `description`, `location`, and `category`
  * `featured` *(optional)*: `"true"` to return only pinned/featured activities
  * `category` *(optional)*: Filter by category keyword
  * `limit` *(optional)*: Maximum number of records to return (1–100)

#### Example Requests
```http
GET /api/activities
GET /api/activities?status=CURRENT
GET /api/activities?status=PREVIOUS&q=Gala
GET /api/activities?featured=true&limit=6
```

#### Success Response (`200 OK`)
```json
{
  "data": [
    {
      "id": "act-seed-current-01",
      "title": "IPAM Digital Transformation & AI Innovation Summit 2026",
      "description": "Over 450 verified IPAM alumni, FinTech founders, and university faculty gathered at the Tower Hill Campus...",
      "status": "CURRENT",
      "displayDate": "November 2026",
      "location": "IPAM Tower Hill Auditorium, Freetown & Hybrid Stream",
      "category": "Technology & Innovation",
      "photos": [
        "/images/alumni_tech_summit.jpg",
        "/images/ipam_university_campus_1788350001937.jpg",
        "/images/alumni_networking_mixer.jpg",
        "/images/sponsor_telecom_banner.jpg"
      ],
      "coverPhoto": "/images/alumni_tech_summit.jpg",
      "photosCount": 4,
      "featured": true,
      "sortOrder": 1,
      "createdAt": "2026-11-27T13:02:00.264Z",
      "updatedAt": "2026-11-27T13:02:00.264Z"
    }
  ]
}
```

---

### 2. Get Single Activity Gallery Detail
* **Method & Path:** `GET /api/activities/{id}`
* **Auth Required:** `None` (Public)

#### Success Response (`200 OK`)
Returns a single `AlumniActivity` object wrapped in `{ "data": { ... } }`.

#### Error Response (`404 Not Found`)
```json
{
  "error": "Activity not found"
}
```

---

### 3. Home Screen Feed & Feature Flag
* **`GET /api/mobile/home`** now also includes:
  * `recentActivities`: Up to 6 featured/ordered `AlumniActivity` objects for a Home screen preview strip
  * `stats.totalActivities`: Total count of published activities
* **`GET /api/mobile/config`** exposes:
  * `features.activitiesGallery: true`

---

## 🖼️ Image URL Resolution Rule (Important)

`photos` and `coverPhoto` may contain:
1. Relative portal asset paths (`/images/alumni_tech_summit.jpg`)
2. Admin-uploaded paths (`/uploads/photo_123.jpg`)
3. Absolute external URLs (`https://...`)

Always normalize before rendering with `CachedNetworkImage` / `Image.network`:
```dart
String resolveMediaUrl(String pathOrUrl, String baseUrl) {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  final normalizedBase = baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;
  final normalizedPath = pathOrUrl.startsWith('/') ? pathOrUrl : '/$pathOrUrl';
  return '$normalizedBase$normalizedPath';
}
```

---

## 🧩 Flutter Dart Model & Service

### `lib/models/alumni_activity.dart`
```dart
enum ActivityStatus { current, previous }

class AlumniActivity {
  final String id;
  final String title;
  final String description;
  final ActivityStatus status;
  final String? displayDate;
  final String? location;
  final String? category;
  final List<String> photos;
  final String? coverPhoto;
  final int photosCount;
  final bool featured;
  final int sortOrder;
  final DateTime createdAt;
  final DateTime updatedAt;

  const AlumniActivity({
    required this.id,
    required this.title,
    required this.description,
    required this.status,
    this.displayDate,
    this.location,
    this.category,
    required this.photos,
    this.coverPhoto,
    required this.photosCount,
    required this.featured,
    required this.sortOrder,
    required this.createdAt,
    required this.updatedAt,
  });

  bool get isCurrent => status == ActivityStatus.current;

  List<String> resolvedPhotos(String baseUrl) =>
      photos.map((p) => resolveUrl(p, baseUrl)).toList();

  String? resolvedCoverPhoto(String baseUrl) {
    final target = coverPhoto ?? (photos.isNotEmpty ? photos.first : null);
    if (target == null || target.isEmpty) return null;
    return resolveUrl(target, baseUrl);
  }

  static String resolveUrl(String pathOrUrl, String baseUrl) {
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
      return pathOrUrl;
    }
    final cleanBase = baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;
    final cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : '/$pathOrUrl';
    return '$cleanBase$cleanPath';
  }

  factory AlumniActivity.fromJson(Map<String, dynamic> json) {
    final rawPhotos = (json['photos'] as List<dynamic>? ?? [])
        .map((e) => e.toString())
        .where((e) => e.trim().isNotEmpty)
        .toList();

    final statusStr = (json['status'] ?? 'CURRENT').toString().toUpperCase();

    return AlumniActivity(
      id: (json['id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      status: statusStr == 'PREVIOUS' ? ActivityStatus.previous : ActivityStatus.current,
      displayDate: json['displayDate']?.toString(),
      location: json['location']?.toString(),
      category: json['category']?.toString(),
      photos: rawPhotos,
      coverPhoto: json['coverPhoto']?.toString() ?? (rawPhotos.isNotEmpty ? rawPhotos.first : null),
      photosCount: (json['photosCount'] as num?)?.toInt() ?? rawPhotos.length,
      featured: json['featured'] == true,
      sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
      updatedAt: DateTime.tryParse(json['updatedAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}
```

### `lib/services/activities_service.dart`
```dart
import 'package:dio/dio.dart';
import '../core/api/api_client.dart';
import '../models/alumni_activity.dart';

class ActivitiesService {
  final Dio _dio = ApiClient().dio;

  Future<List<AlumniActivity>> fetchActivities({
    String? status, // 'CURRENT' | 'PREVIOUS' | null
    String? query,
    bool? featured,
    int? limit,
  }) async {
    final params = <String, dynamic>{};
    if (status != null && status != 'ALL') params['status'] = status;
    if (query != null && query.trim().isNotEmpty) params['q'] = query.trim();
    if (featured == true) params['featured'] = 'true';
    if (limit != null) params['limit'] = limit;

    final response = await _dio.get('/api/activities', queryParameters: params);
    final list = response.data['data'] as List<dynamic>? ?? [];
    return list.map((item) => AlumniActivity.fromJson(item as Map<String, dynamic>)).toList();
  }

  Future<AlumniActivity> fetchActivityById(String id) async {
    final response = await _dio.get('/api/activities/$id');
    return AlumniActivity.fromJson(response.data['data'] as Map<String, dynamic>);
  }
}
```

---

## 🤖 Ready-to-Use AI IDE Prompt (Copy & Paste into Your Flutter IDE)

```text
Implement a complete "Activities & Photo Gallery" feature in this IPAM Alumni Flutter app matching our existing Emerald & Slate design system and ApiClient (Dio) architecture:

1. Data & Service Layer:
   - Create `AlumniActivity` model (`id`, `title`, `description`, `status` [`CURRENT` | `PREVIOUS`], `displayDate`, `location`, `category`, `photos`, `coverPhoto`, `photosCount`, `featured`, `sortOrder`, `createdAt`, `updatedAt`).
   - Prefix relative image URLs (`/images/...`, `/uploads/...`) with `ApiClient.baseUrl`.
   - Create `ActivitiesService` using `ApiClient().dio` calling:
     * `GET /api/activities` (with optional `status`, `q`, `featured`, `limit` query params)
     * `GET /api/activities/{id}` for detail / deep link view
   - Also parse `recentActivities` and `stats.totalActivities` from `GET /api/mobile/home` if needed on the Home screen.

2. Activities List Screen (`ActivitiesScreen`):
   - Navigation: Accessible from the Home screen / Drawer / Bottom navigation or "Activities" section card.
   - Top hero header showing total activities count, Current Events count, Previous Archives count, and total photos count.
   - Filter segmented tabs: `All`, `Current Events` (`status=CURRENT`), `Previous Events` (`status=PREVIOUS`), plus a live debounced search bar (`q`).
   - Support pull-to-refresh (`RefreshIndicator`).
   - Each card displays:
     * Cover image (`16:9` aspect ratio) with `CURRENT` (emerald badge) or `PREVIOUS` (slate badge) pill and photo count badge (`e.g. 4 Photos`).
     * Horizontal multi-photo thumbnail strip below the cover image; tapping any thumbnail jumps directly to that image in the fullscreen gallery viewer.
     * Category pill, `displayDate`, bold `title`, `description` preview, `location`, and a **Share** button (`share_plus` sharing title + `https://ipam.billnbite.cloud/activities?activity={id}`).

3. Activity Detail & Fullscreen Photo Lightbox Screen:
   - Tapping a card or thumbnail opens a multi-photo interactive detail / lightbox view with `PageView.builder` + `InteractiveViewer` (pinch-to-zoom & horizontal swipe across all `photos`), photo index counter (`1 / 4`), thumbnail selector strip at the bottom, and the full multi-paragraph `description`, `displayDate`, `location`, and Share action.

4. States & Polish:
   - Shimmer/loading placeholder, graceful error retry view, and clean empty state when search/filters match nothing.
```
