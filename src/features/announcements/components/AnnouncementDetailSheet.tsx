/**
 * Announcement Detail Sheet
 * Mobile bottom sheet for viewing announcement details with actions
 */

import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import {
  Eye,
  Calendar,
  Clock,
  Pencil,
  Send,
  Archive,
  Trash2,
  FileText,
  Megaphone,
  Wrench,
  Sparkles,
  Gift,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
} from '@/components/common/sheet';
import { Button } from '@/components/common/Button';
import { AdminBadge } from '@/components/admin';
import { Separator } from '@/components/common/Separator';
import { cn } from '@/lib/utils';
import type { Announcement, AnnouncementStatus, AnnouncementType } from '@/api/notification/types';

// ============================================================================
// Types
// ============================================================================

interface AnnouncementDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement: Announcement | null;
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

// Helper: format date for display
const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return '-';
  }
};

// ============================================================================
// Component
// ============================================================================

export const AnnouncementDetailSheet = ({
  open,
  onOpenChange,
  announcement,
  onEdit,
  onPublish,
  onArchive,
  onDelete,
}: AnnouncementDetailSheetProps) => {
  const { t } = useTranslation();

  if (!announcement) return null;

  const status = announcement.status;
  const canPublish = status === 'draft';
  const canArchive = status === 'published';
  const canEdit = status !== 'archived';
  const canDelete = status === 'draft' || status === 'archived';

  const TypeIcon = TYPE_ICON_MAP[announcement.type] || FileText;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-h-[85vh]">
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-muted shrink-0">
              <TypeIcon className="size-5 text-muted-foreground" />
            </div>
            <span className="truncate">{announcement.title}</span>
          </SheetTitle>
        </SheetHeader>

        <SheetBody className="py-4 space-y-4">
          {/* Status and Meta */}
          <div className="flex flex-wrap items-center gap-2">
            <AdminBadge variant={STATUS_VARIANT_MAP[announcement.status]}>
              {t(`announcements.status.${announcement.status}`)}
            </AdminBadge>
            <AdminBadge variant="default">
              {t(`announcements.type.${announcement.type}`)}
            </AdminBadge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Eye className="size-4" />
              {announcement.viewCount}
            </span>
          </div>

          <Separator />

          {/* Content */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">
              {t('announcements.fields.content')}
            </h3>
            <div
              className={cn(
                'prose prose-sm dark:prose-invert max-w-none',
                'p-3 rounded-xl bg-muted/50 ring-1 ring-border'
              )}
            >
              {announcement.contentHtml ? (
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(announcement.contentHtml) }} />
              ) : (
                <p className="whitespace-pre-wrap text-sm">{announcement.content}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="size-3" />
                {t('announcements.fields.scheduledAt')}
              </span>
              <p className="font-medium">{formatDate(announcement.scheduledAt)}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="size-3" />
                {t('announcements.fields.expiresAt')}
              </span>
              <p className="font-medium">{formatDate(announcement.expiresAt)}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">
                {t('common.fields.createdAt')}
              </span>
              <p className="font-medium">{formatDate(announcement.createdAt)}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">
                {t('announcements.fields.priority')}
              </span>
              <p className="font-medium">{announcement.priority}</p>
            </div>
          </div>
        </SheetBody>

        {/* Actions */}
        <SheetFooter className="flex-col gap-2">
          <div className="flex gap-2 w-full">
            {canEdit && onEdit && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  onEdit(announcement);
                  onOpenChange(false);
                }}
              >
                <Pencil className="size-4 mr-1" />
                {t('common.actions.edit')}
              </Button>
            )}
            {canPublish && onPublish && (
              <Button
                variant="default"
                className="flex-1"
                onClick={() => {
                  onPublish(announcement);
                  onOpenChange(false);
                }}
              >
                <Send className="size-4 mr-1" />
                {t('announcements.actions.publish')}
              </Button>
            )}
            {canArchive && onArchive && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  onArchive(announcement);
                  onOpenChange(false);
                }}
              >
                <Archive className="size-4 mr-1" />
                {t('announcements.actions.archive')}
              </Button>
            )}
          </div>
          {canDelete && onDelete && (
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => {
                onDelete(announcement);
                onOpenChange(false);
              }}
            >
              <Trash2 className="size-4 mr-1" />
              {t('common.actions.delete')}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

AnnouncementDetailSheet.displayName = 'AnnouncementDetailSheet';
