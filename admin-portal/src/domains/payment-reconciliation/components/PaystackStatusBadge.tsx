import { StatusBadge, type BadgeTone } from '@/shared/components/StatusBadge';
import type { BookingStatus } from '@/shared/types/api-contracts';

/**
 * There is no persisted Paystack transaction-status enum anywhere in the
 * backend (see api-contracts.ts DerivedPaymentStatus comment) — the only
 * signal available client-side today is whether `paymentReference` is set
 * on the Booking/PremiumPurchase row. This badge makes that inference
 * visible rather than pretending the app knows more than it does.
 */
export function PaymentPresenceBadge({ paymentReference }: { paymentReference: string | null | undefined }) {
  if (paymentReference) {
    return <StatusBadge tone="success">Has reference</StatusBadge>;
  }
  return <StatusBadge tone="danger">No payment reference</StatusBadge>;
}

const bookingStatusTone: Record<BookingStatus, BadgeTone> = {
  REQUESTED: 'info',
  CONFIRMED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'warning',
  CLOSED: 'success',
  CANCELLED: 'neutral',
};

export function BookingStatusChip({ status }: { status: BookingStatus }) {
  return <StatusBadge tone={bookingStatusTone[status]}>{status.replace('_', ' ')}</StatusBadge>;
}

/** Rendered once a live Paystack reconciliation call has actually run — see useReconcileMutation. */
export function ReconciliationResultBadge({ matches }: { matches: boolean }) {
  return matches ? (
    <StatusBadge tone="success">Matches Paystack</StatusBadge>
  ) : (
    <StatusBadge tone="danger">Mismatch</StatusBadge>
  );
}
