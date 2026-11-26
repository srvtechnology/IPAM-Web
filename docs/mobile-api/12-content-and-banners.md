# 12. Content & Banners API Integration

* **Swagger UI Documentation:** [https://ipam.billnbite.cloud/api-docs#/Content%20&%20Banners](https://ipam.billnbite.cloud/api-docs#/Content%20&%20Banners)
* **Tag:** `Content & Banners`
* **Security Schemes:** `Public`

---

## 📌 Overview

The Content & Banners module powers dynamic promotional feeds across the IPAM Alumni Mobile App:
1. **Home Hero Slides (`GET /api/hero-slides`):** Top spotlight carousel on the Home screen.
2. **Bottom Commercial & Partner Banners (`GET /api/banners`):** The full-width sponsor banner carousel displayed at the bottom of the web Home screen (above the footer) and section pages.
3. **Unified Mobile Banners Endpoint (`GET /api/mobile/banners` & `GET /api/mobile/home`):** Fetches both `heroSlides` and `bottomBanners` in a single request.
4. **Analytics Tracking:** Automatically logs banner impressions (`POST /api/banners/impressions`) and click-through rates (`POST /api/banners/{id}/click`).

---

## 🛣️ Endpoints Breakdown

### 1. Unified Mobile Banners (Hero + Bottom Banners)
* **Method & Path:** `GET /api/mobile/banners?page=/`
* **Auth Required:** `None` (Public)
* **Query Parameters:**
  * `page` (optional, default `/`): Target page route (`/`, `home`, `/directory`, `/events`, `/jobs`, `/businesses`, `/giving`, `ALL`).

#### Success Response (`200 OK`)
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
        "caption": "IPAM Tower Hill Campus • Freetown, Sierra Leone",
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
        "active": true,
        "impressions": 124,
        "clicks": 19,
        "ctr": "15.3%"
      }
    ]
  }
}
```

---

### 2. Bottom Commercial Banners (Standalone)
* **Method & Path:** `GET /api/banners?page=/`
* **Auth Required:** `None` (Public)

#### Success Response (`200 OK`)
```json
{
  "data": [
    {
      "id": "cm...",
      "code": "BAN-SLCB-SME",
      "name": "Sierra Leone Commercial Bank",
      "headline": "SME Commercial Financing: Fueling Alumni Ventures",
      "description": "Concessionary credit lines, equipment leasing, and trade finance solutions tailored for verified IPAM graduates.",
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
```

---

### 3. Home Screen Hero Slides
* **Method & Path:** `GET /api/hero-slides`
* **Auth Required:** `None` (Public)

---

### 4. Track Banner Impressions
* **Method & Path:** `POST /api/banners/impressions`
* **Auth Required:** `None`
* **Request Body:**
```json
{
  "ids": ["cm123", "cm456"]
}
```
*(Also supports `{ "bannerIds": ["cm123"] }`.)*
* **Success Response (`200 OK`):** `{ "data": { "success": true, "count": 2, "recorded": 2 } }`

---

### 5. Track Banner Click
* **Method & Path:** `POST /api/banners/{id}/click`
* **Auth Required:** `None`
* **Path Parameters:** `id` — Banner ID
* **Success Response (`200 OK`):** `{ "data": { "success": true, "id": "cm123" } }`

---

## 📱 Flutter Implementation (`lib/models/banner_models.dart`)

```dart
class HeroSlide {
  final String id;
  final String imageUrl;
  final String title;
  final String subtitle;
  final String? badge;
  final String? ctaText;
  final String? ctaLink;
  final int order;

  HeroSlide({
    required this.id,
    required this.imageUrl,
    required this.title,
    required this.subtitle,
    this.badge,
    this.ctaText,
    this.ctaLink,
    required this.order,
  });

  factory HeroSlide.fromJson(Map<String, dynamic> json) {
    return HeroSlide(
      id: json['id'] ?? '',
      imageUrl: json['imageUrl'] ?? json['image'] ?? '',
      title: json['title'] ?? '',
      subtitle: json['subtitle'] ?? '',
      badge: json['badge'],
      ctaText: json['ctaText'],
      ctaLink: json['ctaLink'],
      order: (json['order'] as num?)?.toInt() ?? 0,
    );
  }
}

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
      bannerImageUrl: json['bannerImageUrl'] ?? json['bannerUrl'] ?? '',
      slot: json['slot'] ?? '/',
      pages: List<String>.from(json['pages'] ?? []),
      order: (json['order'] as num?)?.toInt() ?? 1,
    );
  }
}
```
