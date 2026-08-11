import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/auth/AuthContext';
import styles from './AdminLayout.module.css';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: '◧' }],
  },
  {
    label: 'User Moderation',
    items: [{ to: '/users', label: 'Users', icon: '◔' }],
  },
  {
    label: 'Payment Reconciliation',
    items: [
      { to: '/payments/bookings', label: 'Booking payments', icon: '◇' },
      { to: '/payments/premium', label: 'Premium payments', icon: '◈' },
    ],
  },
];

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink;
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandMark} aria-hidden="true">
            P
          </div>
          <div>
            <div className={styles.brandName}>Primp</div>
            <div className={styles.brandSub}>Admin Portal</div>
          </div>
        </div>

        <nav>
          {navSections.map((section) => (
            <div className={styles.navSection} key={section.label}>
              <div className={styles.navSectionLabel}>{section.label}</div>
              {section.items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navLinkClass}>
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className={styles.spacer} />

        <div className={styles.userBox}>
          <div className={styles.userEmail}>{session?.email ?? 'admin'}</div>
          <button type="button" className={styles.logoutButton} onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
