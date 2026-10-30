# 01. Authentication API Integration

* **Swagger UI Documentation:** [https://ipam.billnbite.cloud/api-docs#/Authentication](https://ipam.billnbite.cloud/api-docs#/Authentication)
* **Tag:** `Authentication`
* **Security Schemes:** `BearerAuth` (JWT) & `CookieAuth`

---

## 📌 Overview

The Authentication module governs mobile user onboarding, login, session validation, and security lifecycle. 

Mobile requests authenticate by supplying the header:
```http
Authorization: Bearer <jwt_token>
```
The JWT token is returned in the JSON body upon successful login (`POST /api/auth/alumni/login`) and remains valid for 30 days.

---

## 🛣️ Endpoints Breakdown

### 1. Alumni Sign In
* **Method & Path:** `POST /api/auth/alumni/login`
* **Auth Required:** `None`
* **Description:** Authenticates user via email and password, returning account details, active membership tier, and a signed JWT token.

#### Request Body (`application/json`)
| Field | Type | Required | Description | Example |
|---|---|---|---|---|
| `email` | `string` | **Yes** | Registered alumni email | `demo.alumni@ipam.edu` |
| `password` | `string` | **Yes** | Account password | `Password123!` |
| `rememberMe` | `boolean` | No | Extend session duration | `true` |
| `deviceToken` | `string` | No | FCM push notification device token (registers device atomically on login) | `fcm_token_1234567890_abc` |
| `platform` | `string` | No | Client operating system (`android`, `ios`, `web`) | `android` |
| `deviceName` | `string` | No | Hardware device name | `Samsung Galaxy S24 Ultra` |
| `appVersion` | `string` | No | Flutter app release version | `1.0.0` |
| `subscribeToAll` | `boolean` | No | Auto-subscribe to university broadcast topic `all_alumni` (default: `true`) | `true` |
| `device` | `object` | No | Alternative nested object structure for device info | `{ "token": "...", "platform": "android" }` |

```json
{
  "email": "demo.alumni@ipam.edu",
  "password": "Password123!",
  "rememberMe": true,
  "deviceToken": "fcm_token_1234567890_abc",
  "platform": "android",
  "deviceName": "Samsung Galaxy S24 Ultra",
  "appVersion": "1.0.0",
  "subscribeToAll": true
}
```

#### Success Response (`200 OK`)
```json
{
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
      "id": "cuid...",
      "platform": "android",
      "deviceName": "Samsung Galaxy S24 Ultra",
      "appVersion": "1.0.0",
      "isActive": true
    },
    "profile": {
      "id": "cmv123...",
      "name": "Alex Sesay",
      "avatar": "/uploads/avatar_123.jpg",
      "classYear": 2015,
      "degree": "B.Sc. Applied Accounting",
      "major": "Financial Accounting",
      "currentRole": "Senior Financial Controller",
      "company": "Standard Chartered SL",
      "location": "Freetown",
      "country": "Sierra Leone",
      "isMentor": true
    }
  }
}
```

#### Error Responses
* `401 Unauthorized`: Invalid credentials.
  ```json
  { "error": "Invalid email or password" }
  ```
* `403 Forbidden`: Account is pending registrar approval or has been suspended/rejected.
  ```json
  { "error": "Your account is currently PENDING approval from the university registrar." }
  ```

---

### 2. Alumni Registration / Re-submission
* **Method & Path:** `POST /api/auth/alumni/register`
* **Auth Required:** `None`
* **Description:** Submits a new registration application linked to a university student ID. Requires 2FA OTP verification (Test OTP: `123456`). Newly submitted accounts enter `PENDING` status awaiting registrar review.

#### Request Body (`application/json`)
| Field | Type | Required | Description |
|---|---|---|---|
| `email` | `string` | **Yes** | Valid institutional or personal email |
| `studentId` | `string` | **Yes** | University Reg / Student No (e.g. `IPAM-2022-8492`) |
| `password` | `string` | **Yes** | Password (min 8 characters) |
| `name` | `string` | **Yes** | Full name |
| `classYear` | `integer` | **Yes** | Year of graduation (1950 - 2040) |
| `degree` | `string` | **Yes** | Degree earned (e.g. `B.Sc. Banking & Finance`) |
| `major` | `string` | **Yes** | Faculty / Department |
| `otp` | `string` | **Yes** | 2FA verification code (`123456`) |
| `currentRole` | `string` | No | Current job title |
| `company` | `string` | No | Employer name |
| `location` | `string` | No | City of residence |
| `country` | `string` | No | Country |
| `industry` | `string` | No | Industry sector |
| `bio` | `string` | No | Short professional biography |
| `isMentor` | `boolean` | No | Willing to mentor students/graduates (default: `false`) |

```json
{
  "email": "jane.doe@alumni.ipam.edu",
  "studentId": "IPAM-2022-8492",
  "password": "Password123!",
  "name": "Jane Doe",
  "classYear": 2022,
  "degree": "B.Sc. Applied Computing",
  "major": "Software Engineering",
  "currentRole": "Software Engineer",
  "company": "Apex Technologies",
  "location": "Freetown",
  "country": "Sierra Leone",
  "industry": "Technology",
  "bio": "Passionate about mobile apps and civic tech.",
  "isMentor": true,
  "otp": "123456"
}
```

#### Responses
* `201 Created`: Registration submitted successfully.
  ```json
  {
    "data": {
      "message": "Registration submitted successfully. Your account is pending administrator approval.",
      "status": "PENDING"
    }
  }
  ```
* `400 Bad Request`: Validation failure or incorrect OTP (`Invalid two-factor authentication OTP code. For test environment, enter 123456.`).
* `409 Conflict`: Account already exists or email/student ID already registered.

---

### 3. Current User Session Check
* **Method & Path:** `GET /api/auth/alumni/me`
* **Auth Required:** `BearerAuth`
* **Description:** Validates active session token and returns fresh user profile, membership status, and saved job counters.

#### Headers
```http
Authorization: Bearer <jwt_token>
```

#### Success Response (`200 OK`)
```json
{
  "data": {
    "id": "cmuznxfl90007o63lnxqupalc",
    "email": "demo.alumni@ipam.edu",
    "studentId": "IPAM-2015-0042",
    "isVerifiedAlumni": true,
    "membershipTier": "PLATINUM",
    "status": "APPROVED",
    "savedJobsCount": 3,
    "profile": {
      "name": "Alex Sesay",
      "avatar": "/uploads/avatar_123.jpg",
      "currentRole": "Senior Financial Controller",
      "company": "Standard Chartered SL",
      "classYear": 2015,
      "degree": "B.Sc. Applied Accounting"
    }
  }
}
```

---

### 4. Change Password
* **Method & Path:** `POST /api/auth/alumni/change-password`
* **Auth Required:** `BearerAuth`
* **Description:** Changes user password securely with current password validation.

#### Request Body (`application/json`)
```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewSecurePassword456!"
}
```

#### Responses
* `200 OK`: `{ "data": { "message": "Password changed successfully" } }`
* `400 Bad Request`: Incorrect current password or new password < 8 characters.

---

### 5. Logout
* **Method & Path:** `POST /api/auth/alumni/logout`
* **Auth Required:** Optional (`BearerAuth`)
* **Description:** Clears session cookies and deactivates the device push token on the backend to stop sending notifications after signing out.

#### Request Body (`application/json` - Optional)
```json
{
  "deviceToken": "fcm_token_1234567890_abc"
}
```

#### Success Response (`200 OK`)
```json
{
  "data": {
    "loggedOut": true,
    "deviceUnregistered": true
  }
}
```

---

### 6. Refresh Session Token
* **Method & Path:** `POST /api/auth/refresh`
* **Auth Required:** `BearerAuth` (or `{ token: "..." }` in body)
* **Description:** Issues a refreshed JWT token for the mobile client and keeps the device push token active.

#### Request Body (`application/json` - Optional)
```json
{
  "token": "current_jwt_bearer_token",
  "deviceToken": "fcm_token_1234567890_abc",
  "platform": "android",
  "deviceName": "Samsung Galaxy S24 Ultra",
  "appVersion": "1.0.0"
}
```

---

## 📱 Flutter Implementation

### 1. Data Models (`lib/models/auth_models.dart`)

```dart
class LoginResponse {
  final String id;
  final String email;
  final String studentId;
  final bool isVerifiedAlumni;
  final String membershipTier;
  final String status;
  final String token;
  final bool deviceRegistered;
  final AlumniProfile? profile;

  LoginResponse({
    required this.id,
    required this.email,
    required this.studentId,
    required this.isVerifiedAlumni,
    required this.membershipTier,
    required this.status,
    required this.token,
    this.deviceRegistered = false,
    this.profile,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      studentId: json['studentId'] ?? '',
      isVerifiedAlumni: json['isVerifiedAlumni'] ?? false,
      membershipTier: json['membershipTier'] ?? 'STANDARD',
      status: json['status'] ?? 'PENDING',
      token: json['token'] ?? '',
      deviceRegistered: json['deviceRegistered'] ?? false,
      profile: json['profile'] != null ? AlumniProfile.fromJson(json['profile']) : null,
    );
  }
}

class AlumniProfile {
  final String name;
  final String? avatar;
  final int classYear;
  final String degree;
  final String major;
  final String currentRole;
  final String company;
  final String location;
  final bool isMentor;

  AlumniProfile({
    required this.name,
    this.avatar,
    required this.classYear,
    required this.degree,
    required this.major,
    required this.currentRole,
    required this.company,
    required this.location,
    required this.isMentor,
  });

  factory AlumniProfile.fromJson(Map<String, dynamic> json) {
    return AlumniProfile(
      name: json['name'] ?? '',
      avatar: json['avatar'],
      classYear: json['classYear'] ?? 0,
      degree: json['degree'] ?? '',
      major: json['major'] ?? '',
      currentRole: json['currentRole'] ?? '',
      company: json['company'] ?? '',
      location: json['location'] ?? '',
      isMentor: json['isMentor'] ?? false,
    );
  }
}
```

### 2. Service Repository (`lib/services/auth_service.dart`)

```dart
import 'package:dio/dio.dart';
import '../core/api/api_client.dart';
import '../models/auth_models.dart';

class AuthService {
  final ApiClient _client = ApiClient();

  /// Logs in alumni, persists JWT token to secure storage, and returns session user.
  Future<LoginResponse> login(String email, String password) async {
    try {
      final response = await _client.dio.post(
        '/api/auth/alumni/login',
        data: {
          'email': email.trim(),
          'password': password,
          'rememberMe': true,
        },
      );

      final data = response.data['data'];
      final loginData = LoginResponse.fromJson(data);

      // Save token securely for all subsequent calls
      await _client.saveToken(loginData.token);
      return loginData;
    } on DioException catch (e) {
      final message = e.response?.data?['error'] ?? 'Sign in failed. Check your network.';
      throw Exception(message);
    }
  }

  /// Verifies if existing session token is still valid.
  Future<LoginResponse?> checkSession() async {
    try {
      final token = await _client.getToken();
      if (token == null) return null;

      final response = await _client.dio.get('/api/auth/alumni/me');
      return LoginResponse.fromJson(response.data['data']);
    } catch (_) {
      await _client.clearToken();
      return null;
    }
  }

  /// Changes password for logged-in user.
  Future<void> changePassword(String currentPassword, String newPassword) async {
    try {
      await _client.dio.post(
        '/api/auth/alumni/change-password',
        data: {
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        },
      );
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Password update failed');
    }
  }

  /// Logs out user and cleans local token.
  Future<void> logout() async {
    try {
      await _client.dio.post('/api/auth/alumni/logout');
    } finally {
      await _client.clearToken();
    }
  }
}
```
