/**
 * MobileNodeCard - Tailwind Application UI style list item
 *
 * Design principles:
 * - Clean stacked list item (used with divide-y parent)
 * - Two-line layout: name + online | address + metadata
 * - Status badge on the right
 * - Tap to open detail sheet
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { SmartTruncate } from '@/components/common/SmartTruncate';
import { Activity, ArrowUpCircle, Network, Users } from 'lucide-react';
import { mobileListItemStyles } from '@/lib/ui-styles';
import { AdminBadge } from '@/components/admin';
import { OnlineIndicator } from '@/components/mobile/admin/OnlineIndicator';
import type { Node, NodeStatus, NodeProtocol } from '@/api/node';

// ============================================================================
// Types
// ============================================================================

export interface MobileNodeCardProps {
  node: Node;
  onCardPress: (node: Node) => void;
}

// ============================================================================
// Constants
// ============================================================================

const STATUS_CONFIG: Record<
  NodeStatus,
  { labelKey: string; variant: 'default' | 'success' | 'warning' }
> = {
  active: {
    labelKey: 'common.status.enabled',
    variant: 'success',
  },
  inactive: {
    labelKey: 'common.status.disabled',
    variant: 'default',
  },
  maintenance: {
    labelKey: 'common.status.maintenance',
    variant: 'warning',
  },
};

const PROTOCOL_CONFIG: Record<NodeProtocol, { label: string; color: string }> = {
  shadowsocks: { label: 'SS', color: 'text-info' },
  trojan: { label: 'Trojan', color: 'text-destructive' },
  vless: { label: 'VLESS', color: 'text-relay' },
  vmess: { label: 'VMess', color: 'text-primary' },
  hysteria2: { label: 'Hy2', color: 'text-warning' },
  tuic: { label: 'TUIC', color: 'text-chart-3' },
  anytls: { label: 'AnyTLS', color: 'text-success' },
};

// ============================================================================
// Main Component
// ============================================================================

export const MobileNodeCard = memo(({
  node,
  onCardPress,
}: MobileNodeCardProps) => {
  const { t } = useTranslation();

  const protocolConfig = PROTOCOL_CONFIG[node.protocol] || { label: node.protocol, color: 'text-muted-foreground' };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onCardPress(node)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCardPress(node);
        }
      }}
      className={mobileListItemStyles}
    >
      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Row 1: Name + Online status + Update indicator */}
        <div className="flex items-center gap-2 mb-1">
          <SmartTruncate text={node.name} className="text-[13px] font-medium text-foreground" />
          <OnlineIndicator isOnline={node.isOnline} showLabel={false} onlineText={t('common.status.online')} offlineText={t('common.status.offline')} />
          {node.onlineSubscriptionCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-success font-medium shrink-0">
              <Users className="size-3" strokeWidth={2} />
              {node.onlineSubscriptionCount}
            </span>
          )}
          {node.hasUpdate && node.isOnline && (
            <ArrowUpCircle className="size-3.5 text-warning shrink-0" />
          )}
        </div>

        {/* Row 2: Address + Protocol + Region + CPU */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Network className="size-3 shrink-0" />
          <span className="font-mono truncate max-w-[120px]">
            {node.serverAddress}:{node.agentPort}
          </span>

          <span className="text-muted-foreground/40">·</span>
          <span className={`shrink-0 font-medium ${protocolConfig.color}`}>{protocolConfig.label}</span>

          {node.region && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="truncate max-w-[60px]">{node.region}</span>
            </>
          )}

          {node.isOnline && node.systemStatus && (
            <>
              <span className="text-muted-foreground/40">·</span>
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

      {/* Right side: Status */}
      <AdminBadge
        variant={(STATUS_CONFIG[node.status] || { variant: 'default' as const }).variant}
        className="text-[10px] shrink-0"
      >
        {t((STATUS_CONFIG[node.status] || { labelKey: 'common.status.unknown' }).labelKey)}
      </AdminBadge>
    </div>
  );
});

MobileNodeCard.displayName = 'MobileNodeCard';
