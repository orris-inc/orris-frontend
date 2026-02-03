/**
 * Mobile Announcement Filters Sheet
 * Bottom sheet for filtering announcements on mobile
 */

import { useState, useEffect, useMemo } from 'react';
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
        'relative flex items-center justify-center',
        'size-9 rounded-xl ring-1 ring-border bg-background',
        'hover:bg-muted active:scale-[0.98] transition-all',
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

  // Local state for editing
  const [localFilters, setLocalFilters] = useState<AnnouncementFilters>({});

  // Sync local state when sheet opens
  useEffect(() => {
    if (open) {
      setLocalFilters(filters);
    }
  }, [open, filters]);

  // Check if any filter is active
  const hasFilters = useMemo(() => {
    return !!(filters.status || filters.type || filters.sortBy);
  }, [filters]);

  // Apply filters
  const handleApply = () => {
    onFiltersChange(localFilters);
    onOpenChange(false);
  };

  // Clear all filters
  const handleClear = () => {
    const cleared: AnnouncementFilters = {
      status: undefined,
      type: undefined,
      sortBy: undefined,
      sortOrder: undefined,
    };
    setLocalFilters(cleared);
    onFiltersChange(cleared);
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

        <SheetBody className="py-4 space-y-5">
          {/* Status filter */}
          <div className="space-y-2">
            <Label>{t('common.status.label')}</Label>
            <Select
              value={localFilters.status ?? 'all'}
              onValueChange={(value) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  status: value === 'all' ? undefined : (value as AnnouncementStatus),
                }))
              }
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
              value={localFilters.type ?? 'all'}
              onValueChange={(value) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  type: value === 'all' ? undefined : (value as AnnouncementType),
                }))
              }
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
              value={localFilters.sortBy ?? 'none'}
              onValueChange={(value) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  sortBy: value === 'none' ? undefined : (value as AnnouncementFilters['sortBy']),
                  sortOrder: value === 'none' ? undefined : (prev.sortOrder ?? 'desc'),
                }))
              }
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
