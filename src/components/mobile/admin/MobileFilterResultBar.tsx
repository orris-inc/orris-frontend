/**
 * MobileFilterResultBar - Shows filter result count with clear button
 *
 * Tailwind Application UI style:
 * - Clean text display
 * - Primary color clear filters link
 */

import { useTranslation } from 'react-i18next';

export interface MobileFilterResultBarProps {
  /** Number of filtered results */
  count: number;
  /** Whether any filter is active */
  hasFilter: boolean;
  /** Whether data is loading */
  loading?: boolean;
  /** Clear filters handler */
  onClearFilters: () => void;
  /** Additional class names */
  className?: string;
}

export function MobileFilterResultBar({
  count,
  hasFilter,
  loading = false,
  onClearFilters,
  className,
}: MobileFilterResultBarProps) {
  const { t } = useTranslation();

  // Only show when filtering and has results
  if (!hasFilter || loading || count === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {t('admin.subscriptions.found')}{' '}
          <span className="font-medium text-foreground">{count}</span>{' '}
          {t('admin.subscriptions.results')}
        </span>
        <button
          type="button"
          onClick={onClearFilters}
          className="text-primary font-medium hover:underline"
        >
          {t('messages.clearFilters')}
        </button>
      </div>
    </div>
  );
}

MobileFilterResultBar.displayName = 'MobileFilterResultBar';
