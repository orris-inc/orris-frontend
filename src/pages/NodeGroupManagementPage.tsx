/**
 * 节点组管理页面（管理端）
 * 精致商务风格 - 统一设计系统
 */

import { useState } from 'react';
import { Layers, Plus } from 'lucide-react';
import { NodeGroupListTable } from '@/features/node-groups/components/NodeGroupListTable';
import { CreateNodeGroupDialog } from '@/features/node-groups/components/CreateNodeGroupDialog';
import { EditNodeGroupDialog } from '@/features/node-groups/components/EditNodeGroupDialog';
import { NodeGroupDetailDialog } from '@/features/node-groups/components/NodeGroupDetailDialog';
import { ManageGroupNodesDialog } from '@/features/node-groups/components/ManageGroupNodesDialog';
import { useNodeGroupsPage } from '@/features/node-groups/hooks/useNodeGroups';
import { AdminLayout } from '@/layouts/AdminLayout';
import {
  AdminPageLayout,
  AdminButton,
  AdminCard,
} from '@/components/admin';
import type {
  NodeGroup,
  CreateNodeGroupRequest,
  UpdateNodeGroupRequest,
} from '@/api/node';

export const NodeGroupManagementPage = () => {
  const {
    nodeGroups,
    pagination,
    isLoading,
    createNodeGroup,
    updateNodeGroup,
    deleteNodeGroup,
    handlePageChange,
    handlePageSizeChange,
  } = useNodeGroupsPage();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [manageNodesDialogOpen, setManageNodesDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<NodeGroup | null>(null);

  const handleEdit = (group: NodeGroup) => {
    setSelectedGroup(group);
    setEditDialogOpen(true);
  };

  const handleDelete = async (group: NodeGroup) => {
    if (
      window.confirm(
        `确认删除节点组 "${group.name}" 吗？\n\n此操作不可恢复。删除节点组不会删除其中的节点。`
      )
    ) {
      await deleteNodeGroup(group.id);
    }
  };

  const handleManageNodes = (group: NodeGroup) => {
    setSelectedGroup(group);
    setManageNodesDialogOpen(true);
  };

  const handleViewDetail = (group: NodeGroup) => {
    setSelectedGroup(group);
    setDetailDialogOpen(true);
  };

  const handleCreateSubmit = async (data: CreateNodeGroupRequest) => {
    try {
      await createNodeGroup(data);
      setCreateDialogOpen(false);
    } catch {
      // 错误已在 hook 中处理
    }
  };

  const handleUpdateSubmit = async (
    id: number | string,
    data: UpdateNodeGroupRequest
  ) => {
    try {
      await updateNodeGroup(id, data);
      setEditDialogOpen(false);
      setSelectedGroup(null);
    } catch {
      // 错误已在 hook 中处理
    }
  };

  return (
    <AdminLayout>
      <AdminPageLayout
        title="节点组管理"
        description="管理系统中的节点分组"
        icon={Layers}
        action={
          <AdminButton
            variant="primary"
            icon={<Plus className="size-4" strokeWidth={1.5} />}
            onClick={() => setCreateDialogOpen(true)}
          >
            新增节点组
          </AdminButton>
        }
      >
        {/* 节点组列表表格 */}
        <AdminCard noPadding>
          <NodeGroupListTable
            nodeGroups={nodeGroups}
            loading={isLoading}
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onManageNodes={handleManageNodes}
            onViewDetail={handleViewDetail}
          />
        </AdminCard>
      </AdminPageLayout>

      {/* 对话框 */}
      <CreateNodeGroupDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      <EditNodeGroupDialog
        open={editDialogOpen}
        group={selectedGroup}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedGroup(null);
        }}
        onSubmit={handleUpdateSubmit}
      />

      <NodeGroupDetailDialog
        open={detailDialogOpen}
        group={selectedGroup}
        onClose={() => {
          setDetailDialogOpen(false);
          setSelectedGroup(null);
        }}
      />

      <ManageGroupNodesDialog
        open={manageNodesDialogOpen}
        group={selectedGroup}
        onClose={() => {
          setManageNodesDialogOpen(false);
          setSelectedGroup(null);
        }}
      />
    </AdminLayout>
  );
};
