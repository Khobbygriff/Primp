import { useState } from 'react';
import { PageHeader } from '@/shared/components/PageHeader';
import { BackendPendingNotice } from '@/shared/components/BackendPendingNotice';
import { Toolbar, SearchInput, SelectFilter, ToolbarSpacer } from '@/shared/components/Toolbar';
import { Pagination } from '@/shared/components/Pagination';
import { LoadingState, EmptyState, ErrorBanner } from '@/shared/components/StateViews';
import { PremiumTransactionTable } from '@/domains/payment-reconciliation/components/PremiumTransactionTable';
import { usePremiumTransactionsQuery } from '@/domains/payment-reconciliation/hooks/usePremiumTransactionsQuery';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { normalizeApiError } from '@/shared/api/apiError';
import { premiumFeatureSchema, type PremiumFeature } from '@/shared/types/api-contracts';

const PAGE_SIZE = 20;

const featureOptions: { value: PremiumFeature | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All features' },
  ...premiumFeatureSchema.options.map((feature) => ({ value: feature, label: feature.replace(/_/g, ' ') })),
];

export function PremiumPaymentsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [feature, setFeature] = useState<PremiumFeature | 'ALL'>('ALL');
  const search = useDebouncedValue(searchInput, 300);

  const query = usePremiumTransactionsQuery({ page, pageSize: PAGE_SIZE, search, feature });

  return (
    <div>
      <PageHeader
        title="Premium feature payments"
        subtitle="Priority Listing, Extended Portfolio, Verified Badge, Client Loyalty Tools, and Earnings Analytics unlocks — all currently invisible outside the database (PremiumPurchaseRepository has no controller today)."
      />

      <BackendPendingNotice
        endpoints={[
          'GET /api/admin/premium-purchases',
          'POST /api/admin/premium-purchases/{id}/reconcile',
          "PremiumPurchase.amount column (doesn't exist yet — see api-contracts.ts)",
        ]}
      />

      <Toolbar>
        <SearchInput
          value={searchInput}
          onChange={(value) => {
            setSearchInput(value);
            setPage(1);
          }}
          placeholder="Search by payment reference…"
        />
        <SelectFilter
          label="Filter by feature"
          value={feature}
          onChange={(value) => {
            setFeature(value);
            setPage(1);
          }}
          options={featureOptions}
        />
        <ToolbarSpacer />
      </Toolbar>

      {query.isLoading && <LoadingState label="Loading purchases…" />}
      {query.isError && <ErrorBanner message={normalizeApiError(query.error).message} />}
      {query.data && query.data.items.length === 0 && (
        <EmptyState title="No premium purchases match those filters." />
      )}
      {query.data && query.data.items.length > 0 && (
        <>
          <PremiumTransactionTable purchases={query.data.items} />
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
