# 04. Jobs & Careers API Integration

* **Swagger UI Documentation:** [https://ipam.billnbite.cloud/api-docs#/Jobs%20&%20Careers](https://ipam.billnbite.cloud/api-docs#/Jobs%20&%20Careers)
* **Tag:** `Jobs & Careers`
* **Security Schemes:** `Public` & `BearerAuth` (for Apply, Save, and My Applications)

---

## 📌 Overview

The Jobs & Careers module provides an alumni employment and talent acquisition portal. It supports:
1. **Job Search & Filters:** Search by title, skills, keyword, category, and workplace type (`REMOTE`, `HYBRID`, `ON_SITE`).
2. **One-Tap Apply:** Submits candidate profile, attached CV document (`cvUrl`), and calculating dynamic resume match scores.
3. **Bookmarks / Saved Jobs:** Save openings for later review.
4. **Application Tracking:** Track recruitment pipeline status (`APPLIED`, `REVIEWING`, `INTERVIEW_SCHEDULED`, `OFFER_EXTENDED`, `REJECTED`), interview schedules, and recruiter notes.

---

## 🛣️ Endpoints Breakdown

### 1. Browse Job Openings
* **Method & Path:** `GET /api/jobs`
* **Auth Required:** Optional (`BearerAuth` populates `saved: true` and `applied: true` for current user)
* **Query Parameters:**
  * `q` (`string`): Search keyword in title, company, description, or location.
  * `category` (`string`): e.g. `ENGINEERING`, `FINANCE_BANKING`, `DATA_AI`, `OPERATIONS`, `LEGAL_PUBLIC_POLICY`.
  * `type` (`string`): `FULL_TIME`, `PART_TIME`, `CONTRACT`, `REMOTE`.
  * `workplaceType` (`string`): `REMOTE`, `HYBRID`, `ON_SITE`.

#### Success Response (`200 OK`)
```json
{
  "data": [
    {
      "id": "cmv25m1tj000zo401idx0bqtm",
      "title": "Lead Mobile Engineer (Flutter)",
      "company": "Apex Fintech Sierra Leone",
      "companyLogo": "/uploads/logos/apex.png",
      "location": "Freetown, Sierra Leone",
      "type": "FULL_TIME",
      "workplaceType": "HYBRID",
      "salary": "\$35,000 - \$50,000 / year",
      "category": "ENGINEERING",
      "description": "Looking for an experienced Flutter engineer to lead our mobile banking app development.",
      "requirements": ["3+ years Flutter/Dart experience", "REST APIs & WebSockets", "State management with Bloc/Riverpod"],
      "experienceRequired": true,
      "experienceLevel": "MID_SENIOR",
      "deadline": "2026-12-31T00:00:00.000Z",
      "postedDate": "2026-10-10T00:00:00.000Z",
      "saved": false,
      "applied": false
    }
  ]
}
```

---

### 2. Get Job Details
* **Method & Path:** `GET /api/jobs/{id}`
* **Auth Required:** Optional (`BearerAuth` marks `isSaved` and `hasApplied`)
* **Path Parameters:**
  * `id`: Job Opening ID

---

### 3. Apply for Job
* **Method & Path:** `POST /api/jobs/{id}/apply`
* **Auth Required:** `BearerAuth`
* **Path Parameters:**
  * `id`: Job Opening ID

#### Request Body (`application/json`)
| Field | Type | Required | Description |
|---|---|---|---|
| `candidateName` | `string` | **Yes** | Full candidate name |
| `email` | `string` | **Yes** | Contact email |
| `phone` | `string` | No | Phone / WhatsApp number |
| `degree` | `string` | No | Degree earned |
| `faculty` | `string` | No | Faculty / Department |
| `gradYear` | `integer` | No | Graduation year |
| `experienceYears` | `integer` | No | Total years of relevant experience (default: 1) |
| `skills` | `array<string>` | No | List of candidate skill tags |
| `linkedinUrl` | `string` | No | LinkedIn profile URL |
| `coverNote` | `string` | No | Personal introduction message to recruiter |
| `cvUrl` | `string` | No | Uploaded PDF document path (e.g. from `/api/upload`) |
| `cvFileName` | `string` | No | Original file name (e.g. `Alex_Sesay_CV.pdf`) |

```json
{
  "candidateName": "Alex Sesay",
  "email": "demo.alumni@ipam.edu",
  "phone": "+232 76 112233",
  "degree": "B.Sc. Applied Accounting",
  "faculty": "Faculty of Management Sciences",
  "gradYear": 2015,
  "experienceYears": 5,
  "skills": ["Financial Auditing", "IFRS", "SAP ERP", "Tax Compliance"],
  "linkedinUrl": "https://linkedin.com/in/alexsesay",
  "coverNote": "Excited to bring 5+ years of corporate banking experience to this role.",
  "cvUrl": "/uploads/Alex_Sesay_Resume_17920000.pdf",
  "cvFileName": "Alex_Sesay_Resume.pdf"
}
```

#### Success Response (`201 Created` or `200 OK`)
```json
{
  "data": {
    "application": {
      "id": "cmvapp123...",
      "applicationRef": "IPAM-REF-894120",
      "jobId": "cmv25m1tj000zo401idx0bqtm",
      "candidateName": "Alex Sesay",
      "matchScore": 95,
      "status": "APPLIED",
      "createdAt": "2026-10-26T11:24:00.000Z"
    }
  }
}
```

---

### 4. Toggle Save / Bookmark Job
* **Method & Path:** `POST /api/jobs/{id}/save`
* **Auth Required:** `BearerAuth`
* **Description:** Toggles bookmark for the specified job.

#### Success Response (`200 OK`)
```json
{
  "data": {
    "saved": true
  }
}
```

---

### 5. My Saved Jobs
* **Method & Path:** `GET /api/jobs/saved`
* **Auth Required:** `BearerAuth`
* **Description:** Retrieves all bookmarked vacancies for the authenticated user.

---

### 6. My Submitted Job Applications
* **Method & Path:** `GET /api/jobs/my-applications`
* **Auth Required:** `BearerAuth`
* **Description:** Retrieves user's applications along with company recruitment progress.

#### Success Response (`200 OK`)
```json
{
  "data": {
    "applications": [
      {
        "id": "cmvapp123...",
        "applicationRef": "IPAM-REF-894120",
        "jobId": "cmv25m1tj000zo401idx0bqtm",
        "status": "APPLIED",
        "matchScore": 95,
        "interviewDate": null,
        "recruiterRemarks": null,
        "createdAt": "2026-10-26T11:24:00.000Z",
        "job": {
          "id": "cmv25m1tj000zo401idx0bqtm",
          "title": "Lead Mobile Engineer (Flutter)",
          "company": "Apex Fintech Sierra Leone",
          "location": "Freetown, Sierra Leone",
          "type": "FULL_TIME",
          "salary": "\$35,000 - \$50,000 / year"
        }
      }
    ]
  }
}
```

---

## 📱 Flutter Implementation

### 1. Data Models (`lib/models/job_models.dart`)

```dart
class JobOpening {
  final String id;
  final String title;
  final String company;
  final String? companyLogo;
  final String location;
  final String type;
  final String workplaceType;
  final String salary;
  final String category;
  final String description;
  final List<String> requirements;
  final bool saved;
  final bool applied;

  JobOpening({
    required this.id,
    required this.title,
    required this.company,
    this.companyLogo,
    required this.location,
    required this.type,
    required this.workplaceType,
    required this.salary,
    required this.category,
    required this.description,
    required this.requirements,
    this.saved = false,
    this.applied = false,
  });

  factory JobOpening.fromJson(Map<String, dynamic> json) {
    return JobOpening(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      company: json['company'] ?? '',
      companyLogo: json['companyLogo'],
      location: json['location'] ?? '',
      type: json['type'] ?? 'FULL_TIME',
      workplaceType: json['workplaceType'] ?? 'HYBRID',
      salary: json['salary'] ?? 'Competitive',
      category: json['category'] ?? 'GENERAL',
      description: json['description'] ?? '',
      requirements: (json['requirements'] as List? ?? []).map((e) => e.toString()).toList(),
      saved: json['saved'] ?? false,
      applied: json['applied'] ?? false,
    );
  }
}

class JobApplication {
  final String id;
  final String applicationRef;
  final String jobId;
  final String status;
  final int matchScore;
  final DateTime? interviewDate;
  final String? recruiterRemarks;
  final JobOpening job;

  JobApplication({
    required this.id,
    required this.applicationRef,
    required this.jobId,
    required this.status,
    required this.matchScore,
    this.interviewDate,
    this.recruiterRemarks,
    required this.job,
  });

  factory JobApplication.fromJson(Map<String, dynamic> json) {
    return JobApplication(
      id: json['id'] ?? '',
      applicationRef: json['applicationRef'] ?? '',
      jobId: json['jobId'] ?? '',
      status: json['status'] ?? 'APPLIED',
      matchScore: json['matchScore'] ?? 80,
      interviewDate: json['interviewDate'] != null ? DateTime.tryParse(json['interviewDate']) : null,
      recruiterRemarks: json['recruiterRemarks'],
      job: JobOpening.fromJson(json['job'] ?? {}),
    );
  }
}
```

### 2. Service Repository (`lib/services/job_service.dart`)

```dart
import 'package:dio/dio.dart';
import '../core/api/api_client.dart';
import '../models/job_models.dart';

class JobService {
  final ApiClient _client = ApiClient();

  /// Searches and filters job openings
  Future<List<JobOpening>> fetchJobs({String? query, String? category, String? type}) async {
    try {
      final response = await _client.dio.get(
        '/api/jobs',
        queryParameters: {
          if (query != null && query.isNotEmpty) 'q': query,
          if (category != null && category != 'All') 'category': category,
          if (type != null) 'type': type,
        },
      );
      final list = (response.data['data'] as List? ?? []);
      return list.map((e) => JobOpening.fromJson(e)).toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Failed to load jobs');
    }
  }

  /// Toggles job bookmark
  Future<bool> toggleSaveJob(String jobId) async {
    try {
      final response = await _client.dio.post('/api/jobs/$jobId/save');
      return response.data['data']['saved'] ?? false;
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Save toggle failed');
    }
  }

  /// Submits candidate application with optional CV file link
  Future<String> applyForJob(String jobId, {
    required String candidateName,
    required String email,
    String? phone,
    String? cvUrl,
    String? cvFileName,
    String? coverNote,
  }) async {
    try {
      final response = await _client.dio.post(
        '/api/jobs/$jobId/apply',
        data: {
          'candidateName': candidateName,
          'email': email,
          'phone': phone,
          'cvUrl': cvUrl,
          'cvFileName': cvFileName,
          'coverNote': coverNote,
        },
      );
      return response.data['data']['application']['applicationRef'];
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Application failed');
    }
  }

  /// Fetches application tracking list
  Future<List<JobApplication>> fetchMyApplications() async {
    try {
      final response = await _client.dio.get('/api/jobs/my-applications');
      final list = (response.data['data']?['applications'] as List? ?? []);
      return list.map((e) => JobApplication.fromJson(e)).toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Failed to load applications');
    }
  }
}
```
