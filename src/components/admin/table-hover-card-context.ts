/**
 * TableHoverCard Context
 * Context definitions extracted for Fast Refresh compatibility
 */

import { createContext } from 'react';

// ============ Row Context ============

export interface TableRowContextValue {
  /** Unique identifier for the current row */
  rowId: string;
}

export const TableRowContext = createContext<TableRowContextValue | null>(null);
