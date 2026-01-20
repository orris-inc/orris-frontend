/**
 * MobileNodeCard - iOS-style node card with swipe actions
 *
 * Redesigned for better mobile UX:
 * - Compact layout showing key info at a glance
 * - Swipe left to reveal actions (Edit, Activate/Deactivate, Delete)
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
} from 'lucide-react';
import { MobileSwipeCard, type SwipeAction } from '@/components/mobile';
import { AdminBadge } from '@/components/admin';
import { cn } from '@/lib/utils';
import type { Node, NodeStatus, NodeProtocol } from '@/api/node';
import type { ResourceGroup } from '@/api/resource/types';

// ============================================================================
// Types
// ============================================================================

export interface MobileNodeCardProps {
  node: Node;
  resourceGroupsMap?: Record<string, ResourceGroup>;
  onCardPress: (node: Node) => void;
  onEdit: (node: Node) => void;
  onDelete: (node: Node) => void;
  onActivate: (node: Node) => void;
  onDeactivate: (node: Node) => void;
}

// ============================================================================
// Constants
// ============================================================================

const STATUS_CONFIG: Record<
  NodeStatus,
  { labelKey: string; variant: 'success' | 'default' | 'warning' }
> = {
  active: { labelKey: 'common.status.active', variant: 'success' },
  inactive: { labelKey: 'common.status.inactive', variant: 'default' },
  maintenance: { labelKey: 'common.status.maintenance', variant: 'warning' },
};

const PROTOCOL_CONFIG: Record<NodeProtocol, { label: string; color: string }> = {
  shadowsocks: { label: 'SS', color: 'bg-info/10 text-info' },
  trojan: { label: 'Trojan', color: 'bg-primary/10 text-primary' },
  vless: { label: 'VLESS', color: 'bg-success/10 text-success' },
  vmess: { label: 'VMess', color: 'bg-warning/10 text-warning' },
  hysteria2: { label: 'Hy2', color: 'bg-info/10 text-info' },
  tuic: { label: 'TUIC', color: 'bg-warning/10 text-warning' },
};

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

export const MobileNodeCard = ({
  node,
  onCardPress,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
}: MobileNodeCardProps) => {
  const { t } = useTranslation();
  const statusConfig = STATUS_CONFIG[node.status] || {
    labelKey: 'common.status.unknown',
    variant: 'default' as const,
  };
  const protocolConfig = PROTOCOL_CONFIG[node.protocol] || {
    label: node.protocol,
    color: 'bg-muted text-muted-foreground',
  };

  // Swipe actions
  const swipeActions: SwipeAction[] = [
    {
      key: 'edit',
      icon: <Edit className="size-5" />,
      label: t('common.actions.edit'),
      bgColor: 'bg-primary',
      onClick: () => onEdit(node),
    },
    {
      key: 'toggle',
      icon: node.status === 'active' ? <PowerOff className="size-5" /> : <Power className="size-5" />,
      label: node.status === 'active' ? t('common.actions.disable') : t('common.status.active'),
      bgColor: node.status === 'active' ? 'bg-warning' : 'bg-success',
      onClick: () => (node.status === 'active' ? onDeactivate(node) : onActivate(node)),
    },
    {
      key: 'delete',
      icon: <Trash2 className="size-5" />,
      label: t('common.actions.delete'),
      bgColor: 'bg-destructive',
      onClick: () => onDelete(node),
    },
  ];

  return (
    <MobileSwipeCard actions={swipeActions}>
      <div
        onClick={() => onCardPress(node)}
        className="px-3 py-2.5 min-h-[60px] cursor-pointer active:bg-muted/30 transition-colors"
      >
        {/* Row 1: Name + Status + Online */}
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="text-[13px] font-medium text-foreground truncate">
              {node.name}
            </span>
            <OnlineIndicator isOnline={node.isOnline} t={t} />
            {node.hasUpdate && node.isOnline && (
              <ArrowUpCircle className="size-3 text-warning shrink-0" />
            )}
          </div>
          <AdminBadge
            variant={statusConfig.variant}
            className="text-[10px] px-1.5 py-0 shrink-0"
          >
            {t(statusConfig.labelKey)}
          </AdminBadge>
        </div>

        {/* Row 2: Address + Protocol + Region */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {/* Address */}
          <span className="font-mono truncate max-w-[140px]">
            {node.serverAddress}:{node.agentPort}
          </span>

          <span className="text-border">·</span>

          {/* Protocol */}
          <span className={cn('px-1 py-0 text-[10px] font-medium rounded shrink-0', protocolConfig.color)}>
            {protocolConfig.label}
          </span>

          {/* Region */}
          {node.region && (
            <>
              <span className="text-border">·</span>
              <span className="truncate">{node.region}</span>
            </>
          )}

          {/* System metrics (if online) */}
          {node.isOnline && node.systemStatus && (
            <>
              <span className="text-border">·</span>
              <span className="flex items-center gap-0.5">
                <Activity className="size-3" />
                <span className="tabular-nums">
                  {Math.round(node.systemStatus.cpuPercent)}%
                </span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Swipe hint indicator */}
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
        <div className="flex gap-0.5">
          <div className="w-0.5 h-3 rounded-full bg-foreground" />
          <div className="w-0.5 h-3 rounded-full bg-foreground" />
        </div>
      </div>
    </MobileSwipeCard>
  );
};

MobileNodeCard.displayName = 'MobileNodeCard';
