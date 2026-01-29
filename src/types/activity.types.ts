/**
 * Activity Feed Type Definitions
 *
 * Types for the ActivityFeed component that displays a vertical timeline
 * of user and system activities.
 */

import type { LucideIcon } from 'lucide-react';

/**
 * Activity types for visual differentiation
 */
export type ActivityType =
  | 'comment'
  | 'status'
  | 'assignment'
  | 'tag'
  | 'system'
  | 'create'
  | 'update'
  | 'delete';

/**
 * User information for activity attribution
 */
export interface ActivityUser {
  id: string;
  name: string;
  avatarUrl?: string;
  initials?: string;
}

/**
 * Activity item data structure
 */
export interface Activity {
  /** Unique identifier */
  id: string;

  /** Type of activity for icon/color mapping */
  type: ActivityType;

  /** Activity title or summary */
  title: string;

  /** Optional detailed description */
  description?: string;

  /** User who performed the activity (optional for system activities) */
  user?: ActivityUser;

  /** ISO 8601 timestamp */
  createdAt: string;

  /** Optional action button config */
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };

  /** Optional metadata for display */
  metadata?: Record<string, string | number>;
}

/**
 * Activity icon configuration
 */
export interface ActivityIconConfig {
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
}
