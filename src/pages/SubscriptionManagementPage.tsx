/**
 * 订阅管理页面（管理员）
 * 用于查看和管理所有用户的订阅
 */

import { useEffect, useState } from 'react';
import { CheckCircle, X, RefreshCw, Loader2 } from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useSubscriptions } from '../features/subscriptions/hooks/useSubscriptions';
import type { SubscriptionStatus } from '../features/subscriptions/types/subscriptions.types';
import { formatDate } from '@/shared/utils/date-utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// 状态样式映射
const STATUS_VARIANTS: Record<SubscriptionStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  inactive: 'secondary',
  cancelled: 'destructive',
  expired: 'destructive',
  pending: 'outline',
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
  const handleStatusFilterChange = (status: string) => {
    const filterValue = status as SubscriptionStatus | '';
    setStatusFilter(filterValue);
    fetchSubscriptions(1, pageSize, filterValue ? { status: filterValue } : undefined);
  };

  // 分页变化
  const handlePageChange = (newPage: number) => {
    fetchSubscriptions(newPage, pageSize, statusFilter ? { status: statusFilter } : undefined);
  };

  // 每页数量变化
  const handlePageSizeChange = (value: string) => {
    const newPageSize = parseInt(value, 10);
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

  // 计算分页信息
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);

  return (
    <AdminLayout>
      <div className="container mx-auto max-w-7xl py-6">
        {/* 页面标题和操作栏 */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">订阅管理</h1>
          <div className="flex items-center gap-3">
            {/* 状态筛选 */}
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-[150px]" size="sm">
                <SelectValue placeholder="订阅状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部</SelectItem>
                <SelectItem value="active">激活</SelectItem>
                <SelectItem value="inactive">未激活</SelectItem>
                <SelectItem value="pending">待处理</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
                <SelectItem value="expired">已过期</SelectItem>
              </SelectContent>
            </Select>

            {/* 刷新按钮 */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  <RefreshCw className={loading ? 'animate-spin' : ''} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>刷新</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* 表格卡片 */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订阅 ID</TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead>计划</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>开始日期</TableHead>
                  <TableHead>结束日期</TableHead>
                  <TableHead>自动续费</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && subscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-64 text-center">
                      <div className="flex items-center justify-center">
                        <Loader2 className="size-8 animate-spin text-muted-foreground" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : subscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-64 text-center">
                      <p className="text-muted-foreground">暂无订阅数据</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  subscriptions.map((subscription) => (
                    <TableRow key={subscription.ID}>
                      <TableCell>{subscription.ID}</TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium">
                            {subscription.User?.Name || '-'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {subscription.User?.Email || `User #${subscription.UserID}`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium">
                            {subscription.Plan?.Name || '-'}
                          </div>
                          {subscription.Plan && (
                            <div className="text-xs text-muted-foreground">
                              {(subscription.Plan.Price / 100).toFixed(2)} {subscription.Plan.Currency}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[subscription.Status]}>
                          {STATUS_LABELS[subscription.Status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(subscription.StartDate)}</TableCell>
                      <TableCell>{subscription.EndDate ? formatDate(subscription.EndDate) : '-'}</TableCell>
                      <TableCell>
                        {subscription.AutoRenew ? (
                          <CheckCircle className="size-4 text-green-600" />
                        ) : (
                          <X className="size-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell>{formatDate(subscription.CreatedAt)}</TableCell>
                      <TableCell className="text-center">
                        {subscription.Status === 'inactive' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleActivate(subscription.ID)}
                            disabled={activating === subscription.ID}
                          >
                            {activating === subscription.ID && (
                              <Loader2 className="animate-spin" />
                            )}
                            {activating === subscription.ID ? '激活中...' : '激活'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* 分页控制 */}
            {total > 0 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>每页显示</span>
                  <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                    <SelectTrigger className="h-8 w-[70px]" size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span>共 {total} 条</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {startIndex}-{endIndex} / {total}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1 || loading}
                    >
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages || loading}
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};
