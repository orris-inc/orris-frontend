/**
 * Data Table Utilities
 * Extracted for Fast Refresh compatibility
 */

import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/common/Checkbox';
import type { ResponsiveColumnMeta } from './DataTable';

/**
 * Helper: Create selection column for external use
 */
export function createSelectionColumn<TData>(): ColumnDef<TData, unknown> {
  return {
    id: 'select',
    size: 48,
    meta: {
      priority: 1,
      align: 'center',
    } as ResponsiveColumnMeta,
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
              ? 'indeterminate'
              : false
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };
}
