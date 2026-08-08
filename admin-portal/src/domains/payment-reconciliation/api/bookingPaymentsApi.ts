import { httpClient } from '@/shared/api/httpClient';
import {
  bookingResponseSchema,
  bookingStatusHistorySchema,
  bookingStatusSchema,
  paginatedSchema,
  type BookingResponse,
  type BookingStatus,
  type BookingStatusHistory,
  type Paginated,
} from '@/shared/types/api-contracts';
import { z } from 'zod';

export interface ListBookingPaymentsParams {
  page: number;
  pageSize: number;
  search?: string; // paymentReference or booking id
  status?: BookingStatus | 'ALL';
  hasPaymentReference?: 'ALL' | 'YES' | 'NO';
  /** Filter to bookings where this user is the client OR the professional — used when composing into UserDetailPage. */
  userId?: number;
}

/**
 * BACKEND DEPENDENCY: no global booking listing exists. BookingController
 * only exposes /api/bookings/client/{clientId} and
 * /api/bookings/professional/{professionalId} — both owner-scoped, and
 * both would require an admin to already know which user to look under.
 * Reconciliation needs the inverse direction: "find the booking for this
 * Paystack reference," independent of who the client/professional was.
 */
export async function listBookingPayments(
  params: ListBookingPaymentsParams,
): Promise<Paginated<BookingResponse>> {
  const { data } = await httpClient.get('/api/admin/bookings', {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search || undefined,
      status: params.status && params.status !== 'ALL' ? params.status : undefined,
      hasPaymentReference:
        params.hasPaymentReference && params.hasPaymentReference !== 'ALL'
          ? params.hasPaymentReference
          : undefined,
      userId: params.userId,
    },
  });
  return paginatedSchema(bookingResponseSchema).parse(data);
}

/**
 * Existing endpoint (BookingController#getBookingById) — BUT it currently
 * requires `authenticatedUserId` to be the booking's client or
 * professional (BookingService#getBookingById). An admin session will
 * get a 403 here until that check adds an admin bypass.
 */
export async function getBooking(bookingId: number): Promise<BookingResponse> {
  const { data } = await httpClient.get(`/api/bookings/${bookingId}`);
  return bookingResponseSchema.parse(data);
}

/** Same owner-only caveat as getBooking above. */
export async function getBookingHistory(bookingId: number): Promise<BookingStatusHistory[]> {
  const { data } = await httpClient.get(`/api/bookings/${bookingId}/history`);
  return z.array(bookingStatusHistorySchema).parse(data);
}

export interface ReconciliationResult {
  bookingId: number;
  localPaymentReference: string | null;
  paystackStatus: string;
  paystackAmount: number | null;
  matchesLocalRecord: boolean;
  checkedAt: string;
}

/**
 * BACKEND DEPENDENCY: no live-reconciliation endpoint exists. Today,
 * booking-service only calls Paystack's verify API once, at
 * PaymentService#verify — after that, whatever status was true at that
 * instant is trusted forever. This proposed endpoint would have the
 * backend re-call Paystack's GET /transaction/verify/{reference} (see
 * PaystackClient#verifyTransaction) on demand and diff it against the
 * stored Booking row, without re-running booking creation.
 */
export async function reconcileBookingPayment(bookingId: number): Promise<ReconciliationResult> {
  const { data } = await httpClient.post(`/api/admin/bookings/${bookingId}/reconcile-payment`);
  return data as ReconciliationResult;
}

export const bookingStatusOptions: { value: BookingStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  ...bookingStatusSchema.options.map((status) => ({ value: status, label: status })),
];
