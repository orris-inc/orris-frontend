/**
 * User Forward Rules Management Page
 * Responsive design with iOS 26 Liquid Glass style for mobile
 */

import { useState, useMemo, useCallback, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, AlertCircle, Zap } from 'lucide-react';
import { Link } from 'react-router';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/common/Button';
import { usePageTitle } from '@/shared/hooks';
import { useBreakpoint } from '@/hooks';
import {
  useUserForwardRulesPage,
  UserForwardUsageCard,
  UserForwardRuleList,
  UserForwardRuleMobileList,
} from '@/features/user-forward-rules';
import { useBatchForwardRules } from '@/features/forward-rules/hooks/useBatchForwardRules';

// Lazy load Dialog/Sheet components
const CreateUserForwardRuleDialog = lazy(() =>
  import('@/features/user-forward-rules/components/CreateUserForwardRuleDialog').then((m) => ({
    default: m.CreateUserForwardRuleDialog,
  }))
);

const EditUserForwardRuleDialog = lazy(() =>
  import('@/features/user-forward-rules/components/EditUserForwardRuleDialog').then((m) => ({
    default: m.EditUserForwardRuleDialog,
  }))
);

const BatchActionBar = lazy(() =>
  import('@/features/forward-rules/components/batch').then((m) => ({
    default: m.BatchActionBar,
  }))
);

const BatchDeleteDialog = lazy(() =>
  import('@/features/forward-rules/components/batch').then((m) => ({
    default: m.BatchDeleteDialog,
  }))
);

const BatchToggleStatusDialog = lazy(() =>
  import('@/features/forward-rules/components/batch').then((m) => ({
    default: m.BatchToggleStatusDialog,
  }))
);

const BatchUpdateDialog = lazy(() =>
  import('@/features/forward-rules/components/batch').then((m) => ({
    default: m.BatchUpdateDialog,
  }))
);

const MobileBatchActionSheet = lazy(() =>
  import('@/features/forward-rules/components/batch').then((m) => ({
    default: m.MobileBatchActionSheet,
  }))
);
import type { ForwardRule, CreateForwardRuleRequest, UpdateForwardRuleRequest } from '@/api/forward';
import { canCreateMoreRules } from '@/api/forward';
import type { RowSelectionState } from '@tanstack/react-table';

export const UserForwardRulesPage = () => {
  const { t } = useTranslation();
  usePageTitle(t('userForwardRules.pageTitle'));
  const { isMobile } = useBreakpoint();

  const {
    forwardRules,
    pagination,
    isLoading,
    usage,
    isUsageLoading,
    agentsMap,
    selectedRule,
    setSelectedRule,
    createForwardRule,
    updateForwardRule,
    deleteForwardRule,
    enableForwardRule,
    disableForwardRule,
    isCreating,
    isUpdating,
    isDeleting,
    isEnabling,
    isDisabling,
    handlePageChange,
    handlePageSizeChange,
    handleDragEnd,
  } = useUserForwardRulesPage();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Batch operation states
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
  const [batchEnableOpen, setBatchEnableOpen] = useState(false);
  const [batchDisableOpen, setBatchDisableOpen] = useState(false);
  const [batchUpdateOpen, setBatchUpdateOpen] = useState(false);
  const [mobileActionSheetOpen, setMobileActionSheetOpen] = useState(false);

  // Batch operations hook
  const {
    selectedIds,
    selectedIdsArray,
    selectedCount,
    isSelectMode,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    enterSelectMode,
    exitSelectMode,
    batchDelete,
    batchEnable,
    batchDisable,
    batchUpdate,
    isDeleting: isBatchDeleting,
    isEnabling: isBatchEnabling,
    isDisabling: isBatchDisabling,
    isUpdating: isBatchUpdating,
  } = useBatchForwardRules({ isAdmin: false });

  // Convert Set<string> to Record<string, boolean> for DataTable
  const rowSelection: RowSelectionState = useMemo(() => {
    const selection: RowSelectionState = {};
    selectedIds.forEach((id) => {
      selection[id] = true;
    });
    return selection;
  }, [selectedIds]);

  // Convert agentsMap to array for dialog components
  const forwardAgents = useMemo(() => Object.values(agentsMap), [agentsMap]);

  // Handle row selection change from DataTable
  const handleRowSelectionChange = useCallback(
    (updaterOrValue: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => {
      const newSelection =
        typeof updaterOrValue === 'function' ? updaterOrValue(rowSelection) : updaterOrValue;

      const newIds = Object.keys(newSelection).filter((id) => newSelection[id]);
      clearSelection();
      if (newIds.length > 0) {
        toggleSelectAll(newIds);
      }
    },
    [rowSelection, clearSelection, toggleSelectAll]
  );

  // Open mobile action sheet when items are selected in select mode
  useEffect(() => {
    if (isMobile && selectedCount > 0) {
      setMobileActionSheetOpen(true);
    }
  }, [isMobile, selectedCount]);

  // Check if user has no subscription (no allowed types)
  const hasNoSubscription = usage && usage.allowedTypes.length === 0;

  // Check if rule limit is reached (ruleLimit=0 means unlimited)
  const isAtLimit = usage ? !canCreateMoreRules(usage) : false;

  // Wrap page change to clear selection
  const handlePageChangeWithClear = useCallback(
    (page: number) => {
      clearSelection();
      handlePageChange(page);
    },
    [clearSelection, handlePageChange]
  );

  const handleCreateClick = () => {
    setCreateDialogOpen(true);
  };

  const handleEditClick = (rule: ForwardRule) => {
    setSelectedRule(rule);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = async (rule: ForwardRule) => {
    try {
      await deleteForwardRule(rule.id);
    } catch {
      // Error already handled in hook
    }
  };

  const handleToggleStatus = async (rule: ForwardRule) => {
    try {
      if (rule.status === 'enabled') {
        await disableForwardRule(rule.id);
      } else {
        await enableForwardRule(rule.id);
      }
    } catch {
      // Error already handled in hook
    }
  };

  const handleCreateSubmit = async (data: CreateForwardRuleRequest) => {
    try {
      await createForwardRule(data);
      setCreateDialogOpen(false);
    } catch {
      // Error already handled in hook
    }
  };

  const handleEditSubmit = async (id: string, data: UpdateForwardRuleRequest) => {
    try {
      await updateForwardRule(id, data);
      setEditDialogOpen(false);
      setSelectedRule(null);
    } catch {
      // Error already handled in hook
    }
  };

  return (
    <DashboardLayout
      pageTitle={t('userForwardRules.pageTitle')}
      pageDescription={t('userForwardRules.pageDescription')}
      pageActions={
        <Button
          onClick={handleCreateClick}
          disabled={isAtLimit || isUsageLoading}
          className="gap-2 h-9 px-3 touch-manipulation"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t('userForwardRules.addRule')}</span>
          <span className="sm:hidden">{t('userForwardRules.addRuleShort')}</span>
        </Button>
      }
    >
      <div className="space-y-4 sm:space-y-6 pb-safe">

        {/* No subscription prompt */}
        {hasNoSubscription && (
          <div className="glass rounded-2xl flex flex-col items-center justify-center py-12 sm:py-16 px-4">
            <div className="p-4 rounded-full bg-warning/10 mb-4 sm:mb-6">
              <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 text-warning" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold mb-2 text-center">{t('userForwardRules.noSubscription.title')}</h2>
            <p className="text-sm sm:text-base text-muted-foreground text-center max-w-md mb-4 sm:mb-6">
              {t('userForwardRules.noSubscription.description')}
            </p>
            <Button asChild className="min-h-[44px] px-6">
              <Link to="/dashboard/pricing" className="gap-2">
                <Zap className="h-4 w-4" />
                {t('userForwardRules.noSubscription.viewPlans')}
              </Link>
            </Button>
          </div>
        )}

        {/* Show normal content when subscription exists */}
        {!hasNoSubscription && (
          <>
            {/* Usage quota card */}
            <UserForwardUsageCard usage={usage} isLoading={isUsageLoading} />

            {/* Rule limit reached warning */}
            {isAtLimit && (
              <div className="glass rounded-xl flex items-start sm:items-center gap-3 p-3 sm:p-4 bg-warning/10 ring-1 ring-warning/20">
                <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5 sm:mt-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-warning text-sm sm:text-base">{t('userForwardRules.limitReached.title')}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t('userForwardRules.limitReached.description', { count: usage?.ruleCount })}
                  </p>
                </div>
              </div>
            )}

            {/* Action bar */}
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">
                {t('userForwardRules.totalRules', { count: pagination.total })}
              </p>
            </div>

            {/* Batch action bar - show above table when items selected (desktop only) */}
            {selectedCount > 0 && !isMobile && (
              <Suspense fallback={null}>
                <BatchActionBar
                  selectedCount={selectedCount}
                  onBatchDelete={() => setBatchDeleteOpen(true)}
                  onBatchEnable={() => setBatchEnableOpen(true)}
                  onBatchDisable={() => setBatchDisableOpen(true)}
                  onBatchUpdate={() => setBatchUpdateOpen(true)}
                  onClearSelection={clearSelection}
                  isDeleting={isBatchDeleting}
                  isTogglingStatus={isBatchEnabling || isBatchDisabling}
                  isUpdating={isBatchUpdating}
                />
              </Suspense>
            )}

            {/* Rule list - Responsive view */}
            {isMobile ? (
              <UserForwardRuleMobileList
                rules={forwardRules}
                agentsMap={agentsMap}
                isLoading={isLoading}
                page={pagination.page}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onPageChange={handlePageChangeWithClear}
                onPageSizeChange={handlePageSizeChange}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onToggleStatus={handleToggleStatus}
                onEnabling={isEnabling}
                onDisabling={isDisabling}
                onDeleting={isDeleting}
                isSelectMode={isSelectMode}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onEnterSelectMode={enterSelectMode}
                onExitSelectMode={exitSelectMode}
              />
            ) : (
              <UserForwardRuleList
                rules={forwardRules}
                agentsMap={agentsMap}
                isLoading={isLoading}
                page={pagination.page}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onPageChange={handlePageChangeWithClear}
                onPageSizeChange={handlePageSizeChange}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onToggleStatus={handleToggleStatus}
                onEnabling={isEnabling}
                onDisabling={isDisabling}
                onDeleting={isDeleting}
                rowSelection={rowSelection}
                onRowSelectionChange={handleRowSelectionChange}
                enableSelection={true}
                enableDragSort={true}
                onDragEnd={handleDragEnd}
              />
            )}
          </>
        )}
      </div>

      {/* Create rule dialog */}
      {createDialogOpen && (
        <Suspense fallback={null}>
          <CreateUserForwardRuleDialog
            open={createDialogOpen}
            onClose={() => setCreateDialogOpen(false)}
            onSubmit={handleCreateSubmit}
            allowedTypes={usage?.allowedTypes || []}
            isCreating={isCreating}
          />
        </Suspense>
      )}

      {/* Edit rule dialog */}
      {editDialogOpen && (
        <Suspense fallback={null}>
          <EditUserForwardRuleDialog
            open={editDialogOpen}
            onClose={() => {
              setEditDialogOpen(false);
              setSelectedRule(null);
            }}
            onSubmit={handleEditSubmit}
            rule={selectedRule}
            isUpdating={isUpdating}
          />
        </Suspense>
      )}

      {/* Mobile batch action sheet */}
      {isMobile && selectedCount > 0 && (
        <Suspense fallback={null}>
          <MobileBatchActionSheet
            open={mobileActionSheetOpen}
            onOpenChange={setMobileActionSheetOpen}
            selectedCount={selectedCount}
            onBatchDelete={() => {
              setMobileActionSheetOpen(false);
              setBatchDeleteOpen(true);
            }}
            onBatchEnable={() => {
              setMobileActionSheetOpen(false);
              setBatchEnableOpen(true);
            }}
            onBatchDisable={() => {
              setMobileActionSheetOpen(false);
              setBatchDisableOpen(true);
            }}
            onBatchUpdate={() => {
              setMobileActionSheetOpen(false);
              setBatchUpdateOpen(true);
            }}
            onClearSelection={() => {
              exitSelectMode();
              setMobileActionSheetOpen(false);
            }}
            isDeleting={isBatchDeleting}
            isTogglingStatus={isBatchEnabling || isBatchDisabling}
            isUpdating={isBatchUpdating}
          />
        </Suspense>
      )}

      {/* Batch delete dialog */}
      {batchDeleteOpen && (
        <Suspense fallback={null}>
          <BatchDeleteDialog
            open={batchDeleteOpen}
            onOpenChange={setBatchDeleteOpen}
            selectedCount={selectedCount}
            onConfirm={async () => {
              const result = await batchDelete();
              return result;
            }}
            isDeleting={isBatchDeleting}
          />
        </Suspense>
      )}

      {/* Batch enable dialog */}
      {batchEnableOpen && (
        <Suspense fallback={null}>
          <BatchToggleStatusDialog
            open={batchEnableOpen}
            onOpenChange={setBatchEnableOpen}
            selectedCount={selectedCount}
            targetStatus="enabled"
            onConfirm={async () => {
              const result = await batchEnable();
              return result;
            }}
            isProcessing={isBatchEnabling}
          />
        </Suspense>
      )}

      {/* Batch disable dialog */}
      {batchDisableOpen && (
        <Suspense fallback={null}>
          <BatchToggleStatusDialog
            open={batchDisableOpen}
            onOpenChange={setBatchDisableOpen}
            selectedCount={selectedCount}
            targetStatus="disabled"
            onConfirm={async () => {
              const result = await batchDisable();
              return result;
            }}
            isProcessing={isBatchDisabling}
          />
        </Suspense>
      )}

      {/* Batch update dialog */}
      {batchUpdateOpen && (
        <Suspense fallback={null}>
          <BatchUpdateDialog
            open={batchUpdateOpen}
            onOpenChange={setBatchUpdateOpen}
            selectedIds={selectedIdsArray}
            onConfirm={batchUpdate}
            isUpdating={isBatchUpdating}
            agents={forwardAgents}
          />
        </Suspense>
      )}
    </DashboardLayout>
  );
};
