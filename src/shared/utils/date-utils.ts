/**
 * Date time utility functions
 *
 * Unified date/time format:
 * - Date: YYYY/MM/DD (e.g., 2024/01/15)
 * - Time: HH:mm (24-hour, no seconds, e.g., 14:30)
 * - DateTime: YYYY/MM/DD HH:mm (e.g., 2024/01/15 14:30)
 */

import i18n from '@/lib/i18n';

/**
 * Format a date value to YYYY/MM/DD format
 */
const formatDateParts = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

/**
 * Format a time value to HH:mm format (24-hour, no seconds)
 */
const formatTimeParts = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Format date time string to unified format: YYYY/MM/DD HH:mm
 * @param dateString ISO 8601 date string or timestamp
 * @returns Formatted date time string
 */
export const formatDateTime = (dateString: string | number | Date): string => {
  if (!dateString) return '-';

  try {
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    return `${formatDateParts(date)} ${formatTimeParts(date)}`;
  } catch {
    return '-';
  }
};

/**
 * Format date string to unified format: YYYY/MM/DD (without time)
 * @param dateString ISO 8601 date string or timestamp
 * @returns Formatted date string
 */
export const formatDate = (dateString: string | number | Date): string => {
  if (!dateString) return '-';

  try {
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    return formatDateParts(date);
  } catch {
    return '-';
  }
};

/**
 * Format time string to unified format: HH:mm (without date)
 * @param dateString ISO 8601 date string or timestamp
 * @returns Formatted time string
 */
export const formatTime = (dateString: string | number | Date): string => {
  if (!dateString) return '-';

  try {
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    return formatTimeParts(date);
  } catch {
    return '-';
  }
};

/**
 * Format relative time (e.g., 3 minutes ago, 2 hours ago)
 * @param dateString ISO 8601 date string
 * @returns Relative time string (internationalized)
 */
export const formatRelativeTime = (dateString: string): string => {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return i18n.t('common.time.now');
    if (diffMin < 60) return i18n.t('common.time.minutesAgo', { count: diffMin });
    if (diffHour < 24) return i18n.t('common.time.hoursAgo', { count: diffHour });
    if (diffDay < 7) return i18n.t('common.time.daysAgo', { count: diffDay });

    return formatDate(dateString);
  } catch {
    return '-';
  }
};
