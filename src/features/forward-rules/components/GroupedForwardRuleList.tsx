/**
 * Grouped Forward Rule List Component
 *
 * Displays forward rules grouped by agent (tunnel) or rule type,
 * with collapsible sections and per-group summary stats.
 * Reuses ForwardRuleListTable for consistent column rendering.
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Bot } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/common/Collapsible';
import { formatBytesGB } from '@/shared/utils/format-utils';
import { ForwardRuleListTable } from './ForwardRuleListTable';
import type { ForwardRule, ForwardAgent, RuleOverallStatusResponse } from '@/api/forward';
import type { Node } from '@/api/node';
import type { ResourceGroup } from '@/api/resource';
import type { RowSelectionState, OnChangeFn } from '@tanstack/react-table';
import type { ForwardRuleGroupBy } from '../hooks/useForwardRules';

// Rule type display config
const RULE_TYPE_GROUP_CONFIG: Record<string, { labelKey: string; color: string; bgColor: string }> = {
  direct: { labelKey: 'admin.forwardRules.ruleType.direct', color: 'text-info', bgColor: 'bg-info/10' },
  entry: { labelKey: 'admin.forwardRules.ruleType.entry', color: 'text-success', bgColor: 'bg-success/10' },
  chain: { labelKey: 'admin.forwardRules.ruleType.chain', color: 'text-relay', bgColor: 'bg-relay/10' },
  direct_chain: { labelKey: 'admin.forwardRules.ruleType.directChain', color: 'text-warning', bgColor: 'bg-warning/10' },
  external: { labelKey: 'admin.forwardRules.ruleType.external', color: 'text-info', bgColor: 'bg-info/10' },
};

interface RuleGroup {
  key: string;
  label: string;
  icon?: React.ReactNode;
  badgeColor?: string;
  badgeBg?: string;
  rules: ForwardRule[];
  totalTraffic: number;
  enabledCount: number;
}

interface GroupedForwardRuleListProps {
  rules: ForwardRule[];
  groupBy: ForwardRuleGroupBy;
  agentsMap: Record<string, ForwardAgent>;
  resourceGroupsMap?: Record<string, ResourceGroup>;
  nodes: Node[];
  polledStatusMap?: Record<string, RuleOverallStatusResponse>;
  pollingRuleIds?: string[];
  loading?: boolean;
  // Rule action callbacks
  onEdit: (rule: ForwardRule) => void;
  onDelete: (rule: ForwardRule) => void;
  onEnable: (rule: ForwardRule) => void;
  onDisable: (rule: ForwardRule) => void;
  onResetTraffic: (rule: ForwardRule) => void;
  onViewDetail: (rule: ForwardRule) => void;
  onProbe: (rule: ForwardRule) => void;
  onCopy: (rule: ForwardRule) => void;
  probingRuleId?: string | null;
  // Selection
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  enableSelection?: boolean;
}

export const GroupedForwardRuleList: React.FC<GroupedForwardRuleListProps> = ({
  rules,
  groupBy,
  agentsMap,
  resourceGroupsMap,
  nodes,
  polledStatusMap,
  pollingRuleIds,
  loading = false,
  onEdit,
  onDelete,
  onEnable,
  onDisable,
  onResetTraffic,
  onViewDetail,
  onProbe,
  onCopy,
  probingRuleId,
  rowSelection,
  onRowSelectionChange,
  enableSelection,
}) => {
  const { t } = useTranslation();

  // Track collapsed groups (all open by default)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Build groups
  const groups = useMemo<RuleGroup[]>(() => {
    const groupMap = new Map<string, ForwardRule[]>();

    for (const rule of rules) {
      let key: string;
      if (groupBy === 'agent') {
        key = rule.agentId || '_unknown';
      } else {
        key = rule.ruleType || 'direct';
      }

      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(rule);
    }

    const result: RuleGroup[] = [];
    for (const [key, groupRules] of groupMap) {
      const totalTraffic = groupRules.reduce(
        (sum, r) => sum + (r.uploadBytes || 0) + (r.downloadBytes || 0),
        0,
      );
      const enabledCount = groupRules.filter((r) => r.status === 'enabled').length;

      let label: string;
      let icon: React.ReactNode | undefined;
      let badgeColor: string | undefined;
      let badgeBg: string | undefined;

      if (groupBy === 'agent') {
        const agent = agentsMap[key];
        label = agent?.name || t('admin.forwardRules.groupHeader.unknownAgent');
        icon = <Bot className="size-4 text-success" />;
        if (agent?.publicAddress) {
          label += ` (${agent.publicAddress})`;
        }
      } else {
        const config = RULE_TYPE_GROUP_CONFIG[key];
        label = config ? t(config.labelKey) : key;
        badgeColor = config?.color;
        badgeBg = config?.bgColor;
      }

      result.push({
        key,
        label,
        icon,
        badgeColor,
        badgeBg,
        rules: groupRules,
        totalTraffic,
        enabledCount,
      });
    }

    // Sort: by rule count descending
    result.sort((a, b) => b.rules.length - a.rules.length);
    return result;
  }, [rules, groupBy, agentsMap, t]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border bg-card animate-pulse h-16" />
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        {t('admin.forwardRules.noData')}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {groups.map((group) => {
        const isOpen = !collapsedGroups.has(group.key);
        return (
          <Collapsible
            key={group.key}
            open={isOpen}
            onOpenChange={() => toggleGroup(group.key)}
          >
            {/* Group header */}
            <CollapsibleTrigger className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
              <ChevronDown className="size-4 text-muted-foreground shrink-0 transition-transform duration-200" />
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {group.icon}
                {group.badgeBg ? (
                  <span className={`inline-flex items-center px-1.5 py-0.5 text-[11px] font-semibold rounded ${group.badgeBg} ${group.badgeColor}`}>
                    {group.label}
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-foreground truncate">{group.label}</span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                <span>
                  {t('admin.forwardRules.groupHeader.rulesCount', { count: group.rules.length })}
                </span>
                <span className="text-success">{group.enabledCount} {t('common.status.enabled')}</span>
                {group.totalTraffic > 0 && (
                  <span className="tabular-nums font-mono">
                    {formatBytesGB(group.totalTraffic)}
                  </span>
                )}
              </div>
            </CollapsibleTrigger>

            {/* Group content - reuse ForwardRuleListTable without pagination */}
            <CollapsibleContent>
              <div className="mt-1">
                <ForwardRuleListTable
                  rules={group.rules}
                  agentsMap={agentsMap}
                  resourceGroupsMap={resourceGroupsMap}
                  nodes={nodes}
                  polledStatusMap={polledStatusMap}
                  pollingRuleIds={pollingRuleIds}
                  loading={false}
                  page={1}
                  pageSize={group.rules.length}
                  total={group.rules.length}
                  onPageChange={() => {}}
                  onPageSizeChange={() => {}}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onEnable={onEnable}
                  onDisable={onDisable}
                  onResetTraffic={onResetTraffic}
                  onViewDetail={onViewDetail}
                  onProbe={onProbe}
                  onCopy={onCopy}
                  probingRuleId={probingRuleId}
                  rowSelection={rowSelection}
                  onRowSelectionChange={onRowSelectionChange}
                  enableSelection={enableSelection}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
};

GroupedForwardRuleList.displayName = 'GroupedForwardRuleList';
