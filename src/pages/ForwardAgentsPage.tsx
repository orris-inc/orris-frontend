/**
 * Forward Agents Management Page (Admin)
 * Uses unified refined business style components
 */

import { useState, useMemo } from 'react';
import { Cpu, Plus, RefreshCw } from 'lucide-react';
import { ForwardAgentListTable } from '@/features/forward-agents/components/ForwardAgentListTable';
import { ForwardAgentFiltersComponent } from '@/features/forward-agents/components/ForwardAgentFilters';
import { EditForwardAgentDialog } from '@/features/forward-agents/components/EditForwardAgentDialog';
import { CreateForwardAgentDialog } from '@/features/forward-agents/components/CreateForwardAgentDialog';
import { ForwardAgentDetailDialog } from '@/features/forward-agents/components/ForwardAgentDetailDialog';
import { InstallScriptDialog } from '@/features/forward-agents/components/InstallScriptDialog';
import { useForwardAgentsPage } from '@/features/forward-agents/hooks/useForwardAgents';
import { useResourceGroups } from '@/features/resource-groups/hooks/useResourceGroups';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { TokenDialog } from '@/components/common/TokenDialog';
import {
  AdminPageLayout,
  AdminButton,
  AdminCard,
} from '@/components/admin';
import { usePageTitle } from '@/shared/hooks';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import type { ForwardAgent, UpdateForwardAgentRequest, CreateForwardAgentRequest } from '@/api/forward';

export const ForwardAgentsPage = () => {
  usePageTitle('转发节点管理');

  // Responsive breakpoint
  const { isMobile } = useBreakpoint();

  const {
    forwardAgents,
    pagination,
    isLoading,
    isFetching,
    refetch,
    createForwardAgent,
    updateForwardAgent,
    deleteForwardAgent,
    enableForwardAgent,
    disableForwardAgent,
    handleRegenerateToken,
    handleGetInstallCommand,
    generatedToken,
    setGeneratedToken,
    installCommandData,
    setInstallCommandData,
    handlePageChange,
    handlePageSizeChange,
    filters,
    handleFiltersChange,
  } = useForwardAgentsPage();

  // Fetch resource groups for displaying names
  const { resourceGroups } = useResourceGroups({ pageSize: 100 });
  const resourceGroupsMap = useMemo(() => {
    const map: Record<string, typeof resourceGroups[0]> = {};
    resourceGroups.forEach((group) => {
      map[group.sid] = group;
    });
    return map;
  }, [resourceGroups]);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [installScriptDialogOpen, setInstallScriptDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<ForwardAgent | null>(null);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [copyAgentData, setCopyAgentData] = useState<Partial<CreateForwardAgentRequest> | undefined>(undefined);

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

  const handleRefresh = () => {
    refetch();
  };

  const handleCreateSubmit = async (data: CreateForwardAgentRequest) => {
    try {
      const result = await createForwardAgent(data);
      // Close create dialog first
      setCreateDialogOpen(false);
      // Show Token dialog
      setGeneratedToken({
        token: result.token,
      });
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
      <AdminPageLayout
        title="转发节点管理"
        description="管理系统中的所有转发节点"
        icon={Cpu}
      >
        {/* Toolbar - Compact on mobile */}
        <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
          {/* Row 1: Actions */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <AdminButton
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isFetching}
                  icon={
                    <RefreshCw
                      className={`size-3.5 sm:size-4 ${isFetching ? 'animate-spin' : ''}`}
                      strokeWidth={1.5}
                    />
                  }
                >
                  <span className="sr-only">刷新</span>
                </AdminButton>
              </TooltipTrigger>
              <TooltipContent>刷新</TooltipContent>
            </Tooltip>

            <AdminButton
              variant="primary"
              size="sm"
              icon={<Plus className="size-3.5 sm:size-4" strokeWidth={1.5} />}
              onClick={() => {
                setCopyAgentData(undefined);
                setCreateDialogOpen(true);
              }}
            >
              <span className="hidden sm:inline">新增转发节点</span>
              <span className="sm:hidden text-xs">新增</span>
            </AdminButton>
          </div>

          {/* Row 2: Filters */}
          <ForwardAgentFiltersComponent
            filters={filters}
            onChange={handleFiltersChange}
          />
        </div>

        {/* Forward Agent List - No AdminCard wrapper on mobile */}
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
            />
          </AdminCard>
        )}
      </AdminPageLayout>

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
    </AdminLayout>
  );
};
