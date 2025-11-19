/**
 * 节点详情查看对话框
 */

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  Chip,
  Divider,
  ListItem,
  ListItemText,
} from '@mui/material';
import type { NodeListItem } from '../types/nodes.types';

interface NodeDetailDialogProps {
  open: boolean;
  node: NodeListItem | null;
  onClose: () => void;
}

// 状态标签映射
const STATUS_LABELS: Record<string, string> = {
  active: '激活',
  inactive: '未激活',
  maintenance: '维护中',
  error: '错误',
};

// 状态颜色映射
const STATUS_COLORS: Record<string, 'success' | 'error' | 'default' | 'warning'> = {
  active: 'success',
  inactive: 'default',
  maintenance: 'warning',
  error: 'error',
};

// 协议类型标签映射
const PROTOCOL_LABELS: Record<string, string> = {
  shadowsocks: 'Shadowsocks',
  trojan: 'Trojan',
};

// 格式化时间
const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

// 格式化流量
const formatBytes = (bytes?: number) => {
  if (!bytes) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(2)} ${units[unitIndex]}`;
};

export const NodeDetailDialog: React.FC<NodeDetailDialogProps> = ({
  open,
  node,
  onClose,
}) => {
  if (!node) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">节点详情</Typography>
          <Chip
            label={STATUS_LABELS[node.status] || node.status}
            color={STATUS_COLORS[node.status] || 'default'}
            size="small"
          />
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* 基本信息 */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              基本信息
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <ListItem dense>
              <ListItemText
                primary="节点ID"
                secondary={node.id}
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
              />
            </ListItem>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <ListItem dense>
              <ListItemText
                primary="节点名称"
                secondary={node.name}
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
              />
            </ListItem>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <ListItem dense>
              <ListItemText
                primary="协议类型"
                secondary={PROTOCOL_LABELS[node.protocol] || node.protocol}
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
              />
            </ListItem>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <ListItem dense>
              <ListItemText
                primary="加密方法"
                secondary={node.method}
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                secondaryTypographyProps={{ variant: 'body1', color: 'text.primary', fontFamily: 'monospace' }}
              />
            </ListItem>
          </Grid>

          {/* 连接信息 */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
              连接信息
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <ListItem dense>
              <ListItemText
                primary="服务器地址"
                secondary={node.server_address}
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                secondaryTypographyProps={{ variant: 'body1', color: 'text.primary', fontFamily: 'monospace' }}
              />
            </ListItem>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <ListItem dense>
              <ListItemText
                primary="端口"
                secondary={node.server_port}
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                secondaryTypographyProps={{ variant: 'body1', color: 'text.primary', fontFamily: 'monospace' }}
              />
            </ListItem>
          </Grid>

          {node.region && (
            <Grid size={{ xs: 12, md: 6 }}>
              <ListItem dense>
                <ListItemText
                  primary="地区"
                  secondary={node.region}
                  primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                />
              </ListItem>
            </Grid>
          )}

          {/* 插件信息 */}
          {(node.plugin || node.plugin_opts) && (
            <>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
                  插件信息
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              {node.plugin && (
                <Grid size={{ xs: 12 }}>
                  <ListItem dense>
                    <ListItemText
                      primary="插件"
                      secondary={node.plugin}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1', color: 'text.primary', fontFamily: 'monospace' }}
                    />
                  </ListItem>
                </Grid>
              )}

              {node.plugin_opts && Object.keys(node.plugin_opts).length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <ListItem dense>
                    <ListItemText
                      primary="插件选项"
                      secondary={JSON.stringify(node.plugin_opts, null, 2)}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{
                        variant: 'body2',
                        color: 'text.primary',
                        fontFamily: 'monospace',
                        component: 'pre',
                        sx: { whiteSpace: 'pre-wrap', wordBreak: 'break-all' }
                      }}
                    />
                  </ListItem>
                </Grid>
              )}
            </>
          )}

          {/* 流量信息 */}
          {(node.traffic_limit || node.traffic_used) && (
            <>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
                  流量信息
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              {node.traffic_limit && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <ListItem dense>
                    <ListItemText
                      primary="流量限制"
                      secondary={formatBytes(node.traffic_limit)}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                    />
                  </ListItem>
                </Grid>
              )}

              {node.traffic_used !== undefined && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <ListItem dense>
                    <ListItemText
                      primary="已使用流量"
                      secondary={formatBytes(node.traffic_used)}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                    />
                  </ListItem>
                </Grid>
              )}
            </>
          )}

          {/* 其他信息 */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
              其他信息
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          {node.description && (
            <Grid size={{ xs: 12 }}>
              <ListItem dense>
                <ListItemText
                  primary="描述"
                  secondary={node.description}
                  primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                />
              </ListItem>
            </Grid>
          )}

          <Grid size={{ xs: 12, md: 6 }}>
            <ListItem dense>
              <ListItemText
                primary="排序顺序"
                secondary={node.sort_order ?? 0}
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
              />
            </ListItem>
          </Grid>

          {node.tags && node.tags.length > 0 && (
            <Grid size={{ xs: 12, md: 6 }}>
              <ListItem dense>
                <ListItemText
                  primary="标签"
                  secondary={
                    <Box display="flex" gap={0.5} mt={0.5} flexWrap="wrap">
                      {node.tags.map((tag, index) => (
                        <Chip key={index} label={tag} size="small" />
                      ))}
                    </Box>
                  }
                  primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                />
              </ListItem>
            </Grid>
          )}

          {/* 时间信息 */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
              时间信息
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <ListItem dense>
              <ListItemText
                primary="创建时间"
                secondary={formatDate(node.created_at)}
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                secondaryTypographyProps={{ variant: 'body2', color: 'text.primary' }}
              />
            </ListItem>
          </Grid>

          {node.updated_at && (
            <Grid size={{ xs: 12, md: 6 }}>
              <ListItem dense>
                <ListItemText
                  primary="更新时间"
                  secondary={formatDate(node.updated_at)}
                  primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'body2', color: 'text.primary' }}
                />
              </ListItem>
            </Grid>
          )}

          {node.last_heartbeat && (
            <Grid size={{ xs: 12, md: 6 }}>
              <ListItem dense>
                <ListItemText
                  primary="最后心跳"
                  secondary={formatDate(node.last_heartbeat)}
                  primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'body2', color: 'text.primary' }}
                />
              </ListItem>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>关闭</Button>
      </DialogActions>
    </Dialog>
  );
};
