# 12. Content & Banners API Integration

* **Swagger UI Documentation:** [https://ipam.billnbite.cloud/api-docs#/Content%20&%20Banners](https://ipam.billnbite.cloud/api-docs#/Content%20&%20Banners)
* **Tag:** `Content & Banners`
* **Security Schemes:** `Public`

---

## 📌 Overview

The Content & Banners module powers dynamic promotional feeds, campus highlights, and partner sponsorships across the mobile app. It supports:
1. **Hero Carousel:** Spotlight stories, event launches, and announcements featured on the mobile home screen.
2. **Commercial & Campaign Banners:** Contextual ad slots and sponsorship displays.
3. **Analytics Tracking:** Automatically logs banner impressions (`POST /api/banners/impressions`) and click-through rates (`POST /api/banners/{id}/click`) for university partner analytics.

---

## 🛣️ Endpoints Breakdown

### 1. Home Screen Hero Slides
* **Method & Path:** `GET /api/hero-slides`
* **Auth Required:** `None` (Public)

#### Success Response (`200 OK`)
```json
{
  "data": [
    {
      "id": "hero-1",
      "title": "Welcome to IPAM Alumni Mobile",
      "subtitle": "Connecting over 15,000 graduates across the globe",
      "image": "/uploads/banners/campus_aerial.jpg",
      "ctaText": "Explore Directory",
      "ctaLink": "/alumni",
      "order": 1
    },
    {
      "id": "hero-2",
      "title": "Annual Gala & Awards 2026",
      "subtitle": "Reserve your seat at the Radisson Blu Mammy Yoko Hotel",
      "image": "/uploads/banners/gala_banner.jpg",
      "ctaText": "Book Ticket",
      "ctaLink": "/events/seed-event-6",
      "order": 2
    }
  ]
}
```

---

### 2. Commercial Banners
* **Method & Path:** `GET /api/banners`
* **Auth Required:** `None` (Public)

#### Success Response (`200 OK`)
```json
{
  "data": [
    {
      "id": "ban-101",
      "title": "Exclusive Auto Financing for IPAM Graduates",
      "sponsor": "Sierra Leone Commercial Bank",
      "bannerUrl": "/uploads/banners/slcb_auto.png",
      "targetUrl": "https://slcb.com/alumni-auto-loans",
      "position": "HOME_FEED",
      "active": true
    }
  ]
}
```

---

### 3. Track Banner Impression
* **Method & Path:** `POST /api/banners/impressions`
* **Auth Required:** `None`
* **Request Body:**
```json
{
  "bannerIds": ["ban-101"]
}
```
* **Success Response (`200 OK`):** `{ "data": { "success": true, "recorded": 1 } }`

---

### 4. Track Banner Click
* **Method & Path:** `POST /api/banners/{id}/click`
* **Auth Required:** `None`
* **Path Parameters:**
  * `id`: Banner ID (e.g. `ban-101`)
* **Success Response (`200 OK`):** `{ "data": { "success": true } }`

---

## 📱 Flutter Implementation

### 1. Data Models (`lib/models/banner_models.dart`)

```dart
class HeroSlide {
  final String id;
  final String title;
  final String subtitle;
  final String image;
  final String? ctaText;
  final String? ctaLink;
  final int order;

  HeroSlide({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.image,
    this.ctaText,
    this.ctaLink,
    required this.order,
  });

  factory HeroSlide.fromJson(Map<String, dynamic> json) {
    return HeroSlide(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      subtitle: json['subtitle'] ?? '',
      image: json['image'] ?? '',
      ctaText: json['ctaText'],
      ctaLink: json['ctaLink'],
      order: json['order'] ?? 0,
    );
  }
}

class CommercialBanner {
  final String id;
  final String title;
  final String sponsor;
  final String bannerUrl;
  final String targetUrl;
  final String position;

  CommercialBanner({
    required this.id,
    required this.title,
    required this.sponsor,
    required this.bannerUrl,
    required this.targetUrl,
    required this.position,
  });

  factory CommercialBanner.fromJson(Map<String, dynamic> json) {
    return CommercialBanner(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      sponsor: json['sponsor'] ?? '',
      bannerUrl: json['bannerUrl'] ?? '',
      targetUrl: json['targetUrl'] ?? '',
      position: json['position'] ?? 'HOME_FEED',
    );
  }
}
```

### 2. Service Repository (`lib/services/banner_service.dart`)

```dart
import 'package:dio/dio.dart';
import '../core/api/api_client.dart';
import '../models/banner_models.dart';

class BannerService {
  final ApiClient _client = ApiClient();

  /// Fetches hero carousel slides
  Future<List<HeroSlide>> fetchHeroSlides() async {
    try {
      final response = await _client.dio.get('/api/hero-slides');
      final list = (response.data['data'] as List? ?? []);
      return list.map((e) => HeroSlide.fromJson(e)).toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Failed to load slides');
    }
  }

  /// Fetches commercial banners
  Future<List<CommercialBanner>> fetchBanners() async {
    try {
      final response = await _client.dio.get('/api/banners');
      final list = (response.data['data'] as List? ?? []);
      return list.map((e) => CommercialBanner.fromJson(e)).toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Failed to load banners');
    }
  }

  /// Tracks impression when banner renders into viewport
  Future<void> logImpression(String bannerId) async {
    try {
      await _client.dio.post(
        '/api/banners/impressions',
        data: {'bannerIds': [bannerId]},
      );
    } catch (_) {}
  }

  /// Tracks banner click
  Future<void> logClick(String bannerId) async {
    try {
      await _client.dio.post('/api/banners/$bannerId/click');
    } catch (_) {}
  }
}
```
