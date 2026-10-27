# 09. Membership & Subscriptions API Integration

* **Swagger UI Documentation:** [https://ipam.billnbite.cloud/api-docs#/Membership%20&%20Subscriptions](https://ipam.billnbite.cloud/api-docs#/Membership%20&%20Subscriptions)
* **Tag:** `Membership & Subscriptions`
* **Security Schemes:** `BearerAuth`

---

## 📌 Overview

The Membership & Subscriptions module manages alumni association tiers and member privileges. It supports:
1. **Tier Status Inspection:** Checks active tier (`STANDARD`, `SILVER_LIFETIME`, `GOLD_PATRON`), expiration dates, and tier privileges.
2. **Membership Upgrades:** Upgrades members to higher tiers via annual or lifetime billing cycles.
3. **Billing Preferences:** Allows members to toggle automatic renewal (`autoRenew`).

---

## 🛣️ Endpoints Breakdown

### 1. Get Membership Status & Plans
* **Method & Path:** `GET /api/subscription`
* **Auth Required:** `BearerAuth`
* **Description:** Retrieves the active subscription tier, benefits, renewal state, and available upgrade tiers with pricing.

#### Success Response (`200 OK`)
```json
{
  "data": {
    "currentTier": "PLATINUM",
    "status": "ACTIVE",
    "startDate": "2026-01-01T00:00:00.000Z",
    "validUntil": "2027-01-01T00:00:00.000Z",
    "autoRenew": true,
    "availableTiers": {
      "STANDARD": {
        "name": "Standard Alumni Member",
        "annualPrice": 0,
        "lifetimePrice": 0,
        "features": ["Digital ID Pass", "Directory Access", "Job Board Browsing"]
      },
      "SILVER_LIFETIME": {
        "name": "Silver Lifetime Fellow",
        "annualPrice": 50,
        "lifetimePrice": 250,
        "features": ["Priority Event Seating", "Physical PVC ID Included", "Mentorship Access"]
      },
      "GOLD_PATRON": {
        "name": "Gold University Patron",
        "annualPrice": 120,
        "lifetimePrice": 500,
        "features": ["Executive Council Voting", "Gold RFID Smart Card Included", "VIP University Functions"]
      }
    }
  }
}
```

---

### 2. Upgrade Membership Tier
* **Method & Path:** `POST /api/subscription`
* **Auth Required:** `BearerAuth`

#### Request Body (`application/json`)
| Field | Type | Required | Description | Example |
|---|---|---|---|---|
| `tier` | `string` | **Yes** | Target tier | `"SILVER_LIFETIME"` or `"GOLD_PATRON"` |
| `billingCycle` | `string` | **Yes** | `"MONTHLY"`, `"ANNUAL"`, or `"LIFETIME"` | `"LIFETIME"` |
| `paymentMethod` | `string` | No | `"CARD"`, `"STRIPE"` | `"CARD"` |
| `paymentReference`| `string` | No | Transaction/PaymentIntent reference | `"SUB-PAY-REF-9988"` |

```json
{
  "tier": "SILVER_LIFETIME",
  "billingCycle": "LIFETIME",
  "paymentMethod": "CARD",
  "paymentReference": "SUB-PAY-REF-9988"
}
```

#### Success Response (`200 OK`)
```json
{
  "data": {
    "message": "Membership upgraded successfully",
    "tier": "SILVER_LIFETIME",
    "billingCycle": "LIFETIME",
    "status": "ACTIVE"
  }
}
```

---

### 3. Toggle Auto-Renew
* **Method & Path:** `PATCH /api/subscription`
* **Auth Required:** `BearerAuth`

#### Request Body (`application/json`)
```json
{
  "autoRenew": false
}
```

#### Success Response (`200 OK`)
```json
{
  "data": {
    "autoRenew": false,
    "message": "Auto-renewal preference updated"
  }
}
```

---

## 📱 Flutter Implementation

### 1. Data Model (`lib/models/subscription_models.dart`)

```dart
class MembershipStatus {
  final String currentTier;
  final String status;
  final DateTime? validUntil;
  final bool autoRenew;
  final Map<String, dynamic> availableTiers;

  MembershipStatus({
    required this.currentTier,
    required this.status,
    this.validUntil,
    required this.autoRenew,
    required this.availableTiers,
  });

  factory MembershipStatus.fromJson(Map<String, dynamic> json) {
    return MembershipStatus(
      currentTier: json['currentTier'] ?? 'STANDARD',
      status: json['status'] ?? 'ACTIVE',
      validUntil: json['validUntil'] != null ? DateTime.tryParse(json['validUntil']) : null,
      autoRenew: json['autoRenew'] ?? false,
      availableTiers: json['availableTiers'] ?? {},
    );
  }
}
```

### 2. Service Repository (`lib/services/subscription_service.dart`)

```dart
import 'package:dio/dio.dart';
import '../core/api/api_client.dart';
import '../models/subscription_models.dart';

class SubscriptionService {
  final ApiClient _client = ApiClient();

  /// Gets current membership tier and benefits
  Future<MembershipStatus> fetchStatus() async {
    try {
      final response = await _client.dio.get('/api/subscription');
      return MembershipStatus.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Failed to load membership info');
    }
  }

  /// Upgrades membership
  Future<void> upgradeTier(String tier, String billingCycle, {String? paymentRef}) async {
    try {
      await _client.dio.post(
        '/api/subscription',
        data: {
          'tier': tier,
          'billingCycle': billingCycle,
          'paymentReference': paymentRef,
        },
      );
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Upgrade failed');
    }
  }

  /// Toggles auto-renewal
  Future<bool> setAutoRenew(bool enable) async {
    try {
      final response = await _client.dio.patch(
        '/api/subscription',
        data: {'autoRenew': enable},
      );
      return response.data['data']['autoRenew'] ?? enable;
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Failed to update auto-renewal');
    }
  }
}
```
