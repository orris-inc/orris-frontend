/**
 * Admin Card Component
 * Modern glassmorphism style with refined shadows
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AdminCardProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
  variant?: 'default' | 'glass' | 'elevated';
}

/**
 * Admin standard card
 * Unified rounded corners, borders, shadows and hover effects
 */
export const AdminCard = ({ children, className, noPadding, variant = 'default' }: AdminCardProps) => {
  const variants = {
    default: cn(
      'bg-card',
      'border border-border',
      'shadow-sm hover:shadow-md'
    ),
    glass: cn(
      'bg-card/95',
      'backdrop-blur-xl',
      'border border-border',
      'shadow-sm hover:shadow-lg'
    ),
    elevated: cn(
      'bg-card',
      'border border-border',
      'shadow-lg shadow-muted/50',
      'hover:shadow-xl hover:shadow-muted/60',
      'hover:-translate-y-0.5'
    ),
  };

  return (
    <div
      className={cn(
        'rounded-xl sm:rounded-2xl',
        'transition-all duration-200 ease-out',
        variants[variant],
        !noPadding && 'p-4 sm:p-6',
        className
      )}
    >
      {children}
    </div>
  );
};

interface AdminCardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * 卡片头部
 */
export const AdminCardHeader = ({ title, description, action }: AdminCardHeaderProps) => {
  return (
    <div className="flex items-start justify-between mb-4 sm:mb-6 gap-3">
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-foreground">
          {title}
        </h3>
        {description && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

/**
 * 卡片内容区
 */
export const AdminCardContent = ({ children, className }: { children: ReactNode; className?: string }) => {
  return <div className={cn('space-y-4', className)}>{children}</div>;
};
