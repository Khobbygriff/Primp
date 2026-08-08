import styles from './BackendPendingNotice.module.css';

/**
 * Every screen that depends on an endpoint proposed-but-not-built in the
 * repo scan renders this so it's obvious in the running app — not just in
 * source comments — which pages are non-functional until backend work
 * lands. Delete the call site once the corresponding endpoint ships.
 */
export function BackendPendingNotice({ endpoints }: { endpoints: string[] }) {
  return (
    <div className={styles.notice} role="status">
      <span className={styles.icon} aria-hidden="true">
        🚧
      </span>
      <div>
        <strong>This screen is wired up but not yet functional.</strong> It depends on backend
        endpoints that don't exist in the current API:
        <ul className={styles.list}>
          {endpoints.map((endpoint) => (
            <li key={endpoint}>
              <span className={styles.code}>{endpoint}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
