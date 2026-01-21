/**
 * Content Section Component
 * Simple content wrapper with optional header and loading/empty states
 */

import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { EmptyState, EmptyStateProps } from './EmptyState';
import { cn } from '@/lib/utils';

export interface ContentSectionProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
  loading?: boolean;
  empty?: boolean;
  emptyProps?: EmptyStateProps;
  className?: string;
}

/**
 * Content section with optional header and loading/empty states
 * No wrapper styling - content provides its own styling
 */
export const ContentSection = ({
  children,
  title,
  description,
  actions,
  loading = false,
  empty = false,
  emptyProps,
  className,
}: ContentSectionProps) => {
  const hasHeader = title || actions;

  // Header component
  const renderHeader = () => {
    if (!hasHeader) return null;

    return (
      <div className="flex items-center justify-between gap-4 mb-4">
        {title && (
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground truncate">
              {title}
            </h2>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5 truncate">
                {description}
              </p>
            )}
          </div>
        )}
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    );
  };

  // Content renderer - handles loading and empty states
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (empty) {
      return <EmptyState {...emptyProps} />;
    }

    return children;
  };

  return (
    <div className={cn('@container relative', className)}>
      {renderHeader()}
      {renderContent()}
    </div>
  );
};
