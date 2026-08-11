import { Link } from 'react-router-dom';
import { PageHeader } from '@/shared/components/PageHeader';
import { LoadingState, ErrorBanner } from '@/shared/components/StateViews';
import { normalizeApiError } from '@/shared/api/apiError';
import { useUserStatsQuery } from '@/domains/user-moderation/hooks/useUserStatsQuery';
import { useBookingStatsQuery } from '@/domains/payment-reconciliation/hooks/useBookingStatsQuery';
import styles from './DashboardPage.module.css';

const formatGHS = (amount: number) => `GH₵ ${amount.toFixed(2)}`;

export function DashboardPage() {
  const userStats = useUserStatsQuery();
  const bookingStats = useBookingStatsQuery();

  const isLoading = userStats.isLoading || bookingStats.isLoading;
  const error = userStats.error ?? bookingStats.error;

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle="Primp platform — user moderation and payment reconciliation."
      />

      {isLoading && <LoadingState label="Loading platform stats…" />}
      {error && <ErrorBanner message={normalizeApiError(error).message} />}

      {userStats.data && bookingStats.data && (
        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Total users</div>
            <div className={styles.cardValue}>{userStats.data.totalUsers}</div>
            <div className={styles.cardHint}>
              {userStats.data.totalClients} clients · {userStats.data.totalProfessionals} professionals
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Suspended accounts</div>
            <div className={styles.cardValue}>{userStats.data.suspendedUsers}</div>
            <div className={styles.cardHint}>{userStats.data.newUsersLast30Days} new users (30d)</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Unreconciled bookings</div>
            <div className={styles.cardValue}>{bookingStats.data.unreconciledBookings}</div>
            <div className={styles.cardHint}>of {bookingStats.data.totalBookings} total</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Premium purchases (30d)</div>
            <div className={styles.cardValue}>{userStats.data.premiumPurchasesLast30Days}</div>
            <div className={styles.cardHint}>{formatGHS(userStats.data.premiumRevenueLast30Days)} revenue</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Total fees collected</div>
            <div className={styles.cardValue}>{formatGHS(bookingStats.data.totalPrimpFeesCollectedAllTime)}</div>
            <div className={styles.cardHint}>{bookingStats.data.closedCount} closed bookings</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>New bookings (30d)</div>
            <div className={styles.cardValue}>{bookingStats.data.newBookingsLast30Days}</div>
            <div className={styles.cardHint}>{bookingStats.data.requestedCount} currently pending</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Cancelled bookings</div>
            <div className={styles.cardValue}>{bookingStats.data.cancelledCount}</div>
            <div className={styles.cardHint}>of {bookingStats.data.totalBookings} total</div>
          </div>
        </div>
      )}

      <div className={styles.linksGrid}>
        <Link to="/users" className={styles.linkCard}>
          <div className={styles.linkTitle}>User moderation →</div>
          <div className={styles.linkDescription}>
            Search accounts, review profiles, suspend or reinstate users.
          </div>
        </Link>
        <Link to="/payments/bookings" className={styles.linkCard}>
          <div className={styles.linkTitle}>Booking payments →</div>
          <div className={styles.linkDescription}>
            Every Paystack-backed booking charge, with live reconciliation.
          </div>
        </Link>
        <Link to="/payments/premium" className={styles.linkCard}>
          <div className={styles.linkTitle}>Premium payments →</div>
          <div className={styles.linkDescription}>
            Priority Listing, Verified Badge, and other feature unlocks.
          </div>
        </Link>
      </div>
    </div>
  );
}