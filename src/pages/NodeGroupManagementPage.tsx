/**
 * 节点组管理页面（管理端）
 */

import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import { NodeGroupListTable } from '@/features/node-groups/components/NodeGroupListTable';
import { NodeGroupFilters } from '@/features/node-groups/components/NodeGroupFilters';
import { CreateNodeGroupDialog } from '@/features/node-groups/components/CreateNodeGroupDialog';
import { EditNodeGroupDialog } from '@/features/node-groups/components/EditNodeGroupDialog';
import { NodeGroupDetailDialog } from '@/features/node-groups/components/NodeGroupDetailDialog';
import { ManageGroupNodesDialog } from '@/features/node-groups/components/ManageGroupNodesDialog';
import { NodeGroupStatsCards } from '@/features/node-groups/components/NodeGroupStatsCards';
import { useNodeGroups } from '@/features/node-groups/hooks/useNodeGroups';
import { AdminLayout } from '@/layouts/AdminLayout';
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
      <Container maxWidth="xl">
        <Box py={4}>
          {/* 页面标题 */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                节点组管理
              </Typography>
              <Typography variant="body2" color="text.secondary">
                管理系统中的节点分组，组织和控制节点访问权限
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Tooltip title="刷新">
                <IconButton
                  onClick={handleRefresh}
                  disabled={loading}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
              >
                新增节点组
              </Button>
            </Box>
          </Box>

          {/* 统计卡片 */}
          <NodeGroupStatsCards nodeGroups={nodeGroups} loading={loading} />

          {/* 筛选器 */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <NodeGroupFilters filters={filters} onChange={setFilters} />
          </Paper>

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
        </Box>
      </Container>
    </AdminLayout>
  );
};
