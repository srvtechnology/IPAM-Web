# Module 14: Push Notifications & Firebase Cloud Messaging (FCM)

This guide provides the complete Flutter mobile integration specification for Firebase Cloud Messaging (FCM), push device token registration, in-app notification center, and automatic background topic synchronization.

---

## 🚀 1. Overview & Architecture

The IPAM Alumni backend uses Google Firebase Cloud Messaging HTTP v1 with dedicated service account credentials (`serviceAccountKey.json`, Project: `auratrade-p93c`).

Push notifications are dispatched on:
1. **Administrative Broadcasts:** Campus emergencies, announcements, and invitations where `"PUSH"` is in the channels.
2. **Degree Verification Sign-off:** Notifies alumni when registrar degree approval is granted or rejected.
3. **Physical ID Cards:** Order status transitions (`IN_PRINT_PRESS`, `READY_COURIER`, `DISPATCHED`, `DELIVERED`).
4. **Job Applications:** Candidate status updates (`SHORTLISTED`, `INTERVIEW_SCHEDULED`, `OFFERED`, `REJECTED`).
5. **Event RSVPs:** Immediate ticket booking confirmation.

---

## 📡 2. Endpoints Reference

### 2.1 Register Device Token
* **URL:** `POST /api/notifications/register-token`
* **Auth:** Bearer Token (`Authorization: Bearer <token>`)
* **Request Body:**
```json
{
  "token": "eXamPle_fcm_token_received_from_firebase_messaging",
  "platform": "android",
  "deviceName": "Google Pixel 8 Pro",
  "appVersion": "1.0.0",
  "subscribeToAll": true
}
```
* **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "registered": true,
    "device": {
      "id": "cuid...",
      "platform": "android",
      "deviceName": "Google Pixel 8 Pro",
      "isActive": true,
      "lastUsedAt": "2026-10-29T12:00:00.000Z"
    },
    "topicSubscribed": true,
    "fcmConfigured": true
  }
}
```

### 2.2 Unregister Device Token
* **URL:** `POST /api/notifications/unregister-token`
* **Auth:** Bearer Token
* **Request Body:**
```json
{
  "token": "eXamPle_fcm_token..."
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "unregistered": true
  }
}
```

### 2.3 List User Devices
* **URL:** `GET /api/notifications/devices`
* **Auth:** Bearer Token
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "devices": [
      {
        "id": "cuid...",
        "platform": "android",
        "deviceName": "Google Pixel 8 Pro",
        "appVersion": "1.0.0",
        "createdAt": "2026-10-29T10:00:00.000Z",
        "lastUsedAt": "2026-10-29T12:00:00.000Z"
      }
    ],
    "total": 1
  }
}
```

### 2.4 Fetch Unified Notifications List
* **URL:** `GET /api/alumni/notifications`
* **Auth:** Bearer Token
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_123",
        "type": "NOTIFICATION",
        "categoryType": "VERIFICATION",
        "title": "🎓 Degree Verification Approved!",
        "message": "Congratulations! Your official IPAM degree credentials and digital pass have been signed off.",
        "channels": ["PUSH", "IN_APP"],
        "date": "2026-10-29T12:30:00.000Z",
        "priority": "HIGH",
        "audienceLabel": "Direct Notification",
        "actionUrl": "/pass",
        "isRead": false,
        "isPersonal": true
      }
    ],
    "total": 1,
    "unreadPersonalCount": 1,
    "userEmail": "demo.alumni@ipam.edu"
  }
}
```

### 2.5 Mark Notification as Read
* **URL:** `PATCH /api/alumni/notifications/{id}/read`
* **Auth:** Bearer Token
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "notif_123",
    "isRead": true,
    "readAt": "2026-10-29T12:35:00.000Z"
  }
}
```

### 2.6 Mark All Notifications Read
* **URL:** `POST /api/alumni/notifications/read-all`
* **Auth:** Bearer Token
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "markedReadCount": 3
  }
}
```

---

## 📱 3. Flutter Implementation Guide

### 3.1 Dependencies (`pubspec.yaml`)
```yaml
dependencies:
  flutter:
    sdk: flutter
  firebase_core: ^3.10.0
  firebase_messaging: ^15.2.0
  flutter_local_notifications: ^18.0.1
  dio: ^5.7.0
  flutter_secure_storage: ^9.2.2
```

### 3.2 Notification Service Class (`fcm_service.dart`)
```dart
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class FcmService {
  final Dio _dio;
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifs = FlutterLocalNotificationsPlugin();

  FcmService(this._dio);

  Future<void> initialize() async {
    // 1. Request notification permissions
    NotificationSettings settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    if (settings.authorizationStatus != AuthorizationStatus.authorized) {
      return;
    }

    // 2. Set up local notifications channel for foreground delivery
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'ipam_alumni_notifications',
      'IPAM Alumni Official Notifications',
      description: 'Official announcements, status alerts, and invitations.',
      importance: Importance.high,
      playSound: true,
    );

    await _localNotifs
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);

    // 3. Obtain FCM Token and register on backend
    String? token = await _fcm.getToken();
    if (token != null) {
      await registerTokenWithBackend(token);
    }

    // 4. Handle token refreshes
    _fcm.onTokenRefresh.listen((newToken) {
      registerTokenWithBackend(newToken);
    });

    // 5. Foreground message handler
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      RemoteNotification? notification = message.notification;
      AndroidNotification? android = message.notification?.android;

      if (notification != null && android != null) {
        _localNotifs.show(
          notification.hashCode,
          notification.title,
          notification.body,
          NotificationDetails(
            android: AndroidNotificationDetails(
              channel.id,
              channel.name,
              channelDescription: channel.description,
              icon: '@mipmap/ic_launcher',
              color: const Color(0xFF10B981), // Emerald 500
            ),
          ),
          payload: message.data['actionUrl'],
        );
      }
    });
  }

  Future<void> registerTokenWithBackend(String token) async {
    try {
      await _dio.post(
        '/api/notifications/register-token',
        data: {
          'token': token,
          'platform': Platform.isAndroid ? 'android' : Platform.isIOS ? 'ios' : 'web',
          'deviceName': Platform.localHostname,
          'appVersion': '1.0.0',
          'subscribeToAll': true,
        },
      );
    } catch (e) {
      // Handle error or retry on network restore
    }
  }

  Future<void> unregisterTokenOnLogout() async {
    try {
      String? token = await _fcm.getToken();
      if (token != null) {
        await _dio.post(
          '/api/notifications/unregister-token',
          data: {'token': token},
        );
      }
    } catch (_) {}
  }
}
```

