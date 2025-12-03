/**
 * 节点管理页面（管理端）
 * 使用统一的精致商务风格组件
 */

import { useState } from 'react';
import { Server, Plus, RefreshCw } from 'lucide-react';
import { NodeListTable } from '@/features/nodes/components/NodeListTable';
import { EditNodeDialog } from '@/features/nodes/components/EditNodeDialog';
import { CreateNodeDialog } from '@/features/nodes/components/CreateNodeDialog';
import { NodeDetailDialog } from '@/features/nodes/components/NodeDetailDialog';
import { useNodesPage } from '@/features/nodes/hooks/useNodes';
import { AdminLayout } from '@/layouts/AdminLayout';
import { textareaStyles } from '@/lib/ui-styles';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
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
import type { Node, UpdateNodeRequest, CreateNodeRequest } from '@/api/node';

export const NodeManagementPage = () => {
  const {
    nodes,
    pagination,
    isLoading,
    refetch,
    createNode,
    updateNode,
    deleteNode,
    updateNodeStatus,
    handleGenerateToken,
    generatedToken,
    setGeneratedToken,
    handlePageChange,
    handlePageSizeChange,
  } = useNodesPage();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);

  const handleEdit = (node: Node) => {
    setSelectedNode(node);
    setEditDialogOpen(true);
  };

  const handleDelete = async (node: Node) => {
    if (window.confirm(`确认删除节点 "${node.name}" (${node.serverAddress}:${node.serverPort}) 吗？此操作不可恢复。`)) {
      await deleteNode(node.id);
    }
  };

  const handleActivate = async (node: Node) => {
    await updateNodeStatus(node.id, 'active');
  };

  const handleDeactivate = async (node: Node) => {
    await updateNodeStatus(node.id, 'inactive');
  };

  const handleTokenGenerate = async (node: Node) => {
    const token = await handleGenerateToken(node.id);
    if (token) {
      setTokenDialogOpen(true);
    }
  };

  const handleViewDetail = (node: Node) => {
    setSelectedNode(node);
    setDetailDialogOpen(true);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleCreateSubmit = async (data: CreateNodeRequest) => {
    try {
      await createNode(data);
      setCreateDialogOpen(false);
    } catch {
      // 错误已在 hook 中处理
    }
  };

  const handleUpdateSubmit = async (id: number | string, data: UpdateNodeRequest) => {
    try {
      await updateNode(id, data);
      setEditDialogOpen(false);
      setSelectedNode(null);
    } catch {
      // 错误已在 hook 中处理
    }
  };

  const handleCopyToken = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken.token);
      alert('Token已复制到剪贴板');
    }
  };

  return (
    <AdminLayout>
      <AdminPageLayout
        title="节点管理"
        description="管理系统中的所有代理节点"
        icon={Server}
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
              <TooltipContent>刷新节点列表</TooltipContent>
            </Tooltip>
            <AdminButton
              variant="primary"
              icon={<Plus className="size-4" strokeWidth={1.5} />}
              onClick={() => setCreateDialogOpen(true)}
            >
              新增节点
            </AdminButton>
          </div>
        }
      >
        {/* 节点列表表格 */}
        <AdminCard noPadding>
          <NodeListTable
            nodes={nodes}
            loading={isLoading}
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
            onGenerateToken={handleTokenGenerate}
            onViewDetail={handleViewDetail}
          />
        </AdminCard>
      </AdminPageLayout>

      {/* 新增节点对话框 */}
      <CreateNodeDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      {/* 编辑节点对话框 */}
      <EditNodeDialog
        open={editDialogOpen}
        node={selectedNode}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedNode(null);
        }}
        onSubmit={handleUpdateSubmit}
      />

      {/* 节点详情对话框 */}
      <NodeDetailDialog
        open={detailDialogOpen}
        node={selectedNode}
        onClose={() => {
          setDetailDialogOpen(false);
          setSelectedNode(null);
        }}
      />

      {/* Token显示对话框 */}
      <Dialog
        open={tokenDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setTokenDialogOpen(false);
            setGeneratedToken(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>节点Token</DialogTitle>
            <DialogDescription>
              Token已生成，请妥善保存。此Token仅显示一次。
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={generatedToken?.token || ''}
            readOnly
            rows={4}
            className={`${textareaStyles} mt-2 font-mono`}
          />
          <DialogFooter>
            <AdminButton
              variant="outline"
              onClick={() => {
                setTokenDialogOpen(false);
                setGeneratedToken(null);
              }}
            >
              关闭
            </AdminButton>
            <AdminButton
              variant="primary"
              onClick={handleCopyToken}
            >
              复制Token
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};
