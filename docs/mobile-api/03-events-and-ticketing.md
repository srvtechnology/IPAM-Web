# 03. Events & Ticketing API Integration

* **Swagger UI Documentation:** [https://ipam.billnbite.cloud/api-docs#/Events%20&%20Ticketing](https://ipam.billnbite.cloud/api-docs#/Events%20&%20Ticketing)
* **Tag:** `Events & Ticketing`
* **Security Schemes:** `Public` & `BearerAuth` (for Registrations and Proposals)

---

## 📌 Overview

The Events & Ticketing module allows alumni to discover campus events, reunions, leadership seminars, and career workshops. It supports:
1. **Event Discovery:** Browsing upcoming and featured events with real-time seat availability.
2. **RSVP & Ticketing:** In-app ticket booking that generates a unique booking reference (`BK-EVT-...`).
3. **Ticket Management:** Viewing user tickets and canceling reservations for upcoming events to release capacity.
4. **Community Proposals:** Proposing new alumni meetups to the executive council.

---

## 🛣️ Endpoints Breakdown

### 1. List Events
* **Method & Path:** `GET /api/events`
* **Auth Required:** `None` (Public)
* **Description:** Retrieves all published events sorted chronologically.

#### Success Response (`200 OK`)
```json
{
  "data": [
    {
      "id": "seed-event-6",
      "title": "IPAM Mentorship Network Orientation",
      "slug": "ipam-mentorship-orientation-2026",
      "category": "CAREER_WORKSHOP",
      "date": "2026-10-18T14:00:00.000Z",
      "location": "IPAM Main Auditorium, Freetown",
      "bannerImage": "/uploads/events/mentorship.jpg",
      "description": "Annual launch of the university-wide alumni mentorship circle.",
      "capacity": 250,
      "registeredCount": 84,
      "isFree": true,
      "ticketPrice": 0,
      "status": "UPCOMING"
    }
  ]
}
```

---

### 2. Get Event Details
* **Method & Path:** `GET /api/events/{id}`
* **Auth Required:** Optional (`BearerAuth` allows returning `registered: true` for the authenticated user)
* **Path Parameters:**
  * `id`: Event ID (e.g. `seed-event-6`)

#### Success Response (`200 OK`)
```json
{
  "data": {
    "id": "seed-event-6",
    "title": "IPAM Mentorship Network Orientation",
    "date": "2026-10-18T14:00:00.000Z",
    "location": "IPAM Main Auditorium, Freetown",
    "description": "Annual launch of the university-wide alumni mentorship circle.",
    "capacity": 250,
    "registeredCount": 84,
    "availableSeats": 166,
    "isFree": true,
    "ticketPrice": 0,
    "registered": false
  }
}
```

---

### 3. RSVP / Register for Event
* **Method & Path:** `POST /api/events/{id}/register`
* **Auth Required:** `BearerAuth`
* **Path Parameters:**
  * `id`: Event ID
* **Description:** Books tickets for the event. Validates remaining capacity and generates a unique booking reference.

#### Request Body (`application/json`)
```json
{
  "ticketCount": 1,
  "attendeeName": "Alex Sesay",
  "attendeeEmail": "demo.alumni@ipam.edu",
  "attendeePhone": "+232 76 112233",
  "notes": "Vegetarian meal preference",
  "paymentMethod": "FREE"
}
```

#### Success Response (`201 Created` or `200 OK`)
```json
{
  "data": {
    "id": "cmv199...",
    "bookingReference": "BK-EVT-MV9ANUCY-Z8KF",
    "eventId": "seed-event-6",
    "ticketCount": 1,
    "totalAmount": 0,
    "bookingStatus": "CONFIRMED",
    "registeredAt": "2026-10-26T11:22:00.000Z"
  }
}
```

#### Error Responses
* `400 Bad Request`: Already registered or event is in the past.
* `409 Conflict`: Event has reached maximum capacity.

---

### 4. My Booked Event Tickets
* **Method & Path:** `GET /api/events/my-registrations`
* **Auth Required:** `BearerAuth`
* **Description:** Retrieves all tickets booked by the authenticated alumni member.

#### Success Response (`200 OK`)
```json
{
  "data": [
    {
      "id": "cmv199...",
      "bookingReference": "BK-EVT-MV9ANUCY-Z8KF",
      "ticketCount": 1,
      "bookingStatus": "CONFIRMED",
      "registeredAt": "2026-10-26T11:22:00.000Z",
      "event": {
        "id": "seed-event-6",
        "title": "IPAM Mentorship Network Orientation",
        "date": "2026-10-18T14:00:00.000Z",
        "location": "IPAM Main Auditorium, Freetown",
        "bannerImage": "/uploads/events/mentorship.jpg"
      }
    }
  ]
}
```

---

### 5. View & Cancel Event Ticket
* **Method & Path:** `GET /api/events/my-registrations/{bookingRef}`
* **Method & Path:** `DELETE /api/events/my-registrations/{bookingRef}`
* **Auth Required:** `BearerAuth`
* **Path Parameters:**
  * `bookingRef`: The booking reference code (e.g. `BK-EVT-MV9ANUCY-Z8KF`)

#### Cancel Response (`200 OK`)
```json
{
  "data": {
    "message": "Registration cancelled successfully",
    "bookingReference": "BK-EVT-MV9ANUCY-Z8KF"
  }
}
```
* **Cancellation Guard:** A registration cannot be cancelled if the event date has already passed (`400 Cannot cancel registration for a past event`).

---

### 6. Submit Event Proposal
* **Method & Path:** `POST /api/event-proposals`
* **Auth Required:** `None` (Public / Alumni)
* **Request Body:**
```json
{
  "title": "IPAM Tech Alumni Hackathon 2026",
  "category": "CAREER_WORKSHOP",
  "format": "HYBRID",
  "location": "IPAM Innovation Hub, Freetown",
  "description": "A 2-day hackathon building Flutter mobile apps for university advancement.",
  "organizerEmail": "demo.alumni@ipam.edu"
}
```
* **Success Response (`201 Created`):** Returns the submitted proposal pending review.

---

## 📱 Flutter Implementation

### 1. Data Models (`lib/models/event_models.dart`)

```dart
class EventItem {
  final String id;
  final String title;
  final String category;
  final DateTime date;
  final String location;
  final String? bannerImage;
  final String description;
  final int capacity;
  final int registeredCount;
  final bool isFree;
  final double ticketPrice;
  final bool registered;

  EventItem({
    required this.id,
    required this.title,
    required this.category,
    required this.date,
    required this.location,
    this.bannerImage,
    required this.description,
    required this.capacity,
    required this.registeredCount,
    required this.isFree,
    required this.ticketPrice,
    this.registered = false,
  });

  factory EventItem.fromJson(Map<String, dynamic> json) {
    return EventItem(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      category: json['category'] ?? 'NETWORKING',
      date: DateTime.tryParse(json['date'] ?? '') ?? DateTime.now(),
      location: json['location'] ?? 'IPAM Campus',
      bannerImage: json['bannerImage'],
      description: json['description'] ?? '',
      capacity: json['capacity'] ?? 0,
      registeredCount: json['registeredCount'] ?? 0,
      isFree: json['isFree'] ?? true,
      ticketPrice: (json['ticketPrice'] as num?)?.toDouble() ?? 0.0,
      registered: json['registered'] ?? false,
    );
  }
}

class EventBooking {
  final String id;
  final String bookingReference;
  final int ticketCount;
  final String bookingStatus;
  final DateTime registeredAt;
  final EventItem event;

  EventBooking({
    required this.id,
    required this.bookingReference,
    required this.ticketCount,
    required this.bookingStatus,
    required this.registeredAt,
    required this.event,
  });

  factory EventBooking.fromJson(Map<String, dynamic> json) {
    return EventBooking(
      id: json['id'] ?? '',
      bookingReference: json['bookingReference'] ?? '',
      ticketCount: json['ticketCount'] ?? 1,
      bookingStatus: json['bookingStatus'] ?? 'CONFIRMED',
      registeredAt: DateTime.tryParse(json['registeredAt'] ?? '') ?? DateTime.now(),
      event: EventItem.fromJson(json['event'] ?? {}),
    );
  }
}
```

### 2. Service Repository (`lib/services/event_service.dart`)

```dart
import 'package:dio/dio.dart';
import '../core/api/api_client.dart';
import '../models/event_models.dart';

class EventService {
  final ApiClient _client = ApiClient();

  /// Lists all public events
  Future<List<EventItem>> fetchEvents() async {
    try {
      final response = await _client.dio.get('/api/events');
      final list = (response.data['data'] as List? ?? []);
      return list.map((e) => EventItem.fromJson(e)).toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Failed to load events');
    }
  }

  /// Registers user for an event
  Future<String> registerForEvent(String eventId, {String? notes}) async {
    try {
      final response = await _client.dio.post(
        '/api/events/$eventId/register',
        data: {
          'ticketCount': 1,
          'notes': notes,
        },
      );
      return response.data['data']['bookingReference'];
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Registration failed');
    }
  }

  /// Fetches my booked tickets
  Future<List<EventBooking>> fetchMyRegistrations() async {
    try {
      final response = await _client.dio.get('/api/events/my-registrations');
      final list = (response.data['data'] as List? ?? []);
      return list.map((e) => EventBooking.fromJson(e)).toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Failed to load bookings');
    }
  }

  /// Cancels a booked ticket
  Future<void> cancelRegistration(String bookingReference) async {
    try {
      await _client.dio.delete('/api/events/my-registrations/$bookingReference');
    } on DioException catch (e) {
      throw Exception(e.response?.data?['error'] ?? 'Failed to cancel booking');
    }
  }
}
```
