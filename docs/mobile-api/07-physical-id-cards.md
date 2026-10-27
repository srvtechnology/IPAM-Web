# 07. Physical ID Cards API Integration

* **Swagger UI Documentation:** [https://ipam.billnbite.cloud/api-docs#/Physical%20ID%20Cards](https://ipam.billnbite.cloud/api-docs#/Physical%20ID%20Cards)
* **Tag:** `Physical ID Cards`
* **Security Schemes:** `Public` (Pricing) & `BearerAuth` (Order Placement & Order Tracking)

---

## 📌 Overview

The Physical ID Cards module enables graduates to order official alumni identification cards. It provides:
1. **Dynamic Pricing & Tiers:** Fetches live pricing configured by the university administration for card materials (`STANDARD_PVC`, `GOLD_RFID_SMART`, `EXECUTIVE_TITANIUM`) and courier options.
2. **Order Placement:** Supports Cash on Delivery (`COD`) and Online Stripe Card Checkout (`STRIPE`).
3. **Live Manufacturing & Delivery Tracking:** Live dispatch tracking through printing press phases to final courier delivery.

---

## 🛣️ Endpoints Breakdown

### 1. Get Card Tiers & Pricing Configuration
* **Method & Path:** `GET /api/physical-card-orders/pricing`
* **Auth Required:** `None` (Public)
* **Description:** Returns currently enabled card tiers, unit prices, currencies, shipping rates, and payment gateway toggles.

#### Success Response (`200 OK`)
```json
{
  "data": {
    "currency": "USD",
    "deliveryFee": 5,
    "allowCod": true,
    "allowStripe": true,
    "tiers": {
      "STANDARD_PVC": {
        "name": "Standard University PVC Card",
        "price": 15,
        "features": ["High-gloss PVC", "Durable Magnetic Stripe", "Barcode & Photo"]
      },
      "GOLD_RFID_SMART": {
        "name": "Gold RFID Smart Card",
        "price": 30,
        "features": ["Embedded 13.56 MHz RFID Chip", "NFC Enabled", "Gold Foil Edge"]
      },
      "EXECUTIVE_TITANIUM": {
        "name": "Executive Titanium Metal Card",
        "price": 60,
        "features": ["Laser Engraved Metal Core", "Lifetime Guarantee", "VIP Lounge Access"]
      }
    }
  }
}
```

---

### 2. Place Physical ID Card Order
* **Method & Path:** `POST /api/physical-card-orders`
* **Auth Required:** `BearerAuth`
* **Description:** Orders a physical card. Automatically stamps the student registration ID and sets the initial order status to `IN_PRINT_PRESS`.

#### Request Body (`application/json`)
| Field | Type | Required | Description | Example |
|---|---|---|---|---|
| `cardTier` | `string` | **Yes** | `STANDARD_PVC`, `GOLD_RFID_SMART`, `EXECUTIVE_TITANIUM` | `"GOLD_RFID_SMART"` |
| `recipientName` | `string` | **Yes** | Name on card & package | `"Alex Sesay"` |
| `recipientPhone` | `string` | **Yes** | Courier contact phone | `"+232 76 112233"` |
| `deliveryAddress` | `string` | **Yes** | Physical shipping address | `"14 Pademba Road, Freetown"` |
| `paymentMethod` | `string` | **Yes** | `"COD"` (Cash on Delivery) or `"STRIPE"` | `"COD"` |
| `paymentRef` | `string` | No | Required if paymentMethod is `STRIPE` | `"pi_stripe_12345"` |

```json
{
  "cardTier": "GOLD_RFID_SMART",
  "recipientName": "Alex Sesay",
  "recipientPhone": "+232 76 112233",
  "deliveryAddress": "14 Pademba Road, Freetown, Sierra Leone",
  "paymentMethod": "COD"
}
```

#### Success Response (`201 Created`)
```json
{
  "data": {
    "id": "cmv9anugi000flc01vyo1kri1",
    "orderNumber": "PVC-2026-89410",
    "cardTier": "GOLD_RFID_SMART",
    "recipientName": "Alex Sesay",
    "recipientPhone": "+232 76 112233",
    "deliveryAddress": "14 Pademba Road, Freetown, Sierra Leone",
    "totalAmount": 35.0,
    "paymentMethod": "COD",
    "paymentStatus": "PENDING",
    "status": "IN_PRINT_PRESS",
    "createdAt": "2026-10-26T11:25:00.000Z"
  }
}
```

---

### 3. My Physical Card Orders
* **Method & Path:** `GET /api/physical-card-orders`
* **Auth Required:** `BearerAuth`
* **Description:** Retrieves past and active card orders placed by the authenticated alumni member.

---

### 4. Track Specific Order
* **Method & Path:** `GET /api/physical-card-orders/{id}`
* **Auth Required:** `BearerAuth`
* **Path Parameters:**
  * `id`: The Order ID (CUID) OR the Order Reference Number (`PVC-2026-89410`).

#### Success Response (`200 OK`)
```json
{
  "data": {
    "id": "cmv9anugi000flc01vyo1kri1",
    "orderNumber": "PVC-2026-89410",
    "cardTier": "GOLD_RFID_SMART",
    "status": "IN_PRINT_PRESS",
    "statusHistory": [
      { "status": "RECEIVED", "timestamp": "2026-10-26T11:25:00.000Z" },
      { "status": "IN_PRINT_PRESS", "timestamp": "2026-10-26T11:25:05.000Z" }
    ],
    "trackingNumber": "DHL-SL-8941029",
    "courier": "DHL Express Sierra Leone",
    "estimatedDelivery": "2026-10-30T17:00:00.000Z"
  }
}
```

---

## 📱 Flutter Implementation

### 1. Data Models (`lib/models/card_order_models.dart`)

```dart
class CardTierPricing {
  final String name;
  final double price;
  final List<String> features;

  CardTierPricing({required this.name, required this.price, required this.features});

  factory CardTierPricing.fromJson(Map<String, dynamic> json) {
    return CardTierPricing(
      name: json['name'] ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      features: (json['features'] as List? ?? []).map((e) => e.toString()).toList(),
    );
  }
}

class CardPricingConfig {
  final String currency;
  final double deliveryFee;
  final bool allowCod;
  final bool allowStripe;
  final Map<String, CardTierPricing> tiers;

  CardPricingConfig({
    required this.currency,
    required this.deliveryFee,
    required this.allowCod,
    required this.allowStripe,
    required this.tiers,
  });

  factory CardPricingConfig.fromJson(Map<String, dynamic> json) {
    final tiersMap = <String, CardTierPricing>{};
    if (json['tiers'] is Map) {
      (json['tiers'] as Map).forEach((key, val) {
        tiersMap[key.toString()] = CardTierPricing.fromJson(val);
      });
    }
    return CardPricingConfig(
      currency: json['currency'] ?? 'USD',
      deliveryFee: (json['deliveryFee'] as num?)?.toDouble() ?? 0.0,
      allowCod: json['allowCod'] ?? true,
      allowStripe: json['allowStripe'] ?? true,
      tiers: tiersMap,
    );
  }
}

class PhysicalCardOrder {
  final String id;
  final String orderNumber;
  final String cardTier;
  final String recipientName;
  final String recipientPhone;
  final String deliveryAddress;
  final double totalAmount;
  final String paymentMethod;
  final String status;
  final String? trackingNumber;
  final DateTime createdAt;

  PhysicalCardOrder({
    required this.id,
    required this.orderNumber,
    required this.cardTier,
    required this.recipientName,
    required this.recipientPhone,
    required this.deliveryAddress,
    required this.totalAmount,
    required this.paymentMethod,
    required this.status,
    this.trackingNumber,
    required this.createdAt,
  });

  factory PhysicalCardOrder.fromJson(Map<String, dynamic> json) {
    return PhysicalCardOrder(
      id: json['id'] ?? '',
      orderNumber: json['orderNumber'] ?? '',
      cardTier: json['cardTier'] ?? 'STANDARD_PVC',
      recipientName: json['recipientName'] ?? '',
      recipientPhone: json['recipientPhone'] ?? '',
      deliveryAddress: json['deliveryAddress'] ?? '',
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0.0,
      paymentMethod: json['paymentMethod'] ?? 'COD',
      status: json['status'] ?? 'IN_PRINT_PRESS',
      trackingNumber: json['trackingNumber'],
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }
}
```

### 2. Service Repository (`lib/services/card_order_service.dart`)

```dart
import 'package:dio/dio.dart';
import '../core/api/api_client.dart';
import '../models/card_order_models.dart';

class CardOrderService {
  final ApiClient _client = ApiClient();

  /// Fetches card tiers & pricing
  Future<CardPricingConfig> fetchPricing() async {
    try {
      final response = await _client.dio.get('/api/physical-card-orders/pricing');
      return CardPricingConfig.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Failed to load card pricing');
    }
  }

  /// Places a card order
  Future<PhysicalCardOrder> createOrder({
    required String cardTier,
    required String recipientName,
    required String recipientPhone,
    required String deliveryAddress,
    required String paymentMethod,
    String? paymentRef,
  }) async {
    try {
      final response = await _client.dio.post(
        '/api/physical-card-orders',
        data: {
          'cardTier': cardTier,
          'recipientName': recipientName,
          'recipientPhone': recipientPhone,
          'deliveryAddress': deliveryAddress,
          'paymentMethod': paymentMethod,
          if (paymentRef != null) 'paymentRef': paymentRef,
        },
      );
      return PhysicalCardOrder.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Failed to place card order');
    }
  }

  /// Tracks order status
  Future<PhysicalCardOrder> trackOrder(String orderIdOrNumber) async {
    try {
      final response = await _client.dio.get('/api/physical-card-orders/$orderIdOrNumber');
      return PhysicalCardOrder.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Order not found');
    }
  }
}
```
