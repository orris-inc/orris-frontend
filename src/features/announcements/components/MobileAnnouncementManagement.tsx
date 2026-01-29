/**
 * MobileAnnouncementManagement - Tailwind Application UI style mobile management
 *
 * Design principles:
 * - Unified toolbar with search + filters
 * - Stacked list with divide-y instead of separate cards
 * - Clean header with result count
 * - Minimal visual decoration
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Megaphone } from 'lucide-react';
import {
  MobilePagination,
  MobileListToolbar,
  MobileListContainer,
} from '@/components/mobile';
import { useMobileDetailSheet } from '@/hooks';
import { MobileAnnouncementCard } from './MobileAnnouncementCard';
import { AnnouncementDetailSheet } from './AnnouncementDetailSheet';
import {
  MobileAnnouncementFiltersSheet,
  MobileFilterButton,
} from './MobileAnnouncementFiltersSheet';
import type { Announcement } from '@/api/notification/types';
import type { AnnouncementFilters } from '../hooks/useAnnouncements';

// ============================================================================
// Types
// ============================================================================

export interface MobileAnnouncementManagementProps {
  announcements: Announcement[];
  loading?: boolean;
  refreshing?: boolean;
  page: number;
  pageSize: number;
  total: number;
  filters: AnnouncementFilters;
  onFiltersChange: (filters: Partial<AnnouncementFilters>) => void;
  onRefresh: () => void;
  onViewDetail?: (announcement: Announcement) => void;
  onEdit?: (announcement: Announcement) => void;
  onPublish?: (announcement: Announcement) => void;
  onArchive?: (announcement: Announcement) => void;
  onDelete?: (announcement: Announcement) => void;
  onPageChange: (page: number) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export const MobileAnnouncementManagement = ({
  announcements,
  loading = false,
  refreshing = false,
  page,
  pageSize,
  total,
  filters,
  onFiltersChange,
  onRefresh,
  onEdit,
  onPublish,
  onArchive,
  onDelete,
  onPageChange,
}: MobileAnnouncementManagementProps) => {
  const { t } = useTranslation();

  // Search state (client-side filtering)
  const [searchQuery, setSearchQuery] = useState('');

  // Filters sheet state
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);

  // Detail sheet hook
  const {
    selectedItem: selectedAnnouncement,
    isOpen: detailSheetOpen,
    openSheet: handleCardPress,
    setOpen: setDetailSheetOpen,
  } = useMobileDetailSheet<Announcement>();

  // Check if any filter is active
  const hasFilters = useMemo(() => {
    return !!(filters.status || filters.type || filters.sortBy);
  }, [filters]);

  // Filter announcements (search is client-side)
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((announcement) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchTitle = announcement.title.toLowerCase().includes(query);
        const matchContent = announcement.content.toLowerCase().includes(query);
        if (!matchTitle && !matchContent) {
          return false;
        }
      }
      return true;
    });
  }, [announcements, searchQuery]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    onFiltersChange({
      status: undefined,
      type: undefined,
      sortBy: undefined,
      sortOrder: undefined,
    });
  }, [onFiltersChange]);

  const hasFilter = searchQuery !== '' || hasFilters;

  return (
    <div className="space-y-3">
      {/* Toolbar: Search + Filter Button + Refresh */}
      <MobileListToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('announcements.search.placeholder')}
        onRefresh={onRefresh}
        refreshing={refreshing}
        extraActions={
          <MobileFilterButton
            hasFilters={hasFilters}
            onClick={() => setFiltersSheetOpen(true)}
          />
        }
      />

      {/* Announcement List */}
      <MobileListContainer
        items={filteredAnnouncements}
        loading={loading}
        hasFilter={hasFilter}
        emptyIcon={Megaphone}
        emptyTitle={t('announcements.empty.title')}
        emptyDescription={t('announcements.empty.description')}
        filterEmptyTitle={t('announcements.empty.filterTitle')}
        filterEmptyDescription={t('announcements.empty.filterDescription')}
        onClearFilters={clearFilters}
        skeletonCount={5}
        skeletonMetadataCount={2}
        getItemId={(announcement) => String(announcement.id)}
        renderItem={(announcement) => (
          <MobileAnnouncementCard
            announcement={announcement}
            onCardPress={handleCardPress}
          />
        )}
      />

      {/* Pagination */}
      {!loading && filteredAnnouncements.length > 0 && (
        <MobilePagination
          page={page}
          total={total}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}

      {/* Announcement Detail Sheet */}
      <AnnouncementDetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        announcement={selectedAnnouncement}
        onEdit={onEdit}
        onPublish={onPublish}
        onArchive={onArchive}
        onDelete={onDelete}
      />

      {/* Filters Sheet */}
      <MobileAnnouncementFiltersSheet
        open={filtersSheetOpen}
        onOpenChange={setFiltersSheetOpen}
        filters={filters}
        onFiltersChange={onFiltersChange}
      />
    </div>
  );
};

MobileAnnouncementManagement.displayName = 'MobileAnnouncementManagement';
