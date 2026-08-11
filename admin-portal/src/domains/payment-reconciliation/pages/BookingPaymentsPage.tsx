import { useState } from 'react';
import { PageHeader } from '@/shared/components/PageHeader';
import { Toolbar, SearchInput, SelectFilter, ToolbarSpacer } from '@/shared/components/Toolbar';
import { Pagination } from '@/shared/components/Pagination';
import { LoadingState, EmptyState, ErrorBanner } from '@/shared/components/StateViews';
import { BookingTransactionTable } from '@/domains/payment-reconciliation/components/BookingTransactionTable';
import { useBookingTransactionsQuery } from '@/domains/payment-reconciliation/hooks/useBookingTransactionsQuery';
import { bookingStatusOptions } from '@/domains/payment-reconciliation/api/bookingPaymentsApi';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { normalizeApiError } from '@/shared/api/apiError';
import type { BookingStatus } from '@/shared/types/api-contracts';

const PAGE_SIZE = 20;

const referenceFilterOptions: { value: 'ALL' | 'YES' | 'NO'; label: string }[] = [
  { value: 'ALL', label: 'All bookings' },
  { value: 'YES', label: 'Has payment reference' },
  { value: 'NO', label: 'Missing payment reference' },
];

export function BookingPaymentsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState<BookingStatus | 'ALL'>('ALL');
  const [hasReference, setHasReference] = useState<'ALL' | 'YES' | 'NO'>('ALL');
  const search = useDebouncedValue(searchInput, 300);

  const query = useBookingTransactionsQuery({
    page,
    pageSize: PAGE_SIZE,
    search,
    status,
    hasPaymentReference: hasReference,
  });

  return (
    <div>
      <PageHeader
        title="Booking payments"
        subtitle="Every Paystack-backed booking charge, searchable by reference or booking ID. Reconcile re-verifies a charge against Paystack live rather than trusting the one-time check made at booking creation."
      />

      <Toolbar>
        <SearchInput
          value={searchInput}
          onChange={(value) => {
            setSearchInput(value);
            setPage(1);
          }}
          placeholder="Search by payment reference or booking ID…"
        />
        <SelectFilter
          label="Filter by status"
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          options={bookingStatusOptions}
        />
        <SelectFilter
          label="Filter by payment reference"
          value={hasReference}
          onChange={(value) => {
            setHasReference(value);
            setPage(1);
          }}
          options={referenceFilterOptions}
        />
        <ToolbarSpacer />
      </Toolbar>

      {query.isLoading && <LoadingState label="Loading transactions…" />}
      {query.isError && <ErrorBanner message={normalizeApiError(query.error).message} />}
      {query.data && query.data.items.length === 0 && (
        <EmptyState title="No bookings match those filters." />
      )}
      {query.data && query.data.items.length > 0 && (
        <>
          <BookingTransactionTable bookings={query.data.items} />
          <Pagination
            page={query.data.page}
            totalPages={query.data.totalPages}
            totalItems={query.data.totalItems}
            pageSize={query.data.pageSize}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
