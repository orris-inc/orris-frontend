/**
 * 节点组管理页面（管理端）
 */

import { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { NodeGroupListTable } from '@/features/node-groups/components/NodeGroupListTable';
import { NodeGroupFilters } from '@/features/node-groups/components/NodeGroupFilters';
import { CreateNodeGroupDialog } from '@/features/node-groups/components/CreateNodeGroupDialog';
import { EditNodeGroupDialog } from '@/features/node-groups/components/EditNodeGroupDialog';
import { NodeGroupDetailDialog } from '@/features/node-groups/components/NodeGroupDetailDialog';
import { ManageGroupNodesDialog } from '@/features/node-groups/components/ManageGroupNodesDialog';
import { NodeGroupStatsCards } from '@/features/node-groups/components/NodeGroupStatsCards';
import { useNodeGroups } from '@/features/node-groups/hooks/useNodeGroups';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type {
  NodeGroupListItem,
  CreateNodeGroupRequest,
  UpdateNodeGroupRequest,
} from '@/features/node-groups/types/node-groups.types';

export const NodeGroupManagementPage = () => {
  const {
    nodeGroups,
    pagination,
    filters,
    loading,
    fetchNodeGroups,
    createNodeGroup,
    updateNodeGroup,
    deleteNodeGroup,
    setFilters,
  } = useNodeGroups(true); // 自动加载数据

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [manageNodesDialogOpen, setManageNodesDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<NodeGroupListItem | null>(null);

  const handlePageChange = (page: number) => {
    fetchNodeGroups(page, pagination.page_size);
  };

  const handlePageSizeChange = (pageSize: number) => {
    fetchNodeGroups(1, pageSize);
  };

  const handleEdit = (group: NodeGroupListItem) => {
    setSelectedGroup(group);
    setEditDialogOpen(true);
  };

  const handleDelete = async (group: NodeGroupListItem) => {
    if (
      window.confirm(
        `确认删除节点组 "${group.name}" 吗？\n\n此操作不可恢复。删除节点组不会删除其中的节点。`
      )
    ) {
      await deleteNodeGroup(group.id);
    }
  };

  const handleManageNodes = (group: NodeGroupListItem) => {
    setSelectedGroup(group);
    setManageNodesDialogOpen(true);
  };

  const handleViewDetail = (group: NodeGroupListItem) => {
    setSelectedGroup(group);
    setDetailDialogOpen(true);
  };

  const handleRefresh = () => {
    fetchNodeGroups(pagination.page, pagination.page_size);
  };

  const handleCreateSubmit = async (data: CreateNodeGroupRequest) => {
    const result = await createNodeGroup(data);
    if (result) {
      setCreateDialogOpen(false);
    }
  };

  const handleUpdateSubmit = async (
    id: number | string,
    data: UpdateNodeGroupRequest
  ) => {
    const result = await updateNodeGroup(id, data);
    if (result) {
      setEditDialogOpen(false);
      setSelectedGroup(null);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto max-w-7xl py-6">
        {/* 页面标题 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">节点组管理</h1>
            <p className="text-sm text-muted-foreground">
              管理系统中的节点分组，组织和控制节点访问权限
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
              新增节点组
            </Button>
          </div>
        </div>

        {/* 统计卡片 */}
        <NodeGroupStatsCards nodeGroups={nodeGroups} loading={loading} />

        {/* 筛选器 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <NodeGroupFilters filters={filters} onChange={setFilters} />
          </CardContent>
        </Card>

        {/* 节点组列表表格 */}
        <NodeGroupListTable
          nodeGroups={nodeGroups}
          loading={loading}
          page={pagination.page}
          pageSize={pagination.page_size}
          total={pagination.total}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onManageNodes={handleManageNodes}
          onViewDetail={handleViewDetail}
        />

        {/* 新增节点组对话框 */}
        <CreateNodeGroupDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSubmit={handleCreateSubmit}
        />

        {/* 编辑节点组对话框 */}
        <EditNodeGroupDialog
          open={editDialogOpen}
          group={selectedGroup}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedGroup(null);
          }}
          onSubmit={handleUpdateSubmit}
        />

        {/* 节点组详情对话框 */}
        <NodeGroupDetailDialog
          open={detailDialogOpen}
          group={selectedGroup}
          onClose={() => {
            setDetailDialogOpen(false);
            setSelectedGroup(null);
          }}
        />

        {/* 管理节点对话框 */}
        <ManageGroupNodesDialog
          open={manageNodesDialogOpen}
          group={selectedGroup}
          onClose={() => {
            setManageNodesDialogOpen(false);
            setSelectedGroup(null);
          }}
        />
      </div>
    </AdminLayout>
  );
};
