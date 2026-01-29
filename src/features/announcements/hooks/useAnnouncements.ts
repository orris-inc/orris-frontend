/**
 * useAnnouncements Hook
 * TanStack Query based data management for announcements
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { queryKeys } from '@/shared/lib/query-client';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { handleApiError } from '@/shared/lib/axios';
import {
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  updateAnnouncementStatus,
  deleteAnnouncement,
  getAnnouncement,
} from '@/api/notification';
import type {
  Announcement,
  AnnouncementType,
  AnnouncementStatus,
  CreateAnnouncementRequest,
  UpdateAnnouncementRequest,
  UpdateAnnouncementStatusRequest,
  ListAnnouncementsParams,
} from '@/api/notification/types';

// ============================================================================
// Types
// ============================================================================

export interface AnnouncementFilters {
  type?: AnnouncementType;
  status?: AnnouncementStatus;
  sortBy?: 'created_at' | 'updated_at' | 'priority' | 'scheduled_at';
  sortOrder?: 'asc' | 'desc';
}

interface UseAnnouncementsOptions {
  page?: number;
  pageSize?: number;
  filters?: AnnouncementFilters;
  enabled?: boolean;
}

// ============================================================================
// Main Hook
// ============================================================================

export const useAnnouncements = (options: UseAnnouncementsOptions = {}) => {
  const { page = 1, pageSize = 20, filters = {}, enabled = true } = options;
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  // Build query parameters
  const params: ListAnnouncementsParams = {
    page,
    pageSize,
    type: filters.type,
    status: filters.status,
  };

  // Query announcement list
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.announcements.list(params),
    queryFn: () => listAnnouncements(params),
    enabled,
  });

  // Create announcement
  const createMutation = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      showSuccess(t('announcements.messages.createSuccess'));
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Update announcement
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAnnouncementRequest }) =>
      updateAnnouncement(id, data),
    onSuccess: () => {
      showSuccess(t('announcements.messages.updateSuccess'));
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Update announcement status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAnnouncementStatusRequest }) =>
      updateAnnouncementStatus(id, data),
    onSuccess: () => {
      showSuccess(t('announcements.messages.statusUpdateSuccess'));
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Delete announcement
  const deleteMutation = useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => {
      showSuccess(t('announcements.messages.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.lists() });
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  return {
    // Data
    announcements: data?.items ?? [],
    pagination: {
      page: data?.page ?? page,
      pageSize: data?.pageSize ?? pageSize,
      total: data?.total ?? 0,
      totalPages: data?.totalPages ?? 0,
    },

    // State
    isLoading,
    isFetching,
    error: error ? handleApiError(error) : null,

    // Actions
    refetch,
    createAnnouncement: (data: CreateAnnouncementRequest) => createMutation.mutateAsync(data),
    updateAnnouncement: (id: string, data: UpdateAnnouncementRequest) =>
      updateMutation.mutateAsync({ id, data }),
    updateStatus: (id: string, data: UpdateAnnouncementStatusRequest) =>
      updateStatusMutation.mutateAsync({ id, data }),
    deleteAnnouncement: (id: string) => deleteMutation.mutateAsync(id),

    // Mutation state
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

// ============================================================================
// Single Announcement Hook
// ============================================================================

export const useAnnouncement = (id: string | null) => {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.announcements.detail(id!),
    queryFn: () => getAnnouncement(id!),
    enabled: !!id,
  });

  return {
    announcement: data ?? null,
    isLoading,
    error: error ? handleApiError(error) : null,
  };
};

// ============================================================================
// Page State Hook
// ============================================================================

export const useAnnouncementsPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<AnnouncementFilters>({});
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const queryClient = useQueryClient();

  const announcementsQuery = useAnnouncements({ page, pageSize, filters });

  // Check if any filter is active
  const hasFilters = !!(filters.type || filters.status || filters.sortBy);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleFiltersChange = (newFilters: Partial<AnnouncementFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setPage(1);
  };

  // Prefetch page data on hover
  const prefetchPage = useCallback(
    (targetPage: number) => {
      const totalPages = announcementsQuery.pagination.totalPages;
      if (targetPage < 1 || targetPage > totalPages || targetPage === page) return;

      const params: ListAnnouncementsParams = {
        page: targetPage,
        pageSize,
        type: filters.type,
        status: filters.status,
      };

      queryClient.prefetchQuery({
        queryKey: queryKeys.announcements.list(params),
        queryFn: () => listAnnouncements(params),
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient, page, pageSize, filters, announcementsQuery.pagination.totalPages]
  );

  return {
    ...announcementsQuery,
    page,
    pageSize,
    filters,
    hasFilters,
    selectedAnnouncement,
    setSelectedAnnouncement,
    handlePageChange,
    handlePageSizeChange,
    handleFiltersChange,
    clearFilters,
    prefetchPage,
  };
};
