/**
 * 节点列表表格组件（管理端）
 */

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Box,
  Typography,
  TablePagination,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import VisibilityIcon from '@mui/icons-material/Visibility';
import type { NodeListItem } from '../types/nodes.types';

interface NodeListTableProps {
  nodes: NodeListItem[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (node: NodeListItem) => void;
  onDelete: (node: NodeListItem) => void;
  onActivate: (node: NodeListItem) => void;
  onDeactivate: (node: NodeListItem) => void;
  onGenerateToken: (node: NodeListItem) => void;
  onViewDetail: (node: NodeListItem) => void;
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
  });
};

export const NodeListTable: React.FC<NodeListTableProps> = ({
  nodes,
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  onGenerateToken,
  onViewDetail,
}) => {

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!nodes || nodes.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h6" color="text.secondary">
          暂无节点数据
        </Typography>
      </Box>
    );
  }

  return (
    <Paper>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>名称</TableCell>
              <TableCell>协议</TableCell>
              <TableCell>服务器地址</TableCell>
              <TableCell>地区</TableCell>
              <TableCell>加密方法</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>创建时间</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {nodes.map((node) => (
              <TableRow key={node.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {node.id}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {node.name}
                  </Typography>
                  {node.description && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {node.description}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={PROTOCOL_LABELS[node.protocol] || node.protocol}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {node.server_address}:{node.server_port}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {node.region || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace">
                    {node.method}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title={node.status === 'active' ? '点击停用' : '点击激活'}>
                    <Chip
                      label={STATUS_LABELS[node.status] || node.status}
                      color={STATUS_COLORS[node.status] || 'default'}
                      size="small"
                      onClick={() => node.status === 'active' ? onDeactivate(node) : onActivate(node)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.8,
                        }
                      }}
                    />
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(node.created_at)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="查看详情">
                    <IconButton
                      size="small"
                      onClick={() => onViewDetail(node)}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="编辑">
                    <IconButton
                      size="small"
                      onClick={() => onEdit(node)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="生成Token">
                    <IconButton
                      size="small"
                      onClick={() => onGenerateToken(node)}
                    >
                      <VpnKeyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="删除">
                    <IconButton
                      size="small"
                      onClick={() => onDelete(node)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={page - 1}
        rowsPerPage={pageSize}
        onPageChange={(_, newPage) => onPageChange(newPage + 1)}
        onRowsPerPageChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[10, 20, 50]}
        labelRowsPerPage="每页条数:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 共 ${count} 条`}
      />
    </Paper>
  );
};
