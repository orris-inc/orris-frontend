/**
 * View Subscription Plan's Subscribers Sheet
 * Mobile-optimized bottom sheet for viewing plan subscribers
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Loader2,
  Users,
  Search,
  CheckCircle,
  Calendar,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from '@/components/common/Sheet';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import { formatDate } from '@/shared/utils/date-utils';
import { adminListSubscriptions } from '@/api/subscription';
import { listUsers } from '@/api/user';
import type { SubscriptionPlan, Subscription, SubscriptionStatus } from '@/api/subscription/types';
import type { UserResponse } from '@/api/user/types';

interface ViewPlanSubscriptionsSheetProps {
  open: boolean;
  onClose: () => void;
  plan: SubscriptionPlan | null;
}

// Status configuration
const STATUS_CONFIG: Record<SubscriptionStatus, { label: string; color: string }> = {
  active: { label: '激活', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  renewed: { label: '已续费', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  expired: { label: '已过期', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

export const ViewPlanSubscriptionsSheet: React.FC<ViewPlanSubscriptionsSheetProps> = ({
  open,
  onClose,
  plan,
}) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [usersMap, setUsersMap] = useState<Map<string, UserResponse>>(new Map());
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load data when sheet opens
  useEffect(() => {
    if (!open || !plan) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [subscriptionsResponse, usersResponse] = await Promise.all([
          adminListSubscriptions({ page: 1, pageSize: 1000 }),
          listUsers({ page: 1, pageSize: 1000 }),
        ]);

        const allSubscriptions = subscriptionsResponse.items || [];
        const planSubscriptions = allSubscriptions.filter(
          (sub) => sub.plan?.id === plan.id
        );

        const users = usersResponse.items || [];
        const userMap = new Map<string, UserResponse>();
        users.forEach((user) => userMap.set(user.id, user));

        setSubscriptions(planSubscriptions);
        setUsersMap(userMap);
      } catch {
        // Error handling
      } finally {
        setLoading(false);
      }
    };

    loadData();
    setSearchQuery('');
  }, [open, plan]);

  // Filter subscriptions
  const filteredSubscriptions = useMemo(() => {
    if (!searchQuery.trim()) return subscriptions;

    const query = searchQuery.toLowerCase();
    return subscriptions.filter((sub) => {
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

  // Statistics
  const activeCount = subscriptions.filter((s) => s.status === 'active').length;

  if (!plan) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="max-h-[95vh]">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <Users className="size-4 text-indigo-500" />
            </div>
            <span>订阅用户</span>
          </SheetTitle>
          <SheetDescription className="text-xs">
            「{plan.name}」的所有订阅用户
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="py-3 space-y-3">
          {/* Stats & Search */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs">
                <Users className="size-3" />
                {subscriptions.length} 个
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs">
                <CheckCircle className="size-3" />
                {activeCount} 激活
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="搜索用户名、邮箱..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  'w-full h-10 pl-9 pr-3 rounded-lg text-sm',
                  'bg-muted/50 border',
                  'placeholder:text-muted-foreground/60',
                  'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
                )}
              />
            </div>
          </div>

          {/* List */}
          <div className="min-h-[200px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="mt-3 text-sm text-muted-foreground">加载中...</p>
              </div>
            ) : filteredSubscriptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                  {searchQuery ? (
                    <Search className="size-5 text-muted-foreground" />
                  ) : (
                    <Users className="size-5 text-muted-foreground" />
                  )}
                </div>
                <p className="mt-3 text-sm font-medium text-muted-foreground">
                  {searchQuery ? '未找到匹配的订阅' : '暂无订阅用户'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  {searchQuery ? '尝试其他关键词' : '该计划还没有用户订阅'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSubscriptions.map((subscription) => {
                  const statusConfig = STATUS_CONFIG[subscription.status] || {
                    label: subscription.status,
                    color: 'bg-gray-100 text-gray-600',
                  };
                  const user = usersMap.get(String(subscription.userId));
                  const displayName = user?.name || user?.displayName || `用户 #${subscription.userId}`;
                  const initials = user?.initials || displayName.charAt(0).toUpperCase();

                  return (
                    <div
                      key={subscription.id}
                      className="rounded-lg border p-3 bg-background"
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="size-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/40 dark:to-indigo-800/30 flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                            {initials}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm truncate max-w-[120px]">
                              {displayName}
                            </span>
                            <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium', statusConfig.color)}>
                              {statusConfig.label}
                            </span>
                          </div>

                          {user?.email && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {user.email}
                            </p>
                          )}

                          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3" />
                              {formatDate(subscription.startDate)}
                            </span>
                            {subscription.autoRenew ? (
                              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                <RefreshCw className="size-3" />
                                自动续费
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-muted-foreground/60">
                                <X className="size-3" />
                                不续费
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Filter info */}
          {searchQuery && filteredSubscriptions.length !== subscriptions.length && (
            <p className="text-xs text-muted-foreground text-center">
              筛选结果：{filteredSubscriptions.length} / {subscriptions.length}
            </p>
          )}
        </SheetBody>

        <SheetFooter className="pt-3 pb-1">
          <Button variant="ghost" onClick={onClose} className="w-full h-10">
            关闭
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
