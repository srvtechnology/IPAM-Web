# 08. Donations & Giving API Integration

* **Swagger UI Documentation:** [https://ipam.billnbite.cloud/api-docs#/Donations%20&%20Giving](https://ipam.billnbite.cloud/api-docs#/Donations%20&%20Giving)
* **Tag:** `Donations & Giving`
* **Security Schemes:** `Public` (Giving Feed & Guest Giving) & `BearerAuth` (Personal Giving History)

---

## 📌 Overview

The Donations & Giving module allows university alumni and global patrons to contribute toward capital development, STEM equipment, student scholarship endowments, and research funds. It supports:
1. **Fund Selection:** Target gifts to specific endowment funds (e.g. `STEM Laboratory Fund`, `Student Scholarship Endowment`, `Campus Digitalization Fund`).
2. **Anonymous Giving:** Supporting anonymous donor recognition on public feeds.
3. **Personal Giving Ledger:** Viewing lifetime contributions, tax summaries, and gift receipts (`?mine=true`).

---

## 🛣️ Endpoints Breakdown

### 1. List Recent Donations & Campaign Feeds
* **Method & Path:** `GET /api/donations`
* **Auth Required:** `None` (Public Feed) / `BearerAuth` (when `?mine=true`)
* **Query Parameters:**
  * `mine` (`string`): If `"true"`, requires `BearerAuth` and returns only the authenticated member's donations.

#### Success Response (`200 OK`)
```json
{
  "data": [
    {
      "id": "cmvdon123",
      "donorName": "Alex Sesay",
      "amount": 100,
      "currency": "USD",
      "fund": "STEM Laboratory Fund",
      "frequency": "ONE_TIME",
      "paymentMethod": "CARD",
      "isAnonymous": false,
      "message": "Honoring the faculty and investing in future engineering students.",
      "createdAt": "2026-10-26T11:25:00.000Z"
    }
  ]
}
```

---

### 2. Make a Donation
* **Method & Path:** `POST /api/donations`
* **Auth Required:** `None` (Guests allowed; if `BearerAuth` is attached, gift is linked to the alumni account)

#### Request Body (`application/json`)
| Field | Type | Required | Description |
|---|---|---|---|
| `donorName` | `string` | **Yes** | Full donor name |
| `donorEmail` | `string` | **Yes** | Confirmation receipt email |
| `donorPhone` | `string` | **Yes** | Contact phone (min 3 chars) |
| `amount` | `number` | **Yes** | Donation amount (positive number) |
| `fund` | `string` | **Yes** | Target fund (e.g. `"STEM Laboratory Fund"`) |
| `currency` | `string` | No | `"USD"` (default) or `"SLE"` |
| `frequency` | `string` | No | `"ONE_TIME"` (default) or `"MONTHLY"` |
| `paymentMethod` | `string` | No | `"CARD"`, `"MOMO"`, `"BANK"`, `"PAYPAL"` |
| `isAnonymous` | `boolean` | No | Display as "Anonymous Donor" publicly |
| `message` | `string` | No | Optional dedication message |

```json
{
  "donorName": "Alex Sesay",
  "donorEmail": "demo.alumni@ipam.edu",
  "donorPhone": "+232 76 112233",
  "amount": 50,
  "currency": "USD",
  "fund": "Student Scholarship Endowment",
  "isAnonymous": false,
  "message": "Automated gift for academic excellence scholarships."
}
```

#### Success Response (`201 Created`)
```json
{
  "data": {
    "id": "cmvdon456",
    "donorName": "Alex Sesay",
    "amount": 50.0,
    "currency": "USD",
    "fund": "Student Scholarship Endowment",
    "paymentRef": "DON-2026-9812",
    "status": "SUCCEEDED",
    "createdAt": "2026-10-26T11:26:00.000Z"
  }
}
```

---

## 📱 Flutter Implementation

### 1. Data Model (`lib/models/donation_models.dart`)

```dart
class DonationRecord {
  final String id;
  final String donorName;
  final double amount;
  final String currency;
  final String fund;
  final bool isAnonymous;
  final String? message;
  final DateTime createdAt;

  DonationRecord({
    required this.id,
    required this.donorName,
    required this.amount,
    required this.currency,
    required this.fund,
    required this.isAnonymous,
    this.message,
    required this.createdAt,
  });

  factory DonationRecord.fromJson(Map<String, dynamic> json) {
    return DonationRecord(
      id: json['id'] ?? '',
      donorName: json['donorName'] ?? 'Anonymous Donor',
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      currency: json['currency'] ?? 'USD',
      fund: json['fund'] ?? 'General University Fund',
      isAnonymous: json['isAnonymous'] ?? false,
      message: json['message'],
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }
}
```

### 2. Service Repository (`lib/services/donation_service.dart`)

```dart
import 'package:dio/dio.dart';
import '../core/api/api_client.dart';
import '../models/donation_models.dart';

class DonationService {
  final ApiClient _client = ApiClient();

  /// Fetches personal giving ledger
  Future<List<DonationRecord>> fetchMyDonations() async {
    try {
      final response = await _client.dio.get('/api/donations', queryParameters: {'mine': 'true'});
      final list = (response.data['data'] as List? ?? []);
      return list.map((e) => DonationRecord.fromJson(e)).toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Failed to load giving ledger');
    }
  }

  /// Submits a donation
  Future<DonationRecord> submitDonation({
    required String donorName,
    required String donorEmail,
    required String donorPhone,
    required double amount,
    required String fund,
    bool isAnonymous = false,
    String? message,
  }) async {
    try {
      final response = await _client.dio.post(
        '/api/donations',
        data: {
          'donorName': donorName,
          'donorEmail': donorEmail,
          'donorPhone': donorPhone,
          'amount': amount,
          'currency': 'USD',
          'fund': fund,
          'isAnonymous': isAnonymous,
          'message': message,
        },
      );
      return DonationRecord.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Donation failed');
    }
  }
}
```
