/**
 * Forward Agents Management Page (Admin)
 * Tailwind UI Application UI style layout
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Cpu,
  Plus,
  RefreshCw,
  ArrowUpCircle,
  CheckCircle2,
  Activity,
  Radio,
  Search,
  FilterX,
} from 'lucide-react';
import { Switch, SwitchThumb } from '@/components/common/Switch';
import { AdminLayout } from '@/layouts/AdminLayout';
import { PageHeader } from '@/components/admin';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { TokenDialog } from '@/components/common/TokenDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { usePageTitle } from '@/shared/hooks';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { useResourceGroups } from '@/features/resource-groups/hooks/useResourceGroups';
import { ForwardAgentListTable } from '@/features/forward-agents/components/ForwardAgentListTable';
import { MobileForwardAgentManagement } from '@/features/forward-agents/components/MobileForwardAgentManagement';
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
  const { t } = useTranslation();
  usePageTitle(t('admin.forwardAgents.title'));

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
      if (window.confirm(t('admin.forwardAgents.confirmDelete', { name: agent.name }))) {
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

  const handleToggleStatus = async (agent: ForwardAgent) => {
    if (agent.status === 'enabled') {
      await disableForwardAgent(agent.id);
    } else {
      await enableForwardAgent(agent.id);
    }
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
      name: `${agent.name} - ${t('admin.forwardAgents.copySuffix')}`,
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
        showInfo(t('admin.forwardAgents.version.upToDate', { name: agent.name, version: info.currentVersion }));
      }
    } catch {
      showError(t('admin.forwardAgents.version.fetchFailed'));
    } finally {
      setCheckingAgentId(null);
    }
  }, [showInfo, showError, t]);

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
      <div className="space-y-6">
        {/* Page Header with metadata and actions */}
        <PageHeader
          title={t('admin.forwardAgents.title')}
          icon={Cpu}
          metadata={[
            { icon: Cpu, text: `${stats.total} ${t('admin.forwardAgents.agentsUnit')}` },
            { icon: CheckCircle2, text: `${stats.enabled} ${t('common.status.enabled')}` },
            { icon: Activity, text: `${stats.online} ${t('common.status.online')}` },
            ...(stats.updatable > 0 ? [{ icon: ArrowUpCircle, text: `${stats.updatable} ${t('admin.forwardAgents.updatable')}` }] : []),
          ]}
          action={
            <div className="flex items-center gap-2">
              {stats.online > 0 && (
                <Button variant="outline" size="sm" onClick={() => setBroadcastURLDialogOpen(true)}>
                  <Radio className="size-4 mr-2" />
                  {t('admin.forwardAgents.actions.broadcast')}
                </Button>
              )}
              {stats.updatable > 0 && (
                <Button variant="outline" size="sm" onClick={() => setBatchUpdateDialogOpen(true)}>
                  <ArrowUpCircle className="size-4 mr-2" />
                  {t('admin.forwardAgents.actions.update')}
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={handleRefresh}>
                <RefreshCw key={refreshKey} className="size-4" />
              </Button>
              <Button onClick={() => { setCopyAgentData(undefined); setCreateDialogOpen(true); }}>
                <Plus className="size-4 mr-2" />
                {t('admin.forwardAgents.actions.create')}
              </Button>
            </div>
          }
        />

        {/* Filters row - desktop only */}
        {!isMobile && (
          <div className="flex flex-wrap items-center gap-3">
            {/* Status filter */}
            <Select value={filters.status || '_all_'} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder={t('admin.forwardAgents.filters.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all_">{t('admin.forwardAgents.filters.all')}</SelectItem>
                <SelectItem value="enabled">{t('admin.forwardAgents.filters.enabled')}</SelectItem>
                <SelectItem value="disabled">{t('admin.forwardAgents.filters.disabled')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Search input */}
            <div className="relative w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={t('admin.forwardAgents.filters.searchAgent')}
                value={filters.name || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Sort filter */}
            <Select value={getSortValue()} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t('admin.forwardAgents.filters.sort')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_default_">{t('admin.forwardAgents.filters.default')}</SelectItem>
                <SelectItem value="created_at_desc">{t('admin.forwardAgents.filters.createdDesc')}</SelectItem>
                <SelectItem value="created_at_asc">{t('admin.forwardAgents.filters.createdAsc')}</SelectItem>
                <SelectItem value="updated_at_desc">{t('admin.forwardAgents.filters.updatedDesc')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Reset filters button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
              >
                <FilterX className="size-4 mr-2" />
                {t('admin.forwardAgents.filters.resetFilters')}
              </Button>
            )}

            {/* Divider */}
            <div className="h-6 w-px bg-border" />

            {/* Drag sort toggle */}
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={dragSortEnabled}
                onCheckedChange={setDragSortEnabled}
                disabled={isReordering}
              >
                <SwitchThumb />
              </Switch>
              <span className="text-muted-foreground">{t('admin.forwardAgents.dragSort.label')}</span>
            </label>
          </div>
        )}

        {/* Mobile: MobileForwardAgentManagement handles its own layout */}
        {isMobile ? (
          <MobileForwardAgentManagement
            forwardAgents={forwardAgents}
            loading={isLoading}
            refreshing={isFetching || isReordering}
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onRefresh={handleRefresh}
            onCreate={() => {
              setCopyAgentData(undefined);
              setCreateDialogOpen(true);
            }}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            onPageChange={handlePageChange}
            enableDragSort={dragSortEnabled}
            onDragSortChange={setDragSortEnabled}
            onDragEnd={handleDragEnd}
            onRegenerateToken={handleTokenRegenerate}
            onGetInstallScript={handleInstallScript}
          />
        ) : (
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
        )}
      </div>

      {/* Create Forward Agent Dialog/Sheet */}
      {isMobile ? (
        <CreateForwardAgentSheet
          open={createDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) setCopyAgentData(undefined);
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
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setSelectedAgent(null);
          }}
          entity={selectedAgent}
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
        title={t('admin.forwardAgents.token')}
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
        title={t('admin.forwardAgents.update.confirmTitle')}
        description={
          versionInfo && updateAgent
            ? t('admin.forwardAgents.update.confirmMessage', {
                name: updateAgent.name,
                currentVersion: versionInfo.currentVersion,
                latestVersion: versionInfo.latestVersion,
              })
            : t('admin.forwardAgents.update.confirmDefault')
        }
        confirmText={t('admin.forwardAgents.update.confirmButton')}
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
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setAgentToDelete(null);
        }}
        entity={agentToDelete}
        onConfirm={handleDeleteConfirm}
      />
    </AdminLayout>
  );
};
