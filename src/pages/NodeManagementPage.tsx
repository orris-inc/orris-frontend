/**
 * 节点管理页面（管理端）
 */

import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import { NodeListTable } from '@/features/nodes/components/NodeListTable';
import { NodeFilters } from '@/features/nodes/components/NodeFilters';
import { EditNodeDialog } from '@/features/nodes/components/EditNodeDialog';
import { CreateNodeDialog } from '@/features/nodes/components/CreateNodeDialog';
import { NodeStatsCards } from '@/features/nodes/components/NodeStatsCards';
import { NodeDetailDialog } from '@/features/nodes/components/NodeDetailDialog';
import { useNodes } from '@/features/nodes/hooks/useNodes';
import { AdminLayout } from '@/layouts/AdminLayout';
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
      <Container maxWidth="xl">
        <Box py={4}>
          {/* 页面标题 */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                节点管理
              </Typography>
              <Typography variant="body2" color="text.secondary">
                管理系统中的所有代理节点
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
                新增节点
              </Button>
            </Box>
          </Box>

          {/* 统计卡片 */}
          <NodeStatsCards nodes={nodes} loading={loading} />

          {/* 筛选器 */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <NodeFilters filters={filters} onChange={setFilters} />
          </Paper>

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
            onClose={() => setTokenDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>节点Token</DialogTitle>
            <DialogContent>
              <DialogContentText gutterBottom>
                Token已生成，请妥善保存。此Token仅显示一次。
              </DialogContentText>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={generatedToken}
                slotProps={{
                  input: {
                    readOnly: true,
                  }
                }}
                sx={{ mt: 2, fontFamily: 'monospace' }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setTokenDialogOpen(false)}>关闭</Button>
              <Button onClick={handleCopyToken} variant="contained">
                复制Token
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
    </AdminLayout>
  );
};
