/**
 * MobileForwardRuleCard - Tailwind Application UI style list item
 *
 * Design principles:
 * - Clean stacked list item (used with divide-y parent)
 * - Two-line layout: name + type | address + status
 * - Status badge on the right
 * - Tap to open detail sheet
 */

import { useTranslation } from 'react-i18next';
import { ArrowUpRight, ArrowDownLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mobileListItemStyles } from '@/lib/ui-styles';
import { AdminBadge } from '@/components/admin';
import { ENABLED_STATUS_CONFIG } from '@/shared/constants/status-config';
import { formatBytesCompact } from '@/shared/utils/format-utils';
import type { ForwardRule, ForwardAgent, RuleOverallStatusResponse } from '@/api/forward';

// ============================================================================
// Types
// ============================================================================

export interface MobileForwardRuleCardProps {
  rule: ForwardRule;
  agentsMap?: Record<string, ForwardAgent>;
  polledStatus?: RuleOverallStatusResponse;
  isPolling?: boolean;
  onCardPress: (rule: ForwardRule) => void;
}

// ============================================================================
// Constants
// ============================================================================

const RULE_TYPE_CONFIG: Record<string, { labelKey: string; shortLabel: string; className: string }> = {
  direct: { labelKey: 'admin.forwardRules.ruleType.direct', shortLabel: 'D', className: 'bg-info/10 text-info' },
  entry: { labelKey: 'admin.forwardRules.ruleType.entry', shortLabel: 'E', className: 'bg-success/10 text-success' },
  chain: { labelKey: 'admin.forwardRules.ruleType.chain', shortLabel: 'C', className: 'bg-warning/10 text-warning' },
  direct_chain: { labelKey: 'admin.forwardRules.ruleType.directChain', shortLabel: 'DC', className: 'bg-muted text-muted-foreground' },
};

const PROTOCOL_LABELS: Record<string, string> = {
  tcp: 'TCP',
  udp: 'UDP',
  both: 'TCP/UDP',
};

// ============================================================================
// Sub Components
// ============================================================================

/**
 * Run status indicator - compact dot
 */
const RunStatusIndicator = ({
  status,
  isPolling,
}: {
  status: string | null;
  isPolling: boolean;
}) => {
  if (isPolling) {
    return <Loader2 className="size-3.5 animate-spin text-info" />;
  }

  if (!status) return null;

  return (
    <span
      className={cn(
        'size-2 rounded-full shrink-0',
        status === 'running' && 'bg-success',
        status === 'stopped' && 'bg-muted-foreground',
        status === 'error' && 'bg-destructive',
        status === 'starting' && 'bg-info animate-pulse motion-reduce:animate-none',
        status === 'unknown' && 'bg-muted-foreground/60'
      )}
    />
  );
};

// Status badge variant mapping
const STATUS_VARIANT_MAP: Record<string, 'default' | 'success'> = {
  enabled: 'success',
  disabled: 'default',
};

// ============================================================================
// Main Component
// ============================================================================

export const MobileForwardRuleCard = ({
  rule,
  polledStatus,
  isPolling = false,
  onCardPress,
}: MobileForwardRuleCardProps) => {
  const { t } = useTranslation();
  const ruleTypeConfig = RULE_TYPE_CONFIG[rule.ruleType] || {
    labelKey: rule.ruleType,
    shortLabel: '?',
    className: 'bg-muted text-muted-foreground',
  };
  const protocolLabel = PROTOCOL_LABELS[rule.protocol] || rule.protocol;

  // Determine run status
  const getRunStatus = () => {
    if (rule.status !== 'enabled') return null;
    const status = polledStatus || { overallRunStatus: rule.runStatus };
    return status.overallRunStatus || 'unknown';
  };

  const runStatus = getRunStatus();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onCardPress(rule)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCardPress(rule);
        }
      }}
      className={mobileListItemStyles}
    >
      {/* Left: Identity + metadata */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={cn(
              'inline-flex items-center justify-center',
              'size-5 rounded text-[10px] font-bold shrink-0',
              ruleTypeConfig.className
            )}
          >
            {ruleTypeConfig.shortLabel}
          </span>
          <span className="text-[13px] font-medium text-foreground truncate">
            {rule.name}
          </span>
          <RunStatusIndicator status={runStatus} isPolling={isPolling} />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{t(ruleTypeConfig.labelKey)}</span>
          <span className="text-muted-foreground/40">·</span>
          <span>{protocolLabel}</span>
        </div>
      </div>

      {/* Right: Status + Traffic pills */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <AdminBadge
          variant={STATUS_VARIANT_MAP[rule.status] || 'default'}
          className="text-[10px] shrink-0"
        >
          {t((ENABLED_STATUS_CONFIG[rule.status] || { labelKey: 'common.status.unknown' }).labelKey)}
        </AdminBadge>
        {(rule.uploadBytes > 0 || rule.downloadBytes > 0) && (
          <span className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-muted/50 text-[11px] font-mono tabular-nums">
            <span className={cn(
              'inline-flex items-center gap-0.5',
              rule.uploadBytes > 0 ? 'text-success' : 'text-muted-foreground/50'
            )}>
              <ArrowUpRight className="size-3" />
              {rule.uploadBytes > 0 ? formatBytesCompact(rule.uploadBytes) : '0B'}
            </span>
            <span className={cn(
              'inline-flex items-center gap-0.5',
              rule.downloadBytes > 0 ? 'text-info' : 'text-muted-foreground/50'
            )}>
              <ArrowDownLeft className="size-3" />
              {rule.downloadBytes > 0 ? formatBytesCompact(rule.downloadBytes) : '0B'}
            </span>
          </span>
        )}
      </div>
    </div>
  );
};

MobileForwardRuleCard.displayName = 'MobileForwardRuleCard';
