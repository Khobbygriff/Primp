import { useState } from 'react';
import { PageHeader } from '@/shared/components/PageHeader';
import { Toolbar, SearchInput, SelectFilter, ToolbarSpacer } from '@/shared/components/Toolbar';
import { Pagination } from '@/shared/components/Pagination';
import { LoadingState, EmptyState, ErrorBanner } from '@/shared/components/StateViews';
import { UserTable } from '@/domains/user-moderation/components/UserTable';
import { useUsersQuery } from '@/domains/user-moderation/hooks/useUsersQuery';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { normalizeApiError } from '@/shared/api/apiError';
import type { UserRole } from '@/shared/types/api-contracts';

const PAGE_SIZE = 20;

const roleOptions: { value: UserRole | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All roles' },
  { value: 'CLIENT', label: 'Clients' },
  { value: 'PROFESSIONAL', label: 'Professionals' },
  { value: 'ADMIN', label: 'Admins' },
];

export function UserListPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [role, setRole] = useState<UserRole | 'ALL'>('ALL');
  const search = useDebouncedValue(searchInput, 300);

  const query = useUsersQuery({ page, pageSize: PAGE_SIZE, search, role });

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Search across every client and professional account, including hidden or suspended profiles."
      />

      <Toolbar>
        <SearchInput
          value={searchInput}
          onChange={(value) => {
            setSearchInput(value);
            setPage(1);
          }}
          placeholder="Search by name, email, or ID…"
        />
        <SelectFilter
          label="Filter by role"
          value={role}
          onChange={(value) => {
            setRole(value);
            setPage(1);
          }}
          options={roleOptions}
        />
        <ToolbarSpacer />
      </Toolbar>

      {query.isLoading && <LoadingState label="Loading users…" />}

      {query.isError && <ErrorBanner message={normalizeApiError(query.error).message} />}

      {query.data && query.data.items.length === 0 && (
        <EmptyState title="No users match those filters" subtitle="Try clearing the search or role filter." />
      )}

      {query.data && query.data.items.length > 0 && (
        <>
          <UserTable users={query.data.items} />
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
