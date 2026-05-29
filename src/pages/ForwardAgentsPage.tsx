/**
 * Forward Agents Management Page (Admin)
 * Tailwind Application UI style
 * Mobile-first responsive design
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  RefreshCw,
  ArrowUpCircle,
  Radio,
  Search,
  X,
} from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { StatsPill, PageToolbar } from '@/components/admin';
import { adminContentStyles } from '@/lib/ui-styles';
import { Button } from '@/components/common/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { Switch, SwitchThumb } from '@/components/common/Switch';
import { TokenDialog } from '@/components/common/TokenDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
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
import { InstallScriptSheet } from '@/features/forward-agents/components/InstallScriptSheet';
import type { MultiInstanceConfig } from '@/shared/components/agent';
import { AgentBatchUpdateDialog } from '@/features/forward-agents/components/AgentBatchUpdateDialog';
import { AgentBatchUpdateSheet } from '@/features/forward-agents/components/AgentBatchUpdateSheet';
import { BroadcastURLDialog } from '@/features/forward-agents/components/BroadcastURLDialog';
import { BroadcastURLSheet } from '@/features/forward-agents/components/BroadcastURLSheet';
import {
  useForwardAgentsPage,
  useTriggerAgentUpdate,
  useBroadcastAPIURL,
  useNotifyAgentAPIURL,
} from '@/features/forward-agents/hooks/useForwardAgents';
import { getAgentVersion } from '@/api/forward';
import type {
  AgentVersionInfo,
  ForwardAgent,
  UpdateForwardAgentRequest,
  CreateForwardAgentRequest,
  ForwardStatus,
} from '@/api/forward';

// ============================================================================
// Types
// ============================================================================

type DialogType =
  | 'create'
  | 'edit'
  | 'detail'
  | 'delete'
  | 'token'
  | 'installScript'
  | 'batchUpdate'
  | 'broadcast'
  | 'notifyURL'
  | 'updateConfirm'
  | null;

// ============================================================================
// Main Component
// ============================================================================

export function ForwardAgentsPage() {
  const { t } = useTranslation();
  usePageTitle(t('admin.forwardAgents.title'));

  const { isMobile } = useBreakpoint();
  const { showError, showInfo } = useNotificationStore();

  // Forward agent data and operations
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
    isLoadingInstallCommand,
    batchUpdateResult,
    setBatchUpdateResult,
    handlePageChange,
    handlePageSizeChange,
    filters,
    handleFiltersChange,
  } = useForwardAgentsPage();

  const { resourceGroups } = useResourceGroups({ pageSize: 100 });
  const triggerUpdateMutation = useTriggerAgentUpdate();
  const broadcastURLMutation = useBroadcastAPIURL();
  const notifyAgentURLMutation = useNotifyAgentAPIURL();

  // Dialog state management
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [selectedAgent, setSelectedAgent] = useState<ForwardAgent | null>(null);
  const [copyAgentData, setCopyAgentData] = useState<Partial<CreateForwardAgentRequest> | undefined>(undefined);
  const [versionInfo, setVersionInfo] = useState<AgentVersionInfo | null>(null);
  const [checkingAgentId, setCheckingAgentId] = useState<string | number | null>(null);
  const [updatingAgentId, setUpdatingAgentId] = useState<string | number | null>(null);
  const [dragSortEnabled, setDragSortEnabled] = useState(false);
  const [installInstanceName, setInstallInstanceName] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Computed values
  const resourceGroupsMap = useMemo(() => {
    const map: Record<string, (typeof resourceGroups)[0]> = {};
    resourceGroups.forEach((group) => {
      map[group.sid] = group;
    });
    return map;
  }, [resourceGroups]);

  // Calculate stats for conditional action buttons
  const stats = useMemo(() => {
    const online = forwardAgents.filter((a) => a.systemStatus).length;
    const updatable = forwardAgents.filter((a) => a.hasUpdate && a.status === 'enabled' && a.systemStatus).length;
    return { total: pagination.total, online, updatable };
  }, [forwardAgents, pagination.total]);

  // Calculate online/offline stats for inline header
  const detailedStats = useMemo(() => {
    const offline = forwardAgents.filter((a) => a.status === 'enabled' && !a.systemStatus).length;
    return { ...stats, offline };
  }, [forwardAgents, stats]);

  // Dialog handlers
  const openDialog = useCallback((type: DialogType, agent?: ForwardAgent) => {
    setSelectedAgent(agent ?? null);
    setActiveDialog(type);
  }, []);

  const closeDialog = useCallback(() => {
    setActiveDialog(null);
    setSelectedAgent(null);
    setCopyAgentData(undefined);
    setVersionInfo(null);
  }, []);

  // Action handlers
  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    refetch();
  }, [refetch]);

  const handleCreate = useCallback(() => {
    setCopyAgentData(undefined);
    openDialog('create');
  }, [openDialog]);

  const handleEdit = useCallback(
    (agent: ForwardAgent) => openDialog('edit', agent),
    [openDialog]
  );

  const handleViewDetail = useCallback(
    (agent: ForwardAgent) => openDialog('detail', agent),
    [openDialog]
  );

  const handleDeleteClick = useCallback(
    (agent: ForwardAgent) => {
      if (isMobile) {
        openDialog('delete', agent);
      } else if (window.confirm(t('admin.forwardAgents.confirmDelete', { name: agent.name }))) {
        deleteForwardAgent(agent.id);
      }
    },
    [isMobile, openDialog, deleteForwardAgent, t]
  );

  const handleCopy = useCallback(
    (agent: ForwardAgent) => {
      const data: Partial<CreateForwardAgentRequest> = {
        name: `${agent.name} - ${t('common.actions.copy')}`,
        remark: agent.remark,
      };
      setCopyAgentData(data);
      openDialog('create');
    },
    [openDialog, t]
  );

  const handleEnable = useCallback(
    async (agent: ForwardAgent) => {
      await enableForwardAgent(agent.id);
    },
    [enableForwardAgent]
  );

  const handleDisable = useCallback(
    async (agent: ForwardAgent) => {
      await disableForwardAgent(agent.id);
    },
    [disableForwardAgent]
  );

  const handleToggleStatus = useCallback(
    async (agent: ForwardAgent) => {
      if (agent.status === 'enabled') {
        await disableForwardAgent(agent.id);
      } else {
        await enableForwardAgent(agent.id);
      }
    },
    [enableForwardAgent, disableForwardAgent]
  );

  const handleToggleMute = useCallback(
    (agent: ForwardAgent) => {
      toggleMuteNotification(agent.id, !agent.muteNotification);
    },
    [toggleMuteNotification]
  );

  const handleTokenRegenerate = useCallback(
    async (agent: ForwardAgent) => {
      const token = await handleRegenerateToken(agent.id);
      if (token) {
        openDialog('token');
      }
    },
    [handleRegenerateToken, openDialog]
  );

  const handleInstallScript = useCallback(
    async (agent: ForwardAgent) => {
      setSelectedAgent(agent);
      setInstallInstanceName('');
      const command = await handleGetInstallCommand(agent.id);
      if (command) {
        openDialog('installScript', agent);
      }
    },
    [handleGetInstallCommand, openDialog]
  );

  // Multi-instance install: regenerate the command with the entered name
  const installMultiInstance = useMemo<MultiInstanceConfig>(
    () => ({
      name: installInstanceName,
      onNameChange: setInstallInstanceName,
      onApply: () => {
        if (selectedAgent) {
          void handleGetInstallCommand(selectedAgent.id, installInstanceName);
        }
      },
      regenerating: isLoadingInstallCommand,
    }),
    [installInstanceName, selectedAgent, handleGetInstallCommand, isLoadingInstallCommand]
  );

  const handleCheckUpdate = useCallback(
    async (agent: ForwardAgent) => {
      setCheckingAgentId(agent.id);
      try {
        const [info] = await Promise.all([
          getAgentVersion(agent.id),
          new Promise((resolve) => setTimeout(resolve, 500)),
        ]);
        setVersionInfo(info);

        if (info.hasUpdate) {
          openDialog('updateConfirm', agent);
        } else {
          showInfo(t('admin.forwardAgents.version.upToDate', { name: agent.name, version: info.currentVersion }));
        }
      } catch {
        showError(t('admin.forwardAgents.version.fetchFailed'));
      } finally {
        setCheckingAgentId(null);
      }
    },
    [openDialog, showInfo, showError, t]
  );

  const handleConfirmUpdate = useCallback(async () => {
    if (!selectedAgent) return;
    try {
      await triggerUpdateMutation.mutateAsync(selectedAgent.id);
      closeDialog();
    } catch {
      // Error handled by mutation
    }
  }, [selectedAgent, triggerUpdateMutation, closeDialog]);

  const handleTriggerUpdate = useCallback(
    async (agent: ForwardAgent) => {
      setUpdatingAgentId(agent.id);
      try {
        await triggerUpdateMutation.mutateAsync(agent.id);
      } catch {
        // Error handled by mutation
      } finally {
        setUpdatingAgentId(null);
      }
    },
    [triggerUpdateMutation]
  );

  const handleBroadcastToAgent = useCallback(
    (agent: ForwardAgent) => openDialog('notifyURL', agent),
    [openDialog]
  );

  const handleBroadcastURL = useCallback(
    async (newUrl: string, reason?: string) => {
      return await broadcastURLMutation.mutateAsync({ newUrl, reason });
    },
    [broadcastURLMutation]
  );

  const handleNotifyAgentURL = useCallback(
    async (agentId: string, newUrl: string, reason?: string) => {
      return await notifyAgentURLMutation.mutateAsync({ agentId, data: { newUrl, reason } });
    },
    [notifyAgentURLMutation]
  );

  // Form submission handlers
  const handleCreateSubmit = useCallback(
    async (data: CreateForwardAgentRequest) => {
      const result = await createForwardAgent(data);
      closeDialog();
      setGeneratedToken({ token: result.token });
      openDialog('token');
    },
    [createForwardAgent, closeDialog, setGeneratedToken, openDialog]
  );

  const handleUpdateSubmit = useCallback(
    async (id: number | string, data: UpdateForwardAgentRequest) => {
      await updateForwardAgent(id, data);
      closeDialog();
    },
    [updateForwardAgent, closeDialog]
  );

  const handleDeleteConfirm = useCallback(
    async (agent: ForwardAgent) => {
      await deleteForwardAgent(agent.id);
      closeDialog();
    },
    [deleteForwardAgent, closeDialog]
  );

  // Drag and drop handler
  const handleDragEnd = useCallback(
    async (_activeId: string, _overId: string, oldIndex: number, newIndex: number) => {
      if (oldIndex === newIndex) return;

      const reorderedAgents = [...forwardAgents];
      const [movedAgent] = reorderedAgents.splice(oldIndex, 1);
      reorderedAgents.splice(newIndex, 0, movedAgent);

      const updates: { id: string | number; sortOrder: number }[] = [];
      reorderedAgents.forEach((agent, index) => {
        const newSortOrder = index + 1;
        if (agent.sortOrder !== newSortOrder) {
          updates.push({ id: agent.id, sortOrder: newSortOrder });
        }
      });

      if (updates.length > 0) {
        await handleReorder(updates);
      }
    },
    [forwardAgents, handleReorder]
  );

  // Filter handlers
  const handleStatusChange = useCallback(
    (value: string) => {
      handleFiltersChange({ status: value === '_all_' ? undefined : (value as ForwardStatus) });
    },
    [handleFiltersChange]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      handleFiltersChange({ name: value || undefined });
    },
    [handleFiltersChange]
  );

  const handleSortChange = useCallback(
    (value: string) => {
      if (value === '_default_') {
        handleFiltersChange({ sortBy: undefined, sortOrder: undefined });
      } else {
        const lastUnderscoreIndex = value.lastIndexOf('_');
        const sortBy = value.substring(0, lastUnderscoreIndex);
        const sortOrder = value.substring(lastUnderscoreIndex + 1) as 'asc' | 'desc';
        handleFiltersChange({ sortBy, sortOrder });
      }
    },
    [handleFiltersChange]
  );

  const handleResetFilters = useCallback(() => {
    handleFiltersChange({ status: undefined, name: undefined, sortBy: undefined, sortOrder: undefined });
  }, [handleFiltersChange]);

  const getSortValue = (): string => {
    if (!filters.sortBy) return '_default_';
    return `${filters.sortBy}_${filters.sortOrder || 'desc'}`;
  };

  const hasActiveFilters = filters.status !== undefined || filters.name !== undefined || filters.sortBy !== undefined;
  const isTableLoading = isLoading || isFetching || isReordering;

  // Mobile layout
  if (isMobile) {
    return (
      <AdminLayout>
        <div className={adminContentStyles.mobile}>
          <MobileForwardAgentManagement
            forwardAgents={forwardAgents}
            loading={isLoading}
            refreshing={isFetching || isReordering}
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onRefresh={handleRefresh}
            onCreate={handleCreate}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onToggleStatus={handleToggleStatus}
            onPageChange={handlePageChange}
            onDragEnd={handleDragEnd}
            onRegenerateToken={handleTokenRegenerate}
            onGetInstallScript={handleInstallScript}
            onTriggerUpdate={handleTriggerUpdate}
            onBatchUpdate={stats.updatable > 0 ? () => openDialog('batchUpdate') : undefined}
            isUpdating={updatingAgentId !== null}
            isBatchUpdating={isBatchUpdating}
            onBroadcast={stats.online > 0 ? () => openDialog('broadcast') : undefined}
          />
        </div>

        {/* Mobile Sheets */}
        <CreateForwardAgentSheet
          open={activeDialog === 'create'}
          onOpenChange={(open) => !open && closeDialog()}
          onSubmit={handleCreateSubmit}
          initialData={copyAgentData}
        />

        <EditForwardAgentSheet
          open={activeDialog === 'edit'}
          onOpenChange={(open) => !open && closeDialog()}
          entity={selectedAgent}
          onSubmit={handleUpdateSubmit}
        />

        <DeleteForwardAgentSheet
          open={activeDialog === 'delete'}
          onOpenChange={(open) => !open && closeDialog()}
          entity={selectedAgent}
          onConfirm={handleDeleteConfirm}
        />

        <AgentBatchUpdateSheet
          open={activeDialog === 'batchUpdate'}
          onOpenChange={(open) => {
            if (!open) {
              closeDialog();
              setBatchUpdateResult(null);
            }
          }}
          agents={forwardAgents}
          onBatchUpdate={(updateAll) => handleBatchUpdate({ updateAll })}
          isUpdating={isBatchUpdating}
          result={batchUpdateResult}
        />

        <BroadcastURLSheet
          open={activeDialog === 'broadcast'}
          onOpenChange={(open) => !open && closeDialog()}
          onBroadcast={handleBroadcastURL}
          isBroadcasting={broadcastURLMutation.isPending}
          onlineCount={stats.online}
        />

        <TokenDialog
          open={activeDialog === 'token'}
          token={generatedToken?.token ?? null}
          title={t('admin.forwardAgents.token')}
          onClose={() => {
            closeDialog();
            setGeneratedToken(null);
          }}
        />

        <InstallScriptSheet
          open={activeDialog === 'installScript'}
          installCommandData={installCommandData}
          agentName={selectedAgent?.name}
          multiInstance={installMultiInstance}
          onClose={() => {
            closeDialog();
            setInstallCommandData(null);
            setInstallInstanceName('');
          }}
        />
      </AdminLayout>
    );
  }

  // Desktop layout
  return (
    <AdminLayout>
      <div className={adminContentStyles.desktop}>
        {/* Stats Overview Strip + Actions */}
        <PageToolbar
          actions={<>
            <Button onClick={handleCreate} size="sm" className="h-8 text-[13px]">
              <Plus className="mr-1 size-3.5" />
              {t('common.actions.create')}
            </Button>
            {detailedStats.online > 0 && (
              <Button variant="outline" size="sm" onClick={() => openDialog('broadcast')} className="h-8 text-[13px] border-border/60">
                <Radio className="mr-1 size-3.5" />
                {t('admin.forwardAgents.actions.broadcast')}
              </Button>
            )}
            {detailedStats.updatable > 0 && (
              <Button variant="outline" size="sm" onClick={() => openDialog('batchUpdate')} className="h-8 text-[13px] border-border/60">
                <ArrowUpCircle className="mr-1 size-3.5" />
                {t('admin.forwardAgents.actions.update')}
              </Button>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground/60 hover:text-foreground" onClick={handleRefresh}>
                  <RefreshCw key={refreshKey} className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('common.actions.refresh')}</TooltipContent>
            </Tooltip>
          </>}
        >
          <StatsPill>{detailedStats.total} {t('admin.forwardAgents.agentsUnit')}</StatsPill>
          <StatsPill variant="success" dot>{detailedStats.online} {t('common.status.online')}</StatsPill>
          {detailedStats.offline > 0 && (
            <StatsPill variant="muted" dot>{detailedStats.offline} {t('common.status.offline')}</StatsPill>
          )}
        </PageToolbar>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search input */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
            <input
              type="text"
              value={filters.name || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t('admin.forwardAgents.filters.searchAgent')}
              className="h-8 w-[200px] rounded-lg ring-1 ring-border/60 bg-background pl-8 pr-3 text-[13px] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/20"
            />
          </div>

          <Select value={filters.status || '_all_'} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[110px] h-8 text-xs">
              <SelectValue placeholder={t('common.status.label')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all_">{t('admin.forwardAgents.filters.all')}</SelectItem>
              <SelectItem value="enabled">{t('common.status.enabled')}</SelectItem>
              <SelectItem value="disabled">{t('common.status.disabled')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={getSortValue()} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder={t('common.table.sort')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_default_">{t('admin.forwardAgents.filters.default')}</SelectItem>
              <SelectItem value="created_at_desc">{t('admin.forwardAgents.filters.createdDesc')}</SelectItem>
              <SelectItem value="created_at_asc">{t('admin.forwardAgents.filters.createdAsc')}</SelectItem>
              <SelectItem value="updated_at_desc">{t('admin.forwardAgents.filters.updatedDesc')}</SelectItem>
            </SelectContent>
          </Select>

          <div className="h-5 w-px bg-border/60" />

          <label className="flex items-center gap-2 text-[13px] cursor-pointer">
            <Switch checked={dragSortEnabled} onCheckedChange={setDragSortEnabled} disabled={isReordering}>
              <SwitchThumb />
            </Switch>
            <span className="text-muted-foreground">{t('admin.forwardAgents.dragSort.label')}</span>
          </label>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters} className="text-muted-foreground h-8 text-xs">
              <X className="size-3.5 mr-1" />
              {t('admin.forwardAgents.filters.resetFilters')}
            </Button>
          )}
        </div>

        {/* Agent Table */}
        <ForwardAgentListTable
          forwardAgents={forwardAgents}
          loading={isTableLoading}
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          resourceGroupsMap={resourceGroupsMap}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
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
      </div>

      {/* Desktop Dialogs */}
      <CreateForwardAgentDialog
        open={activeDialog === 'create'}
        onClose={closeDialog}
        onSubmit={handleCreateSubmit}
        initialData={copyAgentData}
      />

      <EditForwardAgentDialog
        open={activeDialog === 'edit'}
        agent={selectedAgent}
        onClose={closeDialog}
        onSubmit={handleUpdateSubmit}
      />

      <ForwardAgentDetailDialog
        open={activeDialog === 'detail'}
        agent={selectedAgent}
        onClose={closeDialog}
      />

      <TokenDialog
        open={activeDialog === 'token'}
        token={generatedToken?.token ?? null}
        title={t('admin.forwardAgents.token')}
        onClose={() => {
          closeDialog();
          setGeneratedToken(null);
        }}
      />

      <InstallScriptDialog
        open={activeDialog === 'installScript'}
        installCommandData={installCommandData}
        agentName={selectedAgent?.name}
        multiInstance={installMultiInstance}
        onClose={() => {
          closeDialog();
          setInstallCommandData(null);
          setInstallInstanceName('');
        }}
      />

      <ConfirmDialog
        open={activeDialog === 'updateConfirm'}
        onOpenChange={(open) => !open && closeDialog()}
        title={t('admin.forwardAgents.update.confirmTitle')}
        description={
          versionInfo && selectedAgent
            ? t('admin.forwardAgents.update.confirmMessage', {
                name: selectedAgent.name,
                currentVersion: versionInfo.currentVersion,
                latestVersion: versionInfo.latestVersion,
              })
            : t('admin.forwardAgents.update.confirmDefault')
        }
        confirmText={t('admin.forwardAgents.update.confirmButton')}
        onConfirm={handleConfirmUpdate}
        loading={triggerUpdateMutation.isPending}
      />

      <AgentBatchUpdateDialog
        open={activeDialog === 'batchUpdate'}
        onClose={() => {
          closeDialog();
          setBatchUpdateResult(null);
        }}
        agents={forwardAgents}
        onBatchUpdate={(updateAll) => handleBatchUpdate({ updateAll })}
        isUpdating={isBatchUpdating}
        result={batchUpdateResult}
      />

      <BroadcastURLDialog
        open={activeDialog === 'broadcast' || activeDialog === 'notifyURL'}
        onClose={closeDialog}
        onBroadcast={handleBroadcastURL}
        isBroadcasting={broadcastURLMutation.isPending}
        onlineCount={stats.online}
        targetAgent={
          activeDialog === 'notifyURL' && selectedAgent
            ? { id: String(selectedAgent.id), name: selectedAgent.name, isOnline: !!selectedAgent.systemStatus }
            : null
        }
        onNotifySingle={handleNotifyAgentURL}
        isNotifying={notifyAgentURLMutation.isPending}
      />
    </AdminLayout>
  );
}
