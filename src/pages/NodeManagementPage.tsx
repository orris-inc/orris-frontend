/**
 * 节点管理页面（管理端）
 */

import { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { NodeListTable } from '@/features/nodes/components/NodeListTable';
import { NodeFilters } from '@/features/nodes/components/NodeFilters';
import { EditNodeDialog } from '@/features/nodes/components/EditNodeDialog';
import { CreateNodeDialog } from '@/features/nodes/components/CreateNodeDialog';
import { NodeStatsCards } from '@/features/nodes/components/NodeStatsCards';
import { NodeDetailDialog } from '@/features/nodes/components/NodeDetailDialog';
import { useNodes } from '@/features/nodes/hooks/useNodes';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
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
    activateNode,
    deactivateNode,
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
    await activateNode(node.id);
  };

  const handleDeactivate = async (node: NodeListItem) => {
    await deactivateNode(node.id);
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
      <div className="container mx-auto max-w-7xl py-6">
        {/* 页面标题 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">节点管理</h1>
            <p className="text-sm text-muted-foreground">
              管理系统中的所有代理节点
            </p>
          </div>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  <RefreshCw className={loading ? 'animate-spin' : ''} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>刷新</TooltipContent>
            </Tooltip>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2" />
              新增节点
            </Button>
          </div>
        </div>

        {/* 统计卡片 */}
        <NodeStatsCards nodes={nodes} loading={loading} />

        {/* 筛选器 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <NodeFilters filters={filters} onChange={setFilters} />
          </CardContent>
        </Card>

        {/* 节点列表表格 */}
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
            <Textarea
              value={generatedToken}
              readOnly
              rows={4}
              className="mt-2 font-mono"
            />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setTokenDialogOpen(false)}
              >
                关闭
              </Button>
              <Button onClick={handleCopyToken}>
                复制Token
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};
