# Primp Admin Portal

Standalone web admin console for the Primp marketplace — **User Moderation**
and **Payment Reconciliation** only. This does not replace or modify the
mobile app; it's a separate frontend against the same API Gateway.

## Stack

- React 18 + TypeScript + Vite
- React Router v6 (client-side routing, session-gated)
- TanStack Query (server state, caching, mutations)
- TanStack Table (sortable data grids)
- Zod (runtime validation of every API response against the DTOs it mirrors)
- Plain CSS (CSS Modules) — no UI kit, to keep the bundle honest about what's actually built

## Getting started

```bash
npm install
cp .env.example .env
# edit .env: point VITE_API_GATEWAY_URL at your running gateway (default http://localhost:8080)
npm run dev
```

## ⚠️ Backend dependency status

This portal is **fully coded** against the API contract it needs, but a
meaningful slice of that contract does not exist in the backend yet. Every
screen that depends on a missing endpoint renders a visible
`BackendPendingNotice` banner in the running app (not just a code comment),
so it's obvious at a glance what's real. Full list, cross-referenced to the
backend source that would need to change:

| Endpoint | Purpose | Backend touchpoint |
|---|---|---|
| `GET /api/admin/users` | Paginated user list (all roles, incl. hidden/suspended) | New controller. `UserController`/`AuthController` has no global list; `getProfessionals()` filters to available professionals only. |
| `POST /api/admin/users/{id}/suspend` | Suspend an account | New `isSuspended`/`suspendedAt`/`suspendedReason` columns on `User.java` + endpoint |
| `POST /api/admin/users/{id}/reinstate` | Reinstate a suspended account | Same as above |
| `GET /api/reviews/summary/{userId}` (admin access) | View any user's rating summary | `ReviewController` currently requires `authenticatedUserId == userId` — needs an admin bypass, not a new route |
| `GET /api/admin/bookings` | Global booking/payment search across all users | New controller. `BookingController` only exposes client-scoped / professional-scoped lists. |
| `GET /api/bookings/{id}` / `/history` (admin access) | View any booking's detail/timeline | Same owner-only-check issue as reviews above |
| `POST /api/admin/bookings/{id}/reconcile-payment` | Re-verify a charge against Paystack live | New endpoint calling `PaystackClient#verifyTransaction` on demand, diffed against the stored `Booking` row |
| `GET /api/admin/premium-purchases` | List all premium feature purchases | New controller — `PremiumPurchaseRepository` exists and is populated but has **zero** controller exposure today |
| `POST /api/admin/premium-purchases/{id}/reconcile` | Re-verify a premium charge | Same pattern as booking reconciliation |
| `PremiumPurchase.amount` | Show what was actually paid per premium purchase | New column — the entity currently stores `feature`/`duration`/`paymentReference` but never the price paid |
| Role-based authorization (`X-User-Role == ADMIN`) | Gate every endpoint above | Currently **nothing** in the gateway or any downstream service checks role at all — every check today is "does the caller own this resource." This needs to land before any of the above is safe to expose, even once built. |

Until these land, this app authenticates real admins against the existing
`POST /api/auth/login` and gates routes on the JWT's `role` claim client-side
— that is a UX convenience, not a security boundary (see the comment in
`src/shared/auth/decodeJwt.ts`).

## Folder structure

```
src/
├── app/                    App shell: providers, router, sidebar layout
├── shared/                 Cross-domain: http client, auth, design system, api-contracts.ts
├── domains/
│   ├── user-moderation/        Isolated — owns all user list/detail/suspend logic
│   ├── payment-reconciliation/ Isolated — owns Paystack transaction logs (bookings + premium)
│   └── platform-overview/      Dashboard — composes both domains at the page level only
└── pages/                  Top-level pages outside any domain (login)
```

`user-moderation` and `payment-reconciliation` never import each other's
internals. Where a screen needs both (e.g. a user's transaction history on
`UserDetailPage`), that composition happens in the page component, which is
allowed to import from either domain — see the comment in
`src/domains/user-moderation/pages/UserDetailPage.tsx`.
