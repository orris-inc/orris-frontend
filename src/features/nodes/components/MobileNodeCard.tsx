/**
 * MobileNodeCard - iOS-style node card with swipe actions
 *
 * Redesigned for better mobile UX:
 * - Compact layout showing key info at a glance
 * - Swipe left to reveal actions (Edit, Activate/Deactivate, Delete)
 * - Tap to open details sheet
 * - Clear visual hierarchy
 */

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
  { label: string; variant: 'success' | 'default' | 'warning' }
> = {
  active: { label: '激活', variant: 'success' },
  inactive: { label: '未激活', variant: 'default' },
  maintenance: { label: '维护中', variant: 'warning' },
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

const OnlineIndicator = ({ isOnline }: { isOnline: boolean }) => {
  if (isOnline) {
    return (
      <span className="inline-flex items-center gap-1 text-success">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75 motion-reduce:hidden"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success"></span>
        </span>
        <span className="text-[10px] font-medium">在线</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30"></span>
      <span className="text-[10px]">离线</span>
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
  const statusConfig = STATUS_CONFIG[node.status] || {
    label: node.status,
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
      label: '编辑',
      bgColor: 'bg-primary',
      onClick: () => onEdit(node),
    },
    {
      key: 'toggle',
      icon: node.status === 'active' ? <PowerOff className="size-5" /> : <Power className="size-5" />,
      label: node.status === 'active' ? '停用' : '激活',
      bgColor: node.status === 'active' ? 'bg-warning' : 'bg-success',
      onClick: () => (node.status === 'active' ? onDeactivate(node) : onActivate(node)),
    },
    {
      key: 'delete',
      icon: <Trash2 className="size-5" />,
      label: '删除',
      bgColor: 'bg-destructive',
      onClick: () => onDelete(node),
    },
  ];

  return (
    <MobileSwipeCard actions={swipeActions}>
      <div
        onClick={() => onCardPress(node)}
        className="px-4 py-3 min-h-[72px] cursor-pointer active:bg-muted/30 transition-colors"
      >
        {/* Row 1: Name + Status + Online */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="font-medium text-foreground truncate">
              {node.name}
            </span>
            <OnlineIndicator isOnline={node.isOnline} />
            {node.hasUpdate && node.isOnline && (
              <ArrowUpCircle className="size-3.5 text-warning shrink-0" />
            )}
          </div>
          <AdminBadge
            variant={statusConfig.variant}
            className="text-[10px] px-1.5 py-0 shrink-0"
          >
            {statusConfig.label}
          </AdminBadge>
        </div>

        {/* Row 2: Address + Protocol + Region */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {/* Address */}
          <span className="font-mono truncate max-w-[150px]">
            {node.serverAddress}:{node.agentPort}
          </span>

          <span className="text-border">·</span>

          {/* Protocol */}
          <span className={cn('px-1.5 py-0 text-[10px] font-medium rounded shrink-0', protocolConfig.color)}>
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
              <span className="flex items-center gap-1">
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
      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
        <div className="flex gap-0.5">
          <div className="w-0.5 h-4 rounded-full bg-foreground" />
          <div className="w-0.5 h-4 rounded-full bg-foreground" />
        </div>
      </div>
    </MobileSwipeCard>
  );
};

MobileNodeCard.displayName = 'MobileNodeCard';
