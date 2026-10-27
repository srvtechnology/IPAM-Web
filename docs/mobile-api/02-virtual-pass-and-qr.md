# 02. Virtual ID Pass & QR Verification Integration

* **Swagger UI Documentation:** [https://ipam.billnbite.cloud/api-docs#/Virtual%20Pass%20&%20QR](https://ipam.billnbite.cloud/api-docs#/Virtual%20Pass%20&%20QR)
* **Tag:** `Virtual Pass & QR`
* **Security Schemes:** `BearerAuth` (for Pass Generation), `Public` (for Pass Verification)

---

## 📌 Overview

The Virtual ID Pass module transforms the mobile app into a digital university identity card. It provides:
1. **Pass Retrieval & Rendering:** Generates the alumni digital membership card with an embedded dynamic `qrPayload` string ready for rendering using Flutter's `qr_flutter` package.
2. **Scanner Verification:** Allows event marshals, campus security, or fellow alumni to verify a member's badge by scanning their QR code via camera using `mobile_scanner`.

---

## 🛣️ Endpoints Breakdown

### 1. Get Alumni Digital ID Pass
* **Method & Path:** `GET /api/alumni/pass`
* **Auth Required:** `BearerAuth`
* **Description:** Retrieves the authenticated member's digital card details and the encoded `qrPayload` string.

#### Headers
```http
Authorization: Bearer <jwt_token>
```

#### Success Response (`200 OK`)
```json
{
  "data": {
    "id": "cmuznxfl90007o63lnxqupalc",
    "studentId": "IPAM-2015-0042",
    "name": "Alex Sesay",
    "avatar": "/uploads/avatar_123.jpg",
    "degree": "B.Sc. Applied Accounting",
    "major": "Financial Accounting",
    "classYear": 2015,
    "membershipTier": "PLATINUM",
    "isVerifiedAlumni": true,
    "membershipValidUntil": "2027-10-15T00:00:00.000Z",
    "issuedAt": "2026-10-15T08:00:00.000Z",
    "institution": "Institute of Public Administration and Management (IPAM)",
    "qrPayload": "{\"schema\":\"IPAM_PASS_V1\",\"id\":\"cmuznxfl90007o63lnxqupalc\",\"studentId\":\"IPAM-2015-0042\",\"name\":\"Alex Sesay\",\"tier\":\"PLATINUM\",\"issuedAt\":\"2026-10-15T08:00:00.000Z\"}"
  }
}
```

> **Note on `qrPayload`:**
> The `qrPayload` field is a compact JSON string adhering to schema `IPAM_PASS_V1`. Feed this exact string into Flutter's `QrImageView` widget `data` parameter.

---

### 2. Verify Alumni Pass by ID or Student Registration No
* **Method & Path:** `GET /api/alumni/pass/verify/{id}`
* **Auth Required:** `None` (Public verification scanner endpoint)
* **Path Parameters:**
  * `id`: Either the Alumni User CUID (`cmuznxfl90007o63lnxqupalc`) OR the Student Registration ID (`IPAM-2015-0042`).
* **Route Alias:** `GET /api/alumni/verify/{id}` can also be used interchangeably.

#### Success Response (`200 OK`)
```json
{
  "data": {
    "valid": true,
    "status": "APPROVED",
    "message": "Valid Verified Alumni Pass",
    "verifiedAt": "2026-10-26T11:20:00.000Z",
    "user": {
      "id": "cmuznxfl90007o63lnxqupalc",
      "studentId": "IPAM-2015-0042",
      "name": "Alex Sesay",
      "avatar": "/uploads/avatar_123.jpg",
      "classYear": 2015,
      "degree": "B.Sc. Applied Accounting",
      "membershipTier": "PLATINUM",
      "isVerifiedAlumni": true
    }
  }
}
```

#### Error Response (`404 Not Found`)
```json
{
  "error": "Pass not found or invalid alumni registration"
}
```

---

## 📱 Flutter Implementation

### 1. Data Models (`lib/models/pass_models.dart`)

```dart
import 'dart:convert';

class VirtualPass {
  final String id;
  final String studentId;
  final String name;
  final String? avatar;
  final String degree;
  final String major;
  final int classYear;
  final String membershipTier;
  final bool isVerifiedAlumni;
  final String qrPayload;
  final String? membershipValidUntil;
  final String institution;

  VirtualPass({
    required this.id,
    required this.studentId,
    required this.name,
    this.avatar,
    required this.degree,
    required this.major,
    required this.classYear,
    required this.membershipTier,
    required this.isVerifiedAlumni,
    required this.qrPayload,
    this.membershipValidUntil,
    required this.institution,
  });

  factory VirtualPass.fromJson(Map<String, dynamic> json) {
    return VirtualPass(
      id: json['id'] ?? '',
      studentId: json['studentId'] ?? '',
      name: json['name'] ?? '',
      avatar: json['avatar'],
      degree: json['degree'] ?? '',
      major: json['major'] ?? '',
      classYear: json['classYear'] ?? 0,
      membershipTier: json['membershipTier'] ?? 'STANDARD',
      isVerifiedAlumni: json['isVerifiedAlumni'] ?? false,
      qrPayload: json['qrPayload'] ?? '',
      membershipValidUntil: json['membershipValidUntil'],
      institution: json['institution'] ?? 'IPAM',
    );
  }
}

class VerificationResult {
  final bool valid;
  final String status;
  final String message;
  final String verifiedAt;
  final Map<String, dynamic>? user;

  VerificationResult({
    required this.valid,
    required this.status,
    required this.message,
    required this.verifiedAt,
    this.user,
  });

  factory VerificationResult.fromJson(Map<String, dynamic> json) {
    return VerificationResult(
      valid: json['valid'] ?? false,
      status: json['status'] ?? 'UNKNOWN',
      message: json['message'] ?? '',
      verifiedAt: json['verifiedAt'] ?? '',
      user: json['user'],
    );
  }
}
```

### 2. Service Repository (`lib/services/pass_service.dart`)

```dart
import 'package:dio/dio.dart';
import '../core/api/api_client.dart';
import '../models/pass_models.dart';

class PassService {
  final ApiClient _client = ApiClient();

  /// Fetches the digital alumni pass for current user
  Future<VirtualPass> fetchMyPass() async {
    try {
      final response = await _client.dio.get('/api/alumni/pass');
      return VirtualPass.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Failed to load digital pass');
    }
  }

  /// Verifies a scanned pass using user ID or student registration ID
  Future<VerificationResult> verifyPass(String identifier) async {
    try {
      final encodedId = Uri.encodeComponent(identifier.trim());
      final response = await _client.dio.get('/api/alumni/pass/verify/$encodedId');
      return VerificationResult.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Pass is invalid or not found');
    }
  }
}
```

### 3. Rendering the Virtual Pass Screen (`lib/screens/virtual_pass_screen.dart`)

```dart
import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../models/pass_models.dart';
import '../services/pass_service.dart';

class VirtualPassScreen extends StatefulWidget {
  const VirtualPassScreen({Key? key}) : super(key: key);

  @override
  State<VirtualPassScreen> createState() => _VirtualPassScreenState();
}

class _VirtualPassScreenState extends State<VirtualPassScreen> {
  final PassService _passService = PassService();
  VirtualPass? _pass;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPass();
  }

  Future<void> _loadPass() async {
    try {
      final pass = await _passService.fetchMyPass();
      setState(() {
        _pass = pass;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_pass == null) return const Scaffold(body: Center(child: Text("Pass unavailable")));

    return Scaffold(
      appBar: AppBar(title: const Text("Digital Alumni Pass")),
      body: Center(
        child: Container(
          width: 320,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 10)],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_pass!.institution, style: const TextStyle(color: Colors.white70, fontSize: 12)),
              const SizedBox(height: 12),
              Text(_pass!.name, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
              Text("${_pass!.degree} • Class of ${_pass!.classYear}", style: const TextStyle(color: Colors.white70)),
              const SizedBox(height: 6),
              Chip(label: Text(_pass!.membershipTier), backgroundColor: Colors.amber.shade700),
              const SizedBox(height: 16),
              // QR Code Rendered from backend JSON payload
              Container(
                color: Colors.white,
                padding: const EdgeInsets.all(10),
                child: QrImageView(
                  data: _pass!.qrPayload,
                  version: QrVersions.auto,
                  size: 180.0,
                ),
              ),
              const SizedBox(height: 12),
              Text("ID: ${_pass!.studentId}", style: const TextStyle(color: Colors.white54, letterSpacing: 1.2)),
            ],
          ),
        ),
      ),
    );
  }
}
```

### 4. QR Scanner Check-in Widget (`lib/screens/qr_scanner_screen.dart`)

```dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../services/pass_service.dart';

class QrScannerScreen extends StatefulWidget {
  const QrScannerScreen({Key? key}) : super(key: key);

  @override
  State<QrScannerScreen> createState() => _QrScannerScreenState();
}

class _QrScannerScreenState extends State<QrScannerScreen> {
  final PassService _passService = PassService();
  bool _isProcessing = false;

  void _onDetect(BarcodeCapture capture) async {
    if (_isProcessing) return;
    final barcode = capture.barcodes.firstOrNull;
    if (barcode?.rawValue == null) return;

    setState(() => _isProcessing = true);
    final rawData = barcode!.rawValue!;

    String identifier = rawData;
    try {
      // If the scanned data is JSON from IPAM_PASS_V1, extract the studentId or ID
      final decoded = jsonDecode(rawData);
      if (decoded is Map && decoded.containsKey('studentId')) {
        identifier = decoded['studentId'];
      }
    } catch (_) {
      // Use rawData directly if it's already a plain studentId string
    }

    try {
      final result = await _passService.verifyPass(identifier);
      _showResultDialog(result.valid, result.message, result.user);
    } catch (e) {
      _showResultDialog(false, e.toString(), null);
    }
  }

  void _showResultDialog(bool valid, String message, Map<String, dynamic>? user) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            Icon(valid ? Icons.check_circle : Icons.cancel, color: valid ? Colors.green : Colors.red),
            const SizedBox(width: 8),
            Text(valid ? "Pass Valid" : "Verification Failed"),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(message),
            if (user != null) ...[
              const Divider(),
              Text("Name: ${user['name']}"),
              Text("Reg No: ${user['studentId']}"),
              Text("Class: ${user['classYear']}"),
              Text("Tier: ${user['membershipTier']}"),
            ]
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              setState(() => _isProcessing = false);
            },
            child: const Text("Scan Next"),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Scan Member Pass")),
      body: MobileScanner(onDetect: _onDetect),
    );
  }
}
```
