import { z } from 'zod';

/**
 * These schemas mirror the Java DTOs in the backend repo. There is no
 * OpenAPI/Swagger spec generated anywhere in the backend, so this file is
 * the single source of truth for "what shape does each endpoint return,"
 * validated at runtime rather than assumed. When a DTO changes on the
 * backend (e.g. a field renamed on UserResponse.java), a call in this app
 * should fail loudly here instead of quietly rendering `undefined` in a
 * table cell.
 *
 * Each schema below is annotated with the backend source file it mirrors.
 */

// ─────────────────────────────────────────────────────────────────────────
// Auth (mirrors user-service AuthResponse.java / LoginRequest.java)
// ─────────────────────────────────────────────────────────────────────────

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const authResponseSchema = z.object({
  id: z.number(),
  token: z.string(),
  role: z.string(),
  name: z.string(),
  profilePhotoUrl: z.string().nullable().optional(),
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

// ─────────────────────────────────────────────────────────────────────────
// User (mirrors user-service UserResponse.java)
// ─────────────────────────────────────────────────────────────────────────

export const userRoleSchema = z.enum(['PROFESSIONAL', 'CLIENT', 'ADMIN']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const userResponseSchema = z.object({
  id: z.number(),
  profilePhotoUrl: z.string().nullable().optional(),
  name: z.string(),
  location: z.string().nullable().optional(),
  role: z.string(),
  phone: z.string().nullable().optional(),
  specialty: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  isAvailable: z.boolean().nullable().optional(),
  isPriorityListingActive: z.boolean().nullable().optional(),
  hasExtendedPortfolio: z.boolean().nullable().optional(),
  isVerifiedBadge: z.boolean().nullable().optional(),
  hasClientLoyaltyTools: z.boolean().nullable().optional(),
  hasEarningsAnalytics: z.boolean().nullable().optional(),
  priorityListingExpiresAt: z.string().nullable().optional(),
  clientLoyaltyToolsExpiresAt: z.string().nullable().optional(),
  earningsAnalyticsExpiresAt: z.string().nullable().optional(),
  workLatitude: z.number().nullable().optional(),
  workLongitude: z.number().nullable().optional(),
  serviceRadiusKm: z.number().nullable().optional(),
});
export type UserResponse = z.infer<typeof userResponseSchema>;

/**
 * NOT YET SUPPORTED BY THE BACKEND. UserResponse.java has no `isSuspended`
 * / `suspendedAt` / `suspendedReason` fields today — this schema documents
 * the shape the admin portal needs once that column + endpoint exist
 * (see the endpoint-gap analysis). Kept optional/nullable everywhere so
 * this app degrades gracefully (shows "Unknown") rather than crashing if
 * the backend adds it with a different shape than guessed here.
 */
export const adminUserResponseSchema = userResponseSchema.extend({
  email: z.string().nullable().optional(),
  isSuspended: z.boolean().nullable().optional(),
  suspendedAt: z.string().nullable().optional(),
  suspendedReason: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
});
export type AdminUserResponse = z.infer<typeof adminUserResponseSchema>;

// ─────────────────────────────────────────────────────────────────────────
// Rating summary (mirrors review-service RatingSummary.java)
// ─────────────────────────────────────────────────────────────────────────

export const ratingSummarySchema = z.object({
  userId: z.number(),
  averageRating: z.number(),
  totalReviews: z.number(),
});
export type RatingSummary = z.infer<typeof ratingSummarySchema>;

// ─────────────────────────────────────────────────────────────────────────
// Booking (mirrors booking-service BookingResponse.java / Booking.java)
// ─────────────────────────────────────────────────────────────────────────

export const bookingStatusSchema = z.enum([
  'REQUESTED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'CLOSED',
]);
export type BookingStatus = z.infer<typeof bookingStatusSchema>;

export const bookingResponseSchema = z.object({
  id: z.number(),
  clientId: z.number(),
  professionalId: z.number(),
  serviceType: z.string(),
  preferredDate: z.string(),
  location: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  agreedPrice: z.number().nullable().optional(),
  primpFeeRate: z.number().nullable().optional(),
  primpFee: z.number().nullable().optional(),
  totalAmount: z.number().nullable().optional(),
  paymentReference: z.string().nullable().optional(),
  status: bookingStatusSchema,
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});
export type BookingResponse = z.infer<typeof bookingResponseSchema>;

export const bookingStatusHistorySchema = z.object({
  id: z.number(),
  bookingId: z.number(),
  status: bookingStatusSchema,
  changedAt: z.string(),
  changedBy: z.number().nullable().optional(),
});
export type BookingStatusHistory = z.infer<typeof bookingStatusHistorySchema>;

// ─────────────────────────────────────────────────────────────────────────
// Premium purchases (mirrors user-service PremiumPurchase.java model —
// NOTE: this entity has NO controller exposure today. See endpoint gaps.)
// ─────────────────────────────────────────────────────────────────────────

export const premiumFeatureSchema = z.enum([
  'PRIORITY_LISTING',
  'EXTENDED_PORTFOLIO',
  'VERIFIED_BADGE',
  'CLIENT_LOYALTY_TOOLS',
  'EARNINGS_ANALYTICS',
]);
export type PremiumFeature = z.infer<typeof premiumFeatureSchema>;

/**
 * NOT YET EXPOSED. PremiumPurchase.java has no `amount` column, so even
 * once a controller exists, reconciling against Paystack's own dashboard
 * requires either (a) adding that column, or (b) this app re-deriving the
 * expected price client-side from PremiumPaymentService's hardcoded
 * FEATURE_PRICING table (fragile — duplicates business logic in two
 * places). Documented here as `amount: nullable` so the UI can flag rows
 * where the backend hasn't backfilled it.
 */
export const premiumPurchaseSchema = z.object({
  id: z.number(),
  userId: z.number(),
  feature: premiumFeatureSchema,
  duration: z.string(),
  paymentReference: z.string(),
  amount: z.number().nullable().optional(),
  purchasedAt: z.string(),
});
export type PremiumPurchase = z.infer<typeof premiumPurchaseSchema>;

// ─────────────────────────────────────────────────────────────────────────
// Paystack reconciliation (client-side derived — the backend persists
// none of this today; see endpoint gap analysis re: webhook + status enum)
// ─────────────────────────────────────────────────────────────────────────

/** Best-effort status label this app assigns until the backend persists a real enum. */
export const derivedPaymentStatusSchema = z.enum([
  'VERIFIED', // has a paymentReference and a downstream record exists
  'UNVERIFIED', // no paymentReference on the record at all
  'RECONCILING', // admin triggered a live check against Paystack, pending
  'MISMATCH', // live Paystack status disagrees with local record
]);
export type DerivedPaymentStatus = z.infer<typeof derivedPaymentStatusSchema>;

export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.number(),
    pageSize: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
  });
}
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export const adminUserStatsSchema = z.object({
  totalUsers: z.number(),
  totalClients: z.number(),
  totalProfessionals: z.number(),
  totalAdmins: z.number(),
  suspendedUsers: z.number(),
  newUsersLast30Days: z.number(),
  premiumPurchasesLast30Days: z.number(),
  premiumRevenueLast30Days: z.number(),
  generatedAt: z.string(),
});
export type AdminUserStats = z.infer<typeof adminUserStatsSchema>;

export const adminBookingStatsSchema = z.object({
  totalBookings: z.number(),
  requestedCount: z.number(),
  confirmedCount: z.number(),
  inProgressCount: z.number(),
  completedCount: z.number(),
  closedCount: z.number(),
  cancelledCount: z.number(),
  unreconciledBookings: z.number(),
  newBookingsLast30Days: z.number(),
  totalPrimpFeesCollectedAllTime: z.number(),
  generatedAt: z.string(),
});
export type AdminBookingStats = z.infer<typeof adminBookingStatsSchema>;
