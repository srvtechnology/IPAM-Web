# 11. Leadership API Integration

* **Swagger UI Documentation:** [https://ipam.billnbite.cloud/api-docs#/Leadership](https://ipam.billnbite.cloud/api-docs#/Leadership)
* **Tag:** `Leadership`
* **Security Schemes:** `Public`

---

## 📌 Overview

The Leadership module exposes the university's Executive Council, Alumni Association leaders, board trustees, and university advisory committees. It supports:
1. **Executive Council Directory:** Displaying leadership hierarchy, executive designations, biographies, and committee affiliations.
2. **Contact & Social Connect:** Direct professional LinkedIn connections with alumni executives and advisory board members.

---

## 🛣️ Endpoints Breakdown

### 1. Get Association Leadership Directory
* **Method & Path:** `GET /api/leadership`
* **Auth Required:** `None` (Public)
* **Description:** Retrieves all published council officers and committee chairs.

#### Success Response (`200 OK`)
```json
{
  "data": [
    {
      "id": "lead-1",
      "name": "Dr. Mohamed Alpha Jalloh",
      "role": "President, IPAM Alumni Association",
      "title": "President",
      "classYear": 1998,
      "degree": "B.Sc. Applied Accounting, Ph.D. Economics",
      "bio": "Senior governance and public sector financial reform specialist with over 25 years advising regional development banks.",
      "avatar": "/uploads/leadership/president.jpg",
      "email": "president@alumni.ipam.edu",
      "linkedin": "https://linkedin.com/in/mohamed-jalloh-ipam",
      "order": 1
    },
    {
      "id": "lead-2",
      "name": "Fatmata Conteh",
      "role": "Vice President & Chairperson, Mentorship Circle",
      "title": "Vice President",
      "classYear": 2005,
      "degree": "B.Sc. Banking & Finance",
      "bio": "Managing Partner at Capital Trust Partners, championing female leadership in STEM and finance.",
      "avatar": "/uploads/leadership/vp.jpg",
      "email": "vp@alumni.ipam.edu",
      "linkedin": "https://linkedin.com/in/fatmata-conteh",
      "order": 2
    }
  ]
}
```

---

## 📱 Flutter Implementation

### 1. Data Model (`lib/models/leadership_models.dart`)

```dart
class LeadershipMember {
  final String id;
  final String name;
  final String role;
  final String title;
  final int? classYear;
  final String degree;
  final String bio;
  final String? avatar;
  final String? email;
  final String? linkedin;
  final int order;

  LeadershipMember({
    required this.id,
    required this.name,
    required this.role,
    required this.title,
    this.classYear,
    required this.degree,
    required this.bio,
    this.avatar,
    this.email,
    this.linkedin,
    required this.order,
  });

  factory LeadershipMember.fromJson(Map<String, dynamic> json) {
    return LeadershipMember(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      role: json['role'] ?? '',
      title: json['title'] ?? '',
      classYear: json['classYear'],
      degree: json['degree'] ?? '',
      bio: json['bio'] ?? '',
      avatar: json['avatar'],
      email: json['email'],
      linkedin: json['linkedin'],
      order: json['order'] ?? 99,
    );
  }
}
```

### 2. Service Repository (`lib/services/leadership_service.dart`)

```dart
import 'package:dio/dio.dart';
import '../core/api/api_client.dart';
import '../models/leadership_models.dart';

class LeadershipService {
  final ApiClient _client = ApiClient();

  /// Fetches executive council directory
  Future<List<LeadershipMember>> fetchLeadership() async {
    try {
      final response = await _client.dio.get('/api/leadership');
      final list = (response.data['data'] as List? ?? []);
      final members = list.map((e) => LeadershipMember.fromJson(e)).toList();
      members.sort((a, b) => a.order.compareTo(b.order));
      return members;
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Failed to load leadership council');
    }
  }
}
```
