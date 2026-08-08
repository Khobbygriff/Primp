import { Link } from 'react-router-dom';
import { PageHeader } from '@/shared/components/PageHeader';
import { BackendPendingNotice } from '@/shared/components/BackendPendingNotice';
import styles from './DashboardPage.module.css';

/**
 * Deliberately not wired to live aggregate numbers yet. The only
 * platform-wide fee endpoint that exists today,
 * GET /api/bookings/professional/{id}/fees-summary, is per-professional —
 * there is no global "total fees collected across the platform" endpoint,
 * so a real dashboard card here would either require N+1 calls against
 * every professional (fine for a demo, wrong for production) or a new
 * aggregate endpoint. Shipping fake numbers on a finance-adjacent screen
 * is worse than shipping an honest placeholder.
 */
export function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle="Primp platform — user moderation and payment reconciliation."
      />

      <BackendPendingNotice
        endpoints={[
          'GET /api/admin/stats (platform-wide totals — proposed, not built)',
          'A global fees-collected aggregate (today only per-professional via /api/bookings/professional/{id}/fees-summary)',
        ]}
      />

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Total users</div>
          <div className={styles.cardValue}>—</div>
          <div className={styles.cardHint}>Needs GET /api/admin/users</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Suspended accounts</div>
          <div className={styles.cardValue}>—</div>
          <div className={styles.cardHint}>Needs the isSuspended column + endpoint</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Unreconciled bookings</div>
          <div className={styles.cardValue}>—</div>
          <div className={styles.cardHint}>Needs GET /api/admin/bookings</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Premium purchases (30d)</div>
          <div className={styles.cardValue}>—</div>
          <div className={styles.cardHint}>Needs GET /api/admin/premium-purchases</div>
        </div>
      </div>

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
