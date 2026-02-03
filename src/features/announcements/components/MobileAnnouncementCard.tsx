/**
 * Mobile Announcement Card - Tailwind Application UI style list item
 *
 * Design principles:
 * - Clean stacked list item (used with divide-y parent)
 * - Two-line layout: title + type | date + views
 * - Status badge on the right
 * - Tap to open detail sheet
 */

import { useTranslation } from 'react-i18next';
import { Eye, Calendar, Megaphone, Wrench, Sparkles, Gift, FileText } from 'lucide-react';
import { AdminBadge } from '@/components/admin';
import { mobileListItemStyles } from '@/lib/ui-styles';
import { formatDate } from '@/shared/utils/date-utils';
import type { Announcement, AnnouncementStatus, AnnouncementType } from '@/api/notification/types';

// ============================================================================
// Types
// ============================================================================

interface MobileAnnouncementCardProps {
  announcement: Announcement;
  onCardPress: (announcement: Announcement) => void;
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

export const MobileAnnouncementCard = ({
  announcement,
  onCardPress,
}: MobileAnnouncementCardProps) => {
  const { t } = useTranslation();

  const TypeIcon = TYPE_ICON_MAP[announcement.type] || FileText;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onCardPress(announcement)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCardPress(announcement);
        }
      }}
      className={mobileListItemStyles}
    >
      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Row 1: Title + Type */}
        <div className="flex items-center gap-2 mb-1">
          <TypeIcon className="size-3.5 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium text-foreground truncate">
            {announcement.title}
          </span>
        </div>

        {/* Row 2: Type + Date + Views */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{t(`announcements.type.${announcement.type}`)}</span>
          <span className="text-border">·</span>
          <div className="flex items-center gap-1">
            <Calendar className="size-3" />
            <span className="tabular-nums">{formatDate(announcement.createdAt)}</span>
          </div>
          <span className="text-border">·</span>
          <div className="flex items-center gap-1">
            <Eye className="size-3" />
            <span>{announcement.viewCount}</span>
          </div>
        </div>
      </div>

      {/* Right side: Status */}
      <AdminBadge
        variant={STATUS_VARIANT_MAP[announcement.status]}
        className="text-[10px] px-1.5 py-0 shrink-0"
      >
        {t(`announcements.status.${announcement.status}`)}
      </AdminBadge>
    </div>
  );
};

MobileAnnouncementCard.displayName = 'MobileAnnouncementCard';
