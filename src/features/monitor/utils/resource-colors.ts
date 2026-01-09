/**
 * Resource Color Utilities
 * Shared color class functions for resource metrics (CPU, Memory, Disk)
 * Based on threshold levels: >= 80% (critical), >= 60% (warning), < 60% (normal)
 */

/** Threshold for critical status (red) */
const CRITICAL_THRESHOLD = 80;

/** Threshold for warning status (yellow) */
const WARNING_THRESHOLD = 60;

/**
 * Get background color class based on resource percentage
 * @param value - Resource percentage (0-100)
 * @returns Tailwind background color class
 */
export function getResourceBgClass(value: number): string {
  if (value >= CRITICAL_THRESHOLD) return 'bg-destructive';
  if (value >= WARNING_THRESHOLD) return 'bg-warning';
  return 'bg-success';
}

/**
 * Get text color class based on resource percentage
 * @param value - Resource percentage (0-100)
 * @returns Tailwind text color class
 */
export function getResourceTextClass(value: number): string {
  if (value >= CRITICAL_THRESHOLD) return 'text-destructive';
  if (value >= WARNING_THRESHOLD) return 'text-warning';
  return 'text-success';
}

/**
 * Get muted text color class based on resource percentage
 * Uses muted-foreground for normal state instead of success
 * @param value - Resource percentage (0-100)
 * @returns Tailwind text color class
 */
export function getResourceMutedTextClass(value: number): string {
  if (value >= CRITICAL_THRESHOLD) return 'text-destructive';
  if (value >= WARNING_THRESHOLD) return 'text-warning';
  return 'text-muted-foreground';
}
