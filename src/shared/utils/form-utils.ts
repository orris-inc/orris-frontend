/**
 * Normalize strings for comparison.
 * Compare after trim, treat empty string and undefined as same.
 */
export const hasStringChanged = (
  newValue: string | undefined,
  oldValue: string | undefined,
): boolean => {
  const normalizedNew = (newValue || "").trim();
  const normalizedOld = (oldValue || "").trim();
  return normalizedNew !== normalizedOld;
};
