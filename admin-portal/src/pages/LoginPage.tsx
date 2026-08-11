import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/auth/AuthContext';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { login, isAuthenticated, isAdmin, isLoggingIn, loginError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (isAuthenticated && isAdmin) {
    const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? '/';
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch {
      // Error surfaced via loginError from context — nothing further to do here.
    }
  };

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.brand}>Primp</div>
        <h1 className={styles.title}>Admin Portal</h1>
        <p className={styles.subtitle}>Sign in with an admin account to continue.</p>

        {loginError && <div className={styles.error} role="alert">{loginError}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className={styles.submit} disabled={isLoggingIn}>
            {isLoggingIn ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className={styles.footnote}>
          This authenticates against the same endpoint as the mobile app
          (POST /api/auth/login) and requires the account's JWT to carry
          role=ADMIN. Note: no backend endpoint currently enforces admin-only
          access on the data this portal edits — see the endpoint gap
          analysis. Treat this login as an access gate on the UI only until
          that lands.
        </p>
      </div>
    </div>
  );
}
