# 06. Businesses & Marketplace API Integration

* **Swagger UI Documentation:** [https://ipam.billnbite.cloud/api-docs#/Businesses%20&%20Marketplace](https://ipam.billnbite.cloud/api-docs#/Businesses%20&%20Marketplace)
* **Tag:** `Businesses & Marketplace`
* **Security Schemes:** `Public` (Browse) & `BearerAuth` (Submit, Manage, Edit, Delete)

---

## 📌 Overview

The Businesses & Marketplace module provides an enterprise directory highlighting commercial ventures founded or operated by IPAM graduates. It supports:
1. **Directory Browsing:** Discovering alumni enterprises by industry, location, or featured partner status.
2. **Business Registration:** Enabling alumni entrepreneurs to submit their ventures for university accreditation and public listing.
3. **Owner Management:** Managing your active listings (`?mine=true`), editing services, logos, contact information, or deleting listings.

---

## 🛣️ Endpoints Breakdown

### 1. Browse Business Directory
* **Method & Path:** `GET /api/businesses`
* **Auth Required:** `None` (Public) / Optional `BearerAuth`
* **Query Parameters:**
  * `mine` (`string`): If `"true"`, requires `BearerAuth` and filters to businesses created by current user.
  * `q` (`string`): Keyword search across name, founders, industry, tagline, or location.
  * `category` (`string`): Category filter (e.g. `Technology`, `Consulting`, `Hospitality`).
  * `featured` (`string`): If `"true"`, returns spotlighted enterprises.

#### Success Response (`200 OK`)
```json
{
  "data": [
    {
      "id": "cmv9anufw000dlc014fqb6gks",
      "name": "Sierra Cloud Innovations",
      "tagline": "Enterprise Cloud Architecture & Cybersecurity",
      "industry": "Information Technology",
      "category": "Technology & Software",
      "location": "Freetown, Sierra Leone",
      "description": "Leading cloud infrastructure provider in West Africa.",
      "founders": "Alex Sesay (Class of '15)",
      "classYear": "2015",
      "contactEmail": "contact@sierracloud.sl",
      "contactPhone": "+232 76 112233",
      "website": "https://sierracloud.sl",
      "logo": "/uploads/logos/sierracloud.png",
      "status": "APPROVED",
      "featured": true
    }
  ]
}
```

---

### 2. Submit Alumni Business Listing
* **Method & Path:** `POST /api/businesses`
* **Auth Required:** `BearerAuth`
* **Description:** Submits a new business venture. Alumni submissions enter `PENDING_APPROVAL` status until vetted by the university administrator.

#### Request Body (`application/json`)
| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | **Yes** | Official enterprise name |
| `founders` | `string` | **Yes** | Founder(s) name and alumni affiliation |
| `classYear` | `string` | **Yes** | Founder's graduation year (e.g. `"2015"`) |
| `category` | `string` | **Yes** | Category (e.g. `"Technology"`, `"Finance"`) |
| `industry` | `string` | **Yes** | Industry sector |
| `description` | `string` | **Yes** | Detailed company description |
| `location` | `string` | **Yes** | Headquarters city and country |
| `contactEmail` | `string` | **Yes** | Verified commercial email |
| `website` | `string` | **Yes** | Official website or social storefront URL |
| `tagline` | `string` | No | Short enterprise slogan |
| `contactPhone` | `string` | No | Customer service phone number |
| `logo` | `string` | No | Uploaded image path from `/api/upload` |
| `bannerImage` | `string` | No | Header showcase image path |
| `services` | `array<string>` | No | List of key services offered |

```json
{
  "name": "Apex Clean Energy SL",
  "founders": "Jane Doe & Alex Sesay",
  "classYear": "2015",
  "category": "Energy & Sustainability",
  "industry": "Renewable Energy",
  "tagline": "Solar & Micro-grid Solutions for West Africa",
  "description": "Providing turn-key solar installations, battery backup, and energy audits for commercial enterprises.",
  "location": "Freetown, Sierra Leone",
  "contactEmail": "info@apexcleanenergy.sl",
  "contactPhone": "+232 77 554433",
  "website": "https://apexcleanenergy.sl",
  "services": ["Commercial Solar PV", "Energy Auditing", "Micro-grid EPC"]
}
```

#### Success Response (`201 Created`)
```json
{
  "data": {
    "id": "cmvnewbiz123",
    "name": "Apex Clean Energy SL",
    "status": "PENDING_APPROVAL",
    "createdAt": "2026-10-26T11:25:00.000Z"
  }
}
```

---

### 3. Edit & Delete Business Listing
* **`GET /api/businesses/{id}`**: Retrieves single business profile.
* **`PATCH /api/businesses/{id}`**: Updates listing details (Requires ownership or admin session).
* **`DELETE /api/businesses/{id}`**: Deletes business listing.

---

## 📱 Flutter Implementation

### 1. Data Model (`lib/models/business_models.dart`)

```dart
class AlumniBusiness {
  final String id;
  final String name;
  final String? tagline;
  final String industry;
  final String category;
  final String location;
  final String description;
  final String founders;
  final String classYear;
  final String contactEmail;
  final String? contactPhone;
  final String website;
  final String? logo;
  final String status;
  final bool featured;

  AlumniBusiness({
    required this.id,
    required this.name,
    this.tagline,
    required this.industry,
    required this.category,
    required this.location,
    required this.description,
    required this.founders,
    required this.classYear,
    required this.contactEmail,
    this.contactPhone,
    required this.website,
    this.logo,
    required this.status,
    this.featured = false,
  });

  factory AlumniBusiness.fromJson(Map<String, dynamic> json) {
    return AlumniBusiness(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      tagline: json['tagline'],
      industry: json['industry'] ?? '',
      category: json['category'] ?? '',
      location: json['location'] ?? '',
      description: json['description'] ?? '',
      founders: json['founders'] ?? '',
      classYear: json['classYear']?.toString() ?? '',
      contactEmail: json['contactEmail'] ?? '',
      contactPhone: json['contactPhone'],
      website: json['website'] ?? '',
      logo: json['logo'],
      status: json['status'] ?? 'PENDING_APPROVAL',
      featured: json['featured'] ?? false,
    );
  }
}
```

### 2. Service Repository (`lib/services/business_service.dart`)

```dart
import 'package:dio/dio.dart';
import '../core/api/api_client.dart';
import '../models/business_models.dart';

class BusinessService {
  final ApiClient _client = ApiClient();

  /// Fetches published businesses or user's own submissions
  Future<List<AlumniBusiness>> fetchBusinesses({bool mine = false, String? query, String? category}) async {
    try {
      final response = await _client.dio.get(
        '/api/businesses',
        queryParameters: {
          if (mine) 'mine': 'true',
          if (query != null && query.isNotEmpty) 'q': query,
          if (category != null && category != 'All') 'category': category,
        },
      );
      final list = (response.data['data'] as List? ?? []);
      return list.map((e) => AlumniBusiness.fromJson(e)).toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Failed to load business directory');
    }
  }

  /// Submits new business listing
  Future<AlumniBusiness> submitBusiness(Map<String, dynamic> businessData) async {
    try {
      final response = await _client.dio.post(
        '/api/businesses',
        data: businessData,
      );
      return AlumniBusiness.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Business submission failed');
    }
  }

  /// Deletes a business
  Future<void> deleteBusiness(String businessId) async {
    try {
      await _client.dio.delete('/api/businesses/$businessId');
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Failed to delete listing');
    }
  }
}
```
