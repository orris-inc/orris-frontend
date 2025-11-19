/**
 * 管理节点组中的节点对话框组件
 */

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  CircularProgress,
  Divider,
  Alert,
  Autocomplete,
  TextField,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import type { NodeGroupListItem } from '../types/node-groups.types';
import type { NodeListItem } from '@/features/nodes/types/nodes.types';
import { useNodeGroups } from '../hooks/useNodeGroups';
import { useNodes } from '@/features/nodes/hooks/useNodes';

interface ManageGroupNodesDialogProps {
  open: boolean;
  group: NodeGroupListItem | null;
  onClose: () => void;
}

export const ManageGroupNodesDialog = ({
  open,
  group,
  onClose,
}: ManageGroupNodesDialogProps) => {
  const {
    fetchGroupNodes,
    groupNodes,
    addNodeToGroup,
    removeNodeFromGroup,
    batchAddNodesToGroup,
  } = useNodeGroups();

  const { nodes, fetchNodes } = useNodes();

  const [loading, setLoading] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<NodeListItem[]>([]);

  // 加载数据
  useEffect(() => {
    if (open && group) {
      setLoading(true);
      Promise.all([
        fetchGroupNodes(group.id),
        fetchNodes(1, 100), // 获取所有可用节点
      ]).finally(() => setLoading(false));
    }
  }, [open, group, fetchGroupNodes, fetchNodes]);

  // 获取可添加的节点（排除已在组中的节点）
  const availableNodes = nodes.filter(
    (node) => !Array.isArray(groupNodes) || !groupNodes.some((gn) => gn.id === node.id)
  );

  const handleRemoveNode = async (nodeId: number | string) => {
    if (!group) return;

    if (window.confirm('确认要从该节点组中移除此节点吗？')) {
      await removeNodeFromGroup(group.id, nodeId);
    }
  };

  const handleAddNodes = async () => {
    if (!group || selectedNodes.length === 0) return;

    const nodeIds = selectedNodes.map((node) => node.id);

    if (nodeIds.length === 1) {
      await addNodeToGroup(group.id, nodeIds[0]);
    } else {
      await batchAddNodesToGroup(group.id, nodeIds);
    }

    setSelectedNodes([]);
  };

  if (!group) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        管理节点组节点 - {group.name}
      </DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={3}>
          {/* 添加节点区域 */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              添加节点
            </Typography>
            <Box display="flex" gap={1} alignItems="flex-start">
              <Autocomplete
                multiple
                fullWidth
                options={availableNodes}
                getOptionLabel={(option) => `${option.name} (${option.server_address}:${option.server_port})`}
                value={selectedNodes}
                onChange={(_, newValue) => setSelectedNodes(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="选择要添加的节点"
                    size="small"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option.id}
                      label={option.name}
                      size="small"
                    />
                  ))
                }
                disabled={loading}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddNodes}
                disabled={selectedNodes.length === 0 || loading}
                sx={{ minWidth: 100 }}
              >
                添加
              </Button>
            </Box>
            {availableNodes.length === 0 && (
              <Alert severity="info" sx={{ mt: 1 }}>
                所有节点都已添加到此节点组
              </Alert>
            )}
          </Box>

          <Divider />

          {/* 当前节点列表 */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              当前节点 ({Array.isArray(groupNodes) ? groupNodes.length : 0})
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" py={3}>
                <CircularProgress size={32} />
              </Box>
            ) : Array.isArray(groupNodes) && groupNodes.length > 0 ? (
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {groupNodes.map((node: NodeListItem) => (
                  <ListItem key={node.id} divider>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontWeight="medium">
                            {node.name}
                          </Typography>
                          <Chip
                            label={node.status}
                            color={node.status === 'active' ? 'success' : 'default'}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {node.server_address}:{node.server_port} - {node.protocol}
                          {node.region && ` - ${node.region}`}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        size="small"
                        color="error"
                        onClick={() => handleRemoveNode(node.id)}
                        disabled={loading}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box py={3} textAlign="center">
                <Typography variant="body2" color="text.secondary">
                  该节点组暂无节点
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>关闭</Button>
      </DialogActions>
    </Dialog>
  );
};
