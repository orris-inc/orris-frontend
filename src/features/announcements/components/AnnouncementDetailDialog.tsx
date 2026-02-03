/**
 * Announcement Detail Dialog
 * Read-only dialog for viewing announcement details
 */

import { useTranslation } from 'react-i18next';
import { Eye, Calendar, Clock, Users, FileText, Megaphone, Wrench, Sparkles, Gift } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/common/Dialog';
import { AdminBadge } from '@/components/admin';
import { Separator } from '@/components/common/Separator';
import { cn } from '@/lib/utils';
import type { Announcement, AnnouncementStatus, AnnouncementType } from '@/api/notification/types';

// ============================================================================
// Types
// ============================================================================

interface AnnouncementDetailDialogProps {
  open: boolean;
  announcement: Announcement | null;
  onClose: () => void;
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

export const AnnouncementDetailDialog: React.FC<AnnouncementDetailDialogProps> = ({
  open,
  announcement,
  onClose,
}) => {
  const { t } = useTranslation();

  if (!announcement) return null;

  const TypeIcon = TYPE_ICON_MAP[announcement.type] || FileText;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-muted">
              <TypeIcon className="size-5 text-muted-foreground" />
            </div>
            <span className="truncate">{announcement.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
          <div className="space-y-6 py-4">
            {/* Status and Meta */}
            <div className="flex flex-wrap items-center gap-3">
              <AdminBadge variant={STATUS_VARIANT_MAP[announcement.status]}>
                {t(`announcements.status.${announcement.status}`)}
              </AdminBadge>
              <AdminBadge variant="default">
                {t(`announcements.type.${announcement.type}`)}
              </AdminBadge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Eye className="size-4" />
                {announcement.viewCount} {t('announcements.fields.views')}
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
                  'p-4 rounded-xl bg-muted/50 ring-1 ring-border'
                )}
              >
                {announcement.contentHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: announcement.contentHtml }} />
                ) : (
                  <p className="whitespace-pre-wrap">{announcement.content}</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="size-3" />
                  {t('announcements.fields.priority')}
                </span>
                <p className="text-sm font-medium">{announcement.priority}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Eye className="size-3" />
                  {t('announcements.fields.viewCount')}
                </span>
                <p className="text-sm font-medium">{announcement.viewCount}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="size-3" />
                  {t('announcements.fields.scheduledAt')}
                </span>
                <p className="text-sm font-medium">{formatDate(announcement.scheduledAt)}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3" />
                  {t('announcements.fields.expiresAt')}
                </span>
                <p className="text-sm font-medium">{formatDate(announcement.expiresAt)}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">
                  {t('common.fields.createdAt')}
                </span>
                <p className="text-sm font-medium">{formatDate(announcement.createdAt)}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">
                  {t('common.fields.updatedAt')}
                </span>
                <p className="text-sm font-medium">{formatDate(announcement.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

AnnouncementDetailDialog.displayName = 'AnnouncementDetailDialog';
