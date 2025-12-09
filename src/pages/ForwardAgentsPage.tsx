/**
 * 转发节点管理页面（管理端）
 * 使用统一的精致商务风格组件
 */

import { useState } from 'react';
import { Cpu, Plus, RefreshCw } from 'lucide-react';
import { ForwardAgentListTable } from '@/features/forward-agents/components/ForwardAgentListTable';
import { EditForwardAgentDialog } from '@/features/forward-agents/components/EditForwardAgentDialog';
import { CreateForwardAgentDialog } from '@/features/forward-agents/components/CreateForwardAgentDialog';
import { ForwardAgentDetailDialog } from '@/features/forward-agents/components/ForwardAgentDetailDialog';
import { InstallScriptDialog } from '@/features/forward-agents/components/InstallScriptDialog';
import { useForwardAgentsPage } from '@/features/forward-agents/hooks/useForwardAgents';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { TokenDialog } from '@/components/common/TokenDialog';
import {
  AdminPageLayout,
  AdminButton,
  AdminCard,
} from '@/components/admin';
import type { ForwardAgent, UpdateForwardAgentRequest, CreateForwardAgentRequest } from '@/api/forward';

export const ForwardAgentsPage = () => {
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
  } = useForwardAgentsPage();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [installScriptDialogOpen, setInstallScriptDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<ForwardAgent | null>(null);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);

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

  const handleRefresh = () => {
    refetch();
  };

  const handleCreateSubmit = async (data: CreateForwardAgentRequest) => {
    try {
      const result = await createForwardAgent(data);
      // 先关闭创建对话框
      setCreateDialogOpen(false);
      // 显示Token对话框
      setGeneratedToken({
        token: result.token,
      });
      setTokenDialogOpen(true);
    } catch {
      // 错误已在 hook 中处理
    }
  };

  const handleUpdateSubmit = async (id: number | string, data: UpdateForwardAgentRequest) => {
    try {
      await updateForwardAgent(id, data);
      setEditDialogOpen(false);
      setSelectedAgent(null);
    } catch {
      // 错误已在 hook 中处理
    }
  };

  return (
    <AdminLayout>
      <AdminPageLayout
        title="转发节点管理"
        description="管理系统中的所有转发节点"
        icon={Cpu}
        action={
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <AdminButton
                  variant="outline"
                  size="md"
                  onClick={handleRefresh}
                  disabled={isFetching}
                  icon={<RefreshCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} strokeWidth={1.5} />}
                >
                  刷新
                </AdminButton>
              </TooltipTrigger>
              <TooltipContent>刷新转发节点列表</TooltipContent>
            </Tooltip>
            <AdminButton
              variant="primary"
              icon={<Plus className="size-4" strokeWidth={1.5} />}
              onClick={() => setCreateDialogOpen(true)}
            >
              新增转发节点
            </AdminButton>
          </div>
        }
      >
        {/* 转发节点列表表格 */}
        <AdminCard noPadding>
          <ForwardAgentListTable
            forwardAgents={forwardAgents}
            loading={isLoading || isFetching}
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onEnable={handleEnable}
            onDisable={handleDisable}
            onRegenerateToken={handleTokenRegenerate}
            onGetInstallScript={handleInstallScript}
            onViewDetail={handleViewDetail}
          />
        </AdminCard>
      </AdminPageLayout>

      {/* 新增转发节点对话框 */}
      <CreateForwardAgentDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      {/* 编辑转发节点对话框 */}
      <EditForwardAgentDialog
        open={editDialogOpen}
        agent={selectedAgent}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedAgent(null);
        }}
        onSubmit={handleUpdateSubmit}
      />

      {/* 转发节点详情对话框 */}
      <ForwardAgentDetailDialog
        open={detailDialogOpen}
        agent={selectedAgent}
        onClose={() => {
          setDetailDialogOpen(false);
          setSelectedAgent(null);
        }}
      />

      {/* Token显示对话框 */}
      <TokenDialog
        open={tokenDialogOpen}
        token={generatedToken?.token ?? null}
        title="转发节点Token"
        onClose={() => {
          setTokenDialogOpen(false);
          setGeneratedToken(null);
        }}
      />

      {/* 安装脚本对话框 */}
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
