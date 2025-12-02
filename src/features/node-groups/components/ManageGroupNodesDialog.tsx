/**
 * 管理节点组中的节点对话框组件
 */

import { useState } from 'react';
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
import { useNodeGroups, useNodeGroupNodes } from '../hooks/useNodeGroups';
import { useNodes } from '@/features/nodes/hooks/useNodes';

interface ManageGroupNodesDialogProps {
  open: boolean;
  group: NodeGroupListItem | null;
  onClose: () => void;
}

export const ManageGroupNodesDialog = ({
  open,
  group,
}: ManageGroupNodesDialogProps) => {
  const { addNodesToGroup, removeNodesFromGroup } = useNodeGroups();
  const { nodes: groupNodes, isLoading: groupNodesLoading } = useNodeGroupNodes(open && group ? group.id : null);
  const { nodes, isLoading: nodesLoading } = useNodes({ enabled: open });

  const [selectedNodes, setSelectedNodes] = useState<NodeListItem[]>([]);
  const [processing, setProcessing] = useState(false);

  const loading = groupNodesLoading || nodesLoading || processing;

  // 获取可添加的节点（排除已在组中的节点）
  const availableNodes = nodes.filter(
    (node) => !groupNodes.some((gn) => gn.id === node.id)
  );

  const handleRemoveNode = async (nodeId: number | string) => {
    if (!group) return;

    if (window.confirm('确认要从该节点组中移除此节点吗？')) {
      setProcessing(true);
      try {
        await removeNodesFromGroup(group.id, [Number(nodeId)]);
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleAddNodes = async () => {
    if (!group || selectedNodes.length === 0) return;

    setProcessing(true);
    try {
      const nodeIds = selectedNodes.map((node) => node.id);
      await addNodesToGroup(group.id, nodeIds);
      setSelectedNodes([]);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setSelectedNodes([]);
  };

  if (!group) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
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
            {availableNodes.length === 0 && !nodesLoading && (
              <Alert severity="info" sx={{ mt: 1 }}>
                所有节点都已添加到此节点组
              </Alert>
            )}
          </Box>

          <Divider />

          {/* 当前节点列表 */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              当前节点 ({groupNodes.length})
            </Typography>
            {groupNodesLoading ? (
              <Box display="flex" justifyContent="center" py={3}>
                <CircularProgress size={32} />
              </Box>
            ) : groupNodes.length > 0 ? (
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
        <Button onClick={handleClose}>关闭</Button>
      </DialogActions>
    </Dialog>
  );
};
