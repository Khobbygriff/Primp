import { httpClient } from '@/shared/api/httpClient';
import {
  adminBookingStatsSchema,
  bookingResponseSchema,
  bookingStatusHistorySchema,
  bookingStatusSchema,
  paginatedSchema,
  type AdminBookingStats,
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
  paymentReference: string | null;
  paystackStatus: string;
  paystackAmount: number | null;
  matchesLocalRecord: boolean;
  checkedAt: string;
}

export async function reconcileBookingPayment(bookingId: number): Promise<ReconciliationResult> {
  const { data } = await httpClient.post(`/api/admin/bookings/${bookingId}/reconcile-payment`);
  return data as ReconciliationResult;
}

export const bookingStatusOptions: { value: BookingStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  ...bookingStatusSchema.options.map((status) => ({ value: status, label: status })),
];

export async function getBookingStats(): Promise<AdminBookingStats> {
  const { data } = await httpClient.get('/api/admin/bookings/stats');
  return adminBookingStatsSchema.parse(data);
}
