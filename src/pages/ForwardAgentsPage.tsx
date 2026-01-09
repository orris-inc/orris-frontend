/**
 * Forward Agents Management Page (Admin)
 * High-density data management interface
 */

import { useState, useMemo, useCallback } from 'react';
import {
  Cpu,
  Plus,
  RefreshCw,
  ArrowUpCircle,
  CheckCircle2,
  Activity,
  Radio,
  GripVertical,
  Search,
  FilterX,
} from 'lucide-react';
import { Switch, SwitchThumb } from '@/components/common/Switch';
import { AdminLayout } from '@/layouts/AdminLayout';
import { AdminButton, AdminCard } from '@/components/admin';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { Input } from '@/components/common/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { TokenDialog } from '@/components/common/TokenDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { usePageTitle } from '@/shared/hooks';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { useResourceGroups } from '@/features/resource-groups/hooks/useResourceGroups';
import { ForwardAgentListTable } from '@/features/forward-agents/components/ForwardAgentListTable';
import { EditForwardAgentDialog } from '@/features/forward-agents/components/EditForwardAgentDialog';
import { CreateForwardAgentDialog } from '@/features/forward-agents/components/CreateForwardAgentDialog';
import { CreateForwardAgentSheet } from '@/features/forward-agents/components/CreateForwardAgentSheet';
import { EditForwardAgentSheet } from '@/features/forward-agents/components/EditForwardAgentSheet';
import { DeleteForwardAgentSheet } from '@/features/forward-agents/components/DeleteForwardAgentSheet';
import { ForwardAgentDetailDialog } from '@/features/forward-agents/components/ForwardAgentDetailDialog';
import { InstallScriptDialog } from '@/features/forward-agents/components/InstallScriptDialog';
import { AgentBatchUpdateDialog } from '@/features/forward-agents/components/AgentBatchUpdateDialog';
import { BroadcastURLDialog } from '@/features/forward-agents/components/BroadcastURLDialog';
import { useForwardAgentsPage, useTriggerAgentUpdate, useBroadcastAPIURL, useNotifyAgentAPIURL } from '@/features/forward-agents/hooks/useForwardAgents';
import { getAgentVersion } from '@/api/forward';
import type { AgentVersionInfo, ForwardAgent, UpdateForwardAgentRequest, CreateForwardAgentRequest, ForwardStatus } from '@/api/forward';

export const ForwardAgentsPage = () => {
  usePageTitle('转发节点管理');

  const { isMobile } = useBreakpoint();

  const {
    forwardAgents,
    pagination,
    isLoading,
    isFetching,
    isBatchUpdating,
    isReordering,
    refetch,
    createForwardAgent,
    updateForwardAgent,
    deleteForwardAgent,
    enableForwardAgent,
    disableForwardAgent,
    toggleMuteNotification,
    handleRegenerateToken,
    handleGetInstallCommand,
    handleBatchUpdate,
    handleReorder,
    generatedToken,
    setGeneratedToken,
    installCommandData,
    setInstallCommandData,
    batchUpdateResult,
    setBatchUpdateResult,
    handlePageChange,
    handlePageSizeChange,
    filters,
    handleFiltersChange,
  } = useForwardAgentsPage();

  const { resourceGroups } = useResourceGroups({ pageSize: 100 });
  const resourceGroupsMap = useMemo(() => {
    const map: Record<string, typeof resourceGroups[0]> = {};
    resourceGroups.forEach((group) => {
      map[group.sid] = group;
    });
    return map;
  }, [resourceGroups]);

  const { showError, showInfo } = useNotificationStore();
  const triggerUpdateMutation = useTriggerAgentUpdate();
  const broadcastURLMutation = useBroadcastAPIURL();
  const notifyAgentURLMutation = useNotifyAgentAPIURL();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [installScriptDialogOpen, setInstallScriptDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<ForwardAgent | null>(null);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [copyAgentData, setCopyAgentData] = useState<Partial<CreateForwardAgentRequest> | undefined>(undefined);
  const [batchUpdateDialogOpen, setBatchUpdateDialogOpen] = useState(false);
  const [broadcastURLDialogOpen, setBroadcastURLDialogOpen] = useState(false);
  const [broadcastTargetAgent, setBroadcastTargetAgent] = useState<ForwardAgent | null>(null);
  const [updateConfirmOpen, setUpdateConfirmOpen] = useState(false);
  const [versionInfo, setVersionInfo] = useState<AgentVersionInfo | null>(null);
  const [updateAgent, setUpdateAgent] = useState<ForwardAgent | null>(null);
  const [checkingAgentId, setCheckingAgentId] = useState<string | number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dragSortEnabled, setDragSortEnabled] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<ForwardAgent | null>(null);

  // Calculate agent statistics
  const stats = useMemo(() => {
    const total = pagination.total;
    const enabled = forwardAgents.filter((a) => a.status === 'enabled').length;
    const disabled = forwardAgents.filter((a) => a.status === 'disabled').length;
    const online = forwardAgents.filter((a) => a.systemStatus).length;
    const updatable = forwardAgents.filter((a) => a.hasUpdate && a.status === 'enabled' && a.systemStatus).length;
    return { total, enabled, disabled, online, updatable };
  }, [forwardAgents, pagination.total]);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    refetch();
  };

  const handleEdit = (agent: ForwardAgent) => {
    setSelectedAgent(agent);
    setEditDialogOpen(true);
  };

  const handleDelete = async (agent: ForwardAgent) => {
    if (isMobile) {
      setAgentToDelete(agent);
      setDeleteDialogOpen(true);
    } else {
      if (window.confirm(`确认删除转发节点 "${agent.name}" 吗？此操作不可恢复。`)) {
        await deleteForwardAgent(agent.id);
      }
    }
  };

  const handleDeleteConfirm = async (agent: ForwardAgent) => {
    await deleteForwardAgent(agent.id);
  };

  const handleEnable = async (agent: ForwardAgent) => {
    await enableForwardAgent(agent.id);
  };

  const handleDisable = async (agent: ForwardAgent) => {
    await disableForwardAgent(agent.id);
  };

  const handleTokenRegenerate = async (agent: ForwardAgent) => {
    const token = await handleRegenerateToken(agent.id);
    if (token) {
      setTokenDialogOpen(true);
    }
  };

  const handleViewDetail = (agent: ForwardAgent) => {
    setSelectedAgent(agent);
    setDetailDialogOpen(true);
  };

  const handleInstallScript = async (agent: ForwardAgent) => {
    setSelectedAgent(agent);
    const command = await handleGetInstallCommand(agent.id);
    if (command) {
      setInstallScriptDialogOpen(true);
    }
  };

  const handleCopy = (agent: ForwardAgent) => {
    const copyData: Partial<CreateForwardAgentRequest> = {
      name: `${agent.name} - 副本`,
      remark: agent.remark,
    };
    setCopyAgentData(copyData);
    setCreateDialogOpen(true);
  };

  const handleCheckUpdate = useCallback(async (agent: ForwardAgent) => {
    setCheckingAgentId(agent.id);
    try {
      const [info] = await Promise.all([
        getAgentVersion(agent.id),
        new Promise(resolve => setTimeout(resolve, 500)),
      ]);
      setVersionInfo(info);
      setUpdateAgent(agent);

      if (info.hasUpdate) {
        setUpdateConfirmOpen(true);
      } else {
        showInfo(`${agent.name} 已是最新版本 (v${info.currentVersion})`);
      }
    } catch {
      showError('获取版本信息失败');
    } finally {
      setCheckingAgentId(null);
    }
  }, [showInfo, showError]);

  const handleConfirmUpdate = useCallback(async () => {
    if (!updateAgent) return;
    try {
      await triggerUpdateMutation.mutateAsync(updateAgent.id);
      setUpdateConfirmOpen(false);
      setUpdateAgent(null);
      setVersionInfo(null);
    } catch {
      // Error handled by mutation
    }
  }, [updateAgent, triggerUpdateMutation]);

  const handleBroadcastURL = useCallback(async (newUrl: string, reason?: string) => {
    return await broadcastURLMutation.mutateAsync({ newUrl, reason });
  }, [broadcastURLMutation]);

  const handleNotifyAgentURL = useCallback(async (agentId: string, newUrl: string, reason?: string) => {
    return await notifyAgentURLMutation.mutateAsync({ agentId, data: { newUrl, reason } });
  }, [notifyAgentURLMutation]);

  const handleBroadcastToAgent = useCallback((agent: ForwardAgent) => {
    setBroadcastTargetAgent(agent);
  }, []);

  const handleDragEnd = async (_activeId: string, _overId: string, oldIndex: number, newIndex: number) => {
    if (oldIndex === newIndex) return;

    // Calculate new sortOrder values for affected agents
    const updates: { id: string | number; sortOrder: number }[] = [];

    // Create a copy of agents array and reorder
    const reorderedAgents = [...forwardAgents];
    const [movedAgent] = reorderedAgents.splice(oldIndex, 1);
    reorderedAgents.splice(newIndex, 0, movedAgent);

    // Update sortOrder for all affected agents (use index as sortOrder)
    reorderedAgents.forEach((agent, index) => {
      const newSortOrder = index + 1;
      if (agent.sortOrder !== newSortOrder) {
        updates.push({ id: agent.id, sortOrder: newSortOrder });
      }
    });

    if (updates.length > 0) {
      await handleReorder(updates);
    }
  };

  const handleCreateSubmit = async (data: CreateForwardAgentRequest) => {
    try {
      const result = await createForwardAgent(data);
      setCreateDialogOpen(false);
      setGeneratedToken({ token: result.token });
      setTokenDialogOpen(true);
    } catch {
      // Error already handled in hook
    }
  };

  const handleUpdateSubmit = async (id: number | string, data: UpdateForwardAgentRequest) => {
    try {
      await updateForwardAgent(id, data);
      setEditDialogOpen(false);
      setSelectedAgent(null);
    } catch {
      // Error already handled in hook
    }
  };

  const handleToggleMute = (agent: ForwardAgent) => {
    toggleMuteNotification(agent.id, !agent.muteNotification);
  };

  // Helper functions for filters
  const handleStatusChange = (value: string): void => {
    handleFiltersChange({ status: value === '_all_' ? undefined : (value as ForwardStatus) });
  };

  const handleSearchChange = (value: string): void => {
    handleFiltersChange({ name: value || undefined });
  };

  const handleSortChange = (value: string): void => {
    if (value === '_default_') {
      handleFiltersChange({ sortBy: undefined, sortOrder: undefined });
    } else {
      const lastUnderscoreIndex = value.lastIndexOf('_');
      const sortBy = value.substring(0, lastUnderscoreIndex);
      const sortOrder = value.substring(lastUnderscoreIndex + 1) as 'asc' | 'desc';
      handleFiltersChange({ sortBy, sortOrder });
    }
  };

  const getSortValue = (): string => {
    if (!filters.sortBy) return '_default_';
    return `${filters.sortBy}_${filters.sortOrder || 'desc'}`;
  };

  const handleResetFilters = (): void => {
    handleFiltersChange({
      status: undefined,
      name: undefined,
      sortBy: undefined,
      sortOrder: undefined,
    });
  };

  const hasActiveFilters = filters.status !== undefined || filters.name !== undefined || filters.sortBy !== undefined;

  return (
    <AdminLayout>
      <div className="py-3 space-y-3">
        {/* High-Density Status Bar with Integrated Filters */}
        <header className="bg-card rounded-lg border border-border px-3 py-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Left: Title + Primary Stats */}
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-semibold text-foreground">转发节点管理</h1>
              <div className="h-4 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-2.5 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Cpu className="size-3" />
                  <span className="font-medium text-foreground">{stats.total}</span>
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="size-3 text-success" />
                  <span className="font-medium text-success">{stats.enabled}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Activity className="size-3 text-info" />
                  <span className="font-medium text-info">{stats.online}</span>
                </span>
                {stats.updatable > 0 && (
                  <span className="flex items-center gap-1">
                    <ArrowUpCircle className="size-3 text-warning" />
                    <span className="font-medium text-warning">{stats.updatable}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Center: Filters (hidden on mobile) */}
            <div className="hidden md:flex items-center gap-2 flex-1 justify-center max-w-md">
              {/* Status filter */}
              <Select value={filters.status || '_all_'} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-7 w-20 text-xs">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all_">全部</SelectItem>
                  <SelectItem value="enabled">启用</SelectItem>
                  <SelectItem value="disabled">禁用</SelectItem>
                </SelectContent>
              </Select>

              {/* Search input */}
              <div className="relative flex-1 max-w-[180px]">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                <Input
                  placeholder="搜索节点"
                  value={filters.name || ''}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="h-7 pl-7 text-xs"
                />
              </div>

              {/* Sort filter */}
              <Select value={getSortValue()} onValueChange={handleSortChange}>
                <SelectTrigger className="h-7 w-24 text-xs">
                  <SelectValue placeholder="排序" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_default_">默认</SelectItem>
                  <SelectItem value="created_at_desc">创建 ↓</SelectItem>
                  <SelectItem value="created_at_asc">创建 ↑</SelectItem>
                  <SelectItem value="updated_at_desc">更新 ↓</SelectItem>
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
                  <TooltipContent>重置筛选</TooltipContent>
                </Tooltip>
              )}

              {/* Drag sort toggle */}
              <div className="h-4 w-px bg-border" />
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
                  {dragSortEnabled ? '关闭拖拽排序' : '开启拖拽排序'}
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5">
              {stats.online > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AdminButton
                      variant="outline"
                      size="sm"
                      onClick={() => setBroadcastURLDialogOpen(true)}
                      className="h-7 px-2 text-xs border-blue-500/30 hover:border-blue-500/50 hover:bg-blue-500/10"
                      icon={<Radio className="size-3.5 text-blue-500" strokeWidth={1.5} />}
                    >
                      <span className="hidden xl:inline text-blue-500">下发</span>
                    </AdminButton>
                  </TooltipTrigger>
                  <TooltipContent>向 {stats.online} 个在线节点下发新API地址</TooltipContent>
                </Tooltip>
              )}

              {stats.updatable > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AdminButton
                      variant="outline"
                      size="sm"
                      onClick={() => setBatchUpdateDialogOpen(true)}
                      className="h-7 px-2 text-xs border-warning/30 hover:border-warning/50 hover:bg-warning-muted"
                      icon={<ArrowUpCircle className="size-3.5 text-warning" strokeWidth={1.5} />}
                    >
                      <span className="hidden xl:inline text-warning">更新</span>
                    </AdminButton>
                  </TooltipTrigger>
                  <TooltipContent>更新 {stats.updatable} 个转发节点</TooltipContent>
                </Tooltip>
              )}

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
                    <span className="sr-only">刷新</span>
                  </AdminButton>
                </TooltipTrigger>
                <TooltipContent>刷新列表</TooltipContent>
              </Tooltip>

              <AdminButton
                variant="primary"
                size="sm"
                className="h-7 px-2.5 text-xs"
                icon={<Plus className="size-3.5" strokeWidth={2} />}
                onClick={() => {
                  setCopyAgentData(undefined);
                  setCreateDialogOpen(true);
                }}
              >
                <span className="hidden sm:inline">新增</span>
                <span className="sm:hidden">新增</span>
              </AdminButton>
            </div>
          </div>
        </header>

        {/* Forward Agent List */}
        {isMobile ? (
          <ForwardAgentListTable
            forwardAgents={forwardAgents}
            loading={isLoading || isFetching || isReordering}
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            resourceGroupsMap={resourceGroupsMap}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onEnable={handleEnable}
            onDisable={handleDisable}
            onRegenerateToken={handleTokenRegenerate}
            onGetInstallScript={handleInstallScript}
            onViewDetail={handleViewDetail}
            onCopy={handleCopy}
            onCheckUpdate={handleCheckUpdate}
            onBroadcastURL={handleBroadcastToAgent}
            onToggleMute={handleToggleMute}
            checkingAgentId={checkingAgentId}
            enableDragSort={true}
            onDragEnd={handleDragEnd}
          />
        ) : (
          <AdminCard noPadding>
            <ForwardAgentListTable
              forwardAgents={forwardAgents}
              loading={isLoading || isFetching || isReordering}
              page={pagination.page}
              pageSize={pagination.pageSize}
              total={pagination.total}
              resourceGroupsMap={resourceGroupsMap}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onEnable={handleEnable}
              onDisable={handleDisable}
              onRegenerateToken={handleTokenRegenerate}
              onGetInstallScript={handleInstallScript}
              onViewDetail={handleViewDetail}
              onCopy={handleCopy}
              onCheckUpdate={handleCheckUpdate}
              onBroadcastURL={handleBroadcastToAgent}
              onToggleMute={handleToggleMute}
              checkingAgentId={checkingAgentId}
              enableDragSort={dragSortEnabled}
              onDragEnd={handleDragEnd}
            />
          </AdminCard>
        )}
      </div>

      {/* Create Forward Agent Dialog/Sheet */}
      {isMobile ? (
        <CreateForwardAgentSheet
          open={createDialogOpen}
          onClose={() => {
            setCreateDialogOpen(false);
            setCopyAgentData(undefined);
          }}
          onSubmit={handleCreateSubmit}
          initialData={copyAgentData}
        />
      ) : (
        <CreateForwardAgentDialog
          open={createDialogOpen}
          onClose={() => {
            setCreateDialogOpen(false);
            setCopyAgentData(undefined);
          }}
          onSubmit={handleCreateSubmit}
          initialData={copyAgentData}
        />
      )}

      {/* Edit Forward Agent Dialog/Sheet */}
      {isMobile ? (
        <EditForwardAgentSheet
          open={editDialogOpen}
          agent={selectedAgent}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedAgent(null);
          }}
          onSubmit={handleUpdateSubmit}
        />
      ) : (
        <EditForwardAgentDialog
          open={editDialogOpen}
          agent={selectedAgent}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedAgent(null);
          }}
          onSubmit={handleUpdateSubmit}
        />
      )}

      {/* Forward Agent Detail Dialog */}
      <ForwardAgentDetailDialog
        open={detailDialogOpen}
        agent={selectedAgent}
        onClose={() => {
          setDetailDialogOpen(false);
          setSelectedAgent(null);
        }}
      />

      {/* Token Display Dialog */}
      <TokenDialog
        open={tokenDialogOpen}
        token={generatedToken?.token ?? null}
        title="转发节点Token"
        onClose={() => {
          setTokenDialogOpen(false);
          setGeneratedToken(null);
        }}
      />

      {/* Install Script Dialog */}
      <InstallScriptDialog
        open={installScriptDialogOpen}
        installCommandData={installCommandData}
        agentName={selectedAgent?.name}
        onClose={() => {
          setInstallScriptDialogOpen(false);
          setInstallCommandData(null);
          setSelectedAgent(null);
        }}
      />

      {/* Version Update Confirm Dialog */}
      <ConfirmDialog
        open={updateConfirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            setUpdateConfirmOpen(false);
            setUpdateAgent(null);
            setVersionInfo(null);
          }
        }}
        title="确认更新"
        description={
          versionInfo && updateAgent
            ? `确定要将 "${updateAgent.name}" 从 v${versionInfo.currentVersion} 更新到 v${versionInfo.latestVersion} 吗？更新过程中 Agent 会短暂离线。`
            : '确定要更新 Agent 吗？'
        }
        confirmText="确认更新"
        onConfirm={handleConfirmUpdate}
        loading={triggerUpdateMutation.isPending}
      />

      {/* Batch Update Dialog */}
      <AgentBatchUpdateDialog
        open={batchUpdateDialogOpen}
        onClose={() => {
          setBatchUpdateDialogOpen(false);
          setBatchUpdateResult(null);
        }}
        agents={forwardAgents}
        onBatchUpdate={(updateAll) => handleBatchUpdate({ updateAll })}
        isUpdating={isBatchUpdating}
        result={batchUpdateResult}
      />

      {/* Broadcast URL Dialog */}
      <BroadcastURLDialog
        open={broadcastURLDialogOpen || broadcastTargetAgent !== null}
        onClose={() => {
          setBroadcastURLDialogOpen(false);
          setBroadcastTargetAgent(null);
        }}
        onBroadcast={handleBroadcastURL}
        isBroadcasting={broadcastURLMutation.isPending}
        onlineCount={stats.online}
        targetAgent={broadcastTargetAgent ? {
          id: String(broadcastTargetAgent.id),
          name: broadcastTargetAgent.name,
          isOnline: !!broadcastTargetAgent.systemStatus,
        } : null}
        onNotifySingle={handleNotifyAgentURL}
        isNotifying={notifyAgentURLMutation.isPending}
      />

      {/* Delete Forward Agent Confirmation Sheet (Mobile only) */}
      <DeleteForwardAgentSheet
        open={deleteDialogOpen}
        agent={agentToDelete}
        onClose={() => {
          setDeleteDialogOpen(false);
          setAgentToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
      />
    </AdminLayout>
  );
};
