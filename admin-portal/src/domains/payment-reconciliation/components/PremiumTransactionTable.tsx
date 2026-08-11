import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/shared/components/DataTable';
import { StatusBadge } from '@/shared/components/StatusBadge';
import type { PremiumPurchase } from '@/shared/types/api-contracts';
import { useReconcilePremiumMutation } from '@/domains/payment-reconciliation/hooks/useReconcileMutation';

export function PremiumTransactionTable({ purchases }: { purchases: PremiumPurchase[] }) {
  const reconcileMutation = useReconcilePremiumMutation();

  const columns = useMemo<ColumnDef<PremiumPurchase>[]>(
    () => [
      { header: 'Purchase', accessorKey: 'id', cell: ({ getValue }) => `#${getValue<number>()}` },
      { header: 'User ID', accessorKey: 'userId' },
      {
        header: 'Feature',
        accessorKey: 'feature',
        cell: ({ getValue }) => <StatusBadge tone="info">{getValue<string>().replace(/_/g, ' ')}</StatusBadge>,
      },
      { header: 'Duration', accessorKey: 'duration' },
      {
        header: 'Amount',
        accessorKey: 'amount',
        cell: ({ getValue }) => {
          const amount = getValue<number | null>();
          return amount != null ? (
            `GH₵ ${amount.toFixed(2)}`
          ) : (
            <span title="PremiumPurchase.java has no amount column yet — see api-contracts.ts">
              <StatusBadge tone="warning">Not recorded</StatusBadge>
            </span>
          );
        },
      },
      {
        header: 'Payment reference',
        accessorKey: 'paymentReference',
        cell: ({ getValue }) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{getValue<string>()}</span>,
      },
      {
        header: 'Purchased',
        accessorKey: 'purchasedAt',
        cell: ({ getValue }) => new Date(getValue<string>()).toLocaleString(),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              reconcileMutation.mutate(row.original.id);
            }}
            disabled={reconcileMutation.isPending}
            style={{
              border: '1px solid var(--color-border-strong)',
              background: 'var(--color-surface)',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            Reconcile
          </button>
        ),
      },
    ],
    [reconcileMutation],
  );

  return <DataTable data={purchases} columns={columns} getRowId={(row) => String(row.id)} />;
}
