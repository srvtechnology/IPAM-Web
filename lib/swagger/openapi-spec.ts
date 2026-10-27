export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "IPAM Alumni Unified REST API",
    version: "1.0.0",
    description: `
### IPAM Alumni Association Unified Backend API

Official API documentation and testing sandbox for **IPAM Alumni Web** and the **Flutter Mobile App**.

#### Key Features:
- **Dual Authentication**: Accepts standard HTTP \`Authorization: Bearer <jwt_token>\` headers for Flutter/Mobile clients AND session cookies for web browsers.
- **Full Mobile Lifecycle**: Auth, Profile, Virtual QR Pass, Event Booking & Cancellations, Job Applications & Bookmarks, Alumni Directory & Networking, Business Marketplace, Physical ID Smart Card Orders, Online Giving, and Subscriptions.
- **QR Code Verification**: Check-in and membership validation for in-person events and physical entry.

#### Flutter Integration Quick Start:
1. Call \`POST /api/auth/alumni/login\` with your email & password.
2. Store the returned \`token\` securely using \`flutter_secure_storage\`.
3. Add header \`Authorization: Bearer <token>\` to all authenticated requests.
    `,
    contact: {
      name: "IPAM Alumni Engineering Team",
      url: "https://ipam.edu",
      email: "support@ipam.edu",
    },
  },
  servers: [
    {
      url: "/",
      description: "Current Server Environment",
    },
    {
      url: "http://localhost:3000",
      description: "Local Development Server",
    },
  ],
  tags: [
    { name: "Authentication", description: "Alumni login, registration, password management, and sessions" },
    { name: "Virtual Pass & QR", description: "Digital alumni identity card, QR pass, and verifier scanner APIs" },
    { name: "Profile", description: "Alumni member profile and skill management" },
    { name: "Events & Ticketing", description: "Browse events, RSVP tickets, manage registrations, and event proposals" },
    { name: "Jobs & Careers", description: "Job directory, applications, CV submission, and saved jobs" },
    { name: "Alumni Directory & Networking", description: "Search directory, connections, bookmarks, and broadcasts" },
    { name: "Businesses & Marketplace", description: "Alumni-owned businesses and directory listings" },
    { name: "Physical ID Cards", description: "Order PVC/RFID/Titanium physical ID cards and track shipping" },
    { name: "Donations & Giving", description: "Endowment and university fundraising campaigns" },
    { name: "Membership & Subscriptions", description: "Tier configs, upgrades, and billing management" },
    { name: "Media & Uploads", description: "Upload profile photos, avatars, and CV documents" },
    { name: "Leadership", description: "Public executive council and university initiatives" },
    { name: "Content & Banners", description: "Promotional banners and hero slider announcements" },
    { name: "Payments", description: "Stripe PaymentIntent initiation" },
    { name: "Mobile App", description: "Mobile client aggregation feeds, bootstrap config, and client helpers" },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT token obtained from `/api/auth/alumni/login`.",
      },
      CookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "ipam_alumni_session",
        description: "Browser cookie used automatically for web portal requests.",
      },
    },
    schemas: {
      StandardResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { type: "object" },
          error: { type: "string", nullable: true },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string", example: "Invalid email or password" },
          data: { type: "object", nullable: true },
        },
      },
      AlumniLoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "alumni@ipam.edu" },
          password: { type: "string", format: "password", example: "AlumniPass123!" },
          rememberMe: { type: "boolean", example: true },
        },
      },
      AlumniRegisterRequest: {
        type: "object",
        required: ["email", "studentId", "password", "name", "classYear", "degree", "major", "otp"],
        properties: {
          email: { type: "string", format: "email", example: "jane.doe@alumni.ipam.edu" },
          studentId: { type: "string", example: "IPAM-2022-8492" },
          password: { type: "string", minLength: 8, example: "SecretP@ss123" },
          name: { type: "string", example: "Jane Doe" },
          classYear: { type: "integer", example: 2022 },
          degree: { type: "string", example: "B.Sc. Applied Computing" },
          major: { type: "string", example: "Software Engineering" },
          currentRole: { type: "string", example: "Senior Systems Engineer" },
          company: { type: "string", example: "Apex Technologies" },
          location: { type: "string", example: "Freetown" },
          country: { type: "string", example: "Sierra Leone" },
          industry: { type: "string", example: "Technology" },
          bio: { type: "string", example: "Passionate about open source and community mentorship." },
          isMentor: { type: "boolean", example: true },
          otp: { type: "string", example: "123456", description: "Default test 2FA OTP code: 123456" },
        },
      },
      ChangePasswordRequest: {
        type: "object",
        required: ["currentPassword", "newPassword"],
        properties: {
          currentPassword: { type: "string", format: "password", example: "OldPassword123!" },
          newPassword: { type: "string", format: "password", minLength: 8, example: "NewSecurePassword456!" },
        },
      },
      ProfileUpdateRequest: {
        type: "object",
        properties: {
          name: { type: "string", example: "Jane Doe" },
          avatar: { type: "string", nullable: true, example: "/uploads/avatar_123.jpg" },
          currentRole: { type: "string", example: "Lead Cloud Architect" },
          company: { type: "string", example: "Global Nexus Ltd" },
          industry: { type: "string", example: "Cloud Infrastructure" },
          location: { type: "string", example: "Freetown" },
          country: { type: "string", example: "Sierra Leone" },
          degree: { type: "string", example: "B.Sc. Computer Science" },
          major: { type: "string", example: "Software Engineering" },
          classYear: { type: "integer", example: 2021 },
          bio: { type: "string", example: "Passionate about building scalable distributed systems." },
          linkedin: { type: "string", nullable: true, example: "https://linkedin.com/in/janedoe" },
          isMentor: { type: "boolean", example: true },
          skills: {
            type: "array",
            items: { type: "string" },
            example: ["Flutter", "Dart", "Next.js", "Docker", "Prisma"],
          },
        },
      },
      EventRegistrationRequest: {
        type: "object",
        properties: {
          ticketCount: { type: "integer", default: 1, example: 1 },
          attendeeName: { type: "string", example: "Jane Doe" },
          attendeeEmail: { type: "string", format: "email", example: "jane.doe@alumni.ipam.edu" },
          attendeePhone: { type: "string", example: "+232 76 123456" },
          notes: { type: "string", example: "Dietary preference: Vegetarian" },
          paymentRef: { type: "string", nullable: true, example: "pi_3Nxyz123" },
          paymentMethod: { type: "string", default: "FREE", example: "STRIPE" },
        },
      },
      JobApplicationRequest: {
        type: "object",
        required: ["candidateName", "email"],
        properties: {
          candidateName: { type: "string", example: "Jane Doe" },
          email: { type: "string", format: "email", example: "jane.doe@alumni.ipam.edu" },
          phone: { type: "string", example: "+232 76 123456" },
          degree: { type: "string", example: "B.Sc. Computing" },
          faculty: { type: "string", example: "Faculty of Applied Sciences" },
          gradYear: { type: "integer", example: 2022 },
          experienceYears: { type: "integer", example: 4 },
          linkedinUrl: { type: "string", example: "https://linkedin.com/in/janedoe" },
          coverNote: { type: "string", example: "Excited to contribute to your engineering team!" },
          cvUrl: { type: "string", example: "/uploads/Jane_Doe_Resume_123.pdf" },
          cvFileName: { type: "string", example: "Jane_Doe_Resume.pdf" },
        },
      },
      CreateBusinessRequest: {
        type: "object",
        required: ["name", "industry", "location", "description"],
        properties: {
          name: { type: "string", example: "Apex Solutions Sierra Leone" },
          tagline: { type: "string", example: "Pioneering enterprise digital transformation" },
          industry: { type: "string", example: "Information Technology" },
          category: { type: "string", example: "Technology & Software" },
          location: { type: "string", example: "Freetown, Sierra Leone" },
          description: { type: "string", example: "Providing bespoke fintech and mobile banking software." },
          founders: { type: "string", example: "Jane Doe (Class of '21)" },
          logo: { type: "string", nullable: true, example: "/uploads/logo_apex.png" },
          coverImage: { type: "string", nullable: true, example: "/uploads/cover_apex.jpg" },
          email: { type: "string", format: "email", example: "contact@apexsolutions.sl" },
          phone: { type: "string", example: "+232 77 987654" },
          website: { type: "string", example: "https://apexsolutions.sl" },
          yearEstablished: { type: "integer", example: 2023 },
          companySize: { type: "string", example: "11-50 employees" },
        },
      },
      PhysicalCardOrderRequest: {
        type: "object",
        required: ["cardTier", "deliveryAddress", "recipientName", "recipientPhone", "paymentMethod"],
        properties: {
          cardTier: {
            type: "string",
            enum: ["STANDARD_PVC", "GOLD_RFID_SMART", "EXECUTIVE_TITANIUM"],
            example: "GOLD_RFID_SMART",
          },
          recipientName: { type: "string", example: "Jane Doe" },
          recipientPhone: { type: "string", example: "+232 76 112233" },
          deliveryAddress: { type: "string", example: "14 Pademba Road, Freetown, Sierra Leone" },
          paymentMethod: {
            type: "string",
            enum: ["STRIPE", "COD"],
            example: "COD",
            description: "Stripe Online Payment or Cash on Delivery",
          },
          paymentRef: { type: "string", nullable: true, example: "pi_stripe_12345" },
        },
      },
      DonationRequest: {
        type: "object",
        required: ["donorName", "donorEmail", "amount", "fund"],
        properties: {
          donorName: { type: "string", example: "Jane Doe" },
          donorEmail: { type: "string", format: "email", example: "jane.doe@alumni.ipam.edu" },
          amount: { type: "number", example: 100 },
          currency: { type: "string", enum: ["USD", "SLE"], default: "USD", example: "USD" },
          fund: { type: "string", example: "STEM Lab Expansion Fund" },
          isAnonymous: { type: "boolean", default: false, example: false },
          message: { type: "string", example: "Honoring the faculty and looking forward to the future." },
        },
      },
      SubscriptionUpgradeRequest: {
        type: "object",
        required: ["tier", "billingCycle"],
        properties: {
          tier: {
            type: "string",
            enum: ["STANDARD", "SILVER_LIFETIME", "GOLD_PATRON"],
            example: "SILVER_LIFETIME",
          },
          billingCycle: {
            type: "string",
            enum: ["MONTHLY", "ANNUAL", "LIFETIME"],
            example: "LIFETIME",
          },
          paymentMethod: { type: "string", default: "CARD", example: "CARD" },
          paymentReference: { type: "string", nullable: true, example: "SUB-PAY-REF-9988" },
        },
      },
      StripePaymentIntentRequest: {
        type: "object",
        required: ["cardTier"],
        properties: {
          cardTier: {
            type: "string",
            enum: ["STANDARD_PVC", "GOLD_RFID_SMART", "EXECUTIVE_TITANIUM"],
            example: "GOLD_RFID_SMART",
          },
          recipientName: { type: "string", example: "Jane Doe" },
        },
      },
    },
  },
  paths: {
    // -------------------------------------------------------------
    // AUTHENTICATION
    // -------------------------------------------------------------
    "/api/auth/alumni/login": {
      post: {
        tags: ["Authentication"],
        summary: "Alumni Sign In",
        description: "Authenticates an alumni user using email and password. Returns user profile and a JWT `token` for Flutter / Mobile Bearer auth, plus sets session cookie for web.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/AlumniLoginRequest" } } },
        },
        responses: {
          200: {
            description: "Authentication successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        email: { type: "string" },
                        studentId: { type: "string" },
                        isVerifiedAlumni: { type: "boolean" },
                        membershipTier: { type: "string" },
                        token: { type: "string", description: "JWT bearer token to pass in Authorization: Bearer <token>" },
                        savedJobsCount: { type: "integer" },
                        profile: { type: "object" },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Invalid email or password", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          403: { description: "Account pending approval or rejected", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/api/auth/alumni/register": {
      post: {
        tags: ["Authentication"],
        summary: "Alumni Registration / Resubmission",
        description: "Registers a new alumni account with 2FA verification (Test OTP: 123456). Submitted accounts go to PENDING for university registrar approval.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/AlumniRegisterRequest" } } },
        },
        responses: {
          201: { description: "Registration submitted successfully" },
          400: { description: "Validation failure or invalid OTP" },
          409: { description: "Email or Student ID conflict" },
        },
      },
    },
    "/api/auth/alumni/me": {
      get: {
        tags: ["Authentication"],
        summary: "Current User Session",
        description: "Retrieves current authenticated alumni user profile, verification badge status, and saved jobs count.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        responses: {
          200: { description: "Authenticated alumni details" },
          401: { description: "Not authenticated" },
          403: { description: "Account pending approval" },
        },
      },
    },
    "/api/auth/alumni/change-password": {
      post: {
        tags: ["Authentication"],
        summary: "Change Password",
        description: "Allows the authenticated alumni member to change their account password.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ChangePasswordRequest" } } },
        },
        responses: {
          200: { description: "Password changed successfully" },
          400: { description: "Incorrect current password or invalid input" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/auth/alumni/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Sign Out",
        description: "Clears session cookies and ends active web session.",
        responses: {
          200: { description: "Signed out successfully" },
        },
      },
    },
    "/api/auth/forgot-password": {
      post: {
        tags: ["Authentication"],
        summary: "Forgot Password (Request OTP)",
        description: "Requests a 2FA OTP code to reset password. Returns test OTP: `123456`.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: { type: "string", format: "email", example: "demo.alumni@ipam.edu" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Password reset OTP dispatched" },
          400: { description: "Invalid email" },
        },
      },
    },
    "/api/auth/reset-password": {
      post: {
        tags: ["Authentication"],
        summary: "Reset Password with OTP",
        description: "Resets account password using verified OTP code (`123456`).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "otp", "newPassword"],
                properties: {
                  email: { type: "string", format: "email", example: "demo.alumni@ipam.edu" },
                  otp: { type: "string", example: "123456" },
                  newPassword: { type: "string", minLength: 8, example: "NewSecurePassword456!" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Password reset successfully" },
          400: { description: "Invalid OTP or validation failure" },
          404: { description: "Account not found" },
        },
      },
    },
    "/api/auth/refresh": {
      post: {
        tags: ["Authentication"],
        summary: "Refresh Session Token",
        description: "Issues a refreshed JWT session token for authenticated mobile clients.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        responses: {
          200: { description: "Refreshed token issued" },
          401: { description: "Unauthorized" },
        },
      },
    },

    // -------------------------------------------------------------
    // VIRTUAL PASS & QR
    // -------------------------------------------------------------
    "/api/alumni/pass": {
      get: {
        tags: ["Virtual Pass & QR"],
        summary: "Get Alumni Digital ID Pass",
        description: "Returns the digital identity pass for the authenticated alumni user, including `qrPayload` string ready to be rendered as a QR code.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        responses: {
          200: {
            description: "Digital alumni pass card data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        studentId: { type: "string" },
                        name: { type: "string" },
                        avatar: { type: "string", nullable: true },
                        degree: { type: "string" },
                        major: { type: "string" },
                        classYear: { type: "integer" },
                        membershipTier: { type: "string" },
                        isVerifiedAlumni: { type: "boolean" },
                        qrPayload: { type: "string", description: "JSON string for QR code generation" },
                        membershipValidUntil: { type: "string", nullable: true },
                        issuedAt: { type: "string" },
                        institution: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Authentication required" },
          403: { description: "Account is not active or approved" },
        },
      },
    },
    "/api/alumni/pass/verify/{id}": {
      get: {
        tags: ["Virtual Pass & QR"],
        summary: "Verify Alumni Pass by ID or Student ID",
        description: "Public scanner validation endpoint. Checks if an alumni pass or registration number is authentic and active.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Alumni User ID (CUID) or Student Registration ID",
            schema: { type: "string", example: "IPAM-2022-8492" },
          },
        ],
        responses: {
          200: {
            description: "Verification result",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        valid: { type: "boolean", example: true },
                        status: { type: "string", example: "APPROVED" },
                        message: { type: "string", example: "Valid Verified Alumni Pass" },
                        user: { type: "object" },
                        verifiedAt: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: "Pass not found or invalid" },
        },
      },
    },
    "/api/alumni/digital-pass": {
      get: {
        tags: ["Virtual Pass & QR"],
        summary: "Get Digital ID Pass (Mobile Alias)",
        description: "Mobile alias for `/api/alumni/pass`. Returns digital alumni card details and JSON `qrPayload` string.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        responses: {
          200: { description: "Digital alumni pass data" },
          401: { description: "Authentication required" },
        },
      },
    },

    // -------------------------------------------------------------
    // PROFILE
    // -------------------------------------------------------------
    "/api/profile": {
      get: {
        tags: ["Profile"],
        summary: "Get Alumni Profile",
        description: "Retrieves complete alumni profile, career details, and skill tags.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        responses: {
          200: { description: "Profile data retrieved" },
          401: { description: "Unauthorized" },
        },
      },
      patch: {
        tags: ["Profile"],
        summary: "Update Alumni Profile",
        description: "Updates biographical info, industry, role, location, social links, mentor flag, and skills.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ProfileUpdateRequest" } } },
        },
        responses: {
          200: { description: "Profile updated successfully" },
          400: { description: "Validation error" },
          401: { description: "Unauthorized" },
        },
      },
    },

    // -------------------------------------------------------------
    // EVENTS & TICKETING
    // -------------------------------------------------------------
    "/api/events": {
      get: {
        tags: ["Events & Ticketing"],
        summary: "List Alumni Events",
        description: "Fetches upcoming and past university events with seat capacities and attendee counts.",
        responses: {
          200: { description: "Array of events" },
        },
      },
    },
    "/api/events/{id}": {
      get: {
        tags: ["Events & Ticketing"],
        summary: "Get Event Details",
        description: "Retrieves single event details along with the `registered` boolean for the logged-in user.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Event details with registration status" },
          404: { description: "Event not found" },
        },
      },
    },
    "/api/events/{id}/register": {
      post: {
        tags: ["Events & Ticketing"],
        summary: "RSVP / Register for Event",
        description: "Reserves seats/tickets for an event. Generates a unique booking reference (`BK-EVT-...`) and confirms the ticket.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          content: { "application/json": { schema: { $ref: "#/components/schemas/EventRegistrationRequest" } } },
        },
        responses: {
          201: { description: "Registration confirmed" },
          401: { description: "Authentication required" },
          409: { description: "Event capacity full" },
        },
      },
    },
    "/api/events/my-registrations": {
      get: {
        tags: ["Events & Ticketing"],
        summary: "My Booked Event Tickets",
        description: "Fetches all tickets and bookings for the authenticated alumni member.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        responses: {
          200: { description: "List of user event tickets with booking references" },
          401: { description: "Authentication required" },
        },
      },
    },
    "/api/events/my-registrations/{bookingRef}": {
      get: {
        tags: ["Events & Ticketing"],
        summary: "View Ticket Details",
        description: "Retrieves details of a specific ticket booking by booking reference.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [
          { name: "bookingRef", in: "path", required: true, schema: { type: "string", example: "BK-EVT-L..." } },
        ],
        responses: {
          200: { description: "Ticket details" },
          404: { description: "Booking not found" },
        },
      },
      delete: {
        tags: ["Events & Ticketing"],
        summary: "Cancel Event Ticket",
        description: "Cancels an active event registration and releases the reserved seats.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [
          { name: "bookingRef", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Booking cancelled" },
          400: { description: "Cannot cancel past event" },
          404: { description: "Booking not found" },
        },
      },
    },
    "/api/event-proposals": {
      post: {
        tags: ["Events & Ticketing"],
        summary: "Submit Event Proposal",
        description: "Allows alumni to propose a reunion, workshop, or seminar to the alumni executive council.",
        responses: {
          201: { description: "Proposal submitted" },
        },
      },
    },
    "/api/events/rsvp": {
      post: {
        tags: ["Events & Ticketing"],
        summary: "Mobile Event RSVP / Ticket Booking",
        description: "Mobile endpoint for event booking. Accepts `{ eventId, ticketCount, ... }` and generates a booking reference.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["eventId"],
                properties: {
                  eventId: { type: "string", example: "seed-event-6" },
                  ticketCount: { type: "integer", default: 1, example: 1 },
                  attendeeName: { type: "string", example: "Alex Sesay" },
                  attendeeEmail: { type: "string", format: "email", example: "demo.alumni@ipam.edu" },
                  attendeePhone: { type: "string", example: "+232 76 112233" },
                  notes: { type: "string", example: "Vegetarian dietary preference" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "RSVP confirmed with booking reference" },
          400: { description: "Validation failure" },
          401: { description: "Unauthorized" },
          409: { description: "Event capacity full" },
        },
      },
    },

    // -------------------------------------------------------------
    // JOBS & CAREERS
    // -------------------------------------------------------------
    "/api/jobs": {
      get: {
        tags: ["Jobs & Careers"],
        summary: "Browse Job Opportunities",
        description: "Search and filter job openings by query, category, workplace type (REMOTE/HYBRID/ON_SITE), and job type.",
        parameters: [
          { name: "q", in: "query", schema: { type: "string" }, description: "Search query" },
          { name: "category", in: "query", schema: { type: "string" }, description: "Job category" },
          { name: "type", in: "query", schema: { type: "string" }, description: "FULL_TIME, CONTRACT, etc." },
          { name: "workplaceType", in: "query", schema: { type: "string" }, description: "REMOTE, HYBRID, ON_SITE" },
        ],
        responses: {
          200: { description: "List of job openings with application & save status" },
        },
      },
      post: {
        tags: ["Jobs & Careers"],
        summary: "Post a Job",
        description: "Post a new vacancy (for corporate recruiters and alumni employers).",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        responses: {
          201: { description: "Job posted" },
        },
      },
    },
    "/api/jobs/{id}": {
      get: {
        tags: ["Jobs & Careers"],
        summary: "Get Job Details",
        description: "Fetches full job specifications, company info, requirements, and checks if current user applied or saved the job.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Job details" },
          404: { description: "Job not found" },
        },
      },
    },
    "/api/jobs/{id}/apply": {
      post: {
        tags: ["Jobs & Careers"],
        summary: "Apply for Job",
        description: "Submit candidate application with CV document url, cover note, experience, and contact details.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/JobApplicationRequest" } } },
        },
        responses: {
          201: { description: "Application submitted successfully" },
          400: { description: "Validation error" },
          401: { description: "Authentication required" },
          409: { description: "Already applied for this job" },
        },
      },
    },
    "/api/jobs/{id}/save": {
      post: {
        tags: ["Jobs & Careers"],
        summary: "Toggle Save Job",
        description: "Saves or unsaves a job listing for the authenticated alumni member.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Toggle result",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        saved: { type: "boolean", example: true },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Authentication required" },
        },
      },
    },
    "/api/jobs/saved": {
      get: {
        tags: ["Jobs & Careers"],
        summary: "My Saved Jobs",
        description: "Retrieves all job listings saved/bookmarked by the authenticated user.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        responses: {
          200: { description: "List of saved jobs" },
          401: { description: "Authentication required" },
        },
      },
    },
    "/api/jobs/my-applications": {
      get: {
        tags: ["Jobs & Careers"],
        summary: "My Job Applications",
        description: "Retrieves all job applications submitted by the user along with hiring status, match scores, and recruiter remarks.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        responses: {
          200: { description: "List of applications" },
          401: { description: "Authentication required" },
        },
      },
    },

    // -------------------------------------------------------------
    // ALUMNI DIRECTORY & NETWORKING
    // -------------------------------------------------------------
    "/api/alumni": {
      get: {
        tags: ["Alumni Directory & Networking"],
        summary: "Search Alumni Directory",
        description: "Search fellow graduates by name, company, role, skills, graduation year, industry, or mentor availability.",
        parameters: [
          { name: "q", in: "query", schema: { type: "string" }, description: "Search query" },
          { name: "classYear", in: "query", schema: { type: "integer" }, description: "Graduation year" },
          { name: "industry", in: "query", schema: { type: "string" }, description: "Industry sector" },
          { name: "isMentor", in: "query", schema: { type: "string", enum: ["true", "false"] }, description: "Only mentors" },
        ],
        responses: {
          200: { description: "List of matching alumni profiles" },
        },
      },
    },
    "/api/alumni/{id}": {
      get: {
        tags: ["Alumni Directory & Networking"],
        summary: "Get Alumni Public Profile",
        description: "View public profile, skills, education, and current employment of an alumni member.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Alumni profile" },
          404: { description: "Not found" },
        },
      },
    },
    "/api/alumni/{id}/connect": {
      post: {
        tags: ["Alumni Directory & Networking"],
        summary: "Connect / Bookmark Alumni",
        description: "Add an alumni member to your professional network.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          201: { description: "Connected" },
          401: { description: "Authentication required" },
        },
      },
      delete: {
        tags: ["Alumni Directory & Networking"],
        summary: "Disconnect Alumni",
        description: "Removes an alumni member from your network bookmarks.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Disconnected" },
          401: { description: "Authentication required" },
        },
      },
    },
    "/api/alumni/bookmarks": {
      get: {
        tags: ["Alumni Directory & Networking"],
        summary: "My Network Connections",
        description: "Retrieves all alumni connected or bookmarked by the user.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        responses: {
          200: { description: "List of connected alumni profiles" },
          401: { description: "Authentication required" },
        },
      },
    },
    "/api/alumni/notifications": {
      get: {
        tags: ["Alumni Directory & Networking"],
        summary: "Alumni Broadcast Notifications",
        description: "Fetches official university broadcast announcements, event notices, and priority alerts.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        responses: {
          200: { description: "List of notifications" },
          401: { description: "Authentication required" },
        },
      },
    },

    // -------------------------------------------------------------
    // BUSINESSES & MARKETPLACE
    // -------------------------------------------------------------
    "/api/businesses": {
      get: {
        tags: ["Businesses & Marketplace"],
        summary: "Browse Alumni Businesses",
        description: "List verified alumni-owned enterprises or view your own submitted businesses (`?mine=true`).",
        parameters: [
          { name: "mine", in: "query", schema: { type: "string", enum: ["true", "false"] } },
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "featured", in: "query", schema: { type: "string", enum: ["true", "false"] } },
        ],
        responses: {
          200: { description: "List of businesses" },
        },
      },
      post: {
        tags: ["Businesses & Marketplace"],
        summary: "Register Alumni Business",
        description: "Submit your business to the Alumni Commercial Directory (requires admin review).",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateBusinessRequest" } } },
        },
        responses: {
          201: { description: "Business submitted for approval" },
          400: { description: "Validation failure" },
          401: { description: "Authentication required" },
        },
      },
    },
    "/api/businesses/{id}": {
      get: {
        tags: ["Businesses & Marketplace"],
        summary: "Get Business Details",
        description: "Fetch comprehensive profile of an alumni business.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Business details" },
          404: { description: "Business not found" },
        },
      },
      patch: {
        tags: ["Businesses & Marketplace"],
        summary: "Update Business Listing",
        description: "Owner can update business details and branding.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Business updated" },
          403: { description: "Unauthorized" },
        },
      },
      delete: {
        tags: ["Businesses & Marketplace"],
        summary: "Delete Business Listing",
        description: "Delete an alumni business listing.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Business deleted" },
        },
      },
    },

    // -------------------------------------------------------------
    // PHYSICAL ID CARDS
    // -------------------------------------------------------------
    "/api/physical-card-orders/pricing": {
      get: {
        tags: ["Physical ID Cards"],
        summary: "Get Card Tiers & Pricing",
        description: "Returns currently enabled physical card tiers (Standard PVC, Gold RFID Smart, Executive Titanium) and pricing.",
        responses: {
          200: { description: "Tier pricing and delivery configuration" },
        },
      },
    },
    "/api/physical-card-orders": {
      get: {
        tags: ["Physical ID Cards"],
        summary: "My Physical Card Orders",
        description: "List all physical smart card orders made by the authenticated alumni user.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        responses: {
          200: { description: "List of card orders" },
          401: { description: "Authentication required" },
        },
      },
      post: {
        tags: ["Physical ID Cards"],
        summary: "Order Physical ID Card",
        description: "Place order for a customized physical university alumni ID card.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/PhysicalCardOrderRequest" } } },
        },
        responses: {
          201: { description: "Card order placed" },
          400: { description: "Invalid tier or delivery address" },
          401: { description: "Authentication required" },
        },
      },
    },
    "/api/physical-card-orders/{id}": {
      get: {
        tags: ["Physical ID Cards"],
        summary: "Track Physical Card Order",
        description: "Track card printing & courier delivery status, tracking number, and dispatch progress.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Order ID or Order Number" },
        ],
        responses: {
          200: { description: "Order status details" },
          403: { description: "Unauthorized" },
          404: { description: "Order not found" },
        },
      },
    },
    "/api/alumni/orders/card": {
      get: {
        tags: ["Physical ID Cards"],
        summary: "My Physical Card Orders (Mobile Alias)",
        description: "Mobile alias for `/api/physical-card-orders`. Returns user's physical card orders.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        responses: {
          200: { description: "List of card orders" },
        },
      },
      post: {
        tags: ["Physical ID Cards"],
        summary: "Order Physical ID Card (Mobile Alias)",
        description: "Mobile alias for `/api/physical-card-orders`. Places order for physical PVC/RFID card.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/PhysicalCardOrderRequest" } } },
        },
        responses: {
          201: { description: "Card order placed" },
        },
      },
    },

    // -------------------------------------------------------------
    // DONATIONS & GIVING
    // -------------------------------------------------------------
    "/api/donations": {
      get: {
        tags: ["Donations & Giving"],
        summary: "List Giving Campaigns & Donations",
        description: "Fetch university giving contributions or your personal contribution history (`?mine=true`).",
        parameters: [
          { name: "mine", in: "query", schema: { type: "string", enum: ["true", "false"] } },
        ],
        responses: {
          200: { description: "List of donations" },
        },
      },
      post: {
        tags: ["Donations & Giving"],
        summary: "Make a Donation",
        description: "Support university development funds and scholarships.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/DonationRequest" } } },
        },
        responses: {
          201: { description: "Donation recorded" },
        },
      },
    },

    // -------------------------------------------------------------
    // MEMBERSHIP & SUBSCRIPTIONS
    // -------------------------------------------------------------
    "/api/subscription": {
      get: {
        tags: ["Membership & Subscriptions"],
        summary: "Get Membership Status & Plans",
        description: "Retrieves user's active membership tier, validity dates, available tiers, and subscription history.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        responses: {
          200: { description: "Active membership tier and plan details" },
          401: { description: "Authentication required" },
        },
      },
      post: {
        tags: ["Membership & Subscriptions"],
        summary: "Upgrade Membership Tier",
        description: "Subscribe or upgrade to Silver Lifetime or Gold Patron membership.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/SubscriptionUpgradeRequest" } } },
        },
        responses: {
          200: { description: "Membership upgraded successfully" },
          400: { description: "Invalid tier or billing cycle" },
        },
      },
      patch: {
        tags: ["Membership & Subscriptions"],
        summary: "Toggle Auto-Renew",
        description: "Enable or disable automatic membership renewal.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { autoRenew: { type: "boolean" } } } } },
        },
        responses: {
          200: { description: "Auto-renew updated" },
        },
      },
    },

    // -------------------------------------------------------------
    // MEDIA & UPLOADS
    // -------------------------------------------------------------
    "/api/upload": {
      post: {
        tags: ["Media & Uploads"],
        summary: "Upload Image / Document",
        description: "Universal file uploader for Flutter mobile app and web. Accepts `multipart/form-data` with key `file` or JSON base64. Supports avatars, logos, and PDF resumes up to 10MB.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: { type: "string", format: "binary" },
                },
              },
            },
            "application/json": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: { type: "string", description: "Base64 encoded file string or data URI" },
                  filename: { type: "string", example: "my_cv.pdf" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "File uploaded successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        url: { type: "string", example: "/uploads/my_cv_1728990000.pdf" },
                        filename: { type: "string" },
                        originalName: { type: "string" },
                        mimeType: { type: "string" },
                        size: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: "Invalid file type or size exceeded" },
          401: { description: "Authentication required" },
        },
      },
    },

    // -------------------------------------------------------------
    // LEADERSHIP
    // -------------------------------------------------------------
    "/api/leadership": {
      get: {
        tags: ["Leadership"],
        summary: "Executive Council & Association Leadership",
        description: "Public directory of executive leaders, alumni council representatives, bios, and key initiatives.",
        responses: {
          200: { description: "List of leadership council members" },
        },
      },
    },

    // -------------------------------------------------------------
    // CONTENT & BANNERS
    // -------------------------------------------------------------
    "/api/hero-slides": {
      get: {
        tags: ["Content & Banners"],
        summary: "Home Screen Hero Slides",
        description: "Featured announcements, campus highlights, and spotlight items for mobile home feed.",
        responses: {
          200: { description: "List of hero slides" },
        },
      },
    },
    "/api/banners": {
      get: {
        tags: ["Content & Banners"],
        summary: "Commercial & Partner Banners",
        description: "Active sponsor banners and university campaign ads.",
        responses: {
          200: { description: "List of active banners" },
        },
      },
    },
    "/api/banners/impressions": {
      post: {
        tags: ["Content & Banners"],
        summary: "Track Banner Impression",
        description: "Records view metric for sponsor analytics.",
        responses: {
          200: { description: "Impression logged" },
        },
      },
    },
    "/api/banners/{id}/click": {
      post: {
        tags: ["Content & Banners"],
        summary: "Track Banner Click",
        description: "Records click metric for sponsor analytics.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Click logged" },
        },
      },
    },

    // -------------------------------------------------------------
    // PAYMENTS
    // -------------------------------------------------------------
    "/api/payments/stripe/create-payment-intent": {
      post: {
        tags: ["Payments"],
        summary: "Create Stripe PaymentIntent",
        description: "Initializes a Stripe PaymentIntent for in-app or web card checkout.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/StripePaymentIntentRequest" } } },
        },
        responses: {
          200: { description: "Payment intent clientSecret created" },
          400: { description: "Invalid tier or payment disabled" },
          401: { description: "Authentication required" },
        },
      },
    },

    // -------------------------------------------------------------
    // MOBILE APP
    // -------------------------------------------------------------
    "/api/mobile/home": {
      get: {
        tags: ["Mobile App"],
        summary: "Get Mobile Home Feed",
        description: "Unified aggregator endpoint for the Flutter mobile home screen. Returns hero slides, active banners, featured events, latest jobs, council leaders, network statistics, and optional personalized user pass summary.",
        security: [{ BearerAuth: [] }, { CookieAuth: [] }],
        responses: {
          200: {
            description: "Mobile home screen feed object containing slides, banners, events, jobs, leaders, stats, and member info",
          },
        },
      },
    },
    "/api/mobile/config": {
      get: {
        tags: ["Mobile App"],
        summary: "Get Mobile App Configuration",
        description: "Returns client bootstrap configuration including app version, maintenance mode, feature flags, and institutional support contact.",
        responses: {
          200: {
            description: "Mobile runtime configuration object",
          },
        },
      },
    },
  },
};
