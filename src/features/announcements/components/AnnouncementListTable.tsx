/**
 * Announcement List Table Component (Admin)
 * TanStack Table based data table for announcements
 * Mobile-first responsive design
 */

import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Send,
  Archive,
  FileText,
  Megaphone,
  Wrench,
  Sparkles,
  Gift,
} from 'lucide-react';
import {
  DataTable,
  AdminBadge,
  DateTimeCell,
  type ColumnDef,
  type ResponsiveColumnMeta,
} from '@/components/admin';
import { Button } from '@/components/common/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import {
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/common/ContextMenu';
import { SmartTruncate } from '@/components/common/SmartTruncate';
import type { Announcement, AnnouncementStatus, AnnouncementType } from '@/api/notification/types';

// ============================================================================
// Types
// ============================================================================

interface AnnouncementListTableProps {
  announcements: Announcement[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onViewDetail?: (announcement: Announcement) => void;
  onEdit?: (announcement: Announcement) => void;
  onPublish?: (announcement: Announcement) => void;
  onArchive?: (announcement: Announcement) => void;
  onDelete?: (announcement: Announcement) => void;
}

// Status badge variant mapping
const STATUS_VARIANT_MAP: Record<AnnouncementStatus, 'default' | 'success' | 'warning'> = {
  draft: 'default',
  published: 'success',
  archived: 'warning',
  expired: 'warning',
};

// Type icon mapping
const TYPE_ICON_MAP: Record<AnnouncementType, React.ComponentType<{ className?: string }>> = {
  system: Megaphone,
  maintenance: Wrench,
  feature: Sparkles,
  promotion: Gift,
};

// ============================================================================
// Component
// ============================================================================

export const AnnouncementListTable: React.FC<AnnouncementListTableProps> = ({
  announcements,
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onViewDetail,
  onEdit,
  onPublish,
  onArchive,
  onDelete,
}) => {
  const { t } = useTranslation();

  const columns = useMemo<ColumnDef<Announcement>[]>(
    () => [
      {
        id: 'title',
        header: t('announcements.fields.title'),
        size: 280,
        meta: { priority: 1, sticky: 'left' } as ResponsiveColumnMeta,
        cell: ({ row }) => {
          const announcement = row.original;
          const TypeIcon = TYPE_ICON_MAP[announcement.type] || FileText;

          return (
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-xl bg-muted shrink-0">
                <TypeIcon className="size-4 text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <SmartTruncate text={announcement.title} className="font-medium text-foreground" />
                <SmartTruncate text={t(`announcements.type.${announcement.type}`)} className="text-xs text-muted-foreground" />
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: t('common.status.label'),
        size: 100,
        meta: { priority: 1 } as ResponsiveColumnMeta,
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <AdminBadge variant={STATUS_VARIANT_MAP[status]}>
              {t(`announcements.status.${status}`)}
            </AdminBadge>
          );
        },
      },
      {
        accessorKey: 'priority',
        header: t('announcements.fields.priority'),
        size: 80,
        meta: { priority: 3, numeric: true } as ResponsiveColumnMeta,
        cell: ({ row }) => (
          <span className="text-[13px] text-muted-foreground">{row.original.priority}</span>
        ),
      },
      {
        accessorKey: 'viewCount',
        header: t('announcements.fields.viewCount'),
        size: 80,
        meta: { priority: 3, numeric: true } as ResponsiveColumnMeta,
        cell: ({ row }) => (
          <span className="text-[13px] tabular-nums">{row.original.viewCount}</span>
        ),
      },
      {
        accessorKey: 'scheduledAt',
        header: t('announcements.fields.scheduledAt'),
        size: 140,
        meta: { priority: 2 } as ResponsiveColumnMeta,
        cell: ({ row }) =>
          row.original.scheduledAt ? (
            <DateTimeCell value={row.original.scheduledAt} format="datetime" />
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        accessorKey: 'expiresAt',
        header: t('announcements.fields.expiresAt'),
        size: 140,
        meta: { priority: 3 } as ResponsiveColumnMeta,
        cell: ({ row }) =>
          row.original.expiresAt ? (
            <DateTimeCell value={row.original.expiresAt} format="datetime" />
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        accessorKey: 'createdAt',
        header: t('common.fields.createdAt'),
        size: 140,
        meta: { priority: 4 } as ResponsiveColumnMeta,
        cell: ({ row }) => <DateTimeCell value={row.original.createdAt} format="datetime" />,
      },
      {
        id: 'actions',
        header: t('common.table.actions'),
        size: 80,
        meta: { priority: 1, sticky: 'right' } as ResponsiveColumnMeta,
        cell: ({ row }) => {
          const announcement = row.original;
          const status = announcement.status;

          const canPublish = status === 'draft';
          const canArchive = status === 'published';
          const canEdit = status !== 'archived';
          const canDelete = status === 'draft' || status === 'archived';

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-md text-muted-foreground/70 hover:bg-muted/60 hover:text-foreground"
                >
                  <MoreHorizontal className="size-3.5" />
                  <span className="sr-only">{t('aria.openMenu')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent align="end" collisionPadding={16}>
                  {onViewDetail && (
                    <DropdownMenuItem onSelect={() => onViewDetail(announcement)}>
                      <Eye className="mr-2 size-4" />
                      {t('common.actions.view')}
                    </DropdownMenuItem>
                  )}
                  {canEdit && onEdit && (
                    <DropdownMenuItem onSelect={() => onEdit(announcement)}>
                      <Pencil className="mr-2 size-4" />
                      {t('common.actions.edit')}
                    </DropdownMenuItem>
                  )}
                  {(onViewDetail || (canEdit && onEdit)) && (canPublish || canArchive) && (
                    <DropdownMenuSeparator />
                  )}
                  {canPublish && onPublish && (
                    <DropdownMenuItem
                      onClick={() => onPublish(announcement)}
                      className="text-success focus:text-success"
                    >
                      <Send className="mr-2 size-4" />
                      {t('announcements.actions.publish')}
                    </DropdownMenuItem>
                  )}
                  {canArchive && onArchive && (
                    <DropdownMenuItem
                      onClick={() => onArchive(announcement)}
                      className="text-warning focus:text-warning"
                    >
                      <Archive className="mr-2 size-4" />
                      {t('announcements.actions.archive')}
                    </DropdownMenuItem>
                  )}
                  {canDelete && onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(announcement)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 size-4" />
                        {t('common.actions.delete')}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>
          );
        },
      },
    ],
    [t, onViewDetail, onEdit, onPublish, onArchive, onDelete]
  );

  // Context menu content renderer
  const renderContextMenuContent = useCallback(
    (announcement: Announcement) => {
      const status = announcement.status;
      const canPublish = status === 'draft';
      const canArchive = status === 'published';
      const canEdit = status !== 'archived';
      const canDelete = status === 'draft' || status === 'archived';

      return (
        <>
          {onViewDetail && (
            <ContextMenuItem onClick={() => onViewDetail(announcement)}>
              <Eye className="mr-2 size-4" />
              {t('common.actions.view')}
            </ContextMenuItem>
          )}
          {canEdit && onEdit && (
            <ContextMenuItem onClick={() => onEdit(announcement)}>
              <Pencil className="mr-2 size-4" />
              {t('common.actions.edit')}
            </ContextMenuItem>
          )}
          {(onViewDetail || (canEdit && onEdit)) && (canPublish || canArchive) && (
            <ContextMenuSeparator />
          )}
          {canPublish && onPublish && (
            <ContextMenuItem
              onClick={() => onPublish(announcement)}
              className="text-success focus:text-success"
            >
              <Send className="mr-2 size-4" />
              {t('announcements.actions.publish')}
            </ContextMenuItem>
          )}
          {canArchive && onArchive && (
            <ContextMenuItem
              onClick={() => onArchive(announcement)}
              className="text-warning focus:text-warning"
            >
              <Archive className="mr-2 size-4" />
              {t('announcements.actions.archive')}
            </ContextMenuItem>
          )}
          {canDelete && onDelete && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={() => onDelete(announcement)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 size-4" />
                {t('common.actions.delete')}
              </ContextMenuItem>
            </>
          )}
        </>
      );
    },
    [t, onViewDetail, onEdit, onPublish, onArchive, onDelete]
  );

  return (
    <DataTable
      columns={columns}
      data={announcements}
      loading={loading}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      emptyMessage={t('announcements.noData')}
      getRowId={(row) => String(row.id)}
      enableContextMenu
      contextMenuContent={renderContextMenuContent}
    />
  );
};

AnnouncementListTable.displayName = 'AnnouncementListTable';
