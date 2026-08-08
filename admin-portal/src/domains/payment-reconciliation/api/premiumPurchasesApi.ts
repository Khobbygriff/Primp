import { httpClient } from '@/shared/api/httpClient';
import {
  paginatedSchema,
  premiumPurchaseSchema,
  type Paginated,
  type PremiumFeature,
  type PremiumPurchase,
} from '@/shared/types/api-contracts';

export interface ListPremiumPurchasesParams {
  page: number;
  pageSize: number;
  search?: string; // paymentReference
  feature?: PremiumFeature | 'ALL';
}

/**
 * BACKEND DEPENDENCY: PremiumPurchase.java (the JPA entity) is written
 * and actively populated by PremiumPaymentService#verify, but
 * PremiumPurchaseRepository has ZERO controller wired to it anywhere in
 * user-service — every premium unlock is currently invisible outside the
 * database. This is the single highest-value backend addition for
 * reconciliation, since it's pure read exposure of data that already
 * exists (unlike the booking gaps above, no new persistence is needed —
 * only a controller + optionally the `amount` column noted in
 * api-contracts.ts).
 */
export async function listPremiumPurchases(
  params: ListPremiumPurchasesParams,
): Promise<Paginated<PremiumPurchase>> {
  const { data } = await httpClient.get('/api/admin/premium-purchases', {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search || undefined,
      feature: params.feature && params.feature !== 'ALL' ? params.feature : undefined,
    },
  });
  return paginatedSchema(premiumPurchaseSchema).parse(data);
}

export interface PremiumReconciliationResult {
  purchaseId: number;
  paymentReference: string;
  paystackStatus: string;
  paystackAmount: number | null;
  matchesLocalRecord: boolean;
  checkedAt: string;
}

/** BACKEND DEPENDENCY — same pattern as reconcileBookingPayment. */
export async function reconcilePremiumPurchase(purchaseId: number): Promise<PremiumReconciliationResult> {
  const { data } = await httpClient.post(`/api/admin/premium-purchases/${purchaseId}/reconcile`);
  return data as PremiumReconciliationResult;
}
