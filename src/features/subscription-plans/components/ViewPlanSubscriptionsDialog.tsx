/**
 * 查看订阅计划的订阅用户对话框
 * 使用 Radix UI 组件，精致商务风格
 */

import { useState, useEffect, useMemo } from 'react';
import { Loader2, Users, Search, CheckCircle, X, Calendar, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/common/Dialog';
import { ScrollArea } from '@/components/common/ScrollArea';
import { Separator } from '@/components/common/Separator';
import { AdminBadge } from '@/components/admin';
import { cn } from '@/lib/utils';
import { formatDate } from '@/shared/utils/date-utils';
import { adminListSubscriptions } from '@/api/subscription';
import { listUsers } from '@/api/user';
import type { SubscriptionPlan, Subscription, SubscriptionStatus } from '@/api/subscription/types';
import type { UserResponse } from '@/api/user/types';

interface ViewPlanSubscriptionsDialogProps {
  open: boolean;
  onClose: () => void;
  plan: SubscriptionPlan | null;
}

// 状态配置
const STATUS_CONFIG: Record<SubscriptionStatus, { label: string; variant: 'success' | 'default' | 'warning' | 'danger' }> = {
  active: { label: '激活', variant: 'success' },
  renewed: { label: '已续费', variant: 'success' },
  pending: { label: '待处理', variant: 'warning' },
  cancelled: { label: '已取消', variant: 'danger' },
  expired: { label: '已过期', variant: 'danger' },
};

export const ViewPlanSubscriptionsDialog: React.FC<ViewPlanSubscriptionsDialogProps> = ({
  open,
  onClose,
  plan,
}) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  // 注意：UserResponse.id 现在是 string (Stripe-style)
  const [usersMap, setUsersMap] = useState<Map<string, UserResponse>>(new Map());
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 当对话框打开时加载数据
  useEffect(() => {
    if (!open || !plan) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // 并行加载订阅和用户数据
        const [subscriptionsResponse, usersResponse] = await Promise.all([
          adminListSubscriptions({ page: 1, pageSize: 1000 }),
          listUsers({ page: 1, pageSize: 1000 }),
        ]);

        const allSubscriptions = subscriptionsResponse.items || [];
        const planSubscriptions = allSubscriptions.filter(
          (sub) => sub.plan?.id === plan.id
        );

        // 构建用户映射（使用 string key，因为 UserResponse.id 是 string）
        const users = usersResponse.items || [];
        const userMap = new Map<string, UserResponse>();
        users.forEach((user) => userMap.set(user.id, user));

        setSubscriptions(planSubscriptions);
        setUsersMap(userMap);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    setSearchQuery('');
  }, [open, plan]);

  // 过滤订阅（支持按用户名、邮箱搜索）
  const filteredSubscriptions = useMemo(() => {
    if (!searchQuery.trim()) return subscriptions;

    const query = searchQuery.toLowerCase();
    return subscriptions.filter((sub) => {
      // userId 是 number，转为 string 查找
      const user = usersMap.get(String(sub.userId));
      return (
        String(sub.id).includes(query) ||
        String(sub.userId).includes(query) ||
        sub.status.toLowerCase().includes(query) ||
        user?.name?.toLowerCase().includes(query) ||
        user?.email?.toLowerCase().includes(query)
      );
    });
  }, [subscriptions, searchQuery, usersMap]);

  // 统计信息
  const activeCount = subscriptions.filter((s) => s.status === 'active').length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        {/* 头部 */}
        <div className="px-6 py-5 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30">
              <Users className="size-5" strokeWidth={1.5} />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                订阅用户
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                订阅计划「<span className="font-medium text-slate-700 dark:text-slate-300">{plan?.name}</span>」的所有用户
              </DialogDescription>
            </div>
          </div>
        </div>

        <Separator />

        {/* 工具栏 */}
        <div className="px-6 py-4 flex items-center justify-between gap-4 bg-white dark:bg-slate-900">
          {/* 统计徽章 */}
          <div className="flex items-center gap-2">
            <AdminBadge variant="info" size="md">
              <Users className="mr-1.5 size-3.5" strokeWidth={2} />
              {subscriptions.length} 个订阅
            </AdminBadge>
            <AdminBadge variant="success" size="md">
              <CheckCircle className="mr-1.5 size-3.5" strokeWidth={2} />
              {activeCount} 激活
            </AdminBadge>
          </div>

          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" strokeWidth={2} />
            <input
              type="text"
              placeholder="搜索用户名、邮箱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-56 h-9 pl-9 pr-3 rounded-lg text-sm',
                'bg-slate-100 dark:bg-slate-800',
                'border border-transparent',
                'text-slate-900 dark:text-white placeholder:text-slate-400',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500',
                'transition-all duration-200'
              )}
            />
          </div>
        </div>

        <Separator />

        {/* 列表区域 */}
        <ScrollArea className="h-[380px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-16">
              <div className="relative">
                <Loader2 className="size-10 animate-spin text-indigo-500" strokeWidth={2} />
                <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
              </div>
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">加载中...</p>
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16">
              <div className="relative">
                <div className="size-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center shadow-inner">
                  {searchQuery ? (
                    <Search className="size-7 text-slate-400" strokeWidth={1.5} />
                  ) : (
                    <Users className="size-7 text-slate-400" strokeWidth={1.5} />
                  )}
                </div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-200/20 to-transparent dark:from-slate-700/20 blur-xl -z-10" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                {searchQuery ? '未找到匹配的订阅' : '暂无订阅用户'}
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {searchQuery ? '尝试使用不同的关键词搜索' : '该计划还没有用户订阅'}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {filteredSubscriptions.map((subscription) => {
                const statusConfig = STATUS_CONFIG[subscription.status] || {
                  label: subscription.status,
                  variant: 'default' as const,
                };
                // userId 是 number，转为 string 查找
                const user = usersMap.get(String(subscription.userId));
                const displayName = user?.name || user?.displayName || `用户 #${subscription.userId}`;
                const initials = user?.initials || `U${subscription.userId}`;

                return (
                  <div
                    key={subscription.id}
                    className={cn(
                      'group relative rounded-xl border p-4',
                      'bg-white dark:bg-slate-800/50',
                      'border-slate-200/80 dark:border-slate-700/80',
                      'hover:border-indigo-200 dark:hover:border-indigo-800/60',
                      'hover:shadow-md hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50',
                      'transition-all duration-200'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      {/* 用户头像 */}
                      <div className="flex items-center justify-center size-11 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/40 dark:to-indigo-800/30 shrink-0">
                        <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                          {initials}
                        </span>
                      </div>

                      {/* 主要信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5">
                          <span className="font-semibold text-slate-900 dark:text-white truncate">
                            {displayName}
                          </span>
                          <AdminBadge variant={statusConfig.variant} size="sm">
                            {statusConfig.label}
                          </AdminBadge>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                          {user?.email && (
                            <span className="truncate max-w-[180px]">{user.email}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3.5" strokeWidth={2} />
                            {formatDate(subscription.startDate)}
                            {subscription.endDate && (
                              <span className="text-slate-400"> → {formatDate(subscription.endDate)}</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* 续费状态 */}
                      <div className="shrink-0">
                        {subscription.autoRenew ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                            <RefreshCw className="size-3.5" strokeWidth={2} />
                            <span className="text-xs font-medium">自动续费</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                            <X className="size-3.5" strokeWidth={2} />
                            <span className="text-xs font-medium">不续费</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <Separator />

        {/* 底部 */}
        <div className="px-6 py-4 flex items-center justify-between bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-800/30">
          <div className="text-xs text-slate-400">
            {searchQuery && filteredSubscriptions.length !== subscriptions.length && (
              <span>筛选结果：{filteredSubscriptions.length} / {subscriptions.length}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium',
              'bg-slate-100 dark:bg-slate-800',
              'text-slate-700 dark:text-slate-300',
              'hover:bg-slate-200 dark:hover:bg-slate-700',
              'active:scale-[0.98]',
              'transition-all duration-200'
            )}
          >
            关闭
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
