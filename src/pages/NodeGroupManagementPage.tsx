/**
 * 节点组管理页面（管理端）
 * 精致商务风格 - 统一设计系统
 */

import { useState } from 'react';
import { Layers, Plus, FilterX } from 'lucide-react';
import { NodeGroupListTable } from '@/features/node-groups/components/NodeGroupListTable';
import { CreateNodeGroupDialog } from '@/features/node-groups/components/CreateNodeGroupDialog';
import { EditNodeGroupDialog } from '@/features/node-groups/components/EditNodeGroupDialog';
import { NodeGroupDetailDialog } from '@/features/node-groups/components/NodeGroupDetailDialog';
import { ManageGroupNodesDialog } from '@/features/node-groups/components/ManageGroupNodesDialog';
import { NodeGroupStatsCards } from '@/features/node-groups/components/NodeGroupStatsCards';
import { useNodeGroups } from '@/features/node-groups/hooks/useNodeGroups';
import { AdminLayout } from '@/layouts/AdminLayout';
import {
  AdminPageLayout,
  AdminButton,
  AdminCard,
  AdminFilterCard,
  FilterRow,
} from '@/components/admin';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/common/Select';
import { Label } from '@/components/common/Label';
import { inputStyles } from '@/lib/ui-styles';
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

  // Filter handlers
  const handlePublicChange = (value: string) => {
    setFilters({
      is_public: value === 'all' ? undefined : value === 'true',
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ search: e.target.value });
  };

  const handleResetFilters = () => {
    setFilters({ is_public: undefined, search: '' });
  };

  return (
    <AdminLayout>
      <AdminPageLayout
        title="节点组管理"
        description="管理系统中的节点分组，组织和控制节点访问权限"
        icon={Layers}
        info="创建和管理节点组，控制用户对不同节点的访问权限。"
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
        {/* 统计卡片 */}
        <NodeGroupStatsCards nodeGroups={nodeGroups} loading={loading} />

        {/* 筛选器 */}
        <AdminFilterCard>
          <FilterRow columns={3}>
            {/* 公开性筛选 */}
            <div className="space-y-2">
              <Label>公开性</Label>
              <Select
                value={filters.is_public === undefined ? 'all' : String(filters.is_public)}
                onValueChange={handlePublicChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="true">公开</SelectItem>
                  <SelectItem value="false">私有</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 搜索 */}
            <div className="space-y-2">
              <Label>搜索</Label>
              <input
                type="text"
                placeholder="搜索名称或描述"
                value={filters.search || ''}
                onChange={handleSearchChange}
                className={inputStyles}
              />
            </div>

            {/* 重置按钮 */}
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <AdminButton
                variant="outline"
                onClick={handleResetFilters}
                icon={<FilterX className="size-4" strokeWidth={1.5} />}
              >
                重置筛选
              </AdminButton>
            </div>
          </FilterRow>
        </AdminFilterCard>

        {/* 节点组列表表格 */}
        <AdminCard noPadding>
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
