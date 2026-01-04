/**
 * Forward Agents Management Page (Admin)
 * Uses unified refined business style components
 */

import { useState, useMemo, useCallback } from 'react';
import {
  Cpu,
  Plus,
  RefreshCw,
  ArrowUpCircle,
  CheckCircle2,
  XCircle,
  Activity,
  Radio,
} from 'lucide-react';
import { Separator } from '@/components/common/Separator';
import { AdminLayout } from '@/layouts/AdminLayout';
import {
  AdminButton,
  AdminCard,
  PageStatsCard,
  type PageStatsCardProps,
} from '@/components/admin';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { TokenDialog } from '@/components/common/TokenDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { usePageTitle } from '@/shared/hooks';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { useResourceGroups } from '@/features/resource-groups/hooks/useResourceGroups';
import { ForwardAgentListTable } from '@/features/forward-agents/components/ForwardAgentListTable';
import { ForwardAgentFiltersComponent } from '@/features/forward-agents/components/ForwardAgentFilters';
import { EditForwardAgentDialog } from '@/features/forward-agents/components/EditForwardAgentDialog';
import { CreateForwardAgentDialog } from '@/features/forward-agents/components/CreateForwardAgentDialog';
import { ForwardAgentDetailDialog } from '@/features/forward-agents/components/ForwardAgentDetailDialog';
import { InstallScriptDialog } from '@/features/forward-agents/components/InstallScriptDialog';
import { AgentBatchUpdateDialog } from '@/features/forward-agents/components/AgentBatchUpdateDialog';
import { BroadcastURLDialog } from '@/features/forward-agents/components/BroadcastURLDialog';
import { useForwardAgentsPage, useTriggerAgentUpdate, useBroadcastAPIURL, useNotifyAgentAPIURL } from '@/features/forward-agents/hooks/useForwardAgents';
import { getAgentVersion } from '@/api/forward';
import type { AgentVersionInfo, ForwardAgent, UpdateForwardAgentRequest, CreateForwardAgentRequest } from '@/api/forward';

export const ForwardAgentsPage = () => {
  usePageTitle('转发节点管理');

  const { isMobile } = useBreakpoint();

  const {
    forwardAgents,
    pagination,
    isLoading,
    isFetching,
    isBatchUpdating,
    refetch,
    createForwardAgent,
    updateForwardAgent,
    deleteForwardAgent,
    enableForwardAgent,
    disableForwardAgent,
    handleRegenerateToken,
    handleGetInstallCommand,
    handleBatchUpdate,
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

  // Calculate agent statistics
  const agentStats = useMemo(() => {
    const total = pagination.total;
    const enabled = forwardAgents.filter((a) => a.status === 'enabled').length;
    const disabled = forwardAgents.filter((a) => a.status === 'disabled').length;
    const online = forwardAgents.filter((a) => a.systemStatus).length;
    const updatable = forwardAgents.filter((a) => a.hasUpdate && a.status === 'enabled' && a.systemStatus).length;
    return { total, enabled, disabled, online, updatable };
  }, [forwardAgents, pagination.total]);

  const statsCards: PageStatsCardProps[] = [
    {
      title: '节点总数',
      value: agentStats.total,
      icon: <Cpu className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: '已启用',
      value: agentStats.enabled,
      icon: <CheckCircle2 className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-success-muted',
      iconColor: 'text-success',
      showPulse: agentStats.enabled > 0,
    },
    {
      title: '已禁用',
      value: agentStats.disabled,
      icon: <XCircle className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-muted',
      iconColor: 'text-muted-foreground',
    },
    {
      title: '在线节点',
      value: agentStats.online,
      icon: <Activity className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-info-muted',
      iconColor: 'text-info',
    },
    ...(agentStats.updatable > 0
      ? [
          {
            title: '可更新',
            value: agentStats.updatable,
            icon: <ArrowUpCircle className="size-4" strokeWidth={1.5} />,
            iconBg: 'bg-warning-muted',
            iconColor: 'text-warning',
          },
        ]
      : []),
  ];

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    refetch();
  };

  const handleEdit = (agent: ForwardAgent) => {
    setSelectedAgent(agent);
    setEditDialogOpen(true);
  };

  const handleDelete = async (agent: ForwardAgent) => {
    if (window.confirm(`确认删除转发节点 "${agent.name}" 吗？此操作不可恢复。`)) {
      await deleteForwardAgent(agent.id);
    }
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

  return (
    <AdminLayout>
      <div className="py-6 sm:py-8">
        {/* Page Header */}
        <header className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5 sm:mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="size-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  实时数据
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                转发节点管理
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                管理系统中的所有转发节点
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5">
            {statsCards.map((stat, index) => (
              <PageStatsCard key={index} {...stat} loading={isFetching} />
            ))}
          </div>
        </header>

        <Separator className="mb-5 sm:mb-6" />

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
          {/* Filters */}
          <div className="flex-1 min-w-0">
            <ForwardAgentFiltersComponent
              filters={filters}
              onChange={handleFiltersChange}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {agentStats.online > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <AdminButton
                    variant="outline"
                    size="sm"
                    onClick={() => setBroadcastURLDialogOpen(true)}
                    icon={<Radio className="size-4 text-blue-500" strokeWidth={1.5} />}
                    className="border-blue-500/30 hover:border-blue-500/50 hover:bg-blue-500/10"
                  >
                    <span className="hidden sm:inline text-blue-500">下发地址</span>
                  </AdminButton>
                </TooltipTrigger>
                <TooltipContent>
                  向 {agentStats.online} 个在线节点下发新API地址
                </TooltipContent>
              </Tooltip>
            )}

            {agentStats.updatable > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <AdminButton
                    variant="outline"
                    size="sm"
                    onClick={() => setBatchUpdateDialogOpen(true)}
                    icon={<ArrowUpCircle className="size-4 text-warning" strokeWidth={1.5} />}
                    className="border-warning/30 hover:border-warning/50 hover:bg-warning-muted"
                  >
                    <span className="hidden sm:inline text-warning">批量更新</span>
                  </AdminButton>
                </TooltipTrigger>
                <TooltipContent>
                  更新 {agentStats.updatable} 个转发节点
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <AdminButton
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  icon={
                    <RefreshCw
                      key={refreshKey}
                      className="size-4 animate-spin-once"
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
              icon={<Plus className="size-4" strokeWidth={2} />}
              onClick={() => {
                setCopyAgentData(undefined);
                setCreateDialogOpen(true);
              }}
            >
              <span className="hidden sm:inline">新增节点</span>
              <span className="sm:hidden">新增</span>
            </AdminButton>
          </div>
        </div>

        {/* Forward Agent List */}
        {isMobile ? (
          <ForwardAgentListTable
            forwardAgents={forwardAgents}
            loading={isLoading || isFetching}
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
            checkingAgentId={checkingAgentId}
          />
        ) : (
          <AdminCard noPadding>
            <ForwardAgentListTable
              forwardAgents={forwardAgents}
              loading={isLoading || isFetching}
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
              checkingAgentId={checkingAgentId}
            />
          </AdminCard>
        )}
      </div>

      {/* Create Forward Agent Dialog */}
      <CreateForwardAgentDialog
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setCopyAgentData(undefined);
        }}
        onSubmit={handleCreateSubmit}
        initialData={copyAgentData}
      />

      {/* Edit Forward Agent Dialog */}
      <EditForwardAgentDialog
        open={editDialogOpen}
        agent={selectedAgent}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedAgent(null);
        }}
        onSubmit={handleUpdateSubmit}
      />

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
        onlineCount={agentStats.online}
        targetAgent={broadcastTargetAgent ? {
          id: String(broadcastTargetAgent.id),
          name: broadcastTargetAgent.name,
          isOnline: !!broadcastTargetAgent.systemStatus,
        } : null}
        onNotifySingle={handleNotifyAgentURL}
        isNotifying={notifyAgentURLMutation.isPending}
      />
    </AdminLayout>
  );
};
