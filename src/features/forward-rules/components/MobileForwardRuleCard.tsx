/**
 * MobileForwardRuleCard - iOS-style forward rule card with swipe actions
 *
 * Redesigned for better mobile UX:
 * - Compact layout showing key info at a glance
 * - Swipe left to reveal actions (Edit, Copy, Toggle, Delete)
 * - Tap to open details sheet
 * - Clear visual hierarchy
 */

import {
  Edit,
  Power,
  Trash2,
  Copy,
  Loader2,
} from 'lucide-react';
import { MobileSwipeCard, type SwipeAction } from '@/components/mobile/admin';
import { AdminBadge } from '@/components/admin';
import { cn } from '@/lib/utils';
import { ENABLED_STATUS_CONFIG_SHORT } from '@/shared/constants/status-config';
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
  onEdit: (rule: ForwardRule) => void;
  onCopy: (rule: ForwardRule) => void;
  onToggleStatus: (rule: ForwardRule) => void;
  onDelete: (rule: ForwardRule) => void;
}

// ============================================================================
// Constants
// ============================================================================

const RULE_TYPE_CONFIG: Record<string, { label: string; shortLabel: string; variant: 'info' | 'success' | 'warning' | 'default' }> = {
  direct: { label: '直连', shortLabel: '直', variant: 'info' },
  entry: { label: '入口', shortLabel: '入', variant: 'success' },
  chain: { label: '链式', shortLabel: '链', variant: 'warning' },
  direct_chain: { label: '直连链', shortLabel: '直链', variant: 'default' },
};

const PROTOCOL_CONFIG: Record<string, { label: string; variant: 'info' | 'warning' | 'default' }> = {
  tcp: { label: 'TCP', variant: 'info' },
  udp: { label: 'UDP', variant: 'warning' },
  both: { label: 'TCP/UDP', variant: 'default' },
};

// ============================================================================
// Main Component
// ============================================================================

export const MobileForwardRuleCard = ({
  rule,
  agentsMap = {},
  polledStatus,
  isPolling = false,
  onCardPress,
  onEdit,
  onCopy,
  onToggleStatus,
  onDelete,
}: MobileForwardRuleCardProps) => {
  const statusConfig = ENABLED_STATUS_CONFIG_SHORT[rule.status] || { label: rule.status, variant: 'default' as const };
  const ruleTypeConfig = RULE_TYPE_CONFIG[rule.ruleType] || { label: rule.ruleType, shortLabel: '?', variant: 'default' as const };
  const protocolConfig = PROTOCOL_CONFIG[rule.protocol] || { label: rule.protocol, variant: 'default' as const };

  // Get entry agent for display
  const entryAgent = agentsMap[rule.agentId];
  const entryAddress = entryAgent?.publicAddress
    ? `${entryAgent.publicAddress}:${rule.listenPort}`
    : `:${rule.listenPort}`;

  // Determine run status indicator
  const getRunStatus = () => {
    if (rule.status !== 'enabled') return null;

    const status = polledStatus || {
      overallRunStatus: rule.runStatus,
    };

    return status.overallRunStatus || 'unknown';
  };

  const runStatus = getRunStatus();

  // Swipe actions
  const swipeActions: SwipeAction[] = [
    {
      key: 'edit',
      icon: <Edit className="size-5" />,
      label: '编辑',
      bgColor: 'bg-primary',
      onClick: () => onEdit(rule),
    },
    {
      key: 'copy',
      icon: <Copy className="size-5" />,
      label: '复制',
      bgColor: 'bg-info',
      onClick: () => onCopy(rule),
    },
    {
      key: 'toggle',
      icon: <Power className="size-5" />,
      label: rule.status === 'enabled' ? '禁用' : '启用',
      bgColor: rule.status === 'enabled' ? 'bg-warning' : 'bg-success',
      onClick: () => onToggleStatus(rule),
    },
    {
      key: 'delete',
      icon: <Trash2 className="size-5" />,
      label: '删除',
      bgColor: 'bg-destructive',
      onClick: () => onDelete(rule),
    },
  ];

  return (
    <MobileSwipeCard actions={swipeActions}>
      <div
        onClick={() => onCardPress(rule)}
        className="px-4 py-3 min-h-[72px] cursor-pointer active:bg-muted/30 transition-colors"
      >
        {/* Row 1: Rule type badge + Name + Status badge */}
        <div className="flex items-center gap-2 mb-1">
          <AdminBadge variant={ruleTypeConfig.variant} className="text-[10px] px-1.5 py-0 shrink-0">
            {ruleTypeConfig.shortLabel}
          </AdminBadge>
          <span className="font-medium text-foreground truncate flex-1 min-w-0">
            {rule.name}
          </span>
          <AdminBadge
            variant={statusConfig.variant}
            className="text-[10px] px-1.5 py-0 shrink-0"
          >
            {statusConfig.label}
          </AdminBadge>
        </div>

        {/* Row 2: Protocol + Entry address + Run status indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {/* Protocol */}
          <AdminBadge variant={protocolConfig.variant} className="text-[10px] px-1.5 py-0">
            {protocolConfig.label}
          </AdminBadge>

          <span className="text-border">·</span>

          {/* Entry address */}
          <span className="font-mono truncate">{entryAddress}</span>

          {/* Run status indicator */}
          {isPolling && (
            <Loader2 className="size-3 animate-spin text-info shrink-0 ml-auto" />
          )}
          {runStatus && !isPolling && (
            <span className={cn(
              'size-2 rounded-full shrink-0 ml-auto',
              runStatus === 'running' && 'bg-success',
              runStatus === 'stopped' && 'bg-muted-foreground',
              runStatus === 'error' && 'bg-destructive',
              runStatus === 'starting' && 'bg-info',
              runStatus === 'unknown' && 'bg-muted-foreground/60'
            )} />
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

MobileForwardRuleCard.displayName = 'MobileForwardRuleCard';
