/**
 * TableHoverCard Hooks
 * Extracted for Fast Refresh compatibility
 */

import { useContext } from 'react';
import { TableRowContext } from './table-hover-card-context';

/**
 * Hook to get current row ID from context.
 * Returns null if not inside a TableRowProvider.
 */
export function useTableRowId(): string | null {
  const ctx = useContext(TableRowContext);
  return ctx?.rowId ?? null;
}
