import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reconcileBookingPayment } from '@/domains/payment-reconciliation/api/bookingPaymentsApi';
import { reconcilePremiumPurchase } from '@/domains/payment-reconciliation/api/premiumPurchasesApi';

export function useReconcileBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: number) => reconcileBookingPayment(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'booking-transactions'] });
    },
  });
}

export function useReconcilePremiumMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (purchaseId: number) => reconcilePremiumPurchase(purchaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'premium-transactions'] });
    },
  });
}
