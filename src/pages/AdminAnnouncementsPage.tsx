/**
 * Admin Announcements Page
 * Announcement management page for administrators
 *
 * Layout: Tailwind Application UI pattern
 * - PageHeader with badge and stats metadata
 * - Unified filters toolbar
 * - DataTable with context menu
 * - Mobile-first responsive design
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Plus } from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Button } from '@/components/common/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StatsPill, PageToolbar } from '@/components/admin';
import { adminContentStyles } from '@/lib/ui-styles';
import { usePageTitle } from '@/shared/hooks';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useNotificationStore } from '@/shared/stores/notification-store';
import {
  useAnnouncementsPage,
  AnnouncementFilters,
  AnnouncementListTable,
  MobileAnnouncementManagement,
  CreateAnnouncementDialog,
  EditAnnouncementDialog,
  AnnouncementDetailDialog,
} from '@/features/announcements';
import type { Announcement } from '@/api/notification/types';

export const AdminAnnouncementsPage: React.FC = () => {
  const { t } = useTranslation();
  usePageTitle(t('announcements.pageTitle'));

  const { isMobile } = useBreakpoint();

  const {
    announcements,
    pagination,
    isLoading,
    isFetching,
    refetch,
    filters,
    handlePageChange,
    handlePageSizeChange,
    handleFiltersChange,
    createAnnouncement,
    updateAnnouncement,
    updateStatus,
    deleteAnnouncement,
  } = useAnnouncementsPage();

  const { showError } = useNotificationStore();

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    refetch();
  };

  // View detail
  const handleViewDetail = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setDetailDialogOpen(true);
  };

  // Edit
  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setEditDialogOpen(true);
  };

  // Create
  const handleCreate = async (data: Parameters<typeof createAnnouncement>[0]) => {
    try {
      await createAnnouncement(data);
      setCreateDialogOpen(false);
    } catch {
      showError(t('announcements.messages.createFailed'));
    }
  };

  // Update
  const handleUpdate = async (id: string, data: Parameters<typeof updateAnnouncement>[1]) => {
    try {
      await updateAnnouncement(id, data);
      setEditDialogOpen(false);
      setSelectedAnnouncement(null);
    } catch {
      showError(t('announcements.messages.updateFailed'));
    }
  };

  // Publish
  const handlePublish = async (announcement: Announcement) => {
    try {
      await updateStatus(announcement.id, { status: 'published' });
    } catch {
      showError(t('announcements.messages.publishFailed'));
    }
  };

  // Archive
  const handleArchive = async (announcement: Announcement) => {
    try {
      await updateStatus(announcement.id, { status: 'archived' });
    } catch {
      showError(t('announcements.messages.archiveFailed'));
    }
  };

  // Delete
  const handleDeleteClick = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAnnouncement) return;
    try {
      await deleteAnnouncement(selectedAnnouncement.id);
      setDeleteDialogOpen(false);
      setSelectedAnnouncement(null);
    } catch {
      showError(t('announcements.messages.deleteFailed'));
    }
  };

  // Mobile view
  if (isMobile) {
    return (
      <AdminLayout>
        <div className={adminContentStyles.mobile}>
          <MobileAnnouncementManagement
            announcements={announcements}
            loading={isLoading || isFetching}
            refreshing={isFetching}
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onRefresh={handleRefresh}
            onViewDetail={handleViewDetail}
            onEdit={handleEdit}
            onPublish={handlePublish}
            onArchive={handleArchive}
            onDelete={handleDeleteClick}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Floating action button for create */}
        <Button
          size="lg"
          className="fixed bottom-20 right-4 size-14 rounded-full shadow-lg z-40"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="size-6" />
          <span className="sr-only">{t('announcements.create.title')}</span>
        </Button>

        {/* Dialogs */}
        <CreateAnnouncementDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSubmit={handleCreate}
        />

        <EditAnnouncementDialog
          open={editDialogOpen}
          announcement={selectedAnnouncement}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedAnnouncement(null);
          }}
          onSubmit={handleUpdate}
        />

        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title={t('announcements.delete.title')}
          description={t('announcements.delete.description', {
            title: selectedAnnouncement?.title,
          })}
          confirmText={t('common.actions.delete')}
          cancelText={t('common.actions.cancel')}
          variant="destructive"
          onConfirm={handleDeleteConfirm}
        />
      </AdminLayout>
    );
  }

  // Desktop view - Linear/Vercel style
  return (
    <AdminLayout>
      <div className={adminContentStyles.desktop}>
        {/* Stats Overview Strip + Actions */}
        <PageToolbar
          actions={<>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground/60 hover:text-foreground"
                  onClick={handleRefresh}
                >
                  <RefreshCw
                    key={refreshKey}
                    className="size-3.5 animate-spin-once"
                    strokeWidth={1.5}
                  />
                  <span className="sr-only">{t('common.actions.refresh')}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('common.actions.refresh')}</TooltipContent>
            </Tooltip>
            <Button className="h-8 text-[13px]" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="size-3.5 mr-1" />
              {t('announcements.create.button')}
            </Button>
          </>}
        >
          <StatsPill>{pagination.total}</StatsPill>
        </PageToolbar>

        {/* Unified Filters */}
        <AnnouncementFilters filters={filters} onFiltersChange={handleFiltersChange} />

        {/* Announcement List Table */}
        <AnnouncementListTable
          announcements={announcements}
          loading={isLoading || isFetching}
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onViewDetail={handleViewDetail}
          onEdit={handleEdit}
          onPublish={handlePublish}
          onArchive={handleArchive}
          onDelete={handleDeleteClick}
        />
      </div>

      {/* Dialogs */}
      <CreateAnnouncementDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreate}
      />

      <EditAnnouncementDialog
        open={editDialogOpen}
        announcement={selectedAnnouncement}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedAnnouncement(null);
        }}
        onSubmit={handleUpdate}
      />

      <AnnouncementDetailDialog
        open={detailDialogOpen}
        announcement={selectedAnnouncement}
        onClose={() => {
          setDetailDialogOpen(false);
          setSelectedAnnouncement(null);
        }}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('announcements.delete.title')}
        description={t('announcements.delete.description', {
          title: selectedAnnouncement?.title,
        })}
        confirmText={t('common.actions.delete')}
        cancelText={t('common.actions.cancel')}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </AdminLayout>
  );
};
