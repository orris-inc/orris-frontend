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

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Megaphone, RefreshCw, FileText, Send, Archive, Plus } from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { PageHeader } from '@/components/admin';
import { Button } from '@/components/common/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
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

  // Calculate announcement statistics
  const stats = useMemo(() => {
    const total = pagination.total;
    const draft = announcements.filter((a) => a.status === 'draft').length;
    const published = announcements.filter((a) => a.status === 'published').length;
    const archived = announcements.filter((a) => a.status === 'archived').length;
    return { total, draft, published, archived };
  }, [announcements, pagination.total]);

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
    } catch (error) {
      showError(t('announcements.messages.createFailed'));
    }
  };

  // Update
  const handleUpdate = async (id: string, data: Parameters<typeof updateAnnouncement>[1]) => {
    try {
      await updateAnnouncement(id, data);
      setEditDialogOpen(false);
      setSelectedAnnouncement(null);
    } catch (error) {
      showError(t('announcements.messages.updateFailed'));
    }
  };

  // Publish
  const handlePublish = async (announcement: Announcement) => {
    try {
      await updateStatus(announcement.id, { status: 'published', sendNotification: true });
    } catch (error) {
      showError(t('announcements.messages.publishFailed'));
    }
  };

  // Archive
  const handleArchive = async (announcement: Announcement) => {
    try {
      await updateStatus(announcement.id, { status: 'archived' });
    } catch (error) {
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
    } catch (error) {
      showError(t('announcements.messages.deleteFailed'));
    }
  };

  // Mobile view
  if (isMobile) {
    return (
      <AdminLayout>
        <div className="py-3">
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

  // Desktop view - Tailwind UI Application UI style
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header with badge and stats metadata */}
        <PageHeader
          title={t('announcements.pageTitle')}
          description={t('announcements.pageDescription')}
          icon={Megaphone}
          badge={{ label: `${stats.total} ${t('announcements.label')}`, variant: 'default' }}
          metadata={[
            { icon: FileText, text: `${stats.draft} ${t('announcements.status.draft')}` },
            { icon: Send, text: `${stats.published} ${t('announcements.status.published')}` },
            stats.archived > 0 && {
              icon: Archive,
              text: `${stats.archived} ${t('announcements.status.archived')}`,
            },
          ].filter(Boolean) as { icon: typeof Megaphone; text: string }[]}
          action={
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleRefresh}>
                    <RefreshCw
                      key={refreshKey}
                      className="size-4 animate-spin-once"
                      strokeWidth={1.5}
                    />
                    <span className="sr-only">{t('common.actions.refresh')}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('common.actions.refresh')}</TooltipContent>
              </Tooltip>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="size-4 mr-1" />
                {t('announcements.create.button')}
              </Button>
            </div>
          }
        />

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
