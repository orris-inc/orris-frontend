/**
 * Date Range Utilities for Traffic Analytics
 * Provides date range presets and granularity detection without external dependencies
 */

/** Supported date range presets */
export type DateRangePreset = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth';

/** Granularity for traffic data visualization */
export type TimeGranularity = 'hour' | 'day' | 'month';

/** Date range with YYYY-MM-DD formatted dates */
export interface DateRange {
  from: string;
  to: string;
}

/** Date preset option for UI */
export interface DatePresetOption {
  value: DateRangePreset;
  label: string;
}

/**
 * Available date range presets with Chinese labels
 */
export const DATE_PRESETS: DatePresetOption[] = [
  { value: 'today', label: '今天' },
  { value: 'yesterday', label: '昨天' },
  { value: 'last7days', label: '最近 7 天' },
  { value: 'last30days', label: '最近 30 天' },
  { value: 'thisMonth', label: '本月' },
];

/**
 * Format date to YYYY-MM-DD string
 */
const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get start of day (00:00:00)
 */
const getStartOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

/**
 * Get end of day (23:59:59)
 */
const getEndOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

/**
 * Get start of month
 */
const getStartOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

/**
 * Get end of month
 */
const getEndOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
};

/**
 * Convert date range preset to YYYY-MM-DD date range
 *
 * @param preset - Date range preset
 * @returns Object with 'from' and 'to' dates in YYYY-MM-DD format
 *
 * @example
 * getDateRangeFromPreset('today')
 * // Returns: { from: '2024-01-15', to: '2024-01-15' }
 *
 * getDateRangeFromPreset('last7days')
 * // Returns: { from: '2024-01-09', to: '2024-01-15' }
 */
export const getDateRangeFromPreset = (preset: DateRangePreset): DateRange => {
  const now = new Date();
  const today = getStartOfDay(now);

  switch (preset) {
    case 'today': {
      const from = formatDateToYYYYMMDD(today);
      const to = formatDateToYYYYMMDD(getEndOfDay(now));
      return { from, to };
    }

    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const from = formatDateToYYYYMMDD(yesterday);
      const to = formatDateToYYYYMMDD(getEndOfDay(yesterday));
      return { from, to };
    }

    case 'last7days': {
      const from = new Date(today);
      from.setDate(from.getDate() - 6); // Today + 6 days ago = 7 days total
      return {
        from: formatDateToYYYYMMDD(from),
        to: formatDateToYYYYMMDD(getEndOfDay(now)),
      };
    }

    case 'last30days': {
      const from = new Date(today);
      from.setDate(from.getDate() - 29); // Today + 29 days ago = 30 days total
      return {
        from: formatDateToYYYYMMDD(from),
        to: formatDateToYYYYMMDD(getEndOfDay(now)),
      };
    }

    case 'thisMonth': {
      const from = getStartOfMonth(now);
      const to = getEndOfMonth(now);
      return {
        from: formatDateToYYYYMMDD(from),
        to: formatDateToYYYYMMDD(to),
      };
    }

    default: {
      // Exhaustive check to ensure all cases are handled
      const _exhaustive: never = preset;
      throw new Error(`Unknown date preset: ${_exhaustive}`);
    }
  }
};

/**
 * Detect appropriate time granularity based on date range
 * - <= 2 days: hour
 * - <= 90 days: day
 * - > 90 days: month
 *
 * @param range - Date range with YYYY-MM-DD formatted dates
 * @returns Recommended time granularity for visualization
 *
 * @example
 * detectGranularity({ from: '2024-01-15', to: '2024-01-15' })
 * // Returns: 'hour'
 *
 * detectGranularity({ from: '2024-01-01', to: '2024-01-15' })
 * // Returns: 'day'
 *
 * detectGranularity({ from: '2023-01-01', to: '2024-01-15' })
 * // Returns: 'month'
 */
export const detectGranularity = (range: DateRange): TimeGranularity => {
  const fromDate = new Date(range.from);
  const toDate = new Date(range.to);

  // Calculate difference in milliseconds
  const diffMs = toDate.getTime() - fromDate.getTime();

  // Convert to days
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 2) {
    return 'hour';
  }

  if (diffDays <= 90) {
    return 'day';
  }

  return 'month';
};
