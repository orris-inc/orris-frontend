/**
 * Formatting utility functions
 * Shared across components for consistent formatting
 */

import i18n from '@/lib/i18n';

/**
 * Format bytes rate to bits per second (bps/Kbps/Mbps/Gbps)
 * Uses 1000 as base for network units (not 1024)
 *
 * @param bytesPerSec - Bytes per second (can be undefined)
 * @param compact - If true, omit space between value and unit (for table cells)
 * @returns Formatted string like "1.5 Mbps" or "1.5Mbps"
 *
 * @example
 * formatBitRate(125000) // "1 Mbps"
 * formatBitRate(125000, true) // "1Mbps"
 */
export function formatBitRate(bytesPerSec: number | undefined, compact = false): string {
  if (!bytesPerSec || bytesPerSec <= 0) return compact ? '0' : '0 bps';
  // Convert bytes to bits (1 byte = 8 bits)
  const bitsPerSec = bytesPerSec * 8;
  const units = ['bps', 'Kbps', 'Mbps', 'Gbps'];
  // Use 1000 for network units (not 1024)
  const i = Math.floor(Math.log(bitsPerSec) / Math.log(1000));
  const value = bitsPerSec / Math.pow(1000, i);
  const formatted = value < 10 ? value.toFixed(1) : Math.round(value).toString();
  return compact ? `${formatted}${units[i]}` : `${formatted} ${units[i]}`;
}

/**
 * Format bytes to human readable string
 * Uses 1024 as base for storage units
 *
 * @param bytes - Number of bytes (can be undefined)
 * @returns Formatted string like "1.5 GB"
 *
 * @example
 * formatBytes(1073741824) // "1.0 GB"
 */
export function formatBytes(bytes: number | undefined): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value < 10 ? value.toFixed(2) : value.toFixed(1)} ${units[i]}`;
}

/**
 * Format bytes to compact string (for table cells)
 * Uses 1024 as base, no space between value and unit
 *
 * @param bytes - Number of bytes (can be undefined)
 * @returns Formatted string like "1.5GB"
 *
 * @example
 * formatBytesCompact(1073741824) // "1GB"
 */
export function formatBytesCompact(bytes: number | undefined): string {
  if (!bytes || bytes <= 0) return '0';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value < 10 ? value.toFixed(1) : Math.round(value)}${units[i]}`;
}

/**
 * Format bytes with explicit GB display
 * Always shows in GB with 2 decimal places
 *
 * @param bytes - Number of bytes (can be undefined)
 * @returns Formatted string like "1.50 GB"
 *
 * @example
 * formatBytesGB(1610612736) // "1.50 GB"
 */
export function formatBytesGB(bytes: number | undefined): string {
  if (!bytes || bytes <= 0) return '0 GB';
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(2)} GB`;
}

/**
 * Format traffic with used/total display
 *
 * @param used - Used bytes
 * @param total - Total bytes (0 or undefined means unlimited)
 * @returns Formatted string like "1.5 GB / 10 GB" or "1.5 GB / 无限制"
 */
export function formatTrafficUsage(used: number | undefined, total: number | undefined): string {
  const usedStr = formatBytes(used);
  if (!total || total <= 0) {
    return `${usedStr} / ${i18n.t('common.unlimited')}`;
  }
  return `${usedStr} / ${formatBytes(total)}`;
}

/**
 * Calculate traffic usage percentage
 *
 * @param used - Used bytes
 * @param total - Total bytes
 * @returns Percentage (0-100), or 0 if total is 0/undefined
 */
export function getTrafficPercentage(used: number | undefined, total: number | undefined): number {
  if (!used || !total || total <= 0) return 0;
  return Math.min(100, Math.round((used / total) * 100));
}

/**
 * Format uptime seconds to human readable string
 *
 * @param seconds - Uptime in seconds (can be undefined)
 * @returns Formatted string like "3 days 2 hours"
 *
 * @example
 * formatUptime(90061) // "1 day 1 hour"
 */
export function formatUptime(seconds: number | undefined): string {
  if (!seconds || seconds <= 0) return '-';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(i18n.t('common.time.days', { count: days }));
  if (hours > 0) parts.push(i18n.t('common.time.hours', { count: hours }));
  if (minutes > 0 && days === 0) parts.push(i18n.t('common.time.minutes', { count: minutes }));

  return parts.join(' ') || i18n.t('common.time.justStarted');
}

/**
 * Format relative time from unix timestamp
 *
 * @param unixSeconds - Unix timestamp in seconds
 * @returns Formatted string like "5 minutes ago"
 */
export function formatRelativeTime(unixSeconds: number): string {
  if (!unixSeconds) return '-';
  const now = Math.floor(Date.now() / 1000);
  const diff = now - unixSeconds;
  if (diff < 0) return i18n.t('common.time.now');
  if (diff < 60) return i18n.t('common.time.secondsAgo', { count: diff });
  if (diff < 3600) return i18n.t('common.time.minutesAgo', { count: Math.floor(diff / 60) });
  if (diff < 86400) return i18n.t('common.time.hoursAgo', { count: Math.floor(diff / 3600) });
  return i18n.t('common.time.daysAgo', { count: Math.floor(diff / 86400) });
}
