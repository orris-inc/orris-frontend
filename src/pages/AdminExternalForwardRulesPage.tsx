/**
 * Admin External Forward Rules Management Page
 * High-density data management interface for admin
 * Uses ResponsiveModal for automatic Dialog/Sheet switching
 */

import { useState, useMemo, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Globe,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Search,
  FilterX,
  Plus,
} from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { AdminLayout } from '@/layouts/AdminLayout';
import { AdminButton, AdminCard } from '@/components/admin';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { usePageTitle } from '@/shared/hooks';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import {
  useAdminExternalForwardRulesPage,
  type AdminExternalForwardRuleFilters,
} from '@/features/admin-external-forward-rules/hooks/useAdminExternalForwardRules';
import { AdminExternalForwardRuleList } from '@/features/admin-external-forward-rules/components/AdminExternalForwardRuleList';
import { MobileAdminExternalForwardRulesView } from '@/features/admin-external-forward-rules/components/MobileAdminExternalForwardRulesView';
import type { AdminExternalForwardRule, AdminExternalForwardStatus } from '@/api/admin/types';

// Lazy load responsive modal components
const AdminCreateExternalForwardRuleModal = lazy(() =>
  import('@/features/admin-external-forward-rules/components/AdminExternalForwardRuleModal').then((m) => ({
    default: m.AdminCreateExternalForwardRuleModal,
  }))
);

const AdminEditExternalForwardRuleModal = lazy(() =>
  import('@/features/admin-external-forward-rules/components/AdminExternalForwardRuleModal').then((m) => ({
    default: m.AdminEditExternalForwardRuleModal,
  }))
);

export const AdminExternalForwardRulesPage = () => {
  const { t } = useTranslation();
  usePageTitle(t('admin.externalForwardRules.title'));

  const {
    rules,
    pagination,
    isLoading,
    isFetching,
    refetch,
    filters,
    handleFiltersChange,
    handlePageChange,
    handlePageSizeChange,
    handleToggleStatus,
    createRule,
    updateRule,
    deleteRule,
    isCreating,
    isUpdating,
    selectedRule,
    setSelectedRule,
  } = useAdminExternalForwardRulesPage();

  const { isMobile } = useBreakpoint();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Calculate stats from current page data
  const stats = useMemo(() => {
    const total = pagination.total;
    const enabled = rules.filter((r) => r.status === 'enabled').length;
    const disabled = rules.filter((r) => r.status === 'disabled').length;
    return { total, enabled, disabled };
  }, [rules, pagination.total]);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    refetch();
  };

  const handleCreateSubmit = async (data: Parameters<typeof createRule>[0]) => {
    await createRule(data);
    setCreateModalOpen(false);
  };

  const handleEdit = (rule: AdminExternalForwardRule) => {
    setSelectedRule(rule);
    setEditModalOpen(true);
  };

  const handleUpdateSubmit = async (ruleId: string, data: Parameters<typeof updateRule>[1]) => {
    await updateRule(ruleId, data);
    setEditModalOpen(false);
    setSelectedRule(null);
  };

  const handleDelete = async (rule: AdminExternalForwardRule) => {
    await deleteRule(rule.id);
  };

  // Filter handlers
  const handleStatusChange = (value: string): void => {
    handleFiltersChange({ status: value === '_all_' ? undefined : (value as AdminExternalForwardStatus) });
  };

  const handleExternalSourceChange = (value: string): void => {
    handleFiltersChange({ externalSource: value || undefined });
  };

  const handleResetFilters = (): void => {
    handleFiltersChange({
      status: undefined,
      externalSource: undefined,
    } as Partial<AdminExternalForwardRuleFilters>);
  };

  const hasActiveFilters = !!(filters.status || filters.externalSource);

  // Handler for mobile status filter
  const handleMobileStatusFilterChange = (status: AdminExternalForwardStatus | undefined) => {
    handleFiltersChange({ status });
  };

  // Shared modal components - work on both desktop and mobile
  const modals = (
    <>
      {/* Create Modal - responsive (Dialog on desktop, Sheet on mobile) */}
      {createModalOpen && (
        <Suspense fallback={null}>
          <AdminCreateExternalForwardRuleModal
            open={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onSubmit={handleCreateSubmit}
            isCreating={isCreating}
          />
        </Suspense>
      )}

      {/* Edit Modal - responsive (Dialog on desktop, Sheet on mobile) */}
      {editModalOpen && (
        <Suspense fallback={null}>
          <AdminEditExternalForwardRuleModal
            open={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedRule(null);
            }}
            onSubmit={handleUpdateSubmit}
            rule={selectedRule}
            isUpdating={isUpdating}
          />
        </Suspense>
      )}
    </>
  );

  // Mobile view - iOS-style
  if (isMobile) {
    return (
      <AdminLayout>
        <div className="py-3">
          <MobileAdminExternalForwardRulesView
            rules={rules}
            loading={isLoading}
            refreshing={isFetching}
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            enabledCount={stats.enabled}
            disabledCount={stats.disabled}
            onRefresh={handleRefresh}
            onCreate={() => setCreateModalOpen(true)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            onPageChange={handlePageChange}
            onStatusFilterChange={handleMobileStatusFilterChange}
            statusFilter={filters.status}
          />
        </div>
        {modals}
      </AdminLayout>
    );
  }

  // Desktop view
  return (
    <AdminLayout>
      <div className="py-3 space-y-3">
        {/* High-Density Status Bar with Integrated Filters */}
        <header className="bg-card rounded-lg border border-border px-3 py-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Left: Title + Primary Stats */}
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-semibold text-foreground">{t('admin.externalForwardRules.title')}</h1>
              <div className="h-4 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-2.5 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Globe className="size-3" />
                  <span className="font-medium text-foreground">{stats.total}</span>
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="size-3 text-success" />
                  <span className="font-medium text-success">{stats.enabled}</span>
                </span>
                {stats.disabled > 0 && (
                  <span className="flex items-center gap-1">
                    <XCircle className="size-3 text-muted-foreground" />
                    <span className="font-medium text-muted-foreground">{stats.disabled}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Center: Filters */}
            <div className="hidden md:flex items-center gap-2 flex-1 justify-center max-w-lg">
              {/* Status filter */}
              <Select value={filters.status || '_all_'} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-7 w-24 text-xs">
                  <SelectValue placeholder={t('admin.externalForwardRules.filters.status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all_">{t('filter.all')}</SelectItem>
                  <SelectItem value="enabled">{t('common.status.enabledShort')}</SelectItem>
                  <SelectItem value="disabled">{t('common.status.disabledShort')}</SelectItem>
                </SelectContent>
              </Select>

              {/* External source filter */}
              <div className="relative flex-1 max-w-[200px]">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                <Input
                  placeholder={t('admin.externalForwardRules.filters.externalSource')}
                  value={filters.externalSource || ''}
                  onChange={(e) => handleExternalSourceChange(e.target.value)}
                  className="h-7 pl-7 text-xs"
                />
              </div>

              {/* Reset button */}
              {hasActiveFilters && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleResetFilters}
                      className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      <FilterX className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{t('admin.externalForwardRules.resetFilters')}</TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5">
              <AdminButton
                variant="primary"
                size="sm"
                onClick={() => setCreateModalOpen(true)}
                className="h-7"
                icon={<Plus className="size-3.5" strokeWidth={1.5} />}
              >
                {t('common.actions.create')}
              </AdminButton>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AdminButton
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    className="h-7 w-7 p-0"
                    icon={
                      <RefreshCw
                        key={refreshKey}
                        className="size-3.5 animate-spin-once"
                        strokeWidth={1.5}
                      />
                    }
                  >
                    <span className="sr-only">{t('common.actions.refresh')}</span>
                  </AdminButton>
                </TooltipTrigger>
                <TooltipContent>{t('admin.externalForwardRules.refreshList')}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        {/* External Forward Rules List Table */}
        <AdminCard noPadding>
          <AdminExternalForwardRuleList
            rules={rules}
            isLoading={isLoading || isFetching}
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />
        </AdminCard>
      </div>
      {modals}
    </AdminLayout>
  );
};
