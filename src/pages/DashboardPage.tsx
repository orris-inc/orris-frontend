/**
 * Dashboard Main Page - Subscription Entry
 * Simplified entry page with subscription cards and quick actions
 */

import { useEffect, useState } from 'react';
import { CircleAlert, CreditCard, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { usePageTitle } from '@/shared/hooks';
import { getDashboard } from '@/api/user';
import type { DashboardResponse } from '@/api/user/types';
import { SubscriptionEntryCard } from '@/components/dashboard/SubscriptionEntryCard';
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';
import { getButtonClass } from '@/lib/ui-styles';

export const DashboardPage = () => {
  usePageTitle('仪表盘');

  const { user } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getDashboard();
        setDashboardData(data);
      } catch {
        // Failed to fetch dashboard data
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          <CircleAlert className="size-5" />
          <span>无法加载用户信息</span>
        </div>
      </DashboardLayout>
    );
  }

  const subscriptions = dashboardData?.subscriptions ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header: Welcome + Subscriptions Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <CreditCard className="size-4 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {user.displayName || user.email?.split('@')[0] || '用户'}
              </h1>
              <p className="text-xs text-muted-foreground">我的订阅</p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="size-5 animate-spin mr-2" />
            <span className="text-sm">加载中...</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && subscriptions.length === 0 && (
          <div className="text-center py-8 rounded-xl border bg-card">
            <CreditCard className="size-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">您还没有任何订阅</p>
            <a href="/pricing" className={getButtonClass('default', 'sm')}>
              查看订阅计划
            </a>
          </div>
        )}

        {/* Subscription Cards */}
        {!isLoading && subscriptions.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            {subscriptions.map((subscription) => (
              <SubscriptionEntryCard key={subscription.id} subscription={subscription} />
            ))}
          </div>
        )}

        {/* Quick Actions - Inline */}
        {!isLoading && (
          <QuickActionsCard className="!col-span-full" />
        )}
      </div>
    </DashboardLayout>
  );
};
