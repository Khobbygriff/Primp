# Primp — Beauty & Grooming Marketplace

A two-sided Android mobile marketplace connecting beauty and grooming professionals with clients across Ghana. Built as a microservices architecture for the Mobile Application Development module.

---

## Team

| Name | Role |
|---|---|
| Member1 | Full-Stack |
| Member2 | Full-Stack |
| Member3 | Full-Stack |
| Member4 | Full-Stack |
| Member5 | Full-Stack |

---

## Architecture

```
Mobile App (React Native + Expo SDK 54)
                ↓
        API Gateway (port 8080)
        JWT verification + routing + internal-secret trust
    ↙         ↓          ↓          ↘
User      Booking    Review    Notification
Service   Service    Service    Service
(8081)    (8082)     (8083)     (8084)
  ↓          ↓          ↓          ↓
users_db  bookings_db reviews_db notifications_db
```

Every downstream service rejects any request that doesn't carry a shared `X-Internal-Secret` header, so services are only reachable through the gateway (or via explicit service-to-service calls that attach the header themselves, e.g. Booking Service → Notification Service, Booking Service → User Service).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native (Expo SDK 54, managed workflow) — TypeScript |
| State Management | Zustand (persisted auth store via AsyncStorage) |
| Navigation | React Navigation v7 (native-stack + bottom-tabs) |
| HTTP Client | Axios |
| Maps & Location | react-native-maps, expo-location (work-location pins, service radius, haversine distance) |
| Payments (client) | react-native-webview loading Paystack Inline JS checkout |
| i18n | i18next / react-i18next — English and Twi, persisted via AsyncStorage |
| Push Notifications | expo-notifications + Expo push service (routes Android delivery through FCM) |
| Backend | Spring Boot 3.5.14 — Java 21 — Maven |
| Gateway | Spring Boot (manual routing via `RestTemplate` + centralized JWT verification) |
| Payments (server) | Paystack Transactions API (`initialize` → `verify`), real charges — not simulated |
| PDF Generation | Apache PDFBox (service receipts) |
| Image/Media Storage | Cloudinary (portfolio photos & videos) |
| Database | PostgreSQL 16 (4 isolated databases, one per downstream service) |
| Auth | JWT (issued by User Service) + Spring Security, verified centrally at the gateway |
| Version Control | Git + GitHub |
| API Testing | Postman |

---

## Features

### Client Features
- Register and login as a client
- Browse professionals with search, specialty filter, and map view (distance + service-radius aware)
- View professional profiles with bio, specialty, portfolio, and reviews
- Select service type based on professional specialty
- Book appointments with date/time picker and an agreed service price
- Pay securely via Paystack (card, Mobile Money, or bank) — a booking is only created after the server verifies the charge
- Booking confirmation screen showing the Primp fee breakdown before paying
- Cancel pending booking requests
- Track booking status in real time, including a full status-history timeline
- Confirm service completion (moves a booking from `COMPLETED` to `CLOSED`)
- Download/share a branded PDF service receipt once a booking is closed
- Leave mutual reviews after service completion
- View own profile with rating summary
- Receive in-app and push notifications for booking updates
- Unread notification badge on home/alerts screens
- Switch app language between English and Twi
- Pull to refresh on all data screens

### Professional Features
- Register and login as a professional
- Set specialty, bio, location, precise work-location pin, and service radius
- Toggle availability (hidden/visible to clients)
- View public profile as clients see it
- Upload portfolio photos or videos with style tags and captions (Cloudinary-backed)
- Receive new booking request notifications
- Confirm or decline booking requests
- Mark bookings as In Progress and Completed
- Purchase premium features via Paystack:
  - **Priority Listing** — top placement in search results (weekly/monthly)
  - **Extended Portfolio** — up to 50 photos instead of 8 (one-time)
  - **Verified Skills Badge** — one-time verification unlock
  - **Client Loyalty Tools** — rebooking reminders + personalized offers (monthly)
  - **Earnings Analytics** — revenue dashboard by month/service type (monthly)
- View an Earnings Analytics dashboard (total revenue, net earnings, Primp fees collected, average booking value, trends)
- View automatically-tracked client loyalty stamps and send reminders/offers (rate-limited)
- Review clients after a booking is closed
- Receive unread notification badges
- Pull to refresh on all data screens

### System Features
- JWT authentication enforced and verified centrally at the API Gateway
- Gateway-only access enforced downstream via a shared internal service secret
- Real Paystack payment integration for both bookings and premium features, verified server-side before anything is persisted; idempotent via unique payment references
- Automatic notifications on all booking lifecycle events
- Booking status history / audit trail per booking
- Branded PDF receipt generation (Apache PDFBox) for closed bookings
- Mutual rating system for both clients and professionals with rolling average recalculation
- Client Loyalty stamp accrual on every closed booking, independent of whether the professional has unlocked the tools to act on it
- Map-based discovery with haversine distance calculation and per-professional service radius
- English/Twi i18n with persisted language preference
- Keyboard-avoiding view on all form screens
- Focus-based data refresh on all data screens
- Logout confirmation dialog

---

## Screens

Auth: Login, Register
Client-facing: Home, Discovery, Map, Portfolio Feed, Booking, Booking Confirmation (payment), Booking List, Review, View Profile, Notifications, Edit Profile, Work Location
Professional-only additions: Add Portfolio, Earnings Analytics, Client Loyalty

---

## Prerequisites

- Java 21
- Node.js LTS
- PostgreSQL 16
- Maven 3.9+ (or use the bundled `mvnw` wrapper)
- Expo Go (Android) — SDK 54
- A Paystack account (test keys are fine for local development)
- A Cloudinary account (for portfolio media uploads)

---

## Database Setup

Create these four databases in PostgreSQL before running any service:

```sql
CREATE DATABASE primp_users_db;
CREATE DATABASE primp_bookings_db;
CREATE DATABASE primp_reviews_db;
CREATE DATABASE primp_notifications_db;
```

Each service uses `spring.jpa.hibernate.ddl-auto=update`, so tables (including `premium_purchases`, `booking_status_history`, `loyalty_stamps`, and `device_tokens`) are created automatically on first run.

---

## Environment Variables

Each service directory has its own `.env.example` (gateway, user, booking, review, notification), plus one at the repo root. Copy each to `.env` in its respective service folder and fill in real values before running. At minimum you'll need:

- `DB_USERNAME` / `DB_PASSWORD` — PostgreSQL credentials
- `JWT_SECRET` — must be identical across every service and the gateway
- `INTERNAL_SERVICE_SECRET` — must be identical across every service and the gateway (min 32 chars); enforces gateway-only access to each downstream service
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` — used by User Service
- `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` — used by User Service (premium features) and Booking Service (booking payments)

The mobile app has its own `.env` (see `primp-mobile/primp/.env.example`):

```bash
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:8080
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=primp_portfolio
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Never commit real secrets.** Production deployments must generate their own random `JWT_SECRET` and `INTERNAL_SERVICE_SECRET` — the fallback values baked into each `application.properties` are dev-only.

---

## Running the Backend

Start services in this order — Gateway last:

```bash
# 1. User Service (port 8081)
cd primp-backend/user-service
mvn spring-boot:run

# 2. Booking Service (port 8082)
cd primp-backend/booking-service
mvn spring-boot:run

# 3. Review Service (port 8083)
cd primp-backend/review-service
mvn spring-boot:run

# 4. Notification Service (port 8084)
cd primp-backend/notification-service
mvn spring-boot:run

# 5. API Gateway (port 8080)
cd primp-backend/gateway
mvn spring-boot:run
```

---

## Running the Mobile App

```bash
cd primp-mobile/primp
npx expo start
```

Scan the QR code with Expo Go on your Android device.

**Important:** Set `EXPO_PUBLIC_API_URL` in `primp-mobile/primp/.env` to your machine's local IP address before running:
```
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:8080
```

Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux) to find your IP. Look for the WiFi adapter IPv4 address.

Both your phone and laptop must be on the same network. For push notifications, test on a physical device — Expo Go on an emulator won't register a push token.

---

## API Endpoints

All requests go through the gateway on port 8080. Protected endpoints require an `Authorization: Bearer <token>` header.

### Auth & Profile (User Service)
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Register a new user |
| POST | /api/auth/login | Login and get JWT token |
| GET | /api/auth/professionals | Get all available professionals (Priority Listing sorted first) |
| GET | /api/auth/profile/{userId} | Get user profile |
| PUT | /api/auth/profile/{userId} | Update user profile (bio, location, work location pin, radius, availability, etc.) |
| POST | /api/auth/portfolio | Create a portfolio post |
| GET | /api/auth/portfolio/feed | Get the full portfolio feed |
| GET | /api/auth/portfolio/{professionalId} | Get one professional's portfolio |
| DELETE | /api/auth/portfolio/{postId} | Delete a portfolio post |
| POST | /api/auth/premium/initialize | Start a Paystack charge for a premium feature |
| POST | /api/auth/premium/verify | Verify payment and unlock the premium feature |

### Bookings & Payments (Booking Service)
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/bookings | Create a booking directly (internal use / already-paid flow) |
| POST | /api/bookings/payments/initialize | Start a Paystack charge for a new booking |
| POST | /api/bookings/payments/verify | Verify payment and create the booking |
| GET | /api/bookings/client/{clientId} | Get a client's bookings |
| GET | /api/bookings/professional/{professionalId} | Get a professional's bookings |
| GET | /api/bookings/professional/{professionalId}/fees-summary | Total Primp fees collected from closed bookings |
| GET | /api/bookings/professional/{professionalId}/analytics | Earnings Analytics dashboard (premium-gated) |
| PUT | /api/bookings/{id}/status?status= | Update booking status (confirm/decline/in-progress/complete/cancel) |
| PUT | /api/bookings/{id}/close | Client confirms completion — moves `COMPLETED` → `CLOSED` |
| GET | /api/bookings/{id}/history | Full status-change timeline for a booking |
| GET | /api/bookings/{id}/receipt | Download the PDF service receipt (closed bookings only) |
| GET | /api/bookings/{id} | Get a single booking |
| GET | /api/bookings/professional/{professionalId}/loyalty | Client loyalty stamp board (premium-gated actions) |
| POST | /api/bookings/professional/{professionalId}/loyalty/client/{clientId}/remind | Send a rebooking reminder |
| POST | /api/bookings/professional/{professionalId}/loyalty/client/{clientId}/offer | Send a personalized offer |

### Reviews (Review Service)
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/reviews | Submit a review |
| GET | /api/reviews/user/{id} | Get reviews received by a user |
| GET | /api/reviews/by/{id} | Get reviews written by a user |
| GET | /api/reviews/summary/{id} | Get rolling average rating summary |

### Notifications (Notification Service)
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/notifications/device-token | Register an Expo push token for the current user |
| GET | /api/notifications/user/{id} | Get all notifications |
| GET | /api/notifications/user/{id}/unread | Get unread notifications |
| GET | /api/notifications/user/{id}/count | Get unread count |
| PUT | /api/notifications/{id}/read | Mark one as read |
| PUT | /api/notifications/user/{id}/read-all | Mark all as read |

`POST /api/notifications/internal` exists but is intentionally not reachable through the gateway (it 404s there); it's used only for direct service-to-service notification creation (e.g. from Booking Service), authenticated via the internal service secret.

---

## Booking Status Lifecycle

```
REQUESTED → CONFIRMED → IN_PROGRESS → COMPLETED → CLOSED
                ↓
           CANCELLED
```

- **REQUESTED** — client pays via Paystack and submits the booking; professional notified
- **CONFIRMED** — professional accepts, client notified
- **IN_PROGRESS** — professional marks service started, client notified
- **COMPLETED** — professional marks done, client notified and prompted to confirm + review
- **CLOSED** — client confirms completion; this is when the Primp transaction fee is considered realized, a client-loyalty stamp is recorded, and a PDF receipt becomes available
- **CANCELLED** — a client may cancel their own still-`REQUESTED` booking; a professional may decline a `REQUESTED` booking

Every transition is recorded in `booking_status_history` with a timestamp and the user who made the change.

---

## Premium Features & Billing

| Feature | Billing | Notes |
|---|---|---|
| Priority Listing | Weekly (GH₵15) or Monthly (GH₵50) | Subscription; expires and must be manually renewed |
| Extended Portfolio | One-time (GH₵30) | Raises the 8-photo limit to 50 |
| Verified Skills Badge | One-time (GH₵40) | Permanent once purchased |
| Client Loyalty Tools | Monthly (GH₵25) | Gates rebooking reminders/offers; stamps still accrue for free |
| Earnings Analytics | Monthly (GH₵20) | Gates the income dashboard |

Every unlock is confirmed via a verified Paystack transaction (`initialize` → `verify`) before the corresponding flag is flipped on the user's record. Subscription features lazily lapse on read once their expiry passes.

---

## Notification Types

| Type | Trigger | Recipient |
|---|---|---|
| BOOKING_REQUEST | Client creates/pays for a booking, or a loyalty reminder/offer is sent | Professional / Client |
| BOOKING_CONFIRMED | Professional confirms, or marks in progress | Client |
| BOOKING_COMPLETED | Professional marks complete | Client |
| BOOKING_CANCELLED | Booking cancelled or declined | Client / Professional |
| NEW_REVIEW | Review submitted, or a loyalty reward milestone is reached | Reviewee / Client |

In-app notifications are the source of truth; push delivery (via Expo's push service, which forwards Android delivery through Firebase Cloud Messaging) is best-effort and never blocks the underlying booking/review operation.

---

## Demo Credentials

| Name | Email | Password | Role |
|---|---|---|---|
| Ama Owusu | ama@gmail.com | primp1234 | CLIENT |
| Akosua Mensah | akosua@gmail.com | primp1234 | PROFESSIONAL |

---

## Project Structure

```
primp/
├── primp-backend/
│   ├── gateway/                API Gateway — JWT auth, internal-secret trust, and routing
│   ├── user-service/           User Service — auth, profiles, portfolio, Cloudinary, premium payments  
│   ├── booking-service/        Booking Service — bookings, payments, lifecycle, receipts, analytics, loyalty
│   ├── review-service/         Review Service — ratings and reviews
│   └── notification-service/   Notification Service — in-app + Expo push alerts
├── primp-mobile/               React Native Frontend (Expo SDK 54)
│   └── primp/
│       └── src/
│           ├── screens/        All app screens
│           ├── services/       API service layers
│           ├── store/          Zustand state management
│           ├── navigation/     React Navigation setup
│           ├── i18n/           English/Twi translations
│           └── components/     Shared components (e.g. Paystack checkout WebView)
└── Primp_Proposal_Final.docx   Original project proposal
```
