import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  listPremiumPurchases,
  type ListPremiumPurchasesParams,
} from '@/domains/payment-reconciliation/api/premiumPurchasesApi';

export function usePremiumTransactionsQuery(params: ListPremiumPurchasesParams) {
  return useQuery({
    queryKey: ['admin', 'premium-transactions', params],
    queryFn: () => listPremiumPurchases(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
