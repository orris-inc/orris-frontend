/**
 * Announcement Filters Component
 * Unified filtering toolbar following Tailwind Application UI patterns
 *
 * Features:
 * - Status filter (draft/published/archived)
 * - Type filter (system/maintenance/feature/promotion)
 * - Sort options
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ArrowUpDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import type { AnnouncementType, AnnouncementStatus } from '@/api/notification/types';
import type { AnnouncementFilters as FilterValues } from '../hooks/useAnnouncements';

// ============================================================================
// Types
// ============================================================================

export interface AnnouncementFiltersProps {
  filters: FilterValues;
  onFiltersChange: (filters: Partial<FilterValues>) => void;
  className?: string;
}

// Status options
const STATUS_OPTIONS: { value: AnnouncementStatus; label: string }[] = [
  { value: 'draft', label: 'announcements.status.draft' },
  { value: 'published', label: 'announcements.status.published' },
  { value: 'archived', label: 'announcements.status.archived' },
  { value: 'expired', label: 'announcements.status.expired' },
];

// Type options
const TYPE_OPTIONS: { value: AnnouncementType; label: string }[] = [
  { value: 'system', label: 'announcements.type.system' },
  { value: 'maintenance', label: 'announcements.type.maintenance' },
  { value: 'feature', label: 'announcements.type.feature' },
  { value: 'promotion', label: 'announcements.type.promotion' },
];

// Sort options
const SORT_OPTIONS = [
  { value: 'created_at', label: 'filter.sortByCreatedAt' },
  { value: 'updated_at', label: 'filter.sortByUpdatedAt' },
  { value: 'priority', label: 'announcements.sortByPriority' },
  { value: 'scheduled_at', label: 'announcements.sortByScheduled' },
];

// ============================================================================
// Main Component
// ============================================================================

export const AnnouncementFilters = ({
  filters,
  onFiltersChange,
  className,
}: AnnouncementFiltersProps) => {
  const { t } = useTranslation();

  // Check if any filter is active
  const hasFilters = useMemo(() => {
    return !!(filters.status || filters.type || filters.sortBy);
  }, [filters]);

  // Handle status change
  const handleStatusChange = (value: string) => {
    onFiltersChange({
      status: value === 'all' ? undefined : (value as AnnouncementStatus),
    });
  };

  // Handle type change
  const handleTypeChange = (value: string) => {
    onFiltersChange({
      type: value === 'all' ? undefined : (value as AnnouncementType),
    });
  };

  // Handle sort change
  const handleSortChange = (value: string) => {
    if (value === 'none') {
      onFiltersChange({ sortBy: undefined, sortOrder: undefined });
    } else {
      onFiltersChange({
        sortBy: value as FilterValues['sortBy'],
        sortOrder: filters.sortOrder ?? 'desc',
      });
    }
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    if (filters.sortBy) {
      onFiltersChange({
        sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
      });
    }
  };

  // Clear all filters
  const clearFilters = () => {
    onFiltersChange({
      status: undefined,
      type: undefined,
      sortBy: undefined,
      sortOrder: undefined,
    });
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {/* Status filter */}
      <Select value={filters.status ?? 'all'} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-[130px] h-9">
          <SelectValue placeholder={t('common.status.label')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('filter.all')}</SelectItem>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {t(option.label)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Type filter */}
      <Select value={filters.type ?? 'all'} onValueChange={handleTypeChange}>
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder={t('announcements.type.label')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('filter.allTypes')}</SelectItem>
          {TYPE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {t(option.label)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort */}
      <div className="flex items-center gap-1">
        <Select value={filters.sortBy ?? 'none'} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder={t('filter.sortBy')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t('filter.defaultSort')}</SelectItem>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {t(option.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filters.sortBy && (
          <Button
            variant="ghost"
            size="icon"
            className="size-9 shrink-0"
            onClick={toggleSortOrder}
            title={t(
              filters.sortOrder === 'asc' ? 'filter.sortAscending' : 'filter.sortDescending'
            )}
          >
            <ArrowUpDown
              className={cn('size-4', filters.sortOrder === 'asc' && 'rotate-180')}
            />
          </Button>
        )}
      </div>

      {/* Clear filters button */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-muted-foreground h-9"
        >
          <X className="size-4 mr-1" />
          {t('filter.clearAdvanced')}
        </Button>
      )}
    </div>
  );
};

AnnouncementFilters.displayName = 'AnnouncementFilters';
