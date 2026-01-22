/**
 * Sheet Type Definitions
 *
 * Unified type system for all Sheet components following the architecture:
 * "Page as skeleton, Sheet/Modal as muscle, Overlay as nerve"
 */

import type { ReactNode } from 'react';

// ============================================================================
// Base Props
// ============================================================================

/**
 * Base Sheet Props - All Sheet components must extend this
 *
 * Uses onOpenChange instead of onClose for consistency with Radix/Vaul
 */
export interface BaseSheetProps {
  /** Sheet open state */
  open: boolean;
  /** Callback when open state changes (close via gesture/backdrop/ESC) */
  onOpenChange: (open: boolean) => void;
}

// ============================================================================
// Delete Sheet
// ============================================================================

/**
 * Delete Sheet Props - For confirmation dialogs
 *
 * Usage:
 * - Display entity information before deletion
 * - Show warning message
 * - Optionally use ConfirmActionSheet for secondary confirmation
 */
export interface DeleteSheetProps<T> extends BaseSheetProps {
  /** Entity to delete (null when closed) */
  entity: T | null;
  /** Confirm deletion callback - should handle API call and close sheet */
  onConfirm: (entity: T) => Promise<void>;
}

// ============================================================================
// Create Sheet
// ============================================================================

/**
 * Create Sheet Props - For creation forms
 *
 * Usage:
 * - Form for creating new entities
 * - Internal state management for form fields
 * - Internal loading state for submit button
 */
export interface CreateSheetProps<TCreate> extends BaseSheetProps {
  /** Submit callback with form data - should handle API call and close sheet */
  onSubmit: (data: TCreate) => Promise<void>;
}

// ============================================================================
// Edit Sheet
// ============================================================================

/**
 * Edit Sheet Props - For edit forms
 *
 * Usage:
 * - Pre-fill form with entity data
 * - Track changes for submit button state
 * - Submit only changed fields
 */
export interface EditSheetProps<T, TUpdate> extends BaseSheetProps {
  /** Entity to edit (null when closed) */
  entity: T | null;
  /** Submit callback with updated data */
  onSubmit: (id: string, data: TUpdate) => Promise<void>;
}

// ============================================================================
// Detail Sheet
// ============================================================================

/**
 * Detail Sheet Props - For read-only display
 *
 * Usage:
 * - Display entity details in a mobile-friendly format
 * - No form, no submit
 * - May include collapsible sections
 */
export interface DetailSheetProps<T> extends BaseSheetProps {
  /** Entity to display */
  entity: T | null;
}

// ============================================================================
// ActionSheet
// ============================================================================

/**
 * ActionSheet Action - Single action item in ActionSheet
 */
export interface ActionSheetAction {
  /** Action label text */
  label: string;
  /** Action callback - can be async */
  onPress: () => void | Promise<void>;
  /** Action variant - destructive shows red */
  variant?: 'default' | 'destructive';
  /** Optional icon component */
  icon?: ReactNode;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * ActionSheet Props - iOS-style action menu
 *
 * Features:
 * - Grouped action buttons
 * - Separate cancel button with gap
 * - Per-action loading state
 * - Destructive variant styling
 */
export interface ActionSheetProps extends BaseSheetProps {
  /** Action options */
  actions: ActionSheetAction[];
  /** Optional title above actions */
  title?: string;
  /** Optional description below title */
  description?: string;
  /** Cancel button text (default: "Cancel") */
  cancelText?: string;
}

// ============================================================================
// ConfirmActionSheet
// ============================================================================

/**
 * ConfirmActionSheet Props - Simplified confirmation ActionSheet
 *
 * Used as secondary sheet for delete/cancel confirmations
 * inside a primary Sheet. Maximum 2 levels of nesting.
 */
export interface ConfirmActionSheetProps extends BaseSheetProps {
  /** Confirmation variant - destructive shows red confirm button */
  variant?: 'default' | 'destructive';
  /** Title text */
  title: string;
  /** Optional description below title */
  description?: string;
  /** Confirm button text (default: "Confirm") */
  confirmText?: string;
  /** Cancel button text (default: "Cancel") */
  cancelText?: string;
  /** Confirm callback - can be async */
  onConfirm: () => void | Promise<void>;
}

// ============================================================================
// SelectSheet
// ============================================================================

/**
 * SelectSheet Option - Single option item
 */
export interface SelectSheetOption<T extends string = string> {
  /** Option value */
  value: T;
  /** Display label */
  label: string;
  /** Optional description below label */
  description?: string;
  /** Optional left icon */
  icon?: ReactNode;
  /** Optional color indicator (Tailwind class) */
  color?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * SelectSheet Option Group - For grouped options
 */
export interface SelectSheetOptionGroup<T extends string = string> {
  /** Group label */
  label: string;
  /** Options in this group */
  options: SelectSheetOption<T>[];
}

/**
 * SelectSheet Props - Bottom sheet select picker
 *
 * Features:
 * - Bottom drawer with option list
 * - Check mark on selected item
 * - Optional search filter
 * - Optional grouped options
 * - Touch-friendly 48px targets
 */
export interface SelectSheetProps<T extends string = string> extends BaseSheetProps {
  /** Current selected value */
  value: T | null;
  /** Change handler - called when option selected */
  onChange: (value: T) => void;
  /** Flat options list (use this OR groups, not both) */
  options?: SelectSheetOption<T>[];
  /** Grouped options (use this OR options, not both) */
  groups?: SelectSheetOptionGroup<T>[];
  /** Sheet title */
  title?: string;
  /** Optional description */
  description?: string;
  /** Placeholder when no selection */
  placeholder?: string;
  /** Enable search filter */
  searchable?: boolean;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Close sheet after selection (default: true) */
  closeOnSelect?: boolean;
}
