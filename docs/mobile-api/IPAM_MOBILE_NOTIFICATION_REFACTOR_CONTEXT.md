# IPAM Mobile — Notification & Authentication Refactor Context

> **Audience:** Flutter Mobile App Developers (`IPAM-mobile` repository)  
> **Backend Base URL:** `https://ipam.billnbite.cloud` (or local `http://localhost:3000`)  
> **Status:** Production Ready & Live  
> **Related PR/Commit:** `ef72708` + Login Device Token Integration

---

## 🎯 1. Executive Summary & Purpose

Previously, mobile clients had to perform a **two-step handshake** to register for push notifications:
1. `POST /api/auth/alumni/login` $\rightarrow$ obtain JWT `token`.
2. `POST /api/notifications/register-token` $\rightarrow$ send FCM device token with `Bearer` authentication.

### Problems with the Old Approach
* **Network Fragility:** If the user closed the app, lost connection, or experienced a timeout between steps 1 and 2, the login succeeded but the device token was never registered.
* **Delayed Alerts:** Alumnus missed degree verification approvals, ID card shipment updates, and emergency broadcasts until their next session.
* **Complex Mobile State Management:** Required complex error-retry queues in Flutter.

### The New Architecture (Atomic Handshake)
The backend now supports **direct device token integration in the login request**:
* A single `POST /api/auth/alumni/login` authenticates the alumnus **AND** registers their device token, links it to their user ID, and subscribes the device to the `all_alumni` broadcast topic in **one atomic database transaction**.
* On logout (`POST /api/auth/alumni/logout`), passing the device token automatically deactivates it on the backend, preventing privacy leaks.
* On session refresh (`POST /api/auth/refresh`), the device token's active status is maintained.
* **100% Backward Compatible:** The standalone `POST /api/notifications/register-token` endpoint remains active for mid-session token rotations (`onTokenRefresh`).

---

## 🔄 2. API Contract Specification

### 2.1 Alumni Login (`POST /api/auth/alumni/login`)

#### Request Body
The login endpoint accepts either flat device fields or a nested `device` object.

```json
{
  "email": "demo.alumni@ipam.edu",
  "password": "Password123!",
  "rememberMe": true,
  "deviceToken": "eXamPle_fcm_token_received_from_firebase_messaging",
  "platform": "android",
  "deviceName": "Samsung Galaxy S24 Ultra",
  "appVersion": "1.0.0",
  "subscribeToAll": true
}
```

*Alternative Nested Format (also supported):*
```json
{
  "email": "demo.alumni@ipam.edu",
  "password": "Password123!",
  "device": {
    "token": "eXamPle_fcm_token_...",
    "platform": "android",
    "deviceName": "Samsung Galaxy S24 Ultra",
    "appVersion": "1.0.0",
    "subscribeToAll": true
  }
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | `string` | **Yes** | Registered alumni email address |
| `password` | `string` | **Yes** | Alumnus account password |
| `rememberMe` | `boolean` | No | Extend JWT session duration (default: `true`) |
| `deviceToken` | `string` | No | FCM registration token (min 10 chars) |
| `platform` | `string` | No | `"android"` \| `"ios"` \| `"web"` (default: `"android"`) |
| `deviceName` | `string` | No | Device manufacturer & model name |
| `appVersion` | `string` | No | Flutter app version (e.g., `"1.0.0"`) |
| `subscribeToAll` | `boolean` | No | Auto-subscribe to `all_alumni` FCM topic (default: `true`) |

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "cmuznxfl90007o63lnxqupalc",
    "email": "demo.alumni@ipam.edu",
    "studentId": "IPAM-2015-0042",
    "isVerifiedAlumni": true,
    "membershipTier": "PLATINUM",
    "status": "APPROVED",
    "savedJobsCount": 3,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "deviceRegistered": true,
    "topicSubscribed": true,
    "device": {
      "id": "cuid_device_record_123",
      "platform": "android",
      "deviceName": "Samsung Galaxy S24 Ultra",
      "appVersion": "1.0.0",
      "isActive": true,
      "lastUsedAt": "2026-10-30T06:00:00.000Z"
    },
    "profile": {
      "id": "cmv123...",
      "name": "Alex Sesay",
      "avatar": "/uploads/avatar_123.jpg",
      "classYear": 2015,
      "degree": "B.Sc. Applied Accounting"
    }
  }
}
```

---

### 2.2 Alumni Logout (`POST /api/auth/alumni/logout`)

Pass the device token on logout so the backend marks it inactive:

#### Request Body
```json
{
  "deviceToken": "eXamPle_fcm_token_..."
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "loggedOut": true,
    "deviceUnregistered": true
  }
}
```

---

### 2.3 Session Refresh (`POST /api/auth/refresh`)

When refreshing an expired or aging JWT token:

#### Request Body
```json
{
  "token": "current_jwt_token",
  "deviceToken": "eXamPle_fcm_token_...",
  "platform": "android"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "token": "refreshed_new_jwt_token",
    "user": { ... },
    "deviceRegistered": true
  }
}
```

---

### 2.4 Token Rotation (`POST /api/notifications/register-token`)

*Preserved for mid-session token updates (e.g. Firebase rotating the token while the user is actively browsing).*

#### Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "token": "new_rotated_fcm_token_...",
  "platform": "android",
  "deviceName": "Samsung Galaxy S24 Ultra",
  "appVersion": "1.0.0",
  "subscribeToAll": true
}
```

---

## 💻 3. Flutter (`IPAM-mobile`) Refactoring Guide

Here are the exact changes needed in the `IPAM-mobile` codebase.

### Step 1: Update Login Models (`lib/models/auth_models.dart`)

```dart
class LoginRequest {
  final String email;
  final String password;
  final bool rememberMe;
  final String? deviceToken;
  final String? platform;
  final String? deviceName;
  final String? appVersion;
  final bool subscribeToAll;

  LoginRequest({
    required this.email,
    required this.password,
    this.rememberMe = true,
    this.deviceToken,
    this.platform,
    this.deviceName,
    this.appVersion,
    this.subscribeToAll = true,
  });

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      'email': email,
      'password': password,
      'rememberMe': rememberMe,
    };
    if (deviceToken != null) {
      map['deviceToken'] = deviceToken;
      map['platform'] = platform ?? 'android';
      if (deviceName != null) map['deviceName'] = deviceName;
      if (appVersion != null) map['appVersion'] = appVersion;
      map['subscribeToAll'] = subscribeToAll;
    }
    return map;
  }
}

class LoginResponse {
  final String id;
  final String email;
  final String studentId;
  final String token;
  final bool deviceRegistered;
  final Map<String, dynamic>? profile;

  LoginResponse({
    required this.id,
    required this.email,
    required this.studentId,
    required this.token,
    this.deviceRegistered = false,
    this.profile,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      studentId: json['studentId'] ?? '',
      token: json['token'] ?? '',
      deviceRegistered: json['deviceRegistered'] ?? false,
      profile: json['profile'],
    );
  }
}
```

---

### Step 2: Refactor `LoginScreen` / `AuthProvider`

#### ❌ Before (Old, Two-Step Fragile Handshake):
```dart
// OLD CODE - DO NOT USE
final loginRes = await dio.post('/api/auth/alumni/login', data: {
  'email': email,
  'password': password,
});
final token = loginRes.data['data']['token'];
await storage.write(key: 'auth_token', value: token);

// Second request (vulnerable to network drop)
final fcmToken = await FirebaseMessaging.instance.getToken();
if (fcmToken != null) {
  await dio.post(
    '/api/notifications/register-token',
    options: Options(headers: {'Authorization': 'Bearer $token'}),
    data: {'token': fcmToken, 'platform': 'android'},
  );
}
```

#### ✅ After (New, Atomic Handshake):
```dart
import 'dart:io';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

Future<void> loginUser(String email, String password) async {
  // 1. Fetch FCM device token before login
  String? fcmToken;
  try {
    fcmToken = await FirebaseMessaging.instance.getToken();
  } catch (e) {
    debugPrint("Notice: FCM token not yet available: $e");
  }

  // 2. Fetch device and app metadata
  String deviceName = "Mobile Device";
  final deviceInfo = DeviceInfoPlugin();
  if (Platform.isAndroid) {
    final info = await deviceInfo.androidInfo;
    deviceName = "${info.manufacturer} ${info.model}";
  } else if (Platform.isIOS) {
    final info = await deviceInfo.iosInfo;
    deviceName = info.utsname.machine;
  }
  final packageInfo = await PackageInfo.fromPlatform();

  // 3. Dispatch atomic login request
  final response = await dio.post(
    '/api/auth/alumni/login',
    data: {
      'email': email.trim(),
      'password': password,
      'rememberMe': true,
      'deviceToken': fcmToken,
      'platform': Platform.isAndroid ? 'android' : (Platform.isIOS ? 'ios' : 'web'),
      'deviceName': deviceName,
      'appVersion': packageInfo.version,
      'subscribeToAll': true,
    },
  );

  // 4. Save credentials
  final authToken = response.data['data']['token'];
  await storage.write(key: 'auth_token', value: authToken);
  if (fcmToken != null) {
    await storage.write(key: 'fcm_device_token', value: fcmToken);
  }

  debugPrint("✅ Authenticated & Device Registered: ${response.data['data']['deviceRegistered']}");
}
```

---

### Step 3: Refactor Logout Flow

```dart
Future<void> logoutUser() async {
  final fcmToken = await storage.read(key: 'fcm_device_token');
  final authToken = await storage.read(key: 'auth_token');

  try {
    await dio.post(
      '/api/auth/alumni/logout',
      options: Options(headers: {
        if (authToken != null) 'Authorization': 'Bearer $authToken',
      }),
      data: {
        if (fcmToken != null) 'deviceToken': fcmToken,
      },
    );
  } catch (e) {
    debugPrint("Logout notice: $e");
  } finally {
    await storage.deleteAll();
    Navigator.of(context).pushReplacementNamed('/login');
  }
}
```

---

### Step 4: Token Rotation Listener (`NotificationService`)

Keep only the background token refresh listener:

```dart
void setupTokenRefreshListener(Dio dio, FlutterSecureStorage storage) {
  FirebaseMessaging.instance.onTokenRefresh.listen((newToken) async {
    debugPrint("🔄 FCM Token Refreshed by Firebase: $newToken");
    await storage.write(key: 'fcm_device_token', value: newToken);

    final authToken = await storage.read(key: 'auth_token');
    if (authToken != null && authToken.isNotEmpty) {
      try {
        await dio.post(
          '/api/notifications/register-token',
          options: Options(headers: {'Authorization': 'Bearer $authToken'}),
          data: {
            'token': newToken,
            'platform': Platform.isAndroid ? 'android' : 'ios',
            'subscribeToAll': true,
          },
        );
        debugPrint("✅ Rotated FCM token synced with backend.");
      } catch (e) {
        debugPrint("Token sync failed: $e");
      }
    }
  });
}
```

---

## 🔔 4. Push Notification Payload Handling

When the backend sends notifications, Flutter can read the payload fields in both foreground and background handlers:

```dart
// Payload structure delivered in RemoteMessage:
{
  "notification": {
    "title": "🎓 Degree Verification Approved!",
    "body": "Congratulations! Your official IPAM degree credentials and digital pass have been signed off."
  },
  "data": {
    "notificationId": "cmv...",
    "type": "VERIFICATION",
    "priority": "URGENT",
    "actionUrl": "/pass",
    "screen": "virtual_pass"
  }
}
```

### Deep-Link Routing Matrix

| `data['actionUrl']` or `data['screen']` | Target Flutter Screen | Route Name |
| :--- | :--- | :--- |
| `/pass` or `virtual_pass` | Digital Pass & QR Code Screen | `'/virtual-pass'` |
| `/jobs` or `job_applications` | Jobs & Career Pipeline Screen | `'/jobs'` |
| `/events` or `event_detail` | Events & RSVP Confirmation Screen | `'/events'` |
| `/physical-card` or `card_tracker`| Physical ID Card Tracking Screen | `'/card-tracker'` |
| Any other or broadcast | In-App Notification Center | `'/notifications'` |

---

## 🧪 5. Testing & Verification

### Test Accounts
* **Alumni Email:** `demo.alumni@ipam.edu`
* **Password:** `Password123!`
* **Student ID:** `IPAM-2015-0042`
* **Registration 2FA OTP:** `123456`

### Testing with `curl`
```bash
# 1. Login with Device Token
curl -X POST https://ipam.billnbite.cloud/api/auth/alumni/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo.alumni@ipam.edu",
    "password": "Password123!",
    "deviceToken": "mock_test_token_1234567890",
    "platform": "android",
    "deviceName": "Google Pixel 8 Pro",
    "appVersion": "1.0.0"
  }'

# 2. Check registered devices
curl -X GET https://ipam.billnbite.cloud/api/notifications/devices \
  -H "Authorization: Bearer <TOKEN_RETURNED_ABOVE>"

# 3. Test Logout with Device Token
curl -X POST https://ipam.billnbite.cloud/api/auth/alumni/logout \
  -H "Authorization: Bearer <TOKEN_RETURNED_ABOVE>" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceToken": "mock_test_token_1234567890"
  }'
```

---

## ✅ Summary Checklist for IPAM-mobile Developers
- [ ] Add `deviceToken`, `platform`, `deviceName`, and `appVersion` to the `POST /api/auth/alumni/login` payload.
- [ ] Remove redundant post-login call to `/api/notifications/register-token`.
- [ ] Send `deviceToken` in `POST /api/auth/alumni/logout` payload.
- [ ] Keep `onTokenRefresh` listener calling `/api/notifications/register-token` for mid-session token rotations.
- [ ] Map `data['actionUrl']` to app deep links (`/pass`, `/jobs`, `/events`, `/card-tracker`).
