/**
 * 节点组详情对话框组件
 */

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import type { NodeGroupListItem } from '../types/node-groups.types';
import type { NodeListItem } from '@/features/nodes/types/nodes.types';
import { formatDateTime } from '@/shared/utils/date-utils';
import { useNodeGroupNodes } from '../hooks/useNodeGroups';

interface NodeGroupDetailDialogProps {
  open: boolean;
  group: NodeGroupListItem | null;
  onClose: () => void;
}

export const NodeGroupDetailDialog = ({
  open,
  group,
  onClose,
}: NodeGroupDetailDialogProps) => {
  const { nodes: groupNodes, isLoading } = useNodeGroupNodes(open && group ? group.id : null);

  if (!group) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>节点组详情</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2}>
          {/* 基本信息 */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              基本信息
            </Typography>
            <Box display="flex" flexDirection="column" gap={1.5}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">ID:</Typography>
                <Typography variant="body2">{group.id}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">名称:</Typography>
                <Typography variant="body2" fontWeight="medium">{group.name}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">描述:</Typography>
                <Typography variant="body2">{group.description || '-'}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">公开性:</Typography>
                <Chip
                  label={group.is_public ? '公开' : '私有'}
                  color={group.is_public ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">排序顺序:</Typography>
                <Typography variant="body2">{group.sort_order ?? '-'}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">创建时间:</Typography>
                <Typography variant="body2">{formatDateTime(group.created_at)}</Typography>
              </Box>
              {group.updated_at && (
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">更新时间:</Typography>
                  <Typography variant="body2">{formatDateTime(group.updated_at)}</Typography>
                </Box>
              )}
            </Box>
          </Box>

          <Divider />

          {/* 关联节点 */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              关联节点 ({groupNodes.length})
            </Typography>
            {isLoading ? (
              <Box display="flex" justifyContent="center" py={2}>
                <CircularProgress size={24} />
              </Box>
            ) : groupNodes.length > 0 ? (
              <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                {groupNodes.map((node: NodeListItem) => (
                  <ListItem key={node.id} divider>
                    <ListItemText
                      primary={node.name}
                      secondary={`${node.server_address}:${node.server_port} - ${node.protocol}`}
                    />
                    <Chip
                      label={node.status}
                      color={node.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                暂无关联节点
              </Typography>
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
