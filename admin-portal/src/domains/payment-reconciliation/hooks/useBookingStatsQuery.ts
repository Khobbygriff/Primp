import { useQuery } from '@tanstack/react-query';
import { getBookingStats } from '@/domains/payment-reconciliation/api/bookingPaymentsApi';

export function useBookingStatsQuery() {
  return useQuery({
    queryKey: ['admin', 'booking-stats'],
    queryFn: getBookingStats,
    staleTime: 60_000,
  });
}