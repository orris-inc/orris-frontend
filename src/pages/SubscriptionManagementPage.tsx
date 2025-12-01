/**
 * 订阅管理页面（管理端）
 * 精致商务风格 - 统一设计系统
 */

import { useEffect, useState } from 'react';
import { CheckCircle, X, RefreshCw, Loader2, Receipt, Play, XCircle, RotateCcw } from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useSubscriptions } from '../features/subscriptions/hooks/useSubscriptions';
import type { SubscriptionStatus, Subscription } from '../features/subscriptions/types/subscriptions.types';
import { formatDate } from '@/shared/utils/date-utils';
import {
  tableStyles,
  tableHeaderStyles,
  tableBodyStyles,
  tableRowStyles,
  tableHeadStyles,
  tableCellStyles,
  getBadgeClass,
  textareaStyles,
} from '@/lib/ui-styles';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { Label } from '@/components/common/Label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/common/Dialog';
import {
  AdminPageLayout,
  AdminButton,
  AdminCard,
  AdminFilterCard,
  FilterRow,
} from '@/components/admin';

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
  const { subscriptions, loading, total, page, pageSize, fetchSubscriptions, changeStatus } = useSubscriptions();
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'all'>('all');
  const [processing, setProcessing] = useState<number | null>(null);

  // 取消对话框状态
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Subscription | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelImmediate, setCancelImmediate] = useState(false);

  // 初始加载
  useEffect(() => {
    fetchSubscriptions(1, 20);
  }, []);

  // 状态筛选变化
  const handleStatusFilterChange = (status: string) => {
    const filterValue = status as SubscriptionStatus | 'all';
    setStatusFilter(filterValue);
    fetchSubscriptions(1, pageSize, filterValue !== 'all' ? { status: filterValue as SubscriptionStatus } : undefined);
  };

  // 分页变化
  const handlePageChange = (newPage: number) => {
    fetchSubscriptions(newPage, pageSize, statusFilter !== 'all' ? { status: statusFilter as SubscriptionStatus } : undefined);
  };

  // 每页数量变化
  const handlePageSizeChange = (value: string) => {
    const newPageSize = parseInt(value, 10);
    fetchSubscriptions(1, newPageSize, statusFilter !== 'all' ? { status: statusFilter as SubscriptionStatus } : undefined);
  };

  // 激活订阅
  const handleActivate = async (id: number) => {
    setProcessing(id);
    try {
      await changeStatus(id, 'active');
    } finally {
      setProcessing(null);
    }
  };

  // 打开取消对话框
  const openCancelDialog = (subscription: Subscription) => {
    setCancelTarget(subscription);
    setCancelReason('');
    setCancelImmediate(false);
    setCancelDialogOpen(true);
  };

  // 确认取消订阅
  const handleCancelConfirm = async () => {
    if (!cancelTarget || !cancelReason.trim()) return;

    setProcessing(cancelTarget.ID);
    try {
      await changeStatus(cancelTarget.ID, 'cancelled', cancelReason.trim(), cancelImmediate);
      setCancelDialogOpen(false);
      setCancelTarget(null);
      setCancelReason('');
      setCancelImmediate(false);
    } finally {
      setProcessing(null);
    }
  };

  // 续费订阅
  const handleRenew = async (id: number) => {
    setProcessing(id);
    try {
      await changeStatus(id, 'renewed');
    } finally {
      setProcessing(null);
    }
  };

  // 刷新列表
  const handleRefresh = () => {
    fetchSubscriptions(page, pageSize, statusFilter !== 'all' ? { status: statusFilter as SubscriptionStatus } : undefined);
  };

  // 根据订阅状态获取可用操作
  const getAvailableActions = (subscription: Subscription) => {
    const actions: Array<{
      label: string;
      icon: React.ReactNode;
      onClick: () => void;
      variant: 'primary' | 'outline' | 'danger';
    }> = [];

    switch (subscription.Status) {
      case 'inactive':
      case 'pending':
        actions.push({
          label: '激活',
          icon: <Play className="size-3.5" strokeWidth={1.5} />,
          onClick: () => handleActivate(subscription.ID),
          variant: 'primary',
        });
        break;
      case 'active':
        actions.push({
          label: '取消',
          icon: <XCircle className="size-3.5" strokeWidth={1.5} />,
          onClick: () => openCancelDialog(subscription),
          variant: 'danger',
        });
        break;
      case 'cancelled':
      case 'expired':
        actions.push({
          label: '续费',
          icon: <RotateCcw className="size-3.5" strokeWidth={1.5} />,
          onClick: () => handleRenew(subscription.ID),
          variant: 'primary',
        });
        break;
    }

    return actions;
  };

  // 计算分页信息
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);

  return (
    <AdminLayout>
      <AdminPageLayout
        title="订阅管理"
        description="查看和管理所有用户的订阅"
        icon={Receipt}
        info="管理系统中的所有订阅记录，包括激活、取消等操作。"
        action={
          <Tooltip>
            <TooltipTrigger asChild>
              <AdminButton
                variant="outline"
                size="md"
                onClick={handleRefresh}
                disabled={loading}
                icon={<RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />}
              >
                刷新
              </AdminButton>
            </TooltipTrigger>
            <TooltipContent>刷新订阅列表</TooltipContent>
          </Tooltip>
        }
      >
        {/* 筛选器 */}
        <AdminFilterCard>
          <FilterRow columns={4}>
            {/* 状态筛选 */}
            <div className="space-y-2">
              <Label>订阅状态</Label>
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="active">激活</SelectItem>
                  <SelectItem value="inactive">未激活</SelectItem>
                  <SelectItem value="pending">待处理</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                  <SelectItem value="expired">已过期</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </FilterRow>
        </AdminFilterCard>

        {/* 表格卡片 */}
        <AdminCard noPadding>
            <table className={tableStyles}>
              <thead className={tableHeaderStyles}>
                <tr className={tableRowStyles}>
                  <th className={tableHeadStyles}>订阅 ID</th>
                  <th className={tableHeadStyles}>用户</th>
                  <th className={tableHeadStyles}>计划</th>
                  <th className={tableHeadStyles}>状态</th>
                  <th className={tableHeadStyles}>开始日期</th>
                  <th className={tableHeadStyles}>结束日期</th>
                  <th className={tableHeadStyles}>自动续费</th>
                  <th className={tableHeadStyles}>创建时间</th>
                  <th className={`${tableHeadStyles} text-center`}>操作</th>
                </tr>
              </thead>
              <tbody className={tableBodyStyles}>
                {loading && subscriptions.length === 0 ? (
                  <tr className={tableRowStyles}>
                    <td colSpan={9} className={`${tableCellStyles} h-64 text-center`}>
                      <div className="flex items-center justify-center">
                        <Loader2 className="size-8 animate-spin text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
                      </div>
                    </td>
                  </tr>
                ) : subscriptions.length === 0 ? (
                  <tr className={tableRowStyles}>
                    <td colSpan={9} className={`${tableCellStyles} h-64 text-center`}>
                      <p className="text-slate-500 dark:text-slate-400">暂无订阅数据</p>
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((subscription) => (
                    <tr key={subscription.ID} className={tableRowStyles}>
                      <td className={tableCellStyles}>{subscription.ID}</td>
                      <td className={tableCellStyles}>
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {subscription.User?.Name || '-'}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {subscription.User?.Email || `User #${subscription.UserID}`}
                          </div>
                        </div>
                      </td>
                      <td className={tableCellStyles}>
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {subscription.Plan?.Name || '-'}
                          </div>
                          {subscription.Plan && (
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {(subscription.Plan.Price / 100).toFixed(2)} {subscription.Plan.Currency}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className={tableCellStyles}>
                        <span className={getBadgeClass(STATUS_VARIANTS[subscription.Status])}>
                          {STATUS_LABELS[subscription.Status]}
                        </span>
                      </td>
                      <td className={tableCellStyles}>{formatDate(subscription.StartDate)}</td>
                      <td className={tableCellStyles}>{subscription.EndDate ? formatDate(subscription.EndDate) : '-'}</td>
                      <td className={tableCellStyles}>
                        {subscription.AutoRenew ? (
                          <CheckCircle className="size-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
                        ) : (
                          <X className="size-4 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
                        )}
                      </td>
                      <td className={tableCellStyles}>{formatDate(subscription.CreatedAt)}</td>
                      <td className={`${tableCellStyles} text-center`}>
                        <div className="flex items-center justify-center gap-1">
                          {getAvailableActions(subscription).map((action, index) => (
                            <Tooltip key={index}>
                              <TooltipTrigger asChild>
                                <AdminButton
                                  variant={action.variant}
                                  size="sm"
                                  onClick={action.onClick}
                                  disabled={processing === subscription.ID}
                                  loading={processing === subscription.ID}
                                  icon={action.icon}
                                >
                                  {action.label}
                                </AdminButton>
                              </TooltipTrigger>
                              <TooltipContent>{action.label}订阅</TooltipContent>
                            </Tooltip>
                          ))}
                          {getAvailableActions(subscription).length === 0 && (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* 分页控制 */}
            {total > 0 && (
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <span>每页显示</span>
                  <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                    <SelectTrigger className="h-8 w-[70px]">
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
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {startIndex}-{endIndex} / {total}
                  </span>
                  <div className="flex gap-1">
                    <AdminButton
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1 || loading}
                    >
                      上一页
                    </AdminButton>
                    <AdminButton
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages || loading}
                    >
                      下一页
                    </AdminButton>
                  </div>
                </div>
              </div>
            )}
        </AdminCard>
      </AdminPageLayout>

      {/* 取消订阅对话框 */}
      <Dialog
        open={cancelDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCancelDialogOpen(false);
            setCancelTarget(null);
            setCancelReason('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>取消订阅</DialogTitle>
            <DialogDescription>
              {cancelTarget && (
                <>
                  确认取消用户 <strong>{cancelTarget.User?.Name || cancelTarget.User?.Email}</strong> 的订阅？
                  <br />
                  计划：{cancelTarget.Plan?.Name || '-'}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">取消原因 *</Label>
              <textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="请输入取消原因..."
                rows={3}
                className={textareaStyles}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="cancel-immediate"
                checked={cancelImmediate}
                onChange={(e) => setCancelImmediate(e.target.checked)}
                className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="cancel-immediate" className="text-sm font-normal">
                立即生效（否则在当前周期结束后生效）
              </Label>
            </div>
          </div>

          <DialogFooter>
            <AdminButton
              variant="outline"
              onClick={() => {
                setCancelDialogOpen(false);
                setCancelTarget(null);
                setCancelReason('');
              }}
            >
              取消
            </AdminButton>
            <AdminButton
              variant="danger"
              onClick={handleCancelConfirm}
              disabled={!cancelReason.trim() || processing === cancelTarget?.ID}
              loading={processing === cancelTarget?.ID}
            >
              确认取消
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};
