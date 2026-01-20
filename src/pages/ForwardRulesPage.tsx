/**
 * Forward Rules Management Page (Admin)
 * High-density data management interface
 */

import { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeftRight,
  Plus,
  RefreshCw,
  Users,
  CheckCircle2,
  RotateCw,
  Activity,
  GripVertical,
  Search,
  FilterX,
  FileJson,
} from 'lucide-react';
import type { RowSelectionState } from '@tanstack/react-table';
import { Switch, SwitchThumb } from '@/components/common/Switch';
import { ForwardRuleListTable } from '@/features/forward-rules/components/ForwardRuleListTable';
import { MobileForwardRuleManagement } from '@/features/forward-rules/components/MobileForwardRuleManagement';
import { Input } from '@/components/common/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useForwardRulesPage, useRuleStatusPolling } from '@/features/forward-rules/hooks/useForwardRules';
import { useBatchForwardRules } from '@/features/forward-rules/hooks/useBatchForwardRules';
import { BatchActionBar } from '@/features/forward-rules/components/batch';

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
const ForwardRuleDetailSheet = lazy(() =>
  import('@/features/forward-rules/components/ForwardRuleDetailSheet').then((m) => ({
    default: m.ForwardRuleDetailSheet,
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
import { useNodes } from '@/features/nodes/hooks/useNodes';
import { useResourceGroups } from '@/features/resource-groups/hooks/useResourceGroups';
import { useSubscriptionPlans } from '@/features/subscription-plans/hooks/useSubscriptionPlans';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { AdminButton, AdminCard } from '@/components/admin';
import { usePageTitle } from '@/shared/hooks';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import type { ForwardRule, CreateForwardRuleRequest, UpdateForwardRuleRequest, RuleProbeResponse, ForwardRuleType, ForwardProtocol, ForwardStatus, IPVersion } from '@/api/forward';
import type { SubscriptionPlan } from '@/api/subscription/types';

export const ForwardRulesPage = () => {
  const { t } = useTranslation();
  usePageTitle(t('admin.forwardRules.title'));

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
  } = useForwardRulesPage();

  const { nodes } = useNodes({ pageSize: 100 });
  // Convert agentsMap to array for dialog components
  const forwardAgents = useMemo(() => Object.values(agentsMap), [agentsMap]);
  const { polledStatusMap, pollingRuleIds, startPolling } = useRuleStatusPolling();
  const { isMobile } = useBreakpoint();

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

  // Get resource groups and plans for rule binding
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
    const map: Record<string, typeof resourceGroups[0]> = {};
    resourceGroups.forEach((group) => {
      map[group.sid] = group;
    });
    return map;
  }, [resourceGroups]);

  // Filter resource groups to only show node/hybrid type plans (exclude forward type)
  const filteredResourceGroups = useMemo(() => {
    // Return empty array while loading to prevent showing unfiltered data
    if (isLoadingResourceGroups || isLoadingPlans) return [];
    if (!plans.length) return resourceGroups;
    const planTypeMap = new Map(plans.map((plan) => [plan.id, plan.planType]));
    return resourceGroups.filter((group) => {
      const planType = planTypeMap.get(group.planId);
      return planType === 'node' || planType === 'hybrid';
    });
  }, [resourceGroups, plans, isLoadingResourceGroups, isLoadingPlans]);

  const stats = useMemo(() => {
    const total = pagination.total;
    const enabled = forwardRules.filter((r) => r.status === 'enabled').length;
    const disabled = forwardRules.filter((r) => r.status === 'disabled').length;
    const syncing = forwardRules.filter((r) => r.syncStatus === 'pending').length;
    const running = forwardRules.filter((r) => r.runStatus === 'running').length;
    return { total, enabled, disabled, syncing, running };
  }, [forwardRules, pagination.total]);

  // Convert Set<string> to Record<string, boolean> for table row selection
  const rowSelection: RowSelectionState = useMemo(() => {
    const selection: RowSelectionState = {};
    selectedIds.forEach(id => {
      selection[id] = true;
    });
    return selection;
  }, [selectedIds]);

  // Handle row selection change from table
  const handleRowSelectionChange = useCallback((updaterOrValue: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => {
    const newSelection = typeof updaterOrValue === 'function'
      ? updaterOrValue(rowSelection)
      : updaterOrValue;

    const newIds = Object.keys(newSelection).filter(id => newSelection[id]);
    clearSelection();
    if (newIds.length > 0) {
      toggleSelectAll(newIds);
    }
  }, [rowSelection, clearSelection, toggleSelectAll]);

  // Wrap handlePageChange to clear selection when page changes
  const handlePageChangeWithClear = useCallback((page: number) => {
    clearSelection();
    handlePageChange(page);
  }, [clearSelection, handlePageChange]);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<ForwardRule | null>(null);
  const [probeDialogOpen, setProbeDialogOpen] = useState(false);
  const [probeResult, setProbeResult] = useState<RuleProbeResponse | null>(null);
  const [probingRuleId, setProbingRuleId] = useState<string | null>(null);
  const [probingRule, setProbingRule] = useState<ForwardRule | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<ForwardRule | null>(null);
  const [resetTrafficConfirmOpen, setResetTrafficConfirmOpen] = useState(false);
  const [ruleToResetTraffic, setRuleToResetTrafficRule] = useState<ForwardRule | null>(null);
  const [copyRuleData, setCopyRuleData] = useState<(Partial<CreateForwardRuleRequest> & { targetType?: 'manual' | 'node' }) | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dragSortEnabled, setDragSortEnabled] = useState(false);

  // Batch dialog states
  const [batchCreateOpen, setBatchCreateOpen] = useState(false);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
  const [batchEnableOpen, setBatchEnableOpen] = useState(false);
  const [batchDisableOpen, setBatchDisableOpen] = useState(false);
  const [batchUpdateOpen, setBatchUpdateOpen] = useState(false);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    refetch();
  };

  const handleDragEnd = async (_activeId: string, _overId: string, oldIndex: number, newIndex: number) => {
    if (oldIndex === newIndex) return;

    // Reorder rules and calculate new sortOrder values
    const ruleOrders: { ruleId: string; sortOrder: number }[] = [];
    const reorderedRules = [...forwardRules];
    const [movedRule] = reorderedRules.splice(oldIndex, 1);
    reorderedRules.splice(newIndex, 0, movedRule);

    reorderedRules.forEach((rule, index) => {
      const newSortOrder = index + 1;
      if (rule.sortOrder !== newSortOrder) {
        ruleOrders.push({ ruleId: rule.id, sortOrder: newSortOrder });
      }
    });

    if (ruleOrders.length > 0) {
      await handleReorder(ruleOrders);
    }
  };

  const handleEdit = (rule: ForwardRule) => {
    setSelectedRule(rule);
    setEditDialogOpen(true);
  };

  const handleDelete = (rule: ForwardRule) => {
    setRuleToDelete(rule);
    setDeleteConfirmOpen(true);
  };

  // For mobile Sheet (receives entity from callback)
  const handleDeleteConfirmSheet = async (rule: ForwardRule) => {
    await deleteForwardRule(rule.id);
    setRuleToDelete(null);
  };

  // For desktop Dialog (uses ruleToDelete state)
  const handleDeleteConfirmDialog = async () => {
    if (ruleToDelete) {
      await deleteForwardRule(ruleToDelete.id);
      setDeleteConfirmOpen(false);
      setRuleToDelete(null);
    }
  };

  const handleEnable = async (rule: ForwardRule) => {
    await enableForwardRule(rule.id);
    startPolling(rule.id);
  };

  const handleDisable = async (rule: ForwardRule) => {
    await disableForwardRule(rule.id);
  };

  // Toggle status handler for mobile swipe card
  const handleToggleStatus = async (rule: ForwardRule) => {
    if (rule.status === 'enabled') {
      await handleDisable(rule);
    } else {
      await handleEnable(rule);
    }
  };

  const handleResetTraffic = (rule: ForwardRule) => {
    setRuleToResetTrafficRule(rule);
    setResetTrafficConfirmOpen(true);
  };

  const handleResetTrafficConfirm = async () => {
    if (ruleToResetTraffic) {
      await resetTraffic(ruleToResetTraffic.id);
      setResetTrafficConfirmOpen(false);
      setRuleToResetTrafficRule(null);
    }
  };

  const handleViewDetail = (rule: ForwardRule) => {
    setSelectedRule(rule);
    setDetailDialogOpen(true);
  };

  const handleProbe = async (rule: ForwardRule) => {
    setProbingRuleId(rule.id);
    setProbingRule(rule);
    setProbeResult(null);
    setProbeDialogOpen(true);
    try {
      const result = await probeRule(rule.id);
      setProbeResult(result);
    } catch {
      // Error already handled in hook
    } finally {
      setProbingRuleId(null);
    }
  };

  const handleCopy = (rule: ForwardRule) => {
    const filteredChainAgentIds = rule.chainAgentIds
      ? rule.chainAgentIds.filter((id) => id !== rule.agentId)
      : undefined;

    let filteredChainPortConfig: Record<string, number> | undefined;
    if (rule.chainPortConfig && filteredChainAgentIds) {
      filteredChainPortConfig = {};
      for (const id of filteredChainAgentIds) {
        if (rule.chainPortConfig[id] !== undefined) {
          filteredChainPortConfig[id] = rule.chainPortConfig[id];
        }
      }
    }

    const copyData: Partial<CreateForwardRuleRequest> & { targetType?: 'manual' | 'node' } = {
      agentId: rule.agentId,
      ruleType: rule.ruleType as ForwardRuleType,
      exitAgentId: rule.exitAgentId,
      chainAgentIds: filteredChainAgentIds,
      chainPortConfig: filteredChainPortConfig,
      name: `${rule.name} - ${t('admin.forwardRules.copySuffix')}`,
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
    setCopyRuleData(copyData);
    setCreateDialogOpen(true);
  };

  const handleCreateSubmit = async (data: CreateForwardRuleRequest) => {
    await createForwardRule(data);
    setCreateDialogOpen(false);
    setCopyRuleData(undefined);
  };

  const handleUpdateSubmit = async (id: string, data: UpdateForwardRuleRequest) => {
    await updateForwardRule(id, data);
    setEditDialogOpen(false);
    setSelectedRule(null);
  };

  // Wrapper for EditForwardRuleDialog (desktop) which uses legacy interface
  const handleUpdateSubmitLegacy = (id: number | string, data: UpdateForwardRuleRequest) => {
    updateForwardRule(id, data);
    setEditDialogOpen(false);
    setSelectedRule(null);
  };

  // Helper functions for filters
  const handleProtocolChange = (value: string): void => {
    handleFiltersChange({ protocol: value === '_all_' ? undefined : (value as ForwardProtocol) });
  };

  const handleStatusChange = (value: string): void => {
    handleFiltersChange({ status: value === '_all_' ? undefined : (value as ForwardStatus) });
  };

  const handleSearchChange = (value: string): void => {
    handleFiltersChange({ name: value || undefined });
  };

  const handleSortChange = (value: string): void => {
    const lastUnderscoreIndex = value.lastIndexOf('_');
    const orderBy = value.substring(0, lastUnderscoreIndex);
    const order = value.substring(lastUnderscoreIndex + 1) as 'asc' | 'desc';
    handleFiltersChange({ orderBy, order });
  };

  const getSortValue = (): string => {
    if (!filters.orderBy) return 'sort_order_asc';
    return `${filters.orderBy}_${filters.order || 'desc'}`;
  };

  const handleResetFilters = (): void => {
    handleFiltersChange({
      protocol: undefined,
      status: undefined,
      name: undefined,
      orderBy: 'sort_order',
      order: 'asc',
    });
  };

  const isDefaultSort = filters.orderBy === 'sort_order' && filters.order === 'asc';
  const hasActiveFilters = !!(filters.protocol || filters.status || filters.name || (filters.orderBy && !isDefaultSort));

  // Mobile view - uses MobileForwardRuleManagement with its own header/stats
  if (isMobile) {
    return (
      <AdminLayout>
        <div className="py-3">
          <MobileForwardRuleManagement
            rules={forwardRules}
            agentsMap={agentsMap}
            polledStatusMap={polledStatusMap}
            pollingRuleIds={pollingRuleIds}
            loading={isLoading || isFetching}
            refreshing={isFetching}
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onRefresh={handleRefresh}
            onCreate={() => {
              setCopyRuleData(undefined);
              setCreateDialogOpen(true);
            }}
            onEdit={handleEdit}
            onCopy={handleCopy}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
            onPageChange={handlePageChange}
            onViewDetail={handleViewDetail}
            onDragEnd={handleDragEnd}
            isReordering={isReordering}
          />
        </div>

        {/* Create Forward Rule Sheet */}
        {createDialogOpen && (
          <Suspense fallback={null}>
            <CreateForwardRuleSheet
              open={createDialogOpen}
              onOpenChange={(open) => {
                setCreateDialogOpen(open);
                if (!open) setCopyRuleData(undefined);
              }}
              onSubmit={handleCreateSubmit}
              agents={forwardAgents}
              nodes={nodes}
              initialData={copyRuleData}
              resourceGroups={filteredResourceGroups}
              plansMap={plansMap}
            />
          </Suspense>
        )}

        {/* Edit Forward Rule Sheet */}
        {editDialogOpen && (
          <Suspense fallback={null}>
            <EditForwardRuleSheet
              open={editDialogOpen}
              onOpenChange={(open) => {
                setEditDialogOpen(open);
                if (!open) setSelectedRule(null);
              }}
              entity={selectedRule}
              onSubmit={handleUpdateSubmit}
              nodes={nodes}
              agents={forwardAgents}
              resourceGroups={filteredResourceGroups}
              plansMap={plansMap}
            />
          </Suspense>
        )}

        {/* Delete Forward Rule Sheet */}
        {deleteConfirmOpen && (
          <Suspense fallback={null}>
            <DeleteForwardRuleSheet
              open={deleteConfirmOpen}
              onOpenChange={setDeleteConfirmOpen}
              entity={ruleToDelete}
              onConfirm={handleDeleteConfirmSheet}
              agentsMap={agentsMap}
            />
          </Suspense>
        )}

        {/* Forward Rule Detail Sheet (Mobile) */}
        {detailDialogOpen && (
          <Suspense fallback={null}>
            <ForwardRuleDetailSheet
              open={detailDialogOpen}
              onOpenChange={(open) => {
                setDetailDialogOpen(open);
                if (!open) setSelectedRule(null);
              }}
              rule={selectedRule}
              agentsMap={agentsMap}
              nodes={nodes}
              polledStatus={selectedRule ? polledStatusMap[selectedRule.id] : null}
              onEdit={(rule) => {
                setDetailDialogOpen(false);
                handleEdit(rule);
              }}
              onProbe={handleProbe}
              onCopy={(rule) => {
                setDetailDialogOpen(false);
                handleCopy(rule);
              }}
              onToggleStatus={handleToggleStatus}
              onDelete={(rule) => {
                setDetailDialogOpen(false);
                handleDelete(rule);
              }}
              isProbingThis={probingRuleId === selectedRule?.id}
            />
          </Suspense>
        )}

        {/* Probe Result Dialog */}
        {probeDialogOpen && (
          <Suspense fallback={null}>
            <ProbeResultDialog
              open={probeDialogOpen}
              onOpenChange={setProbeDialogOpen}
              rule={probingRule}
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

  // Desktop view - original layout with header and table
  return (
    <AdminLayout>
      <div className="py-3 space-y-3">
        {/* High-Density Status Bar with Integrated Filters */}
        <header className="bg-card rounded-lg border border-border px-3 py-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Left: Title + Primary Stats */}
            <div className="flex items-center gap-fluid-sm">
              <h1 className="text-sm font-semibold text-foreground whitespace-nowrap">{t('admin.forwardRules.title')}</h1>
              <div className="h-4 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-2.5 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <ArrowLeftRight className="size-3" />
                  <span className="font-medium text-foreground">{stats.total}</span>
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="size-3 text-success" />
                  <span className="font-medium text-success">{stats.enabled}</span>
                </span>
                {stats.disabled > 0 && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <span className="font-medium">{stats.disabled}</span>
                  </span>
                )}
                {stats.running > 0 && (
                  <span className="flex items-center gap-1">
                    <Activity className="size-3 text-info" />
                    <span className="font-medium text-info">{stats.running}</span>
                  </span>
                )}
                {stats.syncing > 0 && (
                  <span className="flex items-center gap-1">
                    <RotateCw className="size-3 text-warning animate-spin" />
                    <span className="font-medium text-warning">{stats.syncing}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Center: Filters (hidden on mobile) */}
            <div className="hidden md:flex items-center gap-2 flex-1 justify-center max-w-lg">
              {/* Protocol filter */}
              <Select value={filters.protocol || '_all_'} onValueChange={handleProtocolChange}>
                <SelectTrigger className="h-7 w-20 text-xs">
                  <SelectValue placeholder={t('admin.forwardRules.filters.protocol')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all_">{t('filter.all')}</SelectItem>
                  <SelectItem value="tcp">TCP</SelectItem>
                  <SelectItem value="udp">UDP</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>

              {/* Status filter */}
              <Select value={filters.status || '_all_'} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-7 w-20 text-xs">
                  <SelectValue placeholder={t('admin.forwardRules.filters.status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all_">{t('filter.all')}</SelectItem>
                  <SelectItem value="enabled">{t('common.status.enabledShort')}</SelectItem>
                  <SelectItem value="disabled">{t('common.status.disabledShort')}</SelectItem>
                </SelectContent>
              </Select>

              {/* Search input */}
              <div className="relative flex-1 max-w-[160px]">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                <Input
                  placeholder={t('admin.forwardRules.searchRules')}
                  value={filters.name || ''}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="h-7 pl-7 text-xs"
                />
              </div>

              {/* Sort filter */}
              <Select value={getSortValue()} onValueChange={handleSortChange}>
                <SelectTrigger className="h-7 w-24 text-xs">
                  <SelectValue placeholder={t('admin.forwardRules.sort')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sort_order_asc">{t('admin.forwardRules.sortOptions.default')}</SelectItem>
                  <SelectItem value="created_at_desc">{t('admin.forwardRules.sortOptions.createdDesc')}</SelectItem>
                  <SelectItem value="created_at_asc">{t('admin.forwardRules.sortOptions.createdAsc')}</SelectItem>
                  <SelectItem value="updated_at_desc">{t('admin.forwardRules.sortOptions.updatedDesc')}</SelectItem>
                </SelectContent>
              </Select>

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
                  <TooltipContent>{t('admin.forwardRules.resetFilters')}</TooltipContent>
                </Tooltip>
              )}

              {/* Divider */}
              <div className="h-4 w-px bg-border" />

              {/* Include user rules toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <label className="flex items-center gap-1 cursor-pointer group">
                    <Users className="size-3 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.5} />
                    <Switch
                      checked={includeUserRules}
                      onCheckedChange={handleIncludeUserRulesChange}
                      className="scale-75"
                    >
                      <SwitchThumb />
                    </Switch>
                  </label>
                </TooltipTrigger>
                <TooltipContent>{t('admin.forwardRules.showUserRules')}</TooltipContent>
              </Tooltip>

              {/* Drag sort toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <label className="flex items-center gap-1 cursor-pointer group">
                    <GripVertical className={`size-3 transition-colors ${dragSortEnabled ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} strokeWidth={1.5} />
                    <Switch
                      checked={dragSortEnabled}
                      onCheckedChange={setDragSortEnabled}
                      disabled={isReordering}
                      className="scale-75"
                    >
                      <SwitchThumb />
                    </Switch>
                  </label>
                </TooltipTrigger>
                <TooltipContent>
                  {dragSortEnabled ? t('admin.forwardRules.disableDragSort') : t('admin.forwardRules.enableDragSort')}
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5">
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
                <TooltipContent>{t('admin.forwardRules.refreshList')}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <AdminButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setBatchCreateOpen(true)}
                    className="h-7 w-7 p-0"
                    icon={<FileJson className="size-3.5" strokeWidth={1.5} />}
                  >
                    <span className="sr-only">{t('admin.forwardRules.batchCreate')}</span>
                  </AdminButton>
                </TooltipTrigger>
                <TooltipContent>{t('admin.forwardRules.batchCreateJson')}</TooltipContent>
              </Tooltip>

              <AdminButton
                variant="primary"
                size="sm"
                className="h-7 px-2.5 text-xs"
                icon={<Plus className="size-3.5" strokeWidth={2} />}
                onClick={() => {
                  setCopyRuleData(undefined);
                  setCreateDialogOpen(true);
                }}
              >
                <span className="hidden sm:inline">{t('admin.forwardRules.add')}</span>
                <span className="sm:hidden">{t('admin.forwardRules.add')}</span>
              </AdminButton>
            </div>
          </div>
        </header>

        {/* Batch Action Bar */}
        {selectedCount > 0 && (
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
        )}

        {/* Forward Rules List Table */}
        <AdminCard noPadding>
          <ForwardRuleListTable
            rules={forwardRules}
            agentsMap={agentsMap}
            resourceGroupsMap={resourceGroupsMap}
            nodes={nodes}
            polledStatusMap={polledStatusMap}
            pollingRuleIds={pollingRuleIds}
            loading={isLoading || isFetching || isReordering}
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onPageChange={handlePageChangeWithClear}
            onPageSizeChange={handlePageSizeChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onEnable={handleEnable}
            onDisable={handleDisable}
            onResetTraffic={handleResetTraffic}
            onViewDetail={handleViewDetail}
            onProbe={handleProbe}
            onCopy={handleCopy}
            probingRuleId={probingRuleId}
            enableDragSort={dragSortEnabled}
            onDragEnd={handleDragEnd}
            rowSelection={rowSelection}
            onRowSelectionChange={handleRowSelectionChange}
            enableSelection={true}
          />
        </AdminCard>
      </div>

      {/* Create Forward Rule Dialog */}
      {createDialogOpen && (
        <Suspense fallback={null}>
          <CreateForwardRuleDialog
            open={createDialogOpen}
            onClose={() => {
              setCreateDialogOpen(false);
              setCopyRuleData(undefined);
            }}
            onSubmit={handleCreateSubmit}
            agents={forwardAgents}
            nodes={nodes}
            initialData={copyRuleData}
            resourceGroups={filteredResourceGroups}
            plansMap={plansMap}
          />
        </Suspense>
      )}

      {/* Edit Forward Rule Dialog */}
      {editDialogOpen && (
        <Suspense fallback={null}>
          <EditForwardRuleDialog
            open={editDialogOpen}
            rule={selectedRule}
            onClose={() => {
              setEditDialogOpen(false);
              setSelectedRule(null);
            }}
            onSubmit={handleUpdateSubmitLegacy}
            nodes={nodes}
            agents={forwardAgents}
            resourceGroups={filteredResourceGroups}
            plansMap={plansMap}
          />
        </Suspense>
      )}

      {/* Forward Rule Detail Dialog */}
      {detailDialogOpen && (
        <Suspense fallback={null}>
          <ForwardRuleDetailDialog
            open={detailDialogOpen}
            rule={selectedRule}
            onClose={() => {
              setDetailDialogOpen(false);
              setSelectedRule(null);
            }}
            agents={forwardAgents}
            nodes={nodes}
            resourceGroups={resourceGroups}
          />
        </Suspense>
      )}

      {/* Probe Result Dialog */}
      {probeDialogOpen && (
        <Suspense fallback={null}>
          <ProbeResultDialog
            open={probeDialogOpen}
            onOpenChange={setProbeDialogOpen}
            rule={probingRule}
            probeResult={probeResult}
            isProbing={probingRuleId !== null}
            agents={forwardAgents}
            nodes={nodes}
          />
        </Suspense>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={t('admin.forwardRules.confirmDelete')}
        description={ruleToDelete ? t('admin.forwardRules.confirmDeleteDesc', { name: ruleToDelete.name }) : ''}
        confirmText={t('common.actions.delete')}
        cancelText={t('common.actions.cancel')}
        variant="destructive"
        onConfirm={handleDeleteConfirmDialog}
      />

      {/* Reset Traffic Confirm Dialog */}
      <ConfirmDialog
        open={resetTrafficConfirmOpen}
        onOpenChange={setResetTrafficConfirmOpen}
        title={t('admin.forwardRules.confirmResetTraffic')}
        description={ruleToResetTraffic ? t('admin.forwardRules.confirmResetTrafficDesc', { name: ruleToResetTraffic.name }) : ''}
        confirmText={t('common.actions.reset')}
        cancelText={t('common.actions.cancel')}
        onConfirm={handleResetTrafficConfirm}
      />

      {/* Batch Create Dialog */}
      {batchCreateOpen && (
        <Suspense fallback={null}>
          <BatchCreateDialog
            open={batchCreateOpen}
            onOpenChange={setBatchCreateOpen}
            onConfirm={batchCreate}
            isCreating={isBatchCreating}
          />
        </Suspense>
      )}

      {/* Batch Delete Dialog */}
      {batchDeleteOpen && (
        <Suspense fallback={null}>
          <BatchDeleteDialog
            open={batchDeleteOpen}
            onOpenChange={setBatchDeleteOpen}
            selectedCount={selectedCount}
            onConfirm={batchDelete}
            isDeleting={isBatchDeleting}
          />
        </Suspense>
      )}

      {/* Batch Enable Dialog */}
      {batchEnableOpen && (
        <Suspense fallback={null}>
          <BatchToggleStatusDialog
            open={batchEnableOpen}
            onOpenChange={setBatchEnableOpen}
            selectedCount={selectedCount}
            targetStatus="enabled"
            onConfirm={batchEnable}
            isProcessing={isBatchEnabling}
          />
        </Suspense>
      )}

      {/* Batch Disable Dialog */}
      {batchDisableOpen && (
        <Suspense fallback={null}>
          <BatchToggleStatusDialog
            open={batchDisableOpen}
            onOpenChange={setBatchDisableOpen}
            selectedCount={selectedCount}
            targetStatus="disabled"
            onConfirm={batchDisable}
            isProcessing={isBatchDisabling}
          />
        </Suspense>
      )}

      {/* Batch Update Dialog */}
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
    </AdminLayout>
  );
};
