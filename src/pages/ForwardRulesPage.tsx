/**
 * Forward Rules Management Page (Admin)
 *
 * Redesigned: catalog-style layout with card grid (default) + table toggle.
 * Segmented protocol tabs + compact filter selects + view mode switch.
 * Mobile-first responsive design.
 */

import { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  RefreshCw,
  FileJson,
} from 'lucide-react';
import type { RowSelectionState } from '@tanstack/react-table';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { StatsPill, PageToolbar } from '@/components/admin';
import { adminContentStyles } from '@/lib/ui-styles';
import { usePageTitle } from '@/shared/hooks';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { ForwardRuleListTable } from '@/features/forward-rules/components/ForwardRuleListTable';
import { GroupedForwardRuleList } from '@/features/forward-rules/components/GroupedForwardRuleList';
import { MobileForwardRuleManagement } from '@/features/forward-rules/components/MobileForwardRuleManagement';
import { ForwardRuleFilters } from '@/features/forward-rules/components/ForwardRuleFilters';
import { BatchActionBar } from '@/features/forward-rules/components/batch';
import { useForwardRulesPage, useRuleStatusPolling } from '@/features/forward-rules/hooks/useForwardRules';
import { useBatchForwardRules } from '@/features/forward-rules/hooks/useBatchForwardRules';
import { useNodes } from '@/features/nodes/hooks/useNodes';
import { useResourceGroups } from '@/features/resource-groups/hooks/useResourceGroups';
import { useSubscriptionPlans } from '@/features/subscription-plans/hooks/useSubscriptionPlans';
import type {
  ForwardRule,
  CreateForwardRuleRequest,
  UpdateForwardRuleRequest,
  RuleProbeResponse,
  ForwardRuleType,
  ForwardProtocol,
  IPVersion,
} from '@/api/forward';
import type { SubscriptionPlan } from '@/api/subscription/types';

// Lazy load dialog/sheet components
const CreateForwardRuleDialog = lazy(() =>
  import('@/features/forward-rules/components/CreateForwardRuleDialog').then((m) => ({
    default: m.CreateForwardRuleDialog,
  }))
);
const CreateForwardRuleSheet = lazy(() =>
  import('@/features/forward-rules/components/CreateForwardRuleSheet').then((m) => ({
    default: m.CreateForwardRuleSheet,
  }))
);
const EditForwardRuleDialog = lazy(() =>
  import('@/features/forward-rules/components/EditForwardRuleDialog').then((m) => ({
    default: m.EditForwardRuleDialog,
  }))
);
const EditForwardRuleSheet = lazy(() =>
  import('@/features/forward-rules/components/EditForwardRuleSheet').then((m) => ({
    default: m.EditForwardRuleSheet,
  }))
);
const DeleteForwardRuleSheet = lazy(() =>
  import('@/features/forward-rules/components/DeleteForwardRuleSheet').then((m) => ({
    default: m.DeleteForwardRuleSheet,
  }))
);
const ForwardRuleDetailDialog = lazy(() =>
  import('@/features/forward-rules/components/ForwardRuleDetailDialog').then((m) => ({
    default: m.ForwardRuleDetailDialog,
  }))
);
const ProbeResultDialog = lazy(() =>
  import('@/features/forward-rules/components/ProbeResultDialog').then((m) => ({
    default: m.ProbeResultDialog,
  }))
);
const BatchCreateDialog = lazy(() =>
  import('@/features/forward-rules/components/batch').then((m) => ({
    default: m.BatchCreateDialog,
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

// ============================================================================
// Types
// ============================================================================

type DialogType =
  | 'create'
  | 'edit'
  | 'detail'
  | 'delete'
  | 'probe'
  | 'resetTraffic'
  | 'batchCreate'
  | 'batchDelete'
  | 'batchEnable'
  | 'batchDisable'
  | 'batchUpdate'
  | null;

type CopyRuleData = Partial<CreateForwardRuleRequest> & { targetType?: 'manual' | 'node' };

// ============================================================================
// Main Component
// ============================================================================

export function ForwardRulesPage() {
  const { t } = useTranslation();
  usePageTitle(t('admin.forwardRules.title'));

  const { isMobile } = useBreakpoint();

  // Forward rules data and operations
  const {
    forwardRules,
    pagination,
    isLoading,
    isFetching,
    refetch,
    agentsMap,
    filters,
    handleFiltersChange,
    createForwardRule,
    updateForwardRule,
    deleteForwardRule,
    enableForwardRule,
    disableForwardRule,
    resetTraffic,
    probeRule,
    handlePageChange,
    handlePageSizeChange,
    includeUserRules,
    handleIncludeUserRulesChange,
    handleReorder,
    isReordering,
    groupBy,
    handleGroupByChange,
  } = useForwardRulesPage();

  const { nodes } = useNodes({ pageSize: 100 });
  const forwardAgents = useMemo(() => Object.values(agentsMap), [agentsMap]);
  const { polledStatusMap, pollingRuleIds, startPolling } = useRuleStatusPolling();

  // Batch operations
  const {
    selectedIds,
    selectedIdsArray,
    selectedCount,
    toggleSelectAll,
    clearSelection,
    batchCreate,
    batchDelete,
    batchEnable,
    batchDisable,
    batchUpdate,
    isCreating: isBatchCreating,
    isDeleting: isBatchDeleting,
    isEnabling: isBatchEnabling,
    isDisabling: isBatchDisabling,
    isUpdating: isBatchUpdating,
  } = useBatchForwardRules({ isAdmin: true });

  // Resource groups and plans
  const { resourceGroups, isLoading: isLoadingResourceGroups } = useResourceGroups({ pageSize: 100 });
  const { plans, isLoading: isLoadingPlans } = useSubscriptionPlans({ pageSize: 100 });

  const plansMap = useMemo(() => {
    const map: Record<string, SubscriptionPlan> = {};
    plans.forEach((plan) => {
      map[plan.id] = plan;
    });
    return map;
  }, [plans]);

  const resourceGroupsMap = useMemo(() => {
    const map: Record<string, (typeof resourceGroups)[0]> = {};
    resourceGroups.forEach((group) => {
      map[group.sid] = group;
    });
    return map;
  }, [resourceGroups]);

  const filteredResourceGroups = useMemo(() => {
    if (isLoadingResourceGroups || isLoadingPlans) return [];
    if (!plans.length) return resourceGroups;
    const planTypeMap = new Map(plans.map((plan) => [plan.id, plan.planType]));
    return resourceGroups.filter((group) => {
      const planType = planTypeMap.get(group.planId);
      return planType === 'node' || planType === 'hybrid';
    });
  }, [resourceGroups, plans, isLoadingResourceGroups, isLoadingPlans]);

  // Dialog state management
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [selectedRule, setSelectedRule] = useState<ForwardRule | null>(null);
  const [copyRuleData, setCopyRuleData] = useState<CopyRuleData | undefined>(undefined);
  const [probeResult, setProbeResult] = useState<RuleProbeResponse | null>(null);
  const [probingRuleId, setProbingRuleId] = useState<string | null>(null);
  const [dragSortEnabled, setDragSortEnabled] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Calculate statistics
  const stats = useMemo(() => {
    const enabled = forwardRules.filter((r) => r.status === 'enabled').length;
    const disabled = forwardRules.filter((r) => r.status === 'disabled').length;
    const running = forwardRules.filter((r) => r.runStatus === 'running').length;
    return { total: pagination.total, enabled, disabled, running };
  }, [forwardRules, pagination.total]);

  // Row selection for batch operations
  const rowSelection: RowSelectionState = useMemo(() => {
    const selection: RowSelectionState = {};
    selectedIds.forEach((id) => {
      selection[id] = true;
    });
    return selection;
  }, [selectedIds]);

  const handleRowSelectionChange = useCallback(
    (updaterOrValue: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => {
      const newSelection = typeof updaterOrValue === 'function' ? updaterOrValue(rowSelection) : updaterOrValue;
      const newIds = Object.keys(newSelection).filter((id) => newSelection[id]);
      clearSelection();
      if (newIds.length > 0) {
        toggleSelectAll(newIds);
      }
    },
    [rowSelection, clearSelection, toggleSelectAll]
  );

  // Dialog handlers
  const openDialog = useCallback((type: DialogType, rule?: ForwardRule) => {
    setSelectedRule(rule ?? null);
    setActiveDialog(type);
  }, []);

  const closeDialog = useCallback(() => {
    setActiveDialog(null);
    setSelectedRule(null);
    setCopyRuleData(undefined);
    setProbeResult(null);
  }, []);

  // Action handlers
  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    refetch();
  }, [refetch]);

  const handleCreate = useCallback(() => {
    setCopyRuleData(undefined);
    openDialog('create');
  }, [openDialog]);

  const handleEdit = useCallback(
    (rule: ForwardRule) => openDialog('edit', rule),
    [openDialog]
  );

  const handleViewDetail = useCallback(
    (rule: ForwardRule) => openDialog('detail', rule),
    [openDialog]
  );

  const handleDeleteClick = useCallback(
    (rule: ForwardRule) => openDialog('delete', rule),
    [openDialog]
  );

  const handleResetTrafficClick = useCallback(
    (rule: ForwardRule) => openDialog('resetTraffic', rule),
    [openDialog]
  );

  const handleCopy = useCallback(
    (rule: ForwardRule) => {
      const filteredChainAgentIds = rule.chainAgentIds?.filter((id) => id !== rule.agentId);
      let filteredChainPortConfig: Record<string, number> | undefined;

      if (rule.chainPortConfig && filteredChainAgentIds) {
        filteredChainPortConfig = {};
        for (const id of filteredChainAgentIds) {
          if (rule.chainPortConfig[id] !== undefined) {
            filteredChainPortConfig[id] = rule.chainPortConfig[id];
          }
        }
      }

      const data: CopyRuleData = {
        agentId: rule.agentId,
        ruleType: rule.ruleType as ForwardRuleType,
        exitAgentId: rule.exitAgentId,
        exitAgents: rule.exitAgents,
        chainAgentIds: filteredChainAgentIds,
        chainPortConfig: filteredChainPortConfig,
        name: `${rule.name} - ${t('common.actions.copy')}`,
        listenPort: rule.listenPort,
        targetAddress: rule.targetAddress,
        targetPort: rule.targetPort,
        targetNodeId: rule.targetNodeId,
        bindIp: rule.bindIp,
        trafficMultiplier: rule.trafficMultiplier,
        sortOrder: rule.sortOrder,
        protocol: rule.protocol as ForwardProtocol,
        ipVersion: rule.ipVersion as IPVersion,
        remark: rule.remark,
        targetType: rule.targetNodeId ? 'node' : 'manual',
      };
      setCopyRuleData(data);
      openDialog('create');
    },
    [openDialog, t]
  );

  const handleEnable = useCallback(
    async (rule: ForwardRule) => {
      await enableForwardRule(rule.id);
      startPolling(rule.id);
    },
    [enableForwardRule, startPolling]
  );

  const handleDisable = useCallback(
    async (rule: ForwardRule) => {
      await disableForwardRule(rule.id);
    },
    [disableForwardRule]
  );

  const handleToggleStatus = useCallback(
    async (rule: ForwardRule) => {
      if (rule.status === 'enabled') {
        await handleDisable(rule);
      } else {
        await handleEnable(rule);
      }
    },
    [handleEnable, handleDisable]
  );

  const handleProbe = useCallback(
    async (rule: ForwardRule) => {
      setProbingRuleId(rule.id);
      setProbeResult(null);
      openDialog('probe', rule);
      try {
        const result = await probeRule(rule.id);
        setProbeResult(result);
      } catch {
        // Error handled in hook
      } finally {
        setProbingRuleId(null);
      }
    },
    [openDialog, probeRule]
  );

  // Form submission handlers
  const handleCreateSubmit = useCallback(
    async (data: CreateForwardRuleRequest) => {
      await createForwardRule(data);
      closeDialog();
    },
    [createForwardRule, closeDialog]
  );

  const handleUpdateSubmit = useCallback(
    async (id: string, data: UpdateForwardRuleRequest) => {
      await updateForwardRule(id, data);
      closeDialog();
    },
    [updateForwardRule, closeDialog]
  );

  const handleUpdateSubmitLegacy = useCallback(
    (id: number | string, data: UpdateForwardRuleRequest) => {
      updateForwardRule(id, data);
      closeDialog();
    },
    [updateForwardRule, closeDialog]
  );

  const handleDeleteConfirm = useCallback(
    async (rule?: ForwardRule) => {
      const target = rule ?? selectedRule;
      if (!target) return;
      await deleteForwardRule(target.id);
      closeDialog();
    },
    [selectedRule, deleteForwardRule, closeDialog]
  );

  const handleResetTrafficConfirm = useCallback(async () => {
    if (!selectedRule) return;
    await resetTraffic(selectedRule.id);
    closeDialog();
  }, [selectedRule, resetTraffic, closeDialog]);

  // Drag and drop handler
  const handleDragEnd = useCallback(
    async (_activeId: string, _overId: string, oldIndex: number, newIndex: number) => {
      if (oldIndex === newIndex) return;

      const reorderedRules = [...forwardRules];
      const [movedRule] = reorderedRules.splice(oldIndex, 1);
      reorderedRules.splice(newIndex, 0, movedRule);

      const ruleOrders: { ruleId: string; sortOrder: number }[] = [];
      reorderedRules.forEach((rule, index) => {
        const newSortOrder = index + 1;
        if (rule.sortOrder !== newSortOrder) {
          ruleOrders.push({ ruleId: rule.id, sortOrder: newSortOrder });
        }
      });

      if (ruleOrders.length > 0) {
        await handleReorder(ruleOrders);
      }
    },
    [forwardRules, handleReorder]
  );

  // Page change with selection clear
  const handlePageChangeWithClear = useCallback(
    (page: number) => {
      clearSelection();
      handlePageChange(page);
    },
    [clearSelection, handlePageChange]
  );

  // Filter helpers
  const handleClearFilters = useCallback(() => {
    handleFiltersChange({
      protocol: undefined,
      status: undefined,
      name: undefined,
      orderBy: 'sort_order',
      order: 'asc',
    });
  }, [handleFiltersChange]);

  const isDefaultSort = filters.orderBy === 'sort_order' && filters.order === 'asc';
  const hasActiveFilters = !!(filters.protocol || filters.status || filters.name || (filters.orderBy && !isDefaultSort));
  const isTableLoading = isLoading || isFetching || isReordering;

  // Mobile layout
  if (isMobile) {
    return (
      <AdminLayout>
        <div className={adminContentStyles.mobile}>
          <MobileForwardRuleManagement
            rules={forwardRules}
            agentsMap={agentsMap}
            nodes={nodes}
            polledStatusMap={polledStatusMap}
            pollingRuleIds={pollingRuleIds}
            loading={isTableLoading}
            refreshing={isFetching}
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            filters={filters}
            hasFilters={hasActiveFilters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            includeUserRules={includeUserRules}
            onIncludeUserRulesChange={handleIncludeUserRulesChange}
            onRefresh={handleRefresh}
            onCreate={handleCreate}
            onEdit={handleEdit}
            onCopy={handleCopy}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDeleteClick}
            onProbe={handleProbe}
            onPageChange={handlePageChange}
            onDragEnd={handleDragEnd}
            probingRuleId={probingRuleId ?? undefined}
          />
        </div>

        {/* Mobile Sheets */}
        {activeDialog === 'create' && (
          <Suspense fallback={null}>
            <CreateForwardRuleSheet
              open
              onOpenChange={(open) => !open && closeDialog()}
              onSubmit={handleCreateSubmit}
              agents={forwardAgents}
              nodes={nodes}
              initialData={copyRuleData}
              resourceGroups={filteredResourceGroups}
              plansMap={plansMap}
            />
          </Suspense>
        )}

        {activeDialog === 'edit' && (
          <Suspense fallback={null}>
            <EditForwardRuleSheet
              open
              onOpenChange={(open) => !open && closeDialog()}
              entity={selectedRule}
              onSubmit={handleUpdateSubmit}
              nodes={nodes}
              agents={forwardAgents}
              resourceGroups={filteredResourceGroups}
              plansMap={plansMap}
            />
          </Suspense>
        )}

        {activeDialog === 'delete' && (
          <Suspense fallback={null}>
            <DeleteForwardRuleSheet
              open
              onOpenChange={(open) => !open && closeDialog()}
              entity={selectedRule}
              onConfirm={handleDeleteConfirm}
              agentsMap={agentsMap}
            />
          </Suspense>
        )}

        {activeDialog === 'probe' && (
          <Suspense fallback={null}>
            <ProbeResultDialog
              open
              onOpenChange={(open) => !open && closeDialog()}
              rule={selectedRule}
              probeResult={probeResult}
              isProbing={probingRuleId !== null}
              agents={forwardAgents}
              nodes={nodes}
            />
          </Suspense>
        )}
      </AdminLayout>
    );
  }

  // Desktop layout
  return (
    <AdminLayout>
      <div className={adminContentStyles.desktop}>
        {/* Stats pills + actions */}
        <PageToolbar
          actions={<>
            <Button onClick={handleCreate} size="sm" className="h-8 text-[13px]">
              <Plus className="mr-1 size-3.5" />
              {t('admin.forwardRules.add')}
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground/60 hover:text-foreground" onClick={() => openDialog('batchCreate')}>
                  <FileJson className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('admin.forwardRules.batchCreateJson')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground/60 hover:text-foreground" onClick={handleRefresh}>
                  <RefreshCw key={refreshKey} className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('admin.forwardRules.refreshList')}</TooltipContent>
            </Tooltip>
          </>}
        >
          <StatsPill>{stats.total} {t('admin.forwardRules.rulesUnit')}</StatsPill>
          <StatsPill variant="success" dot>{stats.enabled} {t('common.status.enabled')}</StatsPill>
          {stats.disabled > 0 && (
            <StatsPill variant="muted" dot>{stats.disabled} {t('common.status.disabled')}</StatsPill>
          )}
          {stats.running > 0 && (
            <StatsPill variant="info" dot>{stats.running} {t('common.status.running')}</StatsPill>
          )}
        </PageToolbar>

        {/* Filters */}
        <ForwardRuleFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          hasFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
          includeUserRules={includeUserRules}
          onIncludeUserRulesChange={handleIncludeUserRulesChange}
          dragSortEnabled={dragSortEnabled}
          onDragSortChange={setDragSortEnabled}
          isReordering={isReordering}
          groupBy={groupBy}
          onGroupByChange={handleGroupByChange}
        />

        {/* Batch Action Bar */}
        {selectedCount > 0 && (
          <BatchActionBar
            selectedCount={selectedCount}
            onBatchDelete={() => openDialog('batchDelete')}
            onBatchEnable={() => openDialog('batchEnable')}
            onBatchDisable={() => openDialog('batchDisable')}
            onBatchUpdate={() => openDialog('batchUpdate')}
            onClearSelection={clearSelection}
            isDeleting={isBatchDeleting}
            isTogglingStatus={isBatchEnabling || isBatchDisabling}
            isUpdating={isBatchUpdating}
          />
        )}

        {/* Rules Table / Grouped View */}
        {groupBy !== 'none' ? (
          <GroupedForwardRuleList
            rules={forwardRules}
            groupBy={groupBy}
            agentsMap={agentsMap}
            resourceGroupsMap={resourceGroupsMap}
            nodes={nodes}
            polledStatusMap={polledStatusMap}
            pollingRuleIds={pollingRuleIds}
            loading={isTableLoading}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onEnable={handleEnable}
            onDisable={handleDisable}
            onResetTraffic={handleResetTrafficClick}
            onViewDetail={handleViewDetail}
            onProbe={handleProbe}
            onCopy={handleCopy}
            probingRuleId={probingRuleId}
            rowSelection={rowSelection}
            onRowSelectionChange={handleRowSelectionChange}
            enableSelection
          />
        ) : (
          <ForwardRuleListTable
            rules={forwardRules}
            agentsMap={agentsMap}
            resourceGroupsMap={resourceGroupsMap}
            nodes={nodes}
            polledStatusMap={polledStatusMap}
            pollingRuleIds={pollingRuleIds}
            loading={isTableLoading}
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onPageChange={handlePageChangeWithClear}
            onPageSizeChange={handlePageSizeChange}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onEnable={handleEnable}
            onDisable={handleDisable}
            onResetTraffic={handleResetTrafficClick}
            onViewDetail={handleViewDetail}
            onProbe={handleProbe}
            onCopy={handleCopy}
            probingRuleId={probingRuleId}
            enableDragSort={dragSortEnabled}
            onDragEnd={handleDragEnd}
            rowSelection={rowSelection}
            onRowSelectionChange={handleRowSelectionChange}
            enableSelection
          />
        )}
      </div>

      {/* Desktop Dialogs */}
      {activeDialog === 'create' && (
        <Suspense fallback={null}>
          <CreateForwardRuleDialog
            open
            onClose={closeDialog}
            onSubmit={handleCreateSubmit}
            agents={forwardAgents}
            nodes={nodes}
            initialData={copyRuleData}
            resourceGroups={filteredResourceGroups}
            plansMap={plansMap}
          />
        </Suspense>
      )}

      {activeDialog === 'edit' && (
        <Suspense fallback={null}>
          <EditForwardRuleDialog
            open
            rule={selectedRule}
            onClose={closeDialog}
            onSubmit={handleUpdateSubmitLegacy}
            nodes={nodes}
            agents={forwardAgents}
            resourceGroups={filteredResourceGroups}
            plansMap={plansMap}
          />
        </Suspense>
      )}

      {activeDialog === 'detail' && (
        <Suspense fallback={null}>
          <ForwardRuleDetailDialog
            open
            rule={selectedRule}
            onClose={closeDialog}
            agents={forwardAgents}
            nodes={nodes}
            resourceGroups={resourceGroups}
          />
        </Suspense>
      )}

      {activeDialog === 'probe' && (
        <Suspense fallback={null}>
          <ProbeResultDialog
            open
            onOpenChange={(open) => !open && closeDialog()}
            rule={selectedRule}
            probeResult={probeResult}
            isProbing={probingRuleId !== null}
            agents={forwardAgents}
            nodes={nodes}
          />
        </Suspense>
      )}

      <ConfirmDialog
        open={activeDialog === 'delete'}
        onOpenChange={(open) => !open && closeDialog()}
        title={t('admin.forwardRules.confirmDelete')}
        description={selectedRule ? t('admin.forwardRules.confirmDeleteDesc', { name: selectedRule.name }) : ''}
        confirmText={t('common.actions.delete')}
        cancelText={t('common.actions.cancel')}
        variant="destructive"
        onConfirm={() => handleDeleteConfirm()}
      />

      <ConfirmDialog
        open={activeDialog === 'resetTraffic'}
        onOpenChange={(open) => !open && closeDialog()}
        title={t('admin.forwardRules.confirmResetTraffic')}
        description={selectedRule ? t('admin.forwardRules.confirmResetTrafficDesc', { name: selectedRule.name }) : ''}
        confirmText={t('common.actions.reset')}
        cancelText={t('common.actions.cancel')}
        onConfirm={handleResetTrafficConfirm}
      />

      {/* Batch Dialogs */}
      {activeDialog === 'batchCreate' && (
        <Suspense fallback={null}>
          <BatchCreateDialog
            open
            onOpenChange={(open) => !open && closeDialog()}
            onConfirm={batchCreate}
            isCreating={isBatchCreating}
          />
        </Suspense>
      )}

      {activeDialog === 'batchDelete' && (
        <Suspense fallback={null}>
          <BatchDeleteDialog
            open
            onOpenChange={(open) => !open && closeDialog()}
            selectedCount={selectedCount}
            onConfirm={batchDelete}
            isDeleting={isBatchDeleting}
          />
        </Suspense>
      )}

      {activeDialog === 'batchEnable' && (
        <Suspense fallback={null}>
          <BatchToggleStatusDialog
            open
            onOpenChange={(open) => !open && closeDialog()}
            selectedCount={selectedCount}
            targetStatus="enabled"
            onConfirm={batchEnable}
            isProcessing={isBatchEnabling}
          />
        </Suspense>
      )}

      {activeDialog === 'batchDisable' && (
        <Suspense fallback={null}>
          <BatchToggleStatusDialog
            open
            onOpenChange={(open) => !open && closeDialog()}
            selectedCount={selectedCount}
            targetStatus="disabled"
            onConfirm={batchDisable}
            isProcessing={isBatchDisabling}
          />
        </Suspense>
      )}

      {activeDialog === 'batchUpdate' && (
        <Suspense fallback={null}>
          <BatchUpdateDialog
            open
            onOpenChange={(open) => !open && closeDialog()}
            selectedIds={selectedIdsArray}
            onConfirm={batchUpdate}
            isUpdating={isBatchUpdating}
            agents={forwardAgents}
          />
        </Suspense>
      )}
    </AdminLayout>
  );
}
