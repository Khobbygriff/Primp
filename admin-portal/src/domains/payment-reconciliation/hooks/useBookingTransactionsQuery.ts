import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  listBookingPayments,
  type ListBookingPaymentsParams,
} from '@/domains/payment-reconciliation/api/bookingPaymentsApi';

export function useBookingTransactionsQuery(params: ListBookingPaymentsParams) {
  return useQuery({
    queryKey: ['admin', 'booking-transactions', params],
    queryFn: () => listBookingPayments(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
