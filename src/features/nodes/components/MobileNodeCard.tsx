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
import { Activity, ArrowUpCircle, Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mobileListItemStyles } from '@/lib/ui-styles';
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
  { labelKey: string; className: string }
> = {
  active: {
    labelKey: 'common.status.active',
    className: 'bg-success/10 text-success',
  },
  inactive: {
    labelKey: 'common.status.inactive',
    className: 'bg-muted text-muted-foreground',
  },
  maintenance: {
    labelKey: 'common.status.maintenance',
    className: 'bg-warning/10 text-warning',
  },
};

const PROTOCOL_LABELS: Record<NodeProtocol, string> = {
  shadowsocks: 'SS',
  trojan: 'Trojan',
  vless: 'VLESS',
  vmess: 'VMess',
  hysteria2: 'Hy2',
  tuic: 'TUIC',
};

// ============================================================================
// Sub Components
// ============================================================================

/**
 * Online status indicator - compact dot with optional label
 */
const OnlineIndicator = memo(({
  isOnline,
  showLabel = true,
  t,
}: {
  isOnline: boolean;
  showLabel?: boolean;
  t: (key: string) => string;
}) => {
  if (isOnline) {
    return (
      <span className="inline-flex items-center gap-1">
        <span className="relative flex size-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75 motion-reduce:hidden" />
          <span className="relative inline-flex rounded-full size-2 bg-success" />
        </span>
        {showLabel && (
          <span className="text-xs text-success font-medium">
            {t('common.status.online')}
          </span>
        )}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1">
      <span className="size-2 rounded-full bg-muted-foreground/40" />
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {t('common.status.offline')}
        </span>
      )}
    </span>
  );
});

OnlineIndicator.displayName = 'OnlineIndicator';

/**
 * Status badge
 */
const StatusBadge = memo(({
  status,
  t,
}: {
  status: NodeStatus;
  t: (key: string) => string;
}) => {
  const config = STATUS_CONFIG[status] || {
    labelKey: 'common.status.unknown',
    className: 'bg-muted text-muted-foreground',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        config.className
      )}
    >
      {t(config.labelKey)}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';

// ============================================================================
// Main Component
// ============================================================================

export const MobileNodeCard = memo(({
  node,
  onCardPress,
}: MobileNodeCardProps) => {
  const { t } = useTranslation();

  const protocolLabel = PROTOCOL_LABELS[node.protocol] || node.protocol;

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
          <span className="text-sm font-medium text-foreground truncate">
            {node.name}
          </span>
          <OnlineIndicator isOnline={node.isOnline} showLabel={false} t={t} />
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

          <span className="text-border">·</span>
          <span className="shrink-0">{protocolLabel}</span>

          {node.region && (
            <>
              <span className="text-border">·</span>
              <span className="truncate max-w-[60px]">{node.region}</span>
            </>
          )}

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

      {/* Right side: Status */}
      <StatusBadge status={node.status} t={t} />
    </div>
  );
});

MobileNodeCard.displayName = 'MobileNodeCard';
