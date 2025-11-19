/**
 * 节点组列表表格组件
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
  Tooltip,
  Chip,
  Box,
  Typography,
  TablePagination,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import type { NodeGroupListItem } from '../types/node-groups.types';
import { formatDateTime } from '@/shared/utils/date-utils';

interface NodeGroupListTableProps {
  nodeGroups: NodeGroupListItem[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (group: NodeGroupListItem) => void;
  onDelete: (group: NodeGroupListItem) => void;
  onManageNodes: (group: NodeGroupListItem) => void;
  onViewDetail: (group: NodeGroupListItem) => void;
}

export const NodeGroupListTable = ({
  nodeGroups,
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onManageNodes,
  onViewDetail,
}: NodeGroupListTableProps) => {
  // 处理分页变化（MUI的页码从0开始，后端从1开始）
  const handleChangePage = (_: unknown, newPage: number) => {
    onPageChange(newPage + 1);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onPageSizeChange(parseInt(event.target.value, 10));
  };

  if (loading && nodeGroups.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (nodeGroups.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          暂无节点组数据
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>名称</TableCell>
              <TableCell>描述</TableCell>
              <TableCell>公开性</TableCell>
              <TableCell>节点数</TableCell>
              <TableCell>排序</TableCell>
              <TableCell>创建时间</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {nodeGroups.map((group) => (
              <TableRow key={group.id} hover>
                <TableCell>{group.id}</TableCell>

                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {group.name}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      maxWidth: 300,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {group.description || '-'}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Chip
                    label={group.is_public ? '公开' : '私有'}
                    color={group.is_public ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>

                <TableCell>
                  <Chip
                    label={group.node_count || 0}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>

                <TableCell>{group.sort_order ?? '-'}</TableCell>

                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDateTime(group.created_at)}
                  </Typography>
                </TableCell>

                <TableCell align="right">
                  <Box display="flex" gap={0.5} justifyContent="flex-end">
                    <Tooltip title="查看详情">
                      <IconButton
                        size="small"
                        onClick={() => onViewDetail(group)}
                        color="info"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="管理节点">
                      <IconButton
                        size="small"
                        onClick={() => onManageNodes(group)}
                        color="primary"
                      >
                        <GroupWorkIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="编辑">
                      <IconButton
                        size="small"
                        onClick={() => onEdit(group)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="删除">
                      <IconButton
                        size="small"
                        onClick={() => onDelete(group)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
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
        onPageChange={handleChangePage}
        rowsPerPage={pageSize}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 20, 50, 100]}
        labelRowsPerPage="每页显示"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 共 ${count} 条`}
      />
    </Paper>
  );
};
