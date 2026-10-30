# IPAM Mobile (Flutter) — Push Notifications Implementation Guide

> **Project:** IPAM Alumni Association Mobile App (`IPAM-mobile`)  
> **Backend Service:** Google Firebase Cloud Messaging (FCM HTTP v1)  
> **Firebase Project ID:** `auratrade-p93c`  
> **Messaging Sender ID:** `570831339769`  
> **Document Version:** 1.0.0 (Production Ready)

---

## 📋 Table of Contents
1. [Overview & Notification Types](#1-overview--notification-types)
2. [Firebase Project Setup & Config Files](#2-firebase-project-setup--config-files)
3. [Android Native Configuration](#3-android-native-configuration)
4. [iOS Native Configuration](#4-ios-native-configuration)
5. [Flutter Dependencies (`pubspec.yaml`)](#5-flutter-dependencies-pubspecyaml)
6. [Complete Dart Implementation](#6-complete-dart-implementation)
   - [6.1 Background Message Entry Point](#61-background-message-entry-point)
   - [6.2 NotificationService Class](#62-notificationservice-class)
   - [6.3 Notification Model & API Client](#63-notification-model--api-client)
   - [6.4 Deep Linking & Route Navigation](#64-deep-linking--route-navigation)
   - [6.5 Notification Center UI](#65-notification-center-ui)
7. [Token Lifecycle & Authentication Wiring](#7-token-lifecycle--authentication-wiring)
8. [Backend API Reference](#8-backend-api-reference)
9. [Testing, QA & Troubleshooting Checklist](#9-testing-qa--troubleshooting-checklist)

---

## 1. Overview & Notification Types

The IPAM Alumni backend automatically triggers real-time push notifications across 5 core events:

| Event Type | Category | Priority | Trigger Source | Target Audience | Default Screen / Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Broadcast** | `MESSAGE` / `INVITATION` | Normal / Urgent | Admin Omnichannel Broadcast | All registered alumni (Topic: `all_alumni`) or targeted cohort | Event RSVP, Gala, or News detail |
| **Degree Verification** | `VERIFICATION` | Urgent | Registrar signs off degree approval or rejection | Specific alumnus | `/pass` (Digital Pass Screen) |
| **Physical ID Card** | `ID_CARD` | Normal | Card order status update (`DISPATCHED`, `DELIVERED`) | Specific card purchaser | Order tracking screen |
| **Job Pipeline** | `JOB` | Normal | Recruiter shortlists or updates candidate application | Specific applicant | Job application screen |
| **Event RSVP** | `EVENT` | Normal | Ticket booking confirmation | Specific ticket holder | Event ticket pass screen |

---

## 2. Firebase Project Setup & Config Files

### 2.1 Firebase Project Details
- **Project ID:** `auratrade-p93c`
- **Sender ID / Project Number:** `570831339769`
- **Web App ID:** `1:570831339769:web:594df89ce062124522e228`

### 2.2 Android Configuration File
1. Download `google-services.json` from the Firebase Console for `auratrade-p93c`.
2. Place it in:
   ```text
   IPAM-mobile/android/app/google-services.json
   ```
3. Ensure the `package_name` in `google-services.json` matches your `applicationId` in `android/app/build.gradle` (e.g. `com.ipam.alumni` or `com.ipam.mobile`).

### 2.3 iOS Configuration File
1. Download `GoogleService-Info.plist` from Firebase Console.
2. Open the iOS project in Xcode (`open ios/Runner.xcworkspace`).
3. Drag and drop `GoogleService-Info.plist` into `Runner/` directory (ensure **Copy items if needed** is checked).

---

## 3. Android Native Configuration

### 3.1 Project-Level `android/build.gradle`
```groovy
buildscript {
    dependencies {
        // Add Google Services classpath
        classpath 'com.google.gms:google-services:4.4.2'
    }
}
```

### 3.2 App-Level `android/app/build.gradle`
```groovy
apply plugin: 'com.android.application'
apply plugin: 'com.google.gms.google-services' // <--- Add at bottom or after plugins block

android {
    defaultConfig {
        minSdkVersion 23 // Recommended for modern FCM & local notifications
        targetSdkVersion 34
        multiDexEnabled true
    }
}
```

### 3.3 `android/app/src/main/AndroidManifest.xml`
Add permissions and default notification channels inside `<manifest>`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Permissions required for Android 13+ (API 33+) -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

    <application
        android:label="IPAM Alumni"
        android:name="${applicationName}"
        android:icon="@mipmap/ic_launcher">

        <!-- Default Notification Channel for FCM -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="ipam_alumni_notifications" />

        <!-- Notification Icon (transparent icon) -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_icon"
            android:resource="@mipmap/ic_launcher" />

        <!-- Default Accent Color: IPAM Emerald (#10B981) -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_color"
            android:resource="@color/emerald_500" />

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/LaunchTheme">
            <!-- Normal intent filters -->
        </activity>
    </application>
</manifest>
```

---

## 4. iOS Native Configuration

### 4.1 Enable Capabilities in Xcode
1. Open `ios/Runner.xcworkspace` in Xcode.
2. Select the **Runner** target $\rightarrow$ **Signing & Capabilities**.
3. Click **+ Capability**:
   - Add **Push Notifications**.
   - Add **Background Modes**, and check **Remote notifications** and **Background fetch**.

### 4.2 `ios/Runner/AppDelegate.swift`
Ensure UNUserNotificationCenter delegate is initialized:

```swift
import UIKit
import Flutter
import FirebaseCore
import FirebaseMessaging

@UIApplicationMain
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    FirebaseApp.configure()
    
    if #available(iOS 10.0, *) {
      UNUserNotificationCenter.current().delegate = self as UNUserNotificationCenterDelegate
    }

    GeneratedPluginRegistrant.register(with: self)
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
```

---

## 5. Flutter Dependencies (`pubspec.yaml`)

Add these dependencies to your `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter

  # Firebase Core & Messaging
  firebase_core: ^3.10.0
  firebase_messaging: ^15.2.0

  # Local Notification display for foreground alerts
  flutter_local_notifications: ^18.0.1

  # HTTP Client & Storage
  dio: ^5.7.0
  flutter_secure_storage: ^9.2.2
  device_info_plus: ^11.2.0
  package_info_plus: ^8.2.0

  # State Management (example with Provider/Riverpod/Bloc)
  provider: ^6.1.2
```

Run:
```bash
flutter pub get
```

---

## 6. Complete Dart Implementation

### 6.1 Top-Level Background Entry Point (`lib/main.dart`)

Firebase requires background message handlers to be top-level functions annotated with `@pragma('vm:entry-point')`.

```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:ipam_mobile/services/notification_service.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint("🔥 [FCM Background] Title: ${message.notification?.title}");
  debugPrint("🔥 [FCM Background] Payload data: ${message.data}");
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  await Firebase.initializeApp();
  
  // Register background handler
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  // Initialize notifications service
  await NotificationService.instance.initialize();

  runApp(const IpamAlumniApp());
}
```

---

### 6.2 NotificationService Class (`lib/services/notification_service.dart`)

```dart
// lib/services/notification_service.dart
import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class NotificationService {
  NotificationService._internal();
  static final NotificationService instance = NotificationService._internal();

  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifs = FlutterLocalNotificationsPlugin();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  // Navigation Global Key to route on notification click
  GlobalKey<NavigatorState>? navigatorKey;

  // Local Android Channel definition
  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'ipam_alumni_notifications',
    'IPAM Alumni Official Notifications',
    description: 'Degree sign-offs, physical ID tracking, job updates, and official broadcasts.',
    importance: Importance.max,
    playSound: true,
    enableVibration: true,
  );

  /// Initializes permissions, channels, local plugin, and sets up message streams
  Future<void> initialize({GlobalKey<NavigatorState>? navKey}) async {
    if (navKey != null) navigatorKey = navKey;

    // 1. Request iOS & Android 13+ Notification Permissions
    final settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    debugPrint("🔔 FCM Authorization status: ${settings.authorizationStatus}");
    if (settings.authorizationStatus == AuthorizationStatus.denied) {
      debugPrint("⚠️ User denied push notification permissions");
      return;
    }

    // 2. Initialize Flutter Local Notifications Plugin
    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosInit = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    const initSettings = InitializationSettings(android: androidInit, iOS: iosInit);

    await _localNotifs.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        if (response.payload != null && response.payload!.isNotEmpty) {
          _handleNavigationPayload(response.payload!);
        }
      },
    );

    // Create high-importance Android channel
    await _localNotifs
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_channel);

    // 3. Obtain initial FCM token and register with IPAM backend
    final token = await _fcm.getToken();
    if (token != null) {
      debugPrint("📱 Device FCM Token: $token");
      await syncTokenWithBackend(token);
    }

    // 4. Token refresh listener
    _fcm.onTokenRefresh.listen((newToken) async {
      debugPrint("🔄 FCM Token Refreshed: $newToken");
      await syncTokenWithBackend(newToken);
    });

    // 5. Foreground Notification Listener (shows heads-up banner via local notifications)
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint("📩 [FCM Foreground] Received: ${message.notification?.title}");
      _showLocalNotification(message);
    });

    // 6. Handle notification click when app was in background
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      debugPrint("🚀 [FCM onMessageOpenedApp] Clicked notification: ${message.data}");
      final actionUrl = message.data['actionUrl'] ?? message.data['route'];
      if (actionUrl != null) {
        _handleNavigationPayload(actionUrl);
      }
    });

    // 7. Handle notification click when app was completely terminated
    final initialMessage = await _fcm.getInitialMessage();
    if (initialMessage != null) {
      debugPrint("⚡ [FCM getInitialMessage] Launched from terminated: ${initialMessage.data}");
      final actionUrl = initialMessage.data['actionUrl'] ?? initialMessage.data['route'];
      if (actionUrl != null) {
        // Slight delay to ensure Flutter widget tree has mounted
        Future.delayed(const Duration(milliseconds: 500), () {
          _handleNavigationPayload(actionUrl);
        });
      }
    }
  }

  /// Presents a heads-up local notification when app is in foreground
  void _showLocalNotification(RemoteMessage message) {
    final notification = message.notification;
    final data = message.data;

    final title = notification?.title ?? data['title'] ?? 'IPAM Alumni Association';
    final body = notification?.body ?? data['message'] ?? '';
    final actionUrl = data['actionUrl'] ?? data['route'] ?? '';

    _localNotifs.show(
      message.hashCode,
      title,
      body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _channel.id,
          _channel.name,
          channelDescription: _channel.description,
          importance: Importance.max,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
          color: const Color(0xFF10B981), // Emerald 500
          styleInformation: BigTextStyleInformation(body),
        ),
        iOS: const DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
      payload: actionUrl,
    );
  }

  /// Sends FCM token to IPAM Backend with device metadata
  Future<void> syncTokenWithBackend(String token) async {
    try {
      final authToken = await _storage.read(key: 'auth_token');
      // If user is not logged in, token is stored locally and registered after login
      await _storage.write(key: 'fcm_device_token', value: token);

      if (authToken == null || authToken.isEmpty) {
        debugPrint("ℹ️ User not authenticated yet. FCM token cached for post-login sync.");
        return;
      }

      final deviceInfo = DeviceInfoPlugin();
      String deviceName = "Mobile Device";
      if (Platform.isAndroid) {
        final androidInfo = await deviceInfo.androidInfo;
        deviceName = "${androidInfo.manufacturer} ${androidInfo.model}";
      } else if (Platform.isIOS) {
        final iosInfo = await deviceInfo.iosInfo;
        deviceName = iosInfo.utsname.machine;
      }

      final packageInfo = await PackageInfo.fromPlatform();

      final dio = Dio(BaseOptions(
        baseUrl: 'https://ipam.billnbite.cloud',
        headers: {
          'Authorization': 'Bearer $authToken',
          'Content-Type': 'application/json',
        },
      ));

      final response = await dio.post(
        '/api/notifications/register-token',
        data: {
          'token': token,
          'platform': Platform.isAndroid ? 'android' : (Platform.isIOS ? 'ios' : 'web'),
          'deviceName': deviceName,
          'appVersion': packageInfo.version,
          'subscribeToAll': true,
        },
      );

      debugPrint("✅ FCM token registered on backend: ${response.statusCode}");
    } catch (e) {
      debugPrint("❌ Failed to register FCM token on backend: $e");
    }
  }

  /// Unregisters FCM token on logout to stop notifications for the account
  Future<void> unregisterOnLogout() async {
    try {
      final token = await _storage.read(key: 'fcm_device_token') ?? await _fcm.getToken();
      final authToken = await _storage.read(key: 'auth_token');

      if (token != null && authToken != null) {
        final dio = Dio(BaseOptions(
          baseUrl: 'https://ipam.billnbite.cloud',
          headers: {
            'Authorization': 'Bearer $authToken',
            'Content-Type': 'application/json',
          },
        ));

        await dio.post(
          '/api/notifications/unregister-token',
          data: {'token': token},
        );
        debugPrint("🚪 FCM token successfully unregistered on backend.");
      }
    } catch (e) {
      debugPrint("⚠️ Token unregister notice: $e");
    }
  }

  /// Handles route parsing and navigation
  void _handleNavigationPayload(String actionUrl) {
    debugPrint("🧭 Deep linking to action URL: $actionUrl");
    if (navigatorKey?.currentState == null) return;

    if (actionUrl == '/pass' || actionUrl.contains('pass')) {
      navigatorKey!.currentState!.pushNamed('/virtual-pass');
    } else if (actionUrl.contains('/jobs')) {
      navigatorKey!.currentState!.pushNamed('/jobs');
    } else if (actionUrl.contains('/events')) {
      navigatorKey!.currentState!.pushNamed('/events');
    } else if (actionUrl.contains('/physical-card') || actionUrl.contains('/id-cards')) {
      navigatorKey!.currentState!.pushNamed('/card-tracker');
    } else {
      navigatorKey!.currentState!.pushNamed('/notifications');
    }
  }
}
```

---

### 6.3 Notification Model & API Client (`lib/models/notification_model.dart`)

```dart
// lib/models/notification_model.dart
class AlumniNotification {
  final String id;
  final String type; // MESSAGE, INVITATION, NOTIFICATION
  final String? categoryType; // VERIFICATION, ID_CARD, JOB, EVENT, ALERT
  final String title;
  final String message;
  final List<String> channels;
  final DateTime date;
  final String priority; // NORMAL, URGENT, CRITICAL
  final String audienceLabel;
  final String? actionUrl;
  final bool isRead;
  final bool isPersonal;

  AlumniNotification({
    required this.id,
    required this.type,
    this.categoryType,
    required this.title,
    required this.message,
    required this.channels,
    required this.date,
    required this.priority,
    required this.audienceLabel,
    this.actionUrl,
    required this.isRead,
    required this.isPersonal,
  });

  factory AlumniNotification.fromJson(Map<String, dynamic> json) {
    return AlumniNotification(
      id: json['id'] ?? '',
      type: json['type'] ?? 'NOTIFICATION',
      categoryType: json['categoryType'],
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      channels: List<String>.from(json['channels'] ?? []),
      date: DateTime.tryParse(json['date'] ?? '') ?? DateTime.now(),
      priority: json['priority'] ?? 'NORMAL',
      audienceLabel: json['audienceLabel'] ?? '',
      actionUrl: json['actionUrl'],
      isRead: json['isRead'] ?? false,
      isPersonal: json['isPersonal'] ?? false,
    );
  }
}
```

---

### 6.4 Notification Center Screen (`lib/screens/notification_center_screen.dart`)

```dart
// lib/screens/notification_center_screen.dart
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:ipam_mobile/models/notification_model.dart';

class NotificationCenterScreen extends StatefulWidget {
  const NotificationCenterScreen({Key? key}) : super(key: key);

  @override
  State<NotificationCenterScreen> createState() => _NotificationCenterScreenState();
}

class _NotificationCenterScreenState extends State<NotificationCenterScreen> {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  List<AlumniNotification> _notifications = [];
  bool _loading = true;
  int _unreadCount = 0;

  @override
  void initState() {
    super.initState();
    _fetchNotifications();
  }

  Future<Dio> _getDio() async {
    final token = await _storage.read(key: 'auth_token');
    return Dio(BaseOptions(
      baseUrl: 'https://ipam.billnbite.cloud',
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    ));
  }

  Future<void> _fetchNotifications() async {
    setState(() => _loading = true);
    try {
      final dio = await _getDio();
      final res = await dio.get('/api/alumni/notifications');
      if (res.statusCode == 200 && res.data['success'] == true) {
        final list = (res.data['data']['notifications'] as List)
            .map((item) => AlumniNotification.fromJson(item))
            .toList();

        setState(() {
          _notifications = list;
          _unreadCount = res.data['data']['unreadPersonalCount'] ?? 0;
          _loading = false;
        });
      }
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Future<void> _markAsRead(AlumniNotification notif) async {
    if (notif.isRead || !notif.isPersonal) return;
    try {
      final dio = await _getDio();
      await dio.patch('/api/alumni/notifications/${notif.id}/read');
      setState(() {
        final index = _notifications.indexWhere((n) => n.id == notif.id);
        if (index != -1) {
          _notifications[index] = AlumniNotification(
            id: notif.id,
            type: notif.type,
            categoryType: notif.categoryType,
            title: notif.title,
            message: notif.message,
            channels: notif.channels,
            date: notif.date,
            priority: notif.priority,
            audienceLabel: notif.audienceLabel,
            actionUrl: notif.actionUrl,
            isRead: true,
            isPersonal: notif.isPersonal,
          );
          if (_unreadCount > 0) _unreadCount--;
        }
      });
    } catch (_) {}
  }

  Future<void> _markAllRead() async {
    try {
      final dio = await _getDio();
      await dio.post('/api/alumni/notifications/read-all');
      _fetchNotifications();
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A), // Slate 900
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('Notifications', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        actions: [
          if (_unreadCount > 0)
            TextButton(
              onPressed: _markAllRead,
              child: const Text('Mark all read', style: TextStyle(color: Color(0xFF34D399), fontWeight: FontWeight.bold)),
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
          : _notifications.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  color: const Color(0xFF10B981),
                  onRefresh: _fetchNotifications,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(12),
                    itemCount: _notifications.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final item = _notifications[index];
                      return _buildNotificationCard(item);
                    },
                  ),
                ),
    );
  }

  Widget _buildNotificationCard(AlumniNotification item) {
    final isUrgent = item.priority == 'URGENT' || item.priority == 'CRITICAL';
    return InkWell(
      onTap: () => _markAsRead(item),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: item.isRead ? const Color(0xFF1E293B) : const Color(0xFF334155),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isUrgent ? const Color(0xFFF59E0B) : const Color(0xFF475569),
            width: isUrgent ? 1.5 : 0.6,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    item.title,
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: item.isRead ? FontWeight.w640 : FontWeight.w800,
                      fontSize: 14,
                    ),
                  ),
                ),
                if (!item.isRead)
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(color: Color(0xFF10B981), shape: BoxShape.circle),
                  ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              item.message,
              style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13, height: 1.4),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  "${item.date.day}/${item.date.month}/${item.date.year}",
                  style: const TextStyle(color: Color(0xFF64748B), fontSize: 11),
                ),
                if (item.actionUrl != null)
                  const Text(
                    "View details →",
                    style: TextStyle(color: Color(0xFF34D399), fontSize: 12, fontWeight: FontWeight.bold),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: const [
          Icon(Icons.notifications_none_outlined, size: 48, color: Color(0xFF64748B)),
          SizedBox(height: 12),
          Text("No notifications yet", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          SizedBox(height: 4),
          Text("Official university announcements will appear here", style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
        ],
      ),
    );
  }
}
```

---

## 7. Token Lifecycle & Authentication Wiring

With the backend login integration, device token registration is **atomic**—the mobile app registers its push token in the exact same handshake as authentication, eliminating race conditions or secondary network failures.

### 7.1 On User Login (`lib/screens/login_screen.dart` - Unified Handshake)
```dart
// 1. Retrieve the FCM device token from Firebase Messaging
final fcmToken = await FirebaseMessaging.instance.getToken();

// 2. Send login credentials WITH device token in a single request
final response = await dio.post(
  '/api/auth/alumni/login',
  data: {
    'email': emailController.text.trim(),
    'password': passwordController.text,
    'rememberMe': true,
    'deviceToken': fcmToken,
    'platform': Platform.isAndroid ? 'android' : 'ios',
    'deviceName': '${deviceInfo.manufacturer} ${deviceInfo.model}',
    'appVersion': packageInfo.version,
    'subscribeToAll': true,
  },
);

// 3. Save the returned JWT token
final authToken = response.data['data']['token'];
await storage.write(key: 'auth_token', value: authToken);
if (fcmToken != null) {
  await storage.write(key: 'fcm_device_token', value: fcmToken);
}

// 4. Verify device registration state from response
final isDeviceRegistered = response.data['data']['deviceRegistered'] ?? false;
debugPrint("Device registered with backend: $isDeviceRegistered");
```

### 7.2 On User Logout (Deactivate Device Token)
Before clearing local storage, pass the device token to `/api/auth/alumni/logout` so the backend stops sending alerts for that alumnus to the device:
```dart
// 1. Tell backend to deactivate push token for this user
final fcmToken = await storage.read(key: 'fcm_device_token');
try {
  await dio.post(
    '/api/auth/alumni/logout',
    data: {'deviceToken': fcmToken},
  );
} catch (e) {
  debugPrint("Logout warning: $e");
}

// 2. Clear stored auth tokens
await storage.deleteAll();

// 3. Navigate to login
Navigator.of(context).pushReplacementNamed('/login');
```

### 7.3 On Token Refresh (`onTokenRefresh`)
If Firebase rotates the device token while the user is actively logged in:
```dart
_fcm.onTokenRefresh.listen((newToken) async {
  debugPrint("🔄 FCM Token Refreshed: $newToken");
  await NotificationService.instance.syncTokenWithBackend(newToken);
});
```

---

## 8. Backend API Reference

Base URL: `https://ipam.billnbite.cloud` (or local dev `http://localhost:3000`)

### 1. Register Token: `POST /api/notifications/register-token`
- **Auth:** `Bearer <token>`
- **Body:**
  ```json
  {
    "token": "eXamPle_fcm_token_...",
    "platform": "android",
    "deviceName": "Samsung Galaxy S24",
    "appVersion": "1.0.0",
    "subscribeToAll": true
  }
  ```

### 2. Unregister Token: `POST /api/notifications/unregister-token`
- **Auth:** `Bearer <token>`
- **Body:**
  ```json
  {
    "token": "eXamPle_fcm_token_..."
  }
  ```

### 3. Fetch Notifications: `GET /api/alumni/notifications`
- **Auth:** `Bearer <token>`
- **Returns:** `{ "success": true, "data": { "notifications": [...], "unreadPersonalCount": 2 } }`

### 4. Mark Read: `PATCH /api/alumni/notifications/{id}/read`
- **Auth:** `Bearer <token>`

### 5. Mark All Read: `POST /api/alumni/notifications/read-all`
- **Auth:** `Bearer <token>`

---

## 9. Testing, QA & Troubleshooting Checklist

### 9.1 How to Dispatch a Live Test Push
Admins can send a test push directly to a specific device token:
```bash
curl -X POST https://ipam.billnbite.cloud/api/notifications/test \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<YOUR_COPIED_DEVICE_TOKEN>",
    "title": "Flutter Test Notification",
    "message": "Testing real-time delivery to mobile device",
    "priority": "HIGH",
    "actionUrl": "/pass"
  }'
```

### 9.2 Verification Checklist
- [ ] **Permissions Prompt:** Does the permission prompt appear upon first launch?
- [ ] **Token Registration:** Check the backend logs or query `/api/notifications/devices` to verify the device token is stored with `platform: "android"` or `"ios"`.
- [ ] **Foreground State:** Send a push while app is open $\rightarrow$ local heads-up notification banner appears with sound and vibration.
- [ ] **Background State:** Minimize app $\rightarrow$ send push $\rightarrow$ native OS tray notification displays.
- [ ] **Terminated State:** Force-close app from multitasking $\rightarrow$ send push $\rightarrow$ tapping notification opens app and routes to the target screen (`actionUrl`).
- [ ] **Topic Broadcast:** Send an admin broadcast with channel `PUSH` $\rightarrow$ all devices subscribed to `all_alumni` receive the notification simultaneously.
- [ ] **Logout Cleanup:** Logging out removes the token from the active list so subsequent user notifications do not reach the device.
