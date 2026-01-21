/**
 * Filter Section Component
 * Unified filter area for admin management pages
 * Contains filter inputs and action buttons in horizontal layout
 * Supports mobile collapse behavior
 */

import { ReactNode, useState } from 'react';
import { RotateCcw, Search, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';

interface FilterSectionProps {
  children: ReactNode;
  onReset?: () => void;
  onSearch?: () => void;
  loading?: boolean;
  resetLabel?: string;
  searchLabel?: string;
  className?: string;
  showActions?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

/**
 * Unified filter section with horizontal layout
 * Filter inputs on left, action buttons on right
 * Supports mobile collapse/expand behavior
 */
export const FilterSection = ({
  children,
  onReset,
  onSearch,
  loading = false,
  resetLabel = 'Reset',
  searchLabel = 'Search',
  className,
  showActions = true,
  collapsible = false,
  defaultCollapsed = true,
}: FilterSectionProps) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <div className={cn('@container py-4 bg-transparent', className)}>
      {/* Mobile toggle button - only visible when collapsible on small screens */}
      {collapsible && (
        <div className="flex items-center justify-between @md:hidden mb-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleCollapse}
            className="flex items-center gap-2"
          >
            <Filter className="size-4" />
            <span>Filters</span>
            {isCollapsed ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronUp className="size-4" />
            )}
          </Button>
        </div>
      )}

      {/* Main content - horizontal layout on desktop, collapsible on mobile */}
      <div
        className={cn(
          'flex flex-col @md:flex-row @md:items-center @md:justify-between gap-4',
          // Mobile collapse behavior
          collapsible && isCollapsed && 'hidden @md:flex'
        )}
      >
        {/* Filter inputs container */}
        <div className="flex flex-wrap items-center gap-3">{children}</div>

        {/* Action buttons container */}
        {showActions && (onReset || onSearch) && (
          <div className="flex items-center gap-2 shrink-0">
            {onReset && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onReset}
                disabled={loading}
              >
                <RotateCcw className="size-4 mr-2" />
                {resetLabel}
              </Button>
            )}
            {onSearch && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={onSearch}
                disabled={loading}
              >
                <Search className="size-4 mr-2" />
                {searchLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export type { FilterSectionProps };
