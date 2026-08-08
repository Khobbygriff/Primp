import type { ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';
import { RequireAdminRole } from '@/shared/auth/RequireAdminRole';
import { AdminLayout } from '@/app/AdminLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/domains/platform-overview/pages/DashboardPage';
import { UserListPage } from '@/domains/user-moderation/pages/UserListPage';
import { UserDetailPage } from '@/domains/user-moderation/pages/UserDetailPage';
import { BookingPaymentsPage } from '@/domains/payment-reconciliation/pages/BookingPaymentsPage';
import { PremiumPaymentsPage } from '@/domains/payment-reconciliation/pages/PremiumPaymentsPage';

function Protected({ children }: { children: ReactNode }) {
  return (
    <RequireAdminRole>
      <AdminLayout>{children}</AdminLayout>
    </RequireAdminRole>
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <Protected>
            <DashboardPage />
          </Protected>
        }
      />
      <Route
        path="/users"
        element={
          <Protected>
            <UserListPage />
          </Protected>
        }
      />
      <Route
        path="/users/:userId"
        element={
          <Protected>
            <UserDetailPage />
          </Protected>
        }
      />
      <Route
        path="/payments/bookings"
        element={
          <Protected>
            <BookingPaymentsPage />
          </Protected>
        }
      />
      <Route
        path="/payments/premium"
        element={
          <Protected>
            <PremiumPaymentsPage />
          </Protected>
        }
      />
    </Routes>
  );
}
