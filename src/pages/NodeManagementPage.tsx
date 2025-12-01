/**
 * 节点管理页面（管理端）
 * 使用统一的精致商务风格组件
 */

import { useState } from 'react';
import { Server, Plus, RefreshCw } from 'lucide-react';
import { NodeListTable } from '@/features/nodes/components/NodeListTable';
import { NodeFilters } from '@/features/nodes/components/NodeFilters';
import { EditNodeDialog } from '@/features/nodes/components/EditNodeDialog';
import { CreateNodeDialog } from '@/features/nodes/components/CreateNodeDialog';
import { NodeStatsCards } from '@/features/nodes/components/NodeStatsCards';
import { NodeDetailDialog } from '@/features/nodes/components/NodeDetailDialog';
import { useNodes } from '@/features/nodes/hooks/useNodes';
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
  AdminFilterCard,
} from '@/components/admin';
import type { NodeListItem, UpdateNodeRequest, CreateNodeRequest } from '@/features/nodes/types/nodes.types';

export const NodeManagementPage = () => {
  const {
    nodes,
    pagination,
    filters,
    loading,
    fetchNodes,
    createNode,
    updateNode,
    deleteNode,
    updateNodeStatus,
    generateToken,
    setFilters,
  } = useNodes();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NodeListItem | null>(null);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [generatedToken, setGeneratedToken] = useState('');

  const handlePageChange = (page: number) => {
    fetchNodes(page, pagination.page_size);
  };

  const handlePageSizeChange = (pageSize: number) => {
    fetchNodes(1, pageSize);
  };

  const handleEdit = (node: NodeListItem) => {
    setSelectedNode(node);
    setEditDialogOpen(true);
  };

  const handleDelete = async (node: NodeListItem) => {
    if (window.confirm(`确认删除节点 "${node.name}" (${node.server_address}:${node.server_port}) 吗？此操作不可恢复。`)) {
      await deleteNode(node.id);
    }
  };

  const handleActivate = async (node: NodeListItem) => {
    await updateNodeStatus(node.id, 'active');
  };

  const handleDeactivate = async (node: NodeListItem) => {
    await updateNodeStatus(node.id, 'inactive');
  };

  const handleGenerateToken = async (node: NodeListItem) => {
    const token = await generateToken(node.id);
    if (token) {
      setGeneratedToken(token);
      setTokenDialogOpen(true);
    }
  };

  const handleViewDetail = (node: NodeListItem) => {
    setSelectedNode(node);
    setDetailDialogOpen(true);
  };

  const handleRefresh = () => {
    fetchNodes(pagination.page, pagination.page_size);
  };

  const handleCreateSubmit = async (data: CreateNodeRequest) => {
    const result = await createNode(data);
    if (result) {
      setCreateDialogOpen(false);
    }
  };

  const handleUpdateSubmit = async (id: number | string, data: UpdateNodeRequest) => {
    const result = await updateNode(id, data);
    if (result) {
      setEditDialogOpen(false);
      setSelectedNode(null);
    }
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(generatedToken);
    alert('Token已复制到剪贴板');
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
                  disabled={loading}
                  icon={<RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />}
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
        {/* 统计卡片 */}
        <NodeStatsCards nodes={nodes} loading={loading} />

        {/* 筛选器 */}
        <AdminFilterCard>
          <NodeFilters filters={filters} onChange={setFilters} />
        </AdminFilterCard>

        {/* 节点列表表格 */}
        <AdminCard noPadding>
          <NodeListTable
            nodes={nodes}
            loading={loading}
            page={pagination.page}
            pageSize={pagination.page_size}
            total={pagination.total}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
            onGenerateToken={handleGenerateToken}
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
        onOpenChange={(open) => !open && setTokenDialogOpen(false)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>节点Token</DialogTitle>
            <DialogDescription>
              Token已生成，请妥善保存。此Token仅显示一次。
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={generatedToken}
            readOnly
            rows={4}
            className={`${textareaStyles} mt-2 font-mono`}
          />
          <DialogFooter>
            <AdminButton
              variant="outline"
              onClick={() => setTokenDialogOpen(false)}
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
