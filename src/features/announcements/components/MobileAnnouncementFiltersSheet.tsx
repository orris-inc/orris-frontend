/**
 * Mobile Announcement Filters Sheet
 * Bottom sheet for filtering announcements on mobile
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
} from '@/components/common/sheet';
import { Button } from '@/components/common/Button';
import { Label } from '@/components/common/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { cn } from '@/lib/utils';
import type { AnnouncementType, AnnouncementStatus } from '@/api/notification/types';
import type { AnnouncementFilters } from '../hooks/useAnnouncements';

// ============================================================================
// Types
// ============================================================================

interface MobileAnnouncementFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: AnnouncementFilters;
  onFiltersChange: (filters: Partial<AnnouncementFilters>) => void;
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
];

// ============================================================================
// Mobile Filter Button Component
// ============================================================================

interface MobileFilterButtonProps {
  hasFilters: boolean;
  onClick: () => void;
  className?: string;
}

export const MobileFilterButton = ({
  hasFilters,
  onClick,
  className,
}: MobileFilterButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'size-10 rounded-lg shrink-0',
        'flex items-center justify-center',
        'ring-1 ring-border bg-background',
        'hover:bg-muted active:bg-muted/80 active:scale-[0.98]',
        'transition-colors relative',
        'pointer-coarse:size-11',
        className
      )}
    >
      <Filter className="size-4 text-muted-foreground" />
      {hasFilters && (
        <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-primary" />
      )}
    </button>
  );
};

// ============================================================================
// Filters Sheet Component
// ============================================================================

export const MobileAnnouncementFiltersSheet = ({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
}: MobileAnnouncementFiltersSheetProps) => {
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
    onFiltersChange({
      sortBy: value === 'none' ? undefined : (value as AnnouncementFilters['sortBy']),
      sortOrder: value === 'none' ? undefined : (filters.sortOrder ?? 'desc'),
    });
  };

  // Clear all filters
  const handleClear = () => {
    onFiltersChange({
      status: undefined,
      type: undefined,
      sortBy: undefined,
      sortOrder: undefined,
    });
    onOpenChange(false);
  };

  // Apply and close
  const handleApply = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-h-[85vh]">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center justify-between">
            <span>{t('common.actions.filter')}</span>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-muted-foreground -mr-2"
              >
                <X className="size-4 mr-1" />
                {t('filter.clearAdvanced')}
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <SheetBody className="py-4 space-y-3">
          {/* Status filter */}
          <div className="space-y-2">
            <Label>{t('common.status.label')}</Label>
            <Select
              value={filters.status ?? 'all'}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('filter.all')} />
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
          </div>

          {/* Type filter */}
          <div className="space-y-2">
            <Label>{t('announcements.type.label')}</Label>
            <Select
              value={filters.type ?? 'all'}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('filter.allTypes')} />
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
          </div>

          {/* Sort by */}
          <div className="space-y-2">
            <Label>{t('filter.sortBy')}</Label>
            <Select
              value={filters.sortBy ?? 'none'}
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('filter.defaultSort')} />
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
          </div>
        </SheetBody>

        <SheetFooter>
          <Button className="w-full" onClick={handleApply}>
            {t('common.actions.apply')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

MobileAnnouncementFiltersSheet.displayName = 'MobileAnnouncementFiltersSheet';
