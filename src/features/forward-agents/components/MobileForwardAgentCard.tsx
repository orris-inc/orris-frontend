/**
 * MobileForwardAgentCard - Tailwind Application UI style list item
 *
 * Design principles:
 * - Clean stacked list item (used with divide-y parent)
 * - Two-line layout: name + online | address + metadata
 * - Status badge on the right
 * - Tap to open detail sheet
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  ArrowUpCircle,
  Network,
} from 'lucide-react';
import { mobileListItemStyles } from '@/lib/ui-styles';
import { AdminBadge } from '@/components/admin';
import { OnlineIndicator } from '@/components/mobile/admin/OnlineIndicator';
import { ENABLED_STATUS_CONFIG } from '@/shared/constants/status-config';
import type { ForwardAgent } from '@/api/forward';

// ============================================================================
// Types
// ============================================================================

export interface MobileForwardAgentCardProps {
  agent: ForwardAgent;
  onCardPress: (agent: ForwardAgent) => void;
}

// Status badge variant mapping
const STATUS_VARIANT_MAP: Record<string, 'default' | 'success'> = {
  enabled: 'success',
  disabled: 'default',
};

// ============================================================================
// Main Component
// ============================================================================

export const MobileForwardAgentCard = memo(({
  agent,
  onCardPress,
}: MobileForwardAgentCardProps) => {
  const { t } = useTranslation();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onCardPress(agent)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCardPress(agent);
        }
      }}
      className={mobileListItemStyles}
    >
      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Row 1: Name + Online status + Update indicator */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[13px] font-medium text-foreground truncate">
            {agent.name}
          </span>
          <OnlineIndicator isOnline={agent.isOnline} showLabel={false} onlineText={t('common.status.online')} offlineText={t('common.status.offline')} />
          {agent.hasUpdate && agent.isOnline && (
            <ArrowUpCircle className="size-3.5 text-warning shrink-0" />
          )}
        </div>

        {/* Row 2: Address + Version + CPU (if online) */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Network className="size-3 shrink-0" />
          <span className="font-mono truncate max-w-[140px]">
            {agent.publicAddress || '-'}
          </span>

          {agent.agentVersion && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="shrink-0">v{agent.agentVersion}</span>
            </>
          )}

          {agent.isOnline && agent.systemStatus && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="flex items-center gap-0.5">
                <Activity className="size-3" />
                <span className="tabular-nums">
                  {Math.round(agent.systemStatus.cpuPercent)}%
                </span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right side: Status */}
      <AdminBadge
        variant={STATUS_VARIANT_MAP[agent.status] || 'default'}
        className="text-[10px] shrink-0"
      >
        {t((ENABLED_STATUS_CONFIG[agent.status] || { labelKey: 'common.status.unknown' }).labelKey)}
      </AdminBadge>
    </div>
  );
});

MobileForwardAgentCard.displayName = 'MobileForwardAgentCard';
