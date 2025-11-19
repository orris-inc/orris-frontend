/**
 * 订阅管理页面（管理员）
 * 用于查看和管理所有用户的订阅
 */

import { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { CheckCircle, Cancel, Refresh } from '@mui/icons-material';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useSubscriptions } from '../features/subscriptions/hooks/useSubscriptions';
import type { SubscriptionStatus } from '../features/subscriptions/types/subscriptions.types';
import { formatDate } from '@/shared/utils/date-utils';

// 状态颜色映射
const STATUS_COLORS: Record<SubscriptionStatus, 'success' | 'error' | 'warning' | 'default' | 'info'> = {
  active: 'success',
  inactive: 'warning',
  cancelled: 'error',
  expired: 'error',
  pending: 'info',
};

// 状态标签
const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: '激活',
  inactive: '未激活',
  cancelled: '已取消',
  expired: '已过期',
  pending: '待处理',
};

export const SubscriptionManagementPage: React.FC = () => {
  const { subscriptions, loading, total, page, pageSize, fetchSubscriptions, activate } = useSubscriptions();
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | ''>('');
  const [activating, setActivating] = useState<number | null>(null);

  // 初始加载
  useEffect(() => {
    fetchSubscriptions(1, 20);
  }, []);

  // 状态筛选变化
  const handleStatusFilterChange = (status: SubscriptionStatus | '') => {
    setStatusFilter(status);
    fetchSubscriptions(1, pageSize, status ? { status } : undefined);
  };

  // 分页变化
  const handlePageChange = (_: unknown, newPage: number) => {
    fetchSubscriptions(newPage + 1, pageSize, statusFilter ? { status: statusFilter } : undefined);
  };

  // 每页数量变化
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPageSize = parseInt(event.target.value, 10);
    fetchSubscriptions(1, newPageSize, statusFilter ? { status: statusFilter } : undefined);
  };

  // 激活订阅
  const handleActivate = async (id: number) => {
    setActivating(id);
    try {
      await activate(id);
    } finally {
      setActivating(null);
    }
  };

  // 刷新列表
  const handleRefresh = () => {
    fetchSubscriptions(page, pageSize, statusFilter ? { status: statusFilter } : undefined);
  };

  return (
    <AdminLayout>
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" component="h1">
              订阅管理
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {/* 状态筛选 */}
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>订阅状态</InputLabel>
                <Select
                  value={statusFilter}
                  label="订阅状态"
                  onChange={(e) => handleStatusFilterChange(e.target.value as SubscriptionStatus | '')}
                >
                  <MenuItem value="">
                    <em>全部</em>
                  </MenuItem>
                  <MenuItem value="active">激活</MenuItem>
                  <MenuItem value="inactive">未激活</MenuItem>
                  <MenuItem value="pending">待处理</MenuItem>
                  <MenuItem value="cancelled">已取消</MenuItem>
                  <MenuItem value="expired">已过期</MenuItem>
                </Select>
              </FormControl>

              {/* 刷新按钮 */}
              <Tooltip title="刷新">
                <IconButton onClick={handleRefresh} disabled={loading}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Card>
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>订阅 ID</TableCell>
                      <TableCell>用户</TableCell>
                      <TableCell>计划</TableCell>
                      <TableCell>状态</TableCell>
                      <TableCell>开始日期</TableCell>
                      <TableCell>结束日期</TableCell>
                      <TableCell>自动续费</TableCell>
                      <TableCell>创建时间</TableCell>
                      <TableCell align="center">操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading && subscriptions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : subscriptions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                          <Typography color="text.secondary">
                            暂无订阅数据
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      subscriptions.map((subscription) => (
                        <TableRow key={subscription.ID} hover>
                          <TableCell>{subscription.ID}</TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">
                                {subscription.User?.Name || '-'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {subscription.User?.Email || `User #${subscription.UserID}`}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">
                                {subscription.Plan?.Name || '-'}
                              </Typography>
                              {subscription.Plan && (
                                <Typography variant="caption" color="text.secondary">
                                  {(subscription.Plan.Price / 100).toFixed(2)} {subscription.Plan.Currency}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={STATUS_LABELS[subscription.Status]}
                              color={STATUS_COLORS[subscription.Status]}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{formatDate(subscription.StartDate)}</TableCell>
                          <TableCell>{subscription.EndDate ? formatDate(subscription.EndDate) : '-'}</TableCell>
                          <TableCell>
                            {subscription.AutoRenew ? (
                              <CheckCircle color="success" fontSize="small" />
                            ) : (
                              <Cancel color="disabled" fontSize="small" />
                            )}
                          </TableCell>
                          <TableCell>{formatDate(subscription.CreatedAt)}</TableCell>
                          <TableCell align="center">
                            {subscription.Status === 'inactive' && (
                              <Button
                                variant="contained"
                                size="small"
                                color="primary"
                                onClick={() => handleActivate(subscription.ID)}
                                disabled={activating === subscription.ID}
                              >
                                {activating === subscription.ID ? '激活中...' : '激活'}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={total}
                page={page - 1}
                onPageChange={handlePageChange}
                rowsPerPage={pageSize}
                onRowsPerPageChange={handleRowsPerPageChange}
                rowsPerPageOptions={[10, 20, 50, 100]}
                labelRowsPerPage="每页显示"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} 共 ${count} 条`}
              />
            </CardContent>
          </Card>
        </Box>
      </Container>
    </AdminLayout>
  );
};
