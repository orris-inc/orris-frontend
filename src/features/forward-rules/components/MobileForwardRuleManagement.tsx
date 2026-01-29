/**
 * MobileForwardRuleManagement - Tailwind Application UI style mobile management
 *
 * Design principles:
 * - Unified toolbar with search + filters
 * - Server-side filtering with MobileForwardRuleFiltersSheet
 * - Stacked list with divide-y instead of separate cards
 * - Clean header with result count
 * - Minimal visual decoration
 * - Long-press to drag sort (when no filter active)
 * - Tap card to open detail sheet
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, ArrowLeftRight } from 'lucide-react';
import { useMobileDetailSheet } from '@/hooks';
import {
  MobilePagination,
  MobileListToolbar,
  MobileListContainer,
} from '@/components/mobile';
import { MobileForwardRuleCard } from './MobileForwardRuleCard';
import { ForwardRuleDetailSheet } from './ForwardRuleDetailSheet';
import {
  MobileForwardRuleFiltersSheet,
  MobileFilterButton,
} from './MobileForwardRuleFiltersSheet';
import type { ForwardRule, ForwardAgent, RuleOverallStatusResponse } from '@/api/forward';
import type { Node } from '@/api/node';
import type { ForwardRuleFilters } from '../hooks/useForwardRules';

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
  /** Server-side filters */
  filters: ForwardRuleFilters;
  hasFilters: boolean;
  onFiltersChange: (filters: Partial<ForwardRuleFilters>) => void;
  onClearFilters: () => void;
  /** Include user rules toggle */
  includeUserRules?: boolean;
  onIncludeUserRulesChange?: (include: boolean) => void;
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
  filters,
  hasFilters,
  onFiltersChange,
  onClearFilters,
  includeUserRules = false,
  onIncludeUserRulesChange,
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

  // Filter sheet state
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Local search for quick client-side filtering
  const [searchQuery, setSearchQuery] = useState('');

  // Use shared detail sheet hook
  const {
    selectedItem: selectedRule,
    isOpen: detailSheetOpen,
    openSheet: handleCardPress,
    setOpen: setDetailSheetOpen,
  } = useMobileDetailSheet<ForwardRule>();

  // Client-side search filtering (quick find within current page)
  const filteredRules = useMemo(() => {
    if (!searchQuery.trim()) return rules;
    const query = searchQuery.toLowerCase();
    return rules.filter(
      (rule) =>
        rule.name.toLowerCase().includes(query) ||
        rule.remark?.toLowerCase().includes(query) ||
        rule.id.toLowerCase().includes(query)
    );
  }, [rules, searchQuery]);

  // Check if we have local search filter active
  const hasLocalFilter = searchQuery.trim().length > 0;

  // Clear local search
  const clearLocalSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="space-y-3">
      {/* Unified Toolbar: Search + Filter Button + Actions */}
      <MobileListToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('common.placeholders.search')}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onCreate={onCreate}
        createLabel={t('admin.forwardRules.add')}
        extraActions={
          <MobileFilterButton
            hasFilters={hasFilters}
            onClick={() => setFilterSheetOpen(true)}
          />
        }
      />

      {/* Rule List - long press to drag sort (only when no filter active) */}
      <MobileListContainer
        items={filteredRules}
        loading={loading}
        hasFilter={hasLocalFilter || hasFilters}
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
        onClearFilters={() => {
          clearLocalSearch();
          onClearFilters();
        }}
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

      {/* Filter Sheet */}
      <MobileForwardRuleFiltersSheet
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        filters={filters}
        onFiltersChange={onFiltersChange}
        hasFilters={hasFilters}
        onClearFilters={onClearFilters}
        includeUserRules={includeUserRules}
        onIncludeUserRulesChange={onIncludeUserRulesChange}
      />
    </div>
  );
};

MobileForwardRuleManagement.displayName = 'MobileForwardRuleManagement';
