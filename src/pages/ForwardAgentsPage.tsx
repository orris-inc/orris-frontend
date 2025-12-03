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
import { useForwardAgentsPage } from '@/features/forward-agents/hooks/useForwardAgents';
import { AdminLayout } from '@/layouts/AdminLayout';
import { textareaStyles } from '@/lib/ui-styles';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { Button } from '@/components/common/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/common/Dialog';
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
    refetch,
    createForwardAgent,
    updateForwardAgent,
    deleteForwardAgent,
    enableForwardAgent,
    disableForwardAgent,
    handleRegenerateToken,
    generatedToken,
    setGeneratedToken,
    handlePageChange,
    handlePageSizeChange,
  } = useForwardAgentsPage();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<ForwardAgent | null>(null);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [hasTokenCopied, setHasTokenCopied] = useState(false);

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
      setHasTokenCopied(false);
      setTokenDialogOpen(true);
    }
  };

  const handleViewDetail = (agent: ForwardAgent) => {
    setSelectedAgent(agent);
    setDetailDialogOpen(true);
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
      setHasTokenCopied(false);
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

  const handleCopyToken = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken.token);
      setHasTokenCopied(true);
    }
  };

  const handleCloseTokenDialog = () => {
    if (hasTokenCopied) {
      setTokenDialogOpen(false);
      setGeneratedToken(null);
      setHasTokenCopied(false);
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
                  disabled={isLoading}
                  icon={<RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} strokeWidth={1.5} />}
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
            loading={isLoading}
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
      <Dialog
        open={tokenDialogOpen}
        onOpenChange={(open) => {
          // 只有在已复制Token后才允许关闭
          if (!open && hasTokenCopied) {
            handleCloseTokenDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>转发节点Token</DialogTitle>
            <DialogDescription>
              Token已生成，请妥善保存。此Token仅显示一次，丢失后需要重新生成。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <textarea
              value={generatedToken?.token || ''}
              readOnly
              rows={3}
              className={`${textareaStyles} font-mono text-sm break-all`}
            />
            {hasTokenCopied ? (
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <span>✓</span> Token已复制到剪贴板
              </p>
            ) : (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                请先复制Token后再关闭此对话框
              </p>
            )}
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleCloseTokenDialog}
              disabled={!hasTokenCopied}
              className="w-full sm:w-auto"
            >
              关闭
            </Button>
            <Button
              onClick={handleCopyToken}
              className="w-full sm:w-auto"
            >
              {hasTokenCopied ? '再次复制' : '复制Token'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};
