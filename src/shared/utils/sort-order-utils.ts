/**
 * Sort order helpers for the subscription sequence shared by direct nodes and
 * forward rules (backend change 2026-08-12).
 *
 * Admin reorder endpoints (updateNode, reorderForwardRules, reorderSubscriptionOrder)
 * write the submitted sortOrder verbatim, and the values are compared against every
 * other entry of the subscription. Emitting dense 1..N indices from a drag-and-drop
 * list would therefore push the reordered entries ahead of every entry that is not
 * part of that list. Instead, keep the positions the entries already occupy and
 * redistribute them in the new order: the entries swap places among themselves and
 * their neighbours in the shared sequence stay untouched.
 */

export interface SortOrderUpdate {
  id: string;
  sortOrder: number;
}

/**
 * Redistribute the positions currently occupied by `reordered` according to its new order.
 *
 * @param reordered - Entries in their new visual order
 * @param getId - Entry identity (unique within `reordered`)
 * @param getSortOrder - Entry's current position in the shared sequence
 * @returns Only the entries whose position actually changes
 */
export function computeSortOrderUpdates<T>(
  reordered: T[],
  getId: (item: T) => string,
  getSortOrder: (item: T) => number
): SortOrderUpdate[] {
  const positions = reordered.map(getSortOrder).sort((a, b) => a - b);

  // Legacy rows may share a position (everything defaulted to 0), which would make the
  // requested order ambiguous. Bump duplicates so every entry lands on a distinct slot.
  for (let i = 1; i < positions.length; i += 1) {
    if (positions[i] <= positions[i - 1]) {
      positions[i] = positions[i - 1] + 1;
    }
  }

  const updates: SortOrderUpdate[] = [];
  reordered.forEach((item, index) => {
    if (getSortOrder(item) !== positions[index]) {
      updates.push({ id: getId(item), sortOrder: positions[index] });
    }
  });

  return updates;
}
