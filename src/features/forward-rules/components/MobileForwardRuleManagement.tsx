/**
 * MobileForwardRuleManagement - Tailwind Application UI style mobile management
 *
 * Design principles:
 * - Unified toolbar with search + filters
 * - Stacked list with divide-y instead of separate cards
 * - Clean header with result count
 * - Minimal visual decoration
 * - Long-press to drag sort (when no filter active)
 * - Tap card to open detail sheet
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, ArrowLeftRight } from 'lucide-react';
import { useMobileListFilter, useMobileDetailSheet } from '@/hooks';
import {
  MobilePagination,
  MobileListToolbar,
  MobileListContainer,
  type FilterPillOption,
} from '@/components/mobile';
import { MobileForwardRuleCard } from './MobileForwardRuleCard';
import { ForwardRuleDetailSheet } from './ForwardRuleDetailSheet';
import type { ForwardRule, ForwardAgent, RuleOverallStatusResponse } from '@/api/forward';
import type { Node } from '@/api/node';

// ============================================================================
// Types
// ============================================================================

export interface MobileForwardRuleManagementProps {
  rules: ForwardRule[];
  agentsMap?: Record<string, ForwardAgent>;
  nodes?: Node[];
  polledStatusMap?: Record<string, RuleOverallStatusResponse>;
  pollingRuleIds?: string[];
  loading?: boolean;
  refreshing?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (rule: ForwardRule) => void;
  onCopy: (rule: ForwardRule) => void;
  onToggleStatus: (rule: ForwardRule) => void;
  onDelete: (rule: ForwardRule) => void;
  onProbe: (rule: ForwardRule) => void;
  onPageChange: (page: number) => void;
  // Drag sort
  onDragEnd?: (activeId: string, overId: string, oldIndex: number, newIndex: number) => void;
  probingRuleId?: string;
}

type StatusFilter = 'all' | 'enabled' | 'disabled' | 'direct' | 'entry' | 'chain' | 'direct_chain';

// ============================================================================
// Main Component
// ============================================================================

export const MobileForwardRuleManagement = ({
  rules,
  agentsMap = {},
  nodes = [],
  polledStatusMap = {},
  pollingRuleIds = [],
  loading = false,
  refreshing = false,
  page,
  pageSize,
  total,
  onRefresh,
  onCreate,
  onEdit,
  onCopy,
  onToggleStatus,
  onDelete,
  onProbe,
  onPageChange,
  onDragEnd,
  probingRuleId,
}: MobileForwardRuleManagementProps) => {
  const { t } = useTranslation();

  // Use shared filter hook
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredItems: filteredRules,
    clearFilters,
    hasFilter,
  } = useMobileListFilter<ForwardRule, StatusFilter>({
    items: rules,
    defaultFilter: 'all',
    searchFields: ['name', 'remark', 'id'],
    filterFn: (rule, filter) => {
      if (filter === 'enabled') return rule.status === 'enabled';
      if (filter === 'disabled') return rule.status === 'disabled';
      if (filter === 'direct') return rule.ruleType === 'direct';
      if (filter === 'entry') return rule.ruleType === 'entry';
      if (filter === 'chain') return rule.ruleType === 'chain';
      if (filter === 'direct_chain') return rule.ruleType === 'direct_chain';
      return true;
    },
  });

  // Use shared detail sheet hook
  const {
    selectedItem: selectedRule,
    isOpen: detailSheetOpen,
    openSheet: handleCardPress,
    setOpen: setDetailSheetOpen,
  } = useMobileDetailSheet<ForwardRule>();

  // Build filter options with counts
  const filterOptions = useMemo<FilterPillOption<StatusFilter>[]>(() => {
    const enabled = rules.filter((r) => r.status === 'enabled').length;
    const disabled = rules.filter((r) => r.status === 'disabled').length;
    const direct = rules.filter((r) => r.ruleType === 'direct').length;
    const entry = rules.filter((r) => r.ruleType === 'entry').length;
    const chain = rules.filter((r) => r.ruleType === 'chain').length;
    const directChain = rules.filter((r) => r.ruleType === 'direct_chain').length;

    return [
      { value: 'all', label: t('filter.all'), count: total },
      { value: 'enabled', label: t('common.status.enabled'), count: enabled },
      { value: 'disabled', label: t('common.status.disabled'), count: disabled },
      { value: 'direct', label: t('admin.forwardRules.ruleType.direct'), count: direct },
      { value: 'entry', label: t('admin.forwardRules.ruleType.entry'), count: entry },
      { value: 'chain', label: t('admin.forwardRules.ruleType.chain'), count: chain },
      { value: 'direct_chain', label: t('admin.forwardRules.ruleType.directChain'), count: directChain },
    ];
  }, [rules, total, t]);

  return (
    <div className="space-y-3">
      {/* Unified Toolbar: Search + Filters + Actions */}
      <MobileListToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('common.placeholders.search')}
        filterOptions={filterOptions}
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onCreate={onCreate}
        createLabel={t('admin.forwardRules.add')}
      />

      {/* Rule List - long press to drag sort (only when no filter active) */}
      <MobileListContainer
        items={filteredRules}
        loading={loading}
        hasFilter={hasFilter}
        emptyIcon={ArrowLeftRight}
        emptyTitle={t('admin.forwardRules.noData')}
        emptyDescription={t('admin.forwardRules.add')}
        emptyAction={{
          label: t('admin.forwardRules.add'),
          onClick: onCreate,
          icon: Plus,
        }}
        filterEmptyTitle={t('common.messages.noResults')}
        filterEmptyDescription={t('subscription.tryAdjustSearch')}
        onClearFilters={clearFilters}
        skeletonCount={5}
        skeletonMetadataCount={2}
        getItemId={(rule) => rule.id}
        renderItem={(rule) => (
          <MobileForwardRuleCard
            rule={rule}
            agentsMap={agentsMap}
            polledStatus={polledStatusMap[rule.id]}
            isPolling={pollingRuleIds.includes(rule.id)}
            onCardPress={handleCardPress}
          />
        )}
        draggable={!!onDragEnd}
        onDragEnd={onDragEnd}
      />

      {/* Pagination */}
      {!loading && filteredRules.length > 0 && (
        <MobilePagination
          page={page}
          total={total}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}

      {/* Rule Detail Sheet */}
      <ForwardRuleDetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        rule={selectedRule}
        agentsMap={agentsMap}
        nodes={nodes}
        polledStatus={selectedRule ? polledStatusMap[selectedRule.id] : null}
        onEdit={onEdit}
        onProbe={onProbe}
        onCopy={onCopy}
        onToggleStatus={onToggleStatus}
        onDelete={onDelete}
        isProbingThis={selectedRule?.id === probingRuleId}
      />
    </div>
  );
};

MobileForwardRuleManagement.displayName = 'MobileForwardRuleManagement';
