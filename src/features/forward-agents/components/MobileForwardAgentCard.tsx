/**
 * MobileForwardAgentCard - iOS-style forward agent card with swipe actions
 *
 * Redesigned for better mobile UX:
 * - Compact two-row layout showing key info at a glance
 * - Swipe left to reveal actions (Edit, Enable/Disable, Delete)
 * - Tap to open details sheet
 * - Clear visual hierarchy
 */

import { useTranslation } from 'react-i18next';
import {
  Edit,
  Power,
  PowerOff,
  Trash2,
  Activity,
  ArrowUpCircle,
  Network,
} from 'lucide-react';
import { MobileSwipeCard, type SwipeAction } from '@/components/mobile';
import { AdminBadge } from '@/components/admin';
import { ENABLED_STATUS_CONFIG_SHORT } from '@/shared/constants/status-config';
import type { ForwardAgent } from '@/api/forward';

// ============================================================================
// Types
// ============================================================================

export interface MobileForwardAgentCardProps {
  agent: ForwardAgent;
  onCardPress: (agent: ForwardAgent) => void;
  onEdit: (agent: ForwardAgent) => void;
  onDelete: (agent: ForwardAgent) => void;
  onToggleStatus: (agent: ForwardAgent) => void;
}

// ============================================================================
// Online Status Indicator
// ============================================================================

const OnlineIndicator = ({ isOnline, t }: { isOnline: boolean; t: (key: string) => string }) => {
  if (isOnline) {
    return (
      <span className="inline-flex items-center gap-1 text-success">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75 motion-reduce:hidden"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success"></span>
        </span>
        <span className="text-[10px] font-medium">{t('common.status.online')}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30"></span>
      <span className="text-[10px]">{t('common.status.offline')}</span>
    </span>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const MobileForwardAgentCard = ({
  agent,
  onCardPress,
  onEdit,
  onDelete,
  onToggleStatus,
}: MobileForwardAgentCardProps) => {
  const { t } = useTranslation();
  const statusConfig = ENABLED_STATUS_CONFIG_SHORT[agent.status] || {
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
      onClick: () => onEdit(agent),
    },
    {
      key: 'toggle',
      icon: agent.status === 'enabled' ? <PowerOff className="size-5" /> : <Power className="size-5" />,
      label: agent.status === 'enabled' ? t('common.actions.disable') : t('common.actions.enable'),
      bgColor: agent.status === 'enabled' ? 'bg-warning' : 'bg-success',
      onClick: () => onToggleStatus(agent),
    },
    {
      key: 'delete',
      icon: <Trash2 className="size-5" />,
      label: t('common.actions.delete'),
      bgColor: 'bg-destructive',
      onClick: () => onDelete(agent),
    },
  ];

  return (
    <MobileSwipeCard actions={swipeActions}>
      <div
        onClick={() => onCardPress(agent)}
        className="px-4 py-3 min-h-[72px] cursor-pointer active:bg-muted/30 transition-colors"
      >
        {/* Row 1: Name + Online + Update + Status */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="font-medium text-foreground truncate">
              {agent.name}
            </span>
            <OnlineIndicator isOnline={agent.isOnline} t={t} />
            {agent.hasUpdate && agent.isOnline && (
              <ArrowUpCircle className="size-3.5 text-warning shrink-0" />
            )}
          </div>
          <AdminBadge
            variant={statusConfig.variant}
            className="text-[10px] px-1.5 py-0 shrink-0"
          >
            {t(statusConfig.labelKey)}
          </AdminBadge>
        </div>

        {/* Row 2: Address + Version + CPU */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {/* Address */}
          <Network className="size-3 shrink-0" />
          <span className="font-mono truncate max-w-[150px]">
            {agent.publicAddress || '-'}
          </span>

          {/* Version */}
          {agent.agentVersion && (
            <>
              <span className="text-border">·</span>
              <span className="shrink-0">v{agent.agentVersion}</span>
            </>
          )}

          {/* System metrics (if online) */}
          {agent.isOnline && agent.systemStatus && (
            <>
              <span className="text-border">·</span>
              <span className="flex items-center gap-1">
                <Activity className="size-3" />
                <span className="tabular-nums">
                  {Math.round(agent.systemStatus.cpuPercent)}%
                </span>
              </span>
            </>
          )}
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

MobileForwardAgentCard.displayName = 'MobileForwardAgentCard';
