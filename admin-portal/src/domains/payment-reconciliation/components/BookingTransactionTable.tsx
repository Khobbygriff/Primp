import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/shared/components/DataTable';
import { BookingStatusChip, PaymentPresenceBadge } from './PaystackStatusBadge';
import type { BookingResponse } from '@/shared/types/api-contracts';
import { useReconcileBookingMutation } from '@/domains/payment-reconciliation/hooks/useReconcileMutation';

function formatGHS(amount: number | null | undefined): string {
  return `GH₵ ${(amount ?? 0).toFixed(2)}`;
}

export function BookingTransactionTable({ bookings }: { bookings: BookingResponse[] }) {
  const reconcileMutation = useReconcileBookingMutation();

  const columns = useMemo<ColumnDef<BookingResponse>[]>(
    () => [
      { header: 'Booking', accessorKey: 'id', cell: ({ getValue }) => `#${getValue<number>()}` },
      {
        header: 'Payment reference',
        accessorKey: 'paymentReference',
        cell: ({ getValue }) => (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            {getValue<string | null>() ?? <PaymentPresenceBadge paymentReference={null} />}
          </span>
        ),
      },
      { header: 'Service', accessorKey: 'serviceType' },
      {
        header: 'Total paid',
        accessorKey: 'totalAmount',
        cell: ({ getValue }) => formatGHS(getValue<number | null>()),
      },
      {
        header: 'Primp fee',
        accessorKey: 'primpFee',
        cell: ({ getValue }) => formatGHS(getValue<number | null>()),
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: ({ getValue }) => <BookingStatusChip status={getValue<BookingResponse['status']>()} />,
      },
      {
        header: 'Created',
        accessorKey: 'createdAt',
        cell: ({ getValue }) => {
          const v = getValue<string | null>();
          return v ? new Date(v).toLocaleString() : '—';
        },
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
            disabled={!row.original.paymentReference || reconcileMutation.isPending}
            style={{
              border: '1px solid var(--color-border-strong)',
              background: 'var(--color-surface)',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: 500,
              opacity: row.original.paymentReference ? 1 : 0.4,
            }}
            title={
              row.original.paymentReference
                ? 'Re-verify this reference against Paystack live (requires backend endpoint)'
                : 'No payment reference to reconcile'
            }
          >
            Reconcile
          </button>
        ),
      },
    ],
    [reconcileMutation],
  );

  return <DataTable data={bookings} columns={columns} getRowId={(row) => String(row.id)} />;
}
