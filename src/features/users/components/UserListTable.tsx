/**
 * 用户列表表格组件（管理端）
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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import type { UserListItem } from '../types/users.types';

interface UserListTableProps {
  users: UserListItem[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (user: UserListItem) => void;
  onDelete: (user: UserListItem) => void;
  onAssignSubscription: (user: UserListItem) => void;
}

// 状态标签映射
const STATUS_LABELS: Record<string, string> = {
  active: '激活',
  inactive: '未激活',
  pending: '待处理',
  suspended: '暂停',
  deleted: '已删除',
};

// 状态颜色映射
const STATUS_COLORS: Record<string, 'success' | 'error' | 'default' | 'warning'> = {
  active: 'success',
  inactive: 'default',
  pending: 'warning',
  suspended: 'error',
  deleted: 'error',
};

// 角色标签映射
const ROLE_LABELS: Record<string, string> = {
  user: '用户',
  admin: '管理员',
};

// 角色颜色映射
const ROLE_COLORS: Record<string, 'primary' | 'secondary'> = {
  user: 'secondary',
  admin: 'primary',
};

// 格式化时间
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const UserListTable: React.FC<UserListTableProps> = ({
  users,
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onAssignSubscription,
}) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!users || users.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h6" color="text.secondary">
          暂无用户数据
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
              <TableCell>邮箱</TableCell>
              <TableCell>姓名</TableCell>
              <TableCell>角色</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>创建时间</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {user.id}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {user.email}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {user.name || '-'}
                  </Typography>
                  {user.display_name && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {user.display_name}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={ROLE_LABELS[user.role || 'user'] || user.role || '用户'}
                    color={ROLE_COLORS[user.role || 'user'] || 'secondary'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={STATUS_LABELS[user.status] || user.status}
                    color={STATUS_COLORS[user.status] || 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(user.created_at)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => onAssignSubscription(user)}
                    title="分配订阅"
                    color="primary"
                  >
                    <CardMembershipIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => onEdit(user)}
                    title="编辑"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => onDelete(user)}
                    title="删除"
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={page - 1} // MUI uses 0-based index
        rowsPerPage={pageSize}
        onPageChange={(_, newPage) => onPageChange(newPage + 1)} // Convert back to 1-based
        onRowsPerPageChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[10, 20, 50]}
        labelRowsPerPage="每页条数:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 共 ${count} 条`}
      />
    </Paper>
  );
};
