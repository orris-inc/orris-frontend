/**
 * MobileResourceGroupCard - iOS-style resource group card with swipe actions
 *
 * Redesigned for better mobile UX:
 * - Compact two-row layout showing key info at a glance
 * - Swipe left to reveal actions (Edit, Enable/Disable, Delete)
 * - Tap to open details sheet
 * - Clear visual hierarchy
 */

import { useTranslation } from 'react-i18next';
import { Edit, Power, PowerOff, Trash2, Boxes, Users } from 'lucide-react';
import { MobileSwipeCard, type SwipeAction } from '@/components/mobile';
import { AdminBadge } from '@/components/admin';
import { cn } from '@/lib/utils';
import { ACTIVE_STATUS_CONFIG } from '@/shared/constants/status-config';
import type { ResourceGroup } from '@/api/resource/types';

// ============================================================================
// Types
// ============================================================================

export interface MobileResourceGroupCardProps {
  group: ResourceGroup;
  planName?: string;
  memberCount?: number;
  onCardPress: (group: ResourceGroup) => void;
  onEdit: (group: ResourceGroup) => void;
  onDelete: (group: ResourceGroup) => void;
  onToggleStatus: (group: ResourceGroup) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export const MobileResourceGroupCard = ({
  group,
  planName,
  memberCount = 0,
  onCardPress,
  onEdit,
  onDelete,
  onToggleStatus,
}: MobileResourceGroupCardProps) => {
  const { t } = useTranslation();
  const statusConfig = ACTIVE_STATUS_CONFIG[group.status] || {
    labelKey: 'common.status.unknown',
    variant: 'default' as const,
  };

  // Swipe actions
  const swipeActions: SwipeAction[] = [
    {
      key: 'edit',
      icon: <Edit className="size-5" />,
      label: t('common.actions.edit'),
      bgColor: 'bg-primary',
      onClick: () => onEdit(group),
    },
    {
      key: 'toggle',
      icon:
        group.status === 'active' ? (
          <PowerOff className="size-5" />
        ) : (
          <Power className="size-5" />
        ),
      label: group.status === 'active' ? t('common.actions.disable') : t('common.actions.enable'),
      bgColor: group.status === 'active' ? 'bg-warning' : 'bg-success',
      onClick: () => onToggleStatus(group),
    },
    {
      key: 'delete',
      icon: <Trash2 className="size-5" />,
      label: t('common.actions.delete'),
      bgColor: 'bg-destructive',
      onClick: () => onDelete(group),
    },
  ];

  return (
    <MobileSwipeCard actions={swipeActions}>
      <div
        onClick={() => onCardPress(group)}
        className="px-4 py-3 min-h-[72px] cursor-pointer active:bg-muted/30 transition-colors"
      >
        {/* Row 1: Name + Status */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="font-medium text-foreground truncate flex-1 min-w-0">
            {group.name}
          </span>
          <AdminBadge
            variant={statusConfig.variant}
            className="text-[10px] px-1.5 py-0 shrink-0"
          >
            {t(statusConfig.labelKey)}
          </AdminBadge>
        </div>

        {/* Row 2: Plan + Member count */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {/* Plan */}
          <Boxes className="size-3 shrink-0" />
          <span className={cn('truncate', !planName && 'text-muted-foreground/60')}>
            {planName || t('subscription.noPlan')}
          </span>

          <span className="text-border">·</span>

          {/* Member count */}
          <Users className="size-3 shrink-0" />
          <span>{memberCount} {t('admin.users.usersLabel')}</span>
        </div>
      </div>

      {/* Swipe hint indicator */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
        <div className="flex gap-0.5">
          <div className="w-0.5 h-4 rounded-full bg-foreground" />
          <div className="w-0.5 h-4 rounded-full bg-foreground" />
        </div>
      </div>
    </MobileSwipeCard>
  );
};

MobileResourceGroupCard.displayName = 'MobileResourceGroupCard';
