/**
 * Table Action Menu Component
 * Unified action menu for table rows
 * Supports primary actions (shown directly) and secondary actions (in dropdown)
 */
import { MoreHorizontal } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ActionItem {
  /** Icon component */
  icon: React.ElementType;
  /** Action label (shown in tooltip) */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Action variant for styling */
  variant?: 'default' | 'destructive' | 'primary';
  /** Whether the action is disabled */
  disabled?: boolean;
  /** Whether the action is loading */
  loading?: boolean;
  /** Whether to hide this action */
  hidden?: boolean;
}

export interface TableActionMenuProps {
  /** Primary actions shown directly (max 2-3 recommended) */
  primaryActions?: ActionItem[];
  /** Secondary actions shown in dropdown menu */
  dropdownContent?: React.ReactNode;
  /** Custom class for container */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md';
}

// ============================================================================
// Styles
// ============================================================================

const actionButtonClass = cn(
  'inline-flex items-center justify-center rounded-lg',
  'text-muted-foreground hover:text-foreground',
  'hover:bg-accent/50 active:scale-95',
  'transition-all duration-150',
  'focus:outline-none focus:ring-2 focus:ring-primary/50'
);

const sizeClasses = {
  sm: 'size-7',
  md: 'size-8',
};

const iconSizeClasses = {
  sm: 'size-3.5',
  md: 'size-4',
};

// ============================================================================
// Component
// ============================================================================

export const TableActionMenu: React.FC<TableActionMenuProps> = ({
  primaryActions = [],
  dropdownContent,
  className,
  size = 'md',
}) => {
  const visibleActions = primaryActions.filter((action) => !action.hidden);

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {visibleActions.map((action, index) => {
        const Icon = action.icon;
        return (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                }}
                disabled={action.disabled || action.loading}
                className={cn(
                  actionButtonClass,
                  sizeClasses[size],
                  action.variant === 'destructive' && 'hover:text-destructive hover:bg-destructive/10',
                  action.variant === 'primary' && 'hover:text-primary hover:bg-primary/10',
                  (action.disabled || action.loading) && 'opacity-50 cursor-not-allowed'
                )}
              >
                <Icon
                  className={cn(
                    iconSizeClasses[size],
                    action.loading && 'animate-spin'
                  )}
                  strokeWidth={1.5}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {action.label}
            </TooltipContent>
          </Tooltip>
        );
      })}
      {dropdownContent && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className={cn(actionButtonClass, sizeClasses[size])}
            >
              <MoreHorizontal className={iconSizeClasses[size]} strokeWidth={1.5} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            {dropdownContent}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

// ============================================================================
// Action Button (for standalone use)
// ============================================================================

export interface ActionButtonProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'primary';
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
  disabled = false,
  loading = false,
  size = 'md',
  className,
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          disabled={disabled || loading}
          className={cn(
            actionButtonClass,
            sizeClasses[size],
            variant === 'destructive' && 'hover:text-destructive hover:bg-destructive/10',
            variant === 'primary' && 'hover:text-primary hover:bg-primary/10',
            (disabled || loading) && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          <Icon
            className={cn(iconSizeClasses[size], loading && 'animate-spin')}
            strokeWidth={1.5}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
};
