import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Check if a navigation path is active based on the current location.
 * Uses startsWith logic for nested routes, with special handling for root dashboard path.
 */
export function isPathActive(currentPath: string, itemPath: string): boolean {
  // Exact match for root paths to avoid false positives
  // e.g., /dashboard should not match /dashboard/profile
  // e.g., /admin should not match /admin/monitor
  if (itemPath === '/dashboard' || itemPath === '/admin') {
    return currentPath === itemPath;
  }
  // For other paths, match exact or nested routes
  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
}
