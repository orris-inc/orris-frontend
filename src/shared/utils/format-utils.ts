/**
 * Formatting utility functions
 * Shared across components for consistent formatting
 */

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
 * Format uptime seconds to human readable string
 *
 * @param seconds - Uptime in seconds (can be undefined)
 * @returns Formatted string like "3天 2小时"
 *
 * @example
 * formatUptime(90061) // "1天 1小时"
 */
export function formatUptime(seconds: number | undefined): string {
  if (!seconds || seconds <= 0) return '-';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}天`);
  if (hours > 0) parts.push(`${hours}小时`);
  if (minutes > 0 && days === 0) parts.push(`${minutes}分钟`);

  return parts.join(' ') || '刚刚启动';
}

/**
 * Format relative time from unix timestamp
 *
 * @param unixSeconds - Unix timestamp in seconds
 * @returns Formatted string like "5分钟前"
 */
export function formatRelativeTime(unixSeconds: number): string {
  if (!unixSeconds) return '-';
  const now = Math.floor(Date.now() / 1000);
  const diff = now - unixSeconds;
  if (diff < 0) return '刚刚';
  if (diff < 60) return `${diff}秒前`;
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  return `${Math.floor(diff / 86400)}天前`;
}
