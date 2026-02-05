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
import { cn } from '@/lib/utils';
import { mobileListItemStyles } from '@/lib/ui-styles';
import type { ForwardAgent } from '@/api/forward';

// ============================================================================
// Types
// ============================================================================

export interface MobileForwardAgentCardProps {
  agent: ForwardAgent;
  onCardPress: (agent: ForwardAgent) => void;
}

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
          <span className="text-xs text-success font-medium">{t('common.status.online')}</span>
        )}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1">
      <span className="size-2 rounded-full bg-muted-foreground/40" />
      {showLabel && (
        <span className="text-xs text-muted-foreground">{t('common.status.offline')}</span>
      )}
    </span>
  );
});

OnlineIndicator.displayName = 'OnlineIndicator';

/**
 * Status badge - enabled/disabled indicator
 */
const StatusBadge = memo(({
  status,
  t,
}: {
  status: string;
  t: (key: string) => string;
}) => {
  const isEnabled = status === 'enabled';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        isEnabled
          ? 'bg-success/10 text-success'
          : 'bg-muted text-muted-foreground'
      )}
    >
      {isEnabled ? t('common.status.enabled') : t('common.status.disabled')}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';

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
          <span className="text-sm font-medium text-foreground truncate">
            {agent.name}
          </span>
          <OnlineIndicator isOnline={agent.isOnline} showLabel={false} t={t} />
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
              <span className="text-border">·</span>
              <span className="shrink-0">v{agent.agentVersion}</span>
            </>
          )}

          {agent.isOnline && agent.systemStatus && (
            <>
              <span className="text-border">·</span>
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
      <StatusBadge status={agent.status} t={t} />
    </div>
  );
});

MobileForwardAgentCard.displayName = 'MobileForwardAgentCard';
