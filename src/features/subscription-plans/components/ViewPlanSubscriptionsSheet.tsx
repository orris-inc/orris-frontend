/**
 * View Subscription Plan's Subscribers Sheet
 * Mobile-optimized bottom sheet for viewing plan subscribers
 */

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  type BaseSheetProps,
} from '@/components/common/sheet';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import { formatDate } from '@/shared/utils/date-utils';
import { adminListSubscriptions } from '@/api/subscription';
import { listUsers } from '@/api/user';
import type { SubscriptionPlan, Subscription, SubscriptionStatus } from '@/api/subscription/types';
import type { UserResponse } from '@/api/user/types';

interface ViewPlanSubscriptionsSheetProps extends BaseSheetProps {
  plan: SubscriptionPlan | null;
}

// Status configuration (synced with SDK 2025-01-14)
const STATUS_CONFIG: Record<SubscriptionStatus, { labelKey: string; color: string }> = {
  inactive: { labelKey: 'common.status.inactive', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  pending_payment: { labelKey: 'subscriptionStatus.pendingPayment', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  trialing: { labelKey: 'subscriptionStatus.trialing', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  active: { labelKey: 'common.status.active', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  past_due: { labelKey: 'subscriptionStatus.pastDue', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  suspended: { labelKey: 'common.status.suspended', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  cancelled: { labelKey: 'common.status.cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  expired: { labelKey: 'common.status.expired', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

export const ViewPlanSubscriptionsSheet: React.FC<ViewPlanSubscriptionsSheetProps> = ({
  open,
  onOpenChange,
  plan,
}) => {
  const { t } = useTranslation();
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-h-[95vh]">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <Users className="size-4 text-indigo-500" />
            </div>
            <span>{t('subscriptionPlans.subscribers')}</span>
          </SheetTitle>
          <SheetDescription className="text-xs">
            {t('subscriptionPlans.subscribersOfPlan', { name: plan.name })}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="py-3 space-y-3">
          {/* Stats & Search */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs">
                <Users className="size-3" />
                {t('subscriptionPlans.subscriptionsCount', { count: subscriptions.length })}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs">
                <CheckCircle className="size-3" />
                {t('subscriptionPlans.activeCount', { count: activeCount })}
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('subscriptionPlans.searchUsersPlaceholder')}
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
                <p className="mt-3 text-sm text-muted-foreground">{t('common.table.loading')}</p>
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
                  {searchQuery ? t('subscriptionPlans.noMatchingSubscriptions') : t('subscriptionPlans.noSubscribers')}
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  {searchQuery ? t('subscriptionPlans.tryOtherKeywords') : t('subscriptionPlans.noPlanSubscribers')}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSubscriptions.map((subscription) => {
                  const statusConfig = STATUS_CONFIG[subscription.status] || {
                    labelKey: 'common.status.unknown',
                    color: 'bg-gray-100 text-gray-600',
                  };
                  const user = usersMap.get(String(subscription.userId));
                  const displayName = user?.name || user?.displayName || t('subscriptionPlans.userNumber', { id: subscription.userId });
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
                              {t(statusConfig.labelKey)}
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
                                {t('subscription.autoRenewal')}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-muted-foreground/60">
                                <X className="size-3" />
                                {t('subscription.noRenewal')}
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
              {t('subscriptionPlans.filterResults', { filtered: filteredSubscriptions.length, total: subscriptions.length })}
            </p>
          )}
        </SheetBody>

        <SheetFooter className="pt-3 pb-1">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full h-10">
            {t('common.actions.close')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
