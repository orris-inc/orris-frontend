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
      // Enlarge hit area to fill the whole header cell (negative margins offset td padding)
      <div
        className="flex items-center justify-center -mx-3 -my-2.5 px-3 py-2.5 cursor-pointer"
        onClick={() => table.toggleAllPageRowsSelected(!table.getIsAllPageRowsSelected())}
      >
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
          className="translate-y-[2px] pointer-events-none"
        />
      </div>
    ),
    cell: ({ row }) => (
      // Enlarge hit area to fill the whole cell so clicking anywhere in the column toggles
      <div
        className="flex items-center justify-center -mx-3 -my-2.5 px-3 py-2.5 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          row.toggleSelected(!row.getIsSelected());
        }}
      >
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px] pointer-events-none"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  };
}
