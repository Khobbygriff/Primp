import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '@/shared/components/PageHeader';
import { LoadingState, ErrorBanner, EmptyState } from '@/shared/components/StateViews';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { useUserQuery } from '@/domains/user-moderation/hooks/useUserQuery';
import { SuspendUserDialog } from '@/domains/user-moderation/components/SuspendUserDialog';
import { useReinstateUserMutation } from '@/domains/user-moderation/hooks/useSuspendUserMutation';
import { normalizeApiError } from '@/shared/api/apiError';
import styles from './UserDetailPage.module.css';

// Cross-domain composition happens here, at the page level, per the
// architecture rule: user-moderation and payment-reconciliation never
// import each other's internals directly. This page pulls the booking
// query hook in to show "this user's transactions" without either
// domain depending on the other.
import { useBookingTransactionsQuery } from '@/domains/payment-reconciliation/hooks/useBookingTransactionsQuery';
import { BookingTransactionTable } from '@/domains/payment-reconciliation/components/BookingTransactionTable';

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const parsedId = userId ? Number(userId) : null;
  const [dialogOpen, setDialogOpen] = useState<'suspend' | null>(null);

  const userQuery = useUserQuery(parsedId);
  const reinstateMutation = useReinstateUserMutation();

  // This will 404 until GET /api/admin/bookings exists (see
  // bookingPaymentsApi.ts) — the table below renders its own empty/error
  // state in the meantime via BackendPendingNotice below it.
  const transactionsQuery = useBookingTransactionsQuery({
    page: 1,
    pageSize: 10,
    userId: parsedId ?? undefined,
  });

  if (!parsedId) {
    return <ErrorBanner message="Invalid user ID in the URL." />;
  }

  return (
    <div>
      <Link to="/users" className={styles.backLink}>
        ← Back to Users
      </Link>

      <PageHeader title="User detail" subtitle={`Internal ID ${parsedId}`} />

      {userQuery.isLoading && <LoadingState label="Loading profile…" />}
      {userQuery.isError && <ErrorBanner message={normalizeApiError(userQuery.error).message} />}

      {userQuery.data && (
        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.avatarRow}>
              {userQuery.data.profilePhotoUrl ? (
                <img className={styles.avatar} src={userQuery.data.profilePhotoUrl} alt="" />
              ) : (
                <div className={styles.avatarFallback} aria-hidden="true">
                  {initials(userQuery.data.name)}
                </div>
              )}
              <div>
                <div className={styles.name}>{userQuery.data.name}</div>
                <div className={styles.meta}>
                  <StatusBadge tone="neutral">{userQuery.data.role}</StatusBadge>
                </div>
              </div>
            </div>

            <div className={styles.fieldList}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Location</span>
                <span className={styles.fieldValue}>{userQuery.data.location || '—'}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Phone</span>
                <span className={styles.fieldValue}>{userQuery.data.phone || '—'}</span>
              </div>
              {userQuery.data.role === 'PROFESSIONAL' && (
                <>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Specialty</span>
                    <span className={styles.fieldValue}>{userQuery.data.specialty || '—'}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Availability</span>
                    <span className={styles.fieldValue}>
                      {userQuery.data.isAvailable === false ? (
                        <StatusBadge tone="warning">Hidden from clients</StatusBadge>
                      ) : (
                        <StatusBadge tone="success">Visible</StatusBadge>
                      )}
                    </span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Premium features</span>
                    <span className={styles.fieldValue} style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {userQuery.data.isPriorityListingActive && <StatusBadge tone="info">Priority Listing</StatusBadge>}
                      {userQuery.data.hasExtendedPortfolio && <StatusBadge tone="info">Extended Portfolio</StatusBadge>}
                      {userQuery.data.isVerifiedBadge && <StatusBadge tone="info">Verified Badge</StatusBadge>}
                      {userQuery.data.hasClientLoyaltyTools && <StatusBadge tone="info">Loyalty Tools</StatusBadge>}
                      {userQuery.data.hasEarningsAnalytics && <StatusBadge tone="info">Earnings Analytics</StatusBadge>}
                      {!userQuery.data.isPriorityListingActive &&
                        !userQuery.data.hasExtendedPortfolio &&
                        !userQuery.data.isVerifiedBadge &&
                        !userQuery.data.hasClientLoyaltyTools &&
                        !userQuery.data.hasEarningsAnalytics && <span>None active</span>}
                    </span>
                  </div>
                </>
              )}
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Bio</span>
                <span className={styles.fieldValue}>{userQuery.data.bio || '—'}</span>
              </div>
            </div>

            <div className={styles.actionRow}>
              <button type="button" className={styles.buttonDanger} onClick={() => setDialogOpen('suspend')}>
                Suspend account
              </button>
              <button
                type="button"
                className={styles.buttonSuccess}
                onClick={() => parsedId && reinstateMutation.mutate(parsedId)}
                disabled={reinstateMutation.isPending}
              >
                Reinstate
              </button>
            </div>
            {reinstateMutation.isError && (
              <p style={{ color: 'var(--color-danger)', fontSize: 12, marginTop: 8 }}>
                {normalizeApiError(reinstateMutation.error).message}
              </p>
            )}
          </div>

          <div>
            <h2 className={styles.sectionTitle}>Recent transactions (as client or professional)</h2>

            {transactionsQuery.isLoading && <LoadingState label="Loading transactions…" />}
            {transactionsQuery.isError && (
              <ErrorBanner message={normalizeApiError(transactionsQuery.error).message} />
            )}
            {transactionsQuery.data && transactionsQuery.data.items.length === 0 && (
              <EmptyState title="No transactions found for this user." />
            )}
            {transactionsQuery.data && transactionsQuery.data.items.length > 0 && (
              <BookingTransactionTable bookings={transactionsQuery.data.items} />
            )}
          </div>
        </div>
      )}

      {dialogOpen === 'suspend' && userQuery.data && (
        <SuspendUserDialog
          userId={parsedId}
          userName={userQuery.data.name}
          onClose={() => setDialogOpen(null)}
        />
      )}
    </div>
  );
}
