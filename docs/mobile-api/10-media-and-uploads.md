# 10. Media & Uploads API Integration

* **Swagger UI Documentation:** [https://ipam.billnbite.cloud/api-docs#/Media%20&%20Uploads](https://ipam.billnbite.cloud/api-docs#/Media%20&%20Uploads)
* **Tag:** `Media & Uploads`
* **Security Schemes:** `BearerAuth` (Uploads) & `Public` (Asset Retrieval)

---

## 📌 Overview

The Media & Uploads module provides cloud storage for alumni profile photos, enterprise logos, event banners, and PDF resumes. It supports:
1. **Multipart Uploads:** High-performance binary file streaming via `multipart/form-data`.
2. **Base64 JSON Uploads:** Flexible base64 encoded data URI strings for quick image snapshots.
3. **MIME Validation:** Strictly allows image files (`image/jpeg`, `image/png`, `image/webp`, `image/gif`) and PDF documents (`application/pdf`) up to 10MB.
4. **Dynamic Static Serving:** Files are permanently stored in `./public/uploads` and served directly over HTTP via `/uploads/{filename}`.

---

## 🛣️ Endpoints Breakdown

### 1. Upload File (Multipart or Base64)
* **Method & Path:** `POST /api/upload`
* **Auth Required:** `BearerAuth`

#### Option A: `multipart/form-data` (Recommended for Flutter)
* Form Key: `file` (Binary file content)

#### Option B: `application/json`
```json
{
  "file": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "filename": "my_avatar.png"
}
```

#### Success Response (`201 Created`)
```json
{
  "data": {
    "url": "/uploads/my_avatar_1792053710264_0072593c.png",
    "filename": "my_avatar_1792053710264_0072593c.png",
    "originalName": "my_avatar.png",
    "mimeType": "image/png",
    "size": 68
  }
}
```

#### Error Responses
* `400 Bad Request`: Disallowed MIME type (e.g. `.exe`, `.sh`) or file size > 10MB.
* `401 Unauthorized`: Missing or invalid Bearer token.

---

### 2. Retrieve Uploaded Asset
* **Method & Path:** `GET /uploads/{filename}`
* **Auth Required:** `None` (Public CDN/Static file server)
* **Example:** `https://ipam.billnbite.cloud/uploads/my_avatar_1792053710264_0072593c.png`
* **Response:** Raw binary image or PDF with corresponding `Content-Type` header (e.g. `image/png`, `application/pdf`).

---

## 📱 Flutter Implementation

### 1. Data Model (`lib/models/upload_models.dart`)

```dart
class UploadedFileResult {
  final String url;
  final String filename;
  final String originalName;
  final String mimeType;
  final int size;

  UploadedFileResult({
    required this.url,
    required this.filename,
    required this.originalName,
    required this.mimeType,
    required this.size,
  });

  factory UploadedFileResult.fromJson(Map<String, dynamic> json) {
    return UploadedFileResult(
      url: json['url'] ?? '',
      filename: json['filename'] ?? '',
      originalName: json['originalName'] ?? '',
      mimeType: json['mimeType'] ?? '',
      size: json['size'] ?? 0,
    );
  }

  /// Helper to get full public URL
  String fullUrl(String baseUrl) => '$baseUrl$url';
}
```

### 2. Service Repository (`lib/services/upload_service.dart`)

```dart
import 'dart:io';
import 'package:dio/dio.dart';
import '../core/api/api_client.dart';
import '../models/upload_models.dart';

class UploadService {
  final ApiClient _client = ApiClient();

  /// Uploads local File (Image or PDF) using multipart/form-data
  Future<UploadedFileResult> uploadFile(File file) async {
    try {
      final fileName = file.path.split('/').last;

      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          file.path,
          filename: fileName,
        ),
      });

      final response = await _client.dio.post(
        '/api/upload',
        data: formData,
        options: Options(
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        ),
      );

      return UploadedFileResult.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'File upload failed');
    }
  }
}
```

### 3. Image Picker Integration Example (`lib/widgets/avatar_picker_widget.dart`)

```dart
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/upload_service.dart';

class AvatarPickerWidget extends StatefulWidget {
  final Function(String uploadedUrl) onUploaded;

  const AvatarPickerWidget({Key? key, required this.onUploaded}) : super(key: key);

  @override
  State<AvatarPickerWidget> createState() => _AvatarPickerWidgetState();
}

class _AvatarPickerWidgetState extends State<AvatarPickerWidget> {
  final ImagePicker _picker = ImagePicker();
  final UploadService _uploadService = UploadService();
  bool _isUploading = false;
  String? _previewUrl;

  Future<void> _pickAndUpload() async {
    final XFile? picked = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1024,
      maxHeight: 1024,
      imageQuality: 85,
    );

    if (picked == null) return;

    setState(() => _isUploading = true);
    try {
      final result = await _uploadService.uploadFile(File(picked.path));
      setState(() {
        _previewUrl = result.url;
        _isUploading = false;
      });
      widget.onUploaded(result.url);
    } catch (e) {
      setState(() => _isUploading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _isUploading ? null : _pickAndUpload,
      child: CircleAvatar(
        radius: 50,
        backgroundColor: Colors.grey.shade300,
        child: _isUploading
            ? const CircularProgressIndicator()
            : _previewUrl != null
                ? ClipOval(child: Image.network("https://ipam.billnbite.cloud$_previewUrl", fit: BoxFit.cover))
                : const Icon(Icons.camera_alt, size: 36, color: Colors.black54),
      ),
    );
  }
}
```
