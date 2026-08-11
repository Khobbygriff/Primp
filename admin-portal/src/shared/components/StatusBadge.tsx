import type { ReactNode } from 'react';
import styles from './StatusBadge.module.css';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export function StatusBadge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return (
    <span className={`${styles.badge} ${styles[tone]}`}>
      <span className={styles.dot} aria-hidden="true" />
      {children}
    </span>
  );
}
