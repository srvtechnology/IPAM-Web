# IPAM Mobile App — API Integration Guide

Welcome to the official API Integration Documentation for the **IPAM Alumni Flutter Mobile Application**.

This documentation suite provides production-ready, type-safe integration guides for all 13 core modules exposed by the IPAM Unified Backend. Each guide contains complete endpoint specifications, JSON request/response payloads, validation rules, Dart data models (`fromJson`/`toJson`), and Dio-based service implementations.

---

## 🌐 Server Environments & Swagger Portal

* **Production Base URL:** `https://ipam.billnbite.cloud`
* **Interactive Swagger UI:** [https://ipam.billnbite.cloud/api-docs](https://ipam.billnbite.cloud/api-docs)
* **Raw OpenAPI 3.0.3 Spec:** `https://ipam.billnbite.cloud/api/openapi.json`
* **Local Development Base URLs:**
  * **Android Emulator:** `http://10.0.2.2:3000`
  * **iOS Simulator / macOS Desktop:** `http://localhost:3000`
  * **Physical Device over Wi-Fi:** `http://<YOUR_LOCAL_IP>:3000` (e.g. `http://192.168.1.100:3000`)

---

## 📚 Module Integration Guides

| # | Module Name | Interactive Swagger UI | Guide Document |
|---|---|---|---|
| 01 | **Authentication** | [Swagger Tag](https://ipam.billnbite.cloud/api-docs#/Authentication) | [01-authentication.md](file:///Users/pranab/workspace/IPAM-Web/docs/mobile-api/01-authentication.md) |
| 02 | **Virtual Pass & QR** | [Swagger Tag](https://ipam.billnbite.cloud/api-docs#/Virtual%20Pass%20&%20QR) | [02-virtual-pass-and-qr.md](file:///Users/pranab/workspace/IPAM-Web/docs/mobile-api/02-virtual-pass-and-qr.md) |
| 03 | **Events & Ticketing** | [Swagger Tag](https://ipam.billnbite.cloud/api-docs#/Events%20&%20Ticketing) | [03-events-and-ticketing.md](file:///Users/pranab/workspace/IPAM-Web/docs/mobile-api/03-events-and-ticketing.md) |
| 04 | **Jobs & Careers** | [Swagger Tag](https://ipam.billnbite.cloud/api-docs#/Jobs%20&%20Careers) | [04-jobs-and-careers.md](file:///Users/pranab/workspace/IPAM-Web/docs/mobile-api/04-jobs-and-careers.md) |
| 05 | **Alumni Directory & Networking** | [Swagger Tag](https://ipam.billnbite.cloud/api-docs#/Alumni%20Directory%20&%20Networking) | [05-alumni-directory-and-networking.md](file:///Users/pranab/workspace/IPAM-Web/docs/mobile-api/05-alumni-directory-and-networking.md) |
| 06 | **Businesses & Marketplace** | [Swagger Tag](https://ipam.billnbite.cloud/api-docs#/Businesses%20&%20Marketplace) | [06-businesses-and-marketplace.md](file:///Users/pranab/workspace/IPAM-Web/docs/mobile-api/06-businesses-and-marketplace.md) |
| 07 | **Physical ID Cards** | [Swagger Tag](https://ipam.billnbite.cloud/api-docs#/Physical%20ID%20Cards) | [07-physical-id-cards.md](file:///Users/pranab/workspace/IPAM-Web/docs/mobile-api/07-physical-id-cards.md) |
| 08 | **Donations & Giving** | [Swagger Tag](https://ipam.billnbite.cloud/api-docs#/Donations%20&%20Giving) | [08-donations-and-giving.md](file:///Users/pranab/workspace/IPAM-Web/docs/mobile-api/08-donations-and-giving.md) |
| 09 | **Membership & Subscriptions** | [Swagger Tag](https://ipam.billnbite.cloud/api-docs#/Membership%20&%20Subscriptions) | [09-membership-and-subscriptions.md](file:///Users/pranab/workspace/IPAM-Web/docs/mobile-api/09-membership-and-subscriptions.md) |
| 10 | **Media & Uploads** | [Swagger Tag](https://ipam.billnbite.cloud/api-docs#/Media%20&%20Uploads) | [10-media-and-uploads.md](file:///Users/pranab/workspace/IPAM-Web/docs/mobile-api/10-media-and-uploads.md) |
| 11 | **Leadership** | [Swagger Tag](https://ipam.billnbite.cloud/api-docs#/Leadership) | [11-leadership.md](file:///Users/pranab/workspace/IPAM-Web/docs/mobile-api/11-leadership.md) |
| 12 | **Content & Banners** | [Swagger Tag](https://ipam.billnbite.cloud/api-docs#/Content%20&%20Banners) | [12-content-and-banners.md](file:///Users/pranab/workspace/IPAM-Web/docs/mobile-api/12-content-and-banners.md) |
| 13 | **Payments** | [Swagger Tag](https://ipam.billnbite.cloud/api-docs#/Payments) | [13-payments.md](file:///Users/pranab/workspace/IPAM-Web/docs/mobile-api/13-payments.md) |
| 14 | **Push Notifications & FCM** | [Swagger Tag](https://ipam.billnbite.cloud/api-docs#/Push%20Notifications%20&%20FCM) | [14-push-notifications-and-fcm.md](file:///Users/pranab/workspace/IPAM-Web/docs/mobile-api/14-push-notifications-and-fcm.md) |

---

## 🔒 Authentication Standard (Bearer Token)

The backend provides dual authentication:
1. **Mobile App:** Uses HTTP `Authorization: Bearer <jwt_token>` header on all protected endpoints.
2. **Web Portal:** Uses HTTP-only cookie (`ipam_alumni_session`).

When an alumni logs in via `POST /api/auth/alumni/login`, the response body contains a signed JWT `token`:
```json
{
  "data": {
    "id": "cmuznxfl90007o63lnxqupalc",
    "email": "demo.alumni@ipam.edu",
    "studentId": "IPAM-2015-0042",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "profile": { ... }
  }
}
```
Store this token securely in Flutter using `flutter_secure_storage`. Every subsequent HTTP call must inject this token into the `Authorization` header.

---

## 📦 Standard API Response Envelopes

All responses follow a consistent JSON envelope defined in [lib/api-response.ts](file:///Users/pranab/workspace/IPAM-Web/lib/api-response.ts):

### Success Response (HTTP 200 / 201)
```json
{
  "data": { ... } // Or an array: [ { ... }, { ... } ]
}
```

### Error Response (HTTP 400 / 401 / 403 / 404 / 409 / 500)
```json
{
  "error": "Human readable error message",
  "issues": { ... } // Optional detailed Zod validation issues
}
```

---

## 🚀 Recommended Flutter Dio Client Setup

Add these dependencies to your Flutter `pubspec.yaml`:
```yaml
dependencies:
  flutter:
    sdk: flutter
  dio: ^5.7.0
  flutter_secure_storage: ^9.2.2
  qr_flutter: ^4.1.0
  mobile_scanner: ^6.0.2
  flutter_stripe: ^11.4.0
  image_picker: ^1.1.2
```

### Complete ApiClient Singleton with Auth Interceptor

Create `lib/core/api/api_client.dart` in your Flutter project:

```dart
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  static const String baseUrl = 'https://ipam.billnbite.cloud';
  // Use 'http://10.0.2.2:3000' during local Android emulator testing

  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late final Dio dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  static const String tokenKey = 'ipam_alumni_jwt_token';

  ApiClient._internal() {
    dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Attach Interceptor for Bearer Auth & Global Error Handling
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: tokenKey);
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          if (error.response?.statusCode == 401) {
            // Token expired or invalid: Clear stored credentials
            await _storage.delete(key: tokenKey);
            // Optionally notify router/auth provider to redirect to Login Screen
          }
          return handler.next(error);
        },
      ),
    );
  }

  Future<void> saveToken(String token) async {
    await _storage.write(key: tokenKey, value: token);
  }

  Future<String?> getToken() async {
    return await _storage.read(key: tokenKey);
  }

  Future<void> clearToken() async {
    await _storage.delete(key: tokenKey);
  }
}
```

---

## 🛠️ Testing Demo Accounts

When testing against the sandbox or local database:
* **Demo Alumni Member:**
  * Email: `demo.alumni@ipam.edu`
  * Password: `Password123!`
  * Student ID: `IPAM-2015-0042`
  * Status: `APPROVED`
* **Registration 2FA OTP Code:** `123456`
