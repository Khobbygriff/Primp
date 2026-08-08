import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/shared/components/DataTable';
import { StatusBadge } from '@/shared/components/StatusBadge';
import type { AdminUserResponse } from '@/shared/types/api-contracts';

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function UserTable({ users }: { users: AdminUserResponse[] }) {
  const navigate = useNavigate();

  const columns = useMemo<ColumnDef<AdminUserResponse>[]>(
    () => [
      {
        header: 'User',
        accessorKey: 'name',
        cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {row.original.profilePhotoUrl ? (
              <img
                src={row.original.profilePhotoUrl}
                alt=""
                width={28}
                height={28}
                style={{ borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div
                aria-hidden="true"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--color-accent-soft)',
                  color: 'var(--color-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {initials(row.original.name)}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 600 }}>{row.original.name}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                {row.original.email ?? `ID ${row.original.id}`}
              </div>
            </div>
          </div>
        ),
      },
      {
        header: 'Role',
        accessorKey: 'role',
        cell: ({ getValue }) => <StatusBadge tone="neutral">{getValue<string>()}</StatusBadge>,
      },
      {
        header: 'Specialty',
        accessorKey: 'specialty',
        cell: ({ getValue }) => getValue<string | null | undefined>() || '—',
      },
      {
        header: 'Location',
        accessorKey: 'location',
        cell: ({ getValue }) => getValue<string | null | undefined>() || '—',
      },
      {
        header: 'Status',
        accessorKey: 'isSuspended',
        cell: ({ row }) =>
          row.original.isSuspended ? (
            <StatusBadge tone="danger">Suspended</StatusBadge>
          ) : row.original.isAvailable === false ? (
            <StatusBadge tone="warning">Hidden</StatusBadge>
          ) : (
            <StatusBadge tone="success">Active</StatusBadge>
          ),
      },
      {
        header: 'Joined',
        accessorKey: 'createdAt',
        cell: ({ getValue }) => {
          const value = getValue<string | null | undefined>();
          return value ? new Date(value).toLocaleDateString() : '—';
        },
      },
    ],
    [],
  );

  return (
    <DataTable
      data={users}
      columns={columns}
      getRowId={(row) => String(row.id)}
      onRowClick={(row) => navigate(`/users/${row.id}`)}
    />
  );
}
