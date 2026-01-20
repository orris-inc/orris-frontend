/**
 * External Forward Rules Section Component
 * A self-contained section for managing external forward rules within a subscription
 * Provides responsive desktop/mobile views with page-based create/edit navigation
 *
 * Mobile enhancements:
 * - Compact stats summary (total/enabled/disabled)
 * - Segmented filter for quick status filtering
 * - Improved action bar layout
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Plus, Globe, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { MobileSegmentedFilter, type SegmentOption } from '@/components/mobile';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import type { ExternalForwardRule, ExternalForwardStatus } from '@/api/externalforward/types';
import { useExternalForwardRulesSection } from '../hooks/useExternalForwardRules';
import { ExternalForwardRuleList } from './ExternalForwardRuleList';
import { ExternalForwardRuleMobileList } from './ExternalForwardRuleMobileList';

interface ExternalForwardRulesSectionProps {
  subscriptionId: string;
}

// Status filter options with i18n keys
type StatusFilter = 'all' | ExternalForwardStatus;

interface StatusFilterOption extends SegmentOption<StatusFilter> {
  labelKey: string;
}

const STATUS_FILTER_OPTIONS: StatusFilterOption[] = [
  { value: 'all', label: '', labelKey: 'filter.all' },
  { value: 'enabled', label: '', labelKey: 'common.status.enabled' },
  { value: 'disabled', label: '', labelKey: 'common.status.disabled', hideWhenZero: true },
];

export const ExternalForwardRulesSection: React.FC<ExternalForwardRulesSectionProps> = ({
  subscriptionId,
}) => {
  const { t } = useTranslation();
  const { isMobile } = useBreakpoint();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const {
    rules,
    pagination,
    isLoading,
    deleteRule,
    enableRule,
    disableRule,
    isDeleting,
    isEnabling,
    isDisabling,
    handlePageChange,
    handlePageSizeChange,
  } = useExternalForwardRulesSection(subscriptionId);

  // Calculate stats from rules
  const stats = useMemo(() => {
    const enabled = rules.filter((r) => r.status === 'enabled').length;
    const disabled = rules.filter((r) => r.status === 'disabled').length;
    return { total: pagination.total, enabled, disabled };
  }, [rules, pagination.total]);

  // Build filter options with translated labels and counts
  const filterOptionsWithCounts = useMemo(() => {
    return STATUS_FILTER_OPTIONS.map((opt) => {
      let count: number;
      switch (opt.value) {
        case 'all':
          count = stats.total;
          break;
        case 'enabled':
          count = stats.enabled;
          break;
        case 'disabled':
          count = stats.disabled;
          break;
        default:
          count = 0;
      }
      return { ...opt, label: t(opt.labelKey), count };
    });
  }, [stats, t]);

  // Filter rules by status (client-side)
  const filteredRules = useMemo(() => {
    if (statusFilter === 'all') return rules;
    return rules.filter((rule) => rule.status === statusFilter);
  }, [rules, statusFilter]);

  const handleCreateClick = useCallback(() => {
    navigate(`/dashboard/subscriptions/${subscriptionId}/external-rules/create`);
  }, [navigate, subscriptionId]);

  const handleEditClick = useCallback((rule: ExternalForwardRule) => {
    navigate(`/dashboard/subscriptions/${subscriptionId}/external-rules/${rule.id}/edit`);
  }, [navigate, subscriptionId]);

  const handleDeleteClick = useCallback(async (rule: ExternalForwardRule) => {
    try {
      await deleteRule(rule.id);
    } catch {
      // Error already handled in hook
    }
  }, [deleteRule]);

  const handleToggleStatus = useCallback(async (rule: ExternalForwardRule) => {
    try {
      if (rule.status === 'enabled') {
        await disableRule(rule.id);
      } else {
        await enableRule(rule.id);
      }
    } catch {
      // Error already handled in hook
    }
  }, [disableRule, enableRule]);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Mobile: Stats summary */}
      {isMobile && !isLoading && (
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-1.5">
            <Globe className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">{t('admin.stats.total')}</span>
            <span className="font-semibold text-foreground tabular-nums">{stats.total}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-success" />
            <span className="text-muted-foreground">{t('common.status.enabled')}</span>
            <span className="font-semibold text-success tabular-nums">{stats.enabled}</span>
          </div>
          {stats.disabled > 0 && (
            <div className="flex items-center gap-1.5">
              <XCircle className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{t('common.status.disabled')}</span>
              <span className="font-semibold text-muted-foreground tabular-nums">{stats.disabled}</span>
            </div>
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center justify-between gap-2">
        {!isMobile && (
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t('externalForwardRules.totalCount', { count: pagination.total })}
          </p>
        )}
        {isMobile && <div className="flex-1" />}
        <Button
          onClick={handleCreateClick}
          size="sm"
          className="gap-1.5 h-8 sm:h-9 text-xs sm:text-sm"
        >
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">{t('externalForwardRules.createRule')}</span>
          <span className="sm:hidden">{t('common.actions.create')}</span>
        </Button>
      </div>

      {/* Mobile: Segmented filter */}
      {isMobile && (
        <MobileSegmentedFilter
          options={filterOptionsWithCounts}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      )}

      {/* Rule list - responsive */}
      {isMobile ? (
        <ExternalForwardRuleMobileList
          rules={filteredRules}
          isLoading={isLoading}
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onPageChange={handlePageChange}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onToggleStatus={handleToggleStatus}
          onEnabling={isEnabling}
          onDisabling={isDisabling}
          onDeleting={isDeleting}
        />
      ) : (
        <ExternalForwardRuleList
          rules={rules}
          isLoading={isLoading}
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onToggleStatus={handleToggleStatus}
          onEnabling={isEnabling}
          onDisabling={isDisabling}
          onDeleting={isDeleting}
        />
      )}
    </div>
  );
};
