/**
 * Dashboard Main Page - Subscription Entry
 * Simplified entry page with subscription cards and quick actions
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  usePageTitle(t('user.dashboard.title'));

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
          <span>{t('user.dashboard.errorLoadUser')}</span>
        </div>
      </DashboardLayout>
    );
  }

  const subscriptions = dashboardData?.subscriptions ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-4 pb-safe">
        {/* Header: Welcome + Subscriptions Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 ring-1 ring-primary/20 touch-target flex items-center justify-center">
              <CreditCard className="size-4 sm:size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg md:text-xl font-semibold text-foreground">
                {user.displayName || user.email?.split('@')[0] || t('user.dashboard.defaultUser')}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">{t('user.dashboard.mySubscriptions')}</p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8 bg-card rounded-lg border border-border">
            <Loader2 className="size-5 animate-spin mr-2 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t('user.dashboard.loading')}</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && subscriptions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 bg-card rounded-lg border border-border">
            <div className="size-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
              <CreditCard className="size-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">{t('user.dashboard.empty.title')}</p>
            <p className="text-xs text-muted-foreground mb-4">{t('user.dashboard.empty.description')}</p>
            <a href="/pricing" className={`${getButtonClass('default', 'sm')} touch-target inline-flex items-center justify-center`}>
              {t('user.dashboard.empty.viewPlans')}
            </a>
          </div>
        )}

        {/* Subscription Cards - Responsive grid: 1 col mobile, 2 cols tablet+ */}
        {!isLoading && subscriptions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
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
