import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type SortingState,
} from '@tanstack/react-table';
import styles from './DataTable.module.css';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  onRowClick?: (row: T) => void;
  getRowId?: (row: T) => string;
}

export function DataTable<T>({
  data,
  columns,
  sorting,
  onSortingChange,
  onRowClick,
  getRowId,
}: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    state: sorting ? { sorting } : undefined,
    onSortingChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: false,
    getRowId: getRowId as any,
  });

  return (
    <div className={styles.container}>
      <div className={styles.scroller}>
        <table className={styles.table}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className={styles.headRow}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDir = header.column.getIsSorted();
                  return (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          className={styles.sortableHeader}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sortDir === 'asc' && <span aria-hidden="true">↑</span>}
                          {sortDir === 'desc' && <span aria-hidden="true">↓</span>}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={`${styles.row} ${onRowClick ? styles.clickableRow : ''}`}
                onClick={() => onRowClick?.(row.original)}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={(e) => {
                  if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onRowClick(row.original);
                  }
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className={styles.cell}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
