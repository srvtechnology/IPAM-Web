# 05. Alumni Directory & Networking API Integration

* **Swagger UI Documentation:** [https://ipam.billnbite.cloud/api-docs#/Alumni%20Directory%20&%20Networking](https://ipam.billnbite.cloud/api-docs#/Alumni%20Directory%20&%20Networking)
* **Tag:** `Alumni Directory & Networking`
* **Security Schemes:** `Public` (Directory Browse) & `BearerAuth` (Connect, Bookmarks, Notifications, Profile Editing)

---

## 📌 Overview

The Alumni Directory & Networking module powers peer-to-peer connection among university graduates. It supports:
1. **Directory Search:** Filter alumni by name, graduation year, industry sector, company, or mentorship availability.
2. **Profile Inspection:** View education history, current employer, bio, and LinkedIn profiles.
3. **Network Bookmarks:** Connect with or bookmark fellow alumni and manage your professional address book.
4. **Broadcast Notifications:** Receive university-wide and chapter broadcast notifications.
5. **Profile Editing:** Update bio, current job, location, and skill tags via `/api/profile`.

---

## 🛣️ Endpoints Breakdown

### 1. Search Alumni Directory
* **Method & Path:** `GET /api/alumni`
* **Auth Required:** `None` (Public)
* **Query Parameters:**
  * `q` (`string`): Search string across name, company, role, or skills.
  * `classYear` (`integer`): Filter by graduation class year (e.g. `2015`).
  * `industry` (`string`): e.g. `Technology`, `Banking`, `Public Service`.
  * `isMentor` (`string`): Filter mentors (`"true"` or `"false"`).

#### Success Response (`200 OK`)
```json
{
  "data": [
    {
      "id": "cmuznxflf000go63ld91fia0u",
      "name": "Mariama Sesay",
      "avatar": "/uploads/mariama.jpg",
      "classYear": 2018,
      "degree": "B.Sc. Banking & Finance",
      "major": "Banking & Finance",
      "currentRole": "Treasury Manager",
      "company": "Rokel Commercial Bank",
      "location": "Freetown, Sierra Leone",
      "industry": "Financial Services",
      "isMentor": true,
      "skills": ["Treasury Operations", "Liquidity Risk", "Financial Modeling"]
    }
  ]
}
```

---

### 2. View Alumni Public Profile
* **Method & Path:** `GET /api/alumni/{id}`
* **Auth Required:** `None`
* **Path Parameters:**
  * `id`: Alumni Member ID or User ID

---

### 3. Connect / Bookmark Alumni
* **Method & Path:** `POST /api/alumni/{id}/connect`
* **Auth Required:** `BearerAuth`
* **Description:** Adds the alumni member to your personal network bookmarks.

#### Success Response (`200 OK` or `201 Created`)
```json
{
  "data": {
    "connected": true,
    "targetId": "cmuznxflf000go63ld91fia0u"
  }
}
```

---

### 4. Disconnect Alumni
* **Method & Path:** `DELETE /api/alumni/{id}/connect`
* **Auth Required:** `BearerAuth`
* **Description:** Removes the alumni member from your network bookmarks.

#### Success Response (`200 OK`)
```json
{
  "data": {
    "connected": false
  }
}
```

---

### 5. My Network Connections
* **Method & Path:** `GET /api/alumni/bookmarks`
* **Auth Required:** `BearerAuth`
* **Description:** Returns the list of alumni members you have connected with or bookmarked.

#### Success Response (`200 OK`)
```json
{
  "data": [
    {
      "id": 14,
      "alumniId": "cmuznxflf000go63ld91fia0u",
      "createdAt": "2026-10-26T11:22:00.000Z",
      "alumni": {
        "id": "cmuznxflf000go63ld91fia0u",
        "name": "Mariama Sesay",
        "avatar": "/uploads/mariama.jpg",
        "company": "Rokel Commercial Bank",
        "currentRole": "Treasury Manager",
        "classYear": 2018
      }
    }
  ]
}
```

---

### 6. Broadcast Notifications
* **Method & Path:** `GET /api/alumni/notifications`
* **Auth Required:** `BearerAuth`
* **Description:** Returns university-wide broadcasts and administrative announcements.

#### Success Response (`200 OK`)
```json
{
  "data": {
    "total": 4,
    "notifications": [
      {
        "id": "cmvnotif1",
        "title": "Annual Alumni Gala 2026 Announced",
        "message": "Tickets are now live for the Freetown Alumni Reunion Gala.",
        "category": "EVENT",
        "createdAt": "2026-10-15T09:00:00.000Z",
        "actionUrl": "/events/seed-event-6"
      }
    ]
  }
}
```

---

### 7. Manage Personal Profile & Skills
* **Method & Path:** `GET /api/profile` (Fetch profile)
* **Method & Path:** `PATCH /api/profile` (Update profile)
* **Auth Required:** `BearerAuth`

#### `PATCH /api/profile` Request Body (`application/json`)
```json
{
  "name": "Alex Sesay",
  "location": "Freetown Central, SL",
  "bio": "Experienced corporate financial analyst and alumni mentor.",
  "linkedin": "https://linkedin.com/in/alexsesay",
  "isMentor": true,
  "skills": ["Financial Auditing", "Dart", "Flutter", "Tax Compliance"]
}
```

---

## 📱 Flutter Implementation

### 1. Data Models (`lib/models/directory_models.dart`)

```dart
class AlumniDirectoryMember {
  final String id;
  final String name;
  final String? avatar;
  final int classYear;
  final String degree;
  final String currentRole;
  final String company;
  final String location;
  final String industry;
  final bool isMentor;
  final List<String> skills;

  AlumniDirectoryMember({
    required this.id,
    required this.name,
    this.avatar,
    required this.classYear,
    required this.degree,
    required this.currentRole,
    required this.company,
    required this.location,
    required this.industry,
    required this.isMentor,
    required this.skills,
  });

  factory AlumniDirectoryMember.fromJson(Map<String, dynamic> json) {
    return AlumniDirectoryMember(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      avatar: json['avatar'],
      classYear: json['classYear'] ?? 0,
      degree: json['degree'] ?? '',
      currentRole: json['currentRole'] ?? '',
      company: json['company'] ?? '',
      location: json['location'] ?? '',
      industry: json['industry'] ?? 'General',
      isMentor: json['isMentor'] ?? false,
      skills: (json['skills'] as List? ?? []).map((e) => e.toString()).toList(),
    );
  }
}

class BroadcastNotification {
  final String id;
  final String title;
  final String message;
  final String category;
  final DateTime createdAt;
  final String? actionUrl;

  BroadcastNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.category,
    required this.createdAt,
    this.actionUrl,
  });

  factory BroadcastNotification.fromJson(Map<String, dynamic> json) {
    return BroadcastNotification(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      category: json['category'] ?? 'INFO',
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
      actionUrl: json['actionUrl'],
    );
  }
}
```

### 2. Service Repository (`lib/services/networking_service.dart`)

```dart
import 'package:dio/dio.dart';
import '../core/api/api_client.dart';
import '../models/directory_models.dart';

class NetworkingService {
  final ApiClient _client = ApiClient();

  /// Searches directory with filters
  Future<List<AlumniDirectoryMember>> searchDirectory({
    String? query,
    int? classYear,
    String? industry,
    bool? isMentor,
  }) async {
    try {
      final response = await _client.dio.get(
        '/api/alumni',
        queryParameters: {
          if (query != null && query.isNotEmpty) 'q': query,
          if (classYear != null) 'classYear': classYear,
          if (industry != null && industry != 'All') 'industry': industry,
          if (isMentor != null) 'isMentor': isMentor.toString(),
        },
      );
      final list = (response.data['data'] as List? ?? []);
      return list.map((e) => AlumniDirectoryMember.fromJson(e)).toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Directory search failed');
    }
  }

  /// Connects with an alumni
  Future<void> connectAlumni(String alumniId) async {
    try {
      await _client.dio.post('/api/alumni/$alumniId/connect');
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Connection request failed');
    }
  }

  /// Disconnects with an alumni
  Future<void> disconnectAlumni(String alumniId) async {
    try {
      await _client.dio.delete('/api/alumni/$alumniId/connect');
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Disconnect failed');
    }
  }

  /// Fetches saved network bookmarks
  Future<List<AlumniDirectoryMember>> fetchBookmarks() async {
    try {
      final response = await _client.dio.get('/api/alumni/bookmarks');
      final list = (response.data['data'] as List? ?? []);
      return list.map((item) => AlumniDirectoryMember.fromJson(item['alumni'] ?? item)).toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Failed to load connections');
    }
  }

  /// Fetches broadcast notifications
  Future<List<BroadcastNotification>> fetchNotifications() async {
    try {
      final response = await _client.dio.get('/api/alumni/notifications');
      final list = (response.data['data']?['notifications'] as List? ?? []);
      return list.map((e) => BroadcastNotification.fromJson(e)).toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Failed to load notifications');
    }
  }
}
```
