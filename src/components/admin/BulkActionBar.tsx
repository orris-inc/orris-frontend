/**
 * Bulk Action Bar Component
 * Fixed bottom bar that appears when rows are selected in a table
 * Features: selected count, clear button, action slots, safe-area support
 */

import { type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/common/Button';

// ============================================================================
// Types
// ============================================================================

export interface BulkAction {
  /** Unique key for the action */
  key: string;
  /** Action label */
  label: string;
  /** Icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** Action handler */
  onClick: () => void;
  /** Button variant */
  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
}

export interface BulkActionBarProps {
  /** Number of selected items */
  selectedCount: number;
  /** Handler to clear selection */
  onClearSelection: () => void;
  /** Predefined bulk actions */
  actions?: BulkAction[];
  /** Custom action slot (for more complex UIs) */
  customActions?: ReactNode;
  /** Additional class names */
  className?: string;
  /** Whether the bar is visible (controls animation) */
  visible?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

export const BulkActionBar = ({
  selectedCount,
  onClearSelection,
  actions = [],
  customActions,
  className,
  visible = true,
}: BulkActionBarProps) => {
  const { t } = useTranslation();

  // Don't render if no items selected
  if (selectedCount === 0 || !visible) {
    return null;
  }

  return (
    <div
      className={cn(
        // Fixed positioning at bottom
        'fixed bottom-0 inset-x-0 z-50',
        // Container padding with safe area support
        'pb-safe px-4 sm:px-6 lg:px-8',
        // Animation
        'animate-in slide-in-from-bottom-4 duration-200',
        className
      )}
    >
      <div
        className={cn(
          // Card styling
          'mx-auto max-w-3xl',
          'bg-card/95 backdrop-blur-sm',
          'border border-border rounded-t-xl shadow-lg',
          // Inner layout
          'flex items-center justify-between gap-4',
          'px-4 py-3 sm:px-6'
        )}
      >
        {/* Left side: Selection info + Clear button */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground tabular-nums">
            {t('common.selected', { count: selectedCount })}
          </span>
          <button
            type="button"
            onClick={onClearSelection}
            className={cn(
              'inline-flex items-center justify-center',
              'size-7 rounded-full',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-muted transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
            aria-label={t('common.actions.clear')}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-2">
          {/* Custom actions slot */}
          {customActions}

          {/* Predefined actions */}
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.key}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                className="min-w-[44px]"
              >
                {Icon && <Icon className="size-4 mr-2" />}
                <span className="hidden sm:inline">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

