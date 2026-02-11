/**
 * Admin Dashboard Page
 * Tailwind Application UI style with real API data
 * Mobile-first responsive design
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { MobileDashboard } from '@/features/dashboard/components/MobileDashboard';
import { usePageTitle } from '@/shared/hooks';
import {
  useAdminTrafficStats,
  useNodeTrafficStats,
  useDashboardStats,
  detectGranularity,
} from '@/features/admin-traffic';
import {
  PageHeader,
  DateRangeFilter,
  toDateRange,
  getInitialDateRange,
  LazyTrafficTrendChart,
  TrafficRankingList,
  NodeTrafficStats,
} from '@/components/admin';
import type { DateRangeValue } from '@/components/admin';
import { DashboardOverviewStrip } from '@/components/admin/DashboardOverviewStrip';

// ============================================================================
// Main Page Component
// ============================================================================

export function NewAdminDashboardPage() {
  const { t } = useTranslation();
  usePageTitle(t('admin.dashboard.title'));

  const { user } = useAuthStore();
  const { isMobile } = useBreakpoint();
  const { dashboard, loading } = useDashboardStats();

  // Traffic analytics state
  const [dateRangeValue, setDateRangeValue] = useState<DateRangeValue>(() => getInitialDateRange('last7days'));
  const [nodeTrafficPage, setNodeTrafficPage] = useState(1);

  // Convert to traffic hooks format
  const dateRange = toDateRange(dateRangeValue);
  const granularity = detectGranularity(dateRange);

  // Fetch traffic statistics
  const {
    overview: trafficOverview,
    trend: trafficTrend,
    userRanking,
    subscriptionRanking,
    isLoading: isTrafficLoading,
  } = useAdminTrafficStats({ dateRange });

  // Fetch node traffic statistics with pagination
  const {
    items: nodeTrafficItems,
    pagination: nodeTrafficPagination,
    isLoading: isNodeTrafficLoading,
  } = useNodeTrafficStats({
    dateRange,
    page: nodeTrafficPage,
    pageSize: 10,
  });

  if (!user) {
    return (
      <AdminLayout>
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{t('admin.dashboard.unableToLoadUser')}</p>
        </div>
      </AdminLayout>
    );
  }

  // Mobile dashboard
  if (isMobile) {
    return (
      <AdminLayout>
        <MobileDashboard
          user={user}
          dashboard={dashboard}
          dashboardLoading={loading}
          dateRangeValue={dateRangeValue}
          onDateRangeChange={setDateRangeValue}
          trafficOverview={trafficOverview}
          trafficTrend={trafficTrend}
          userRanking={userRanking}
          subscriptionRanking={subscriptionRanking}
          isTrafficLoading={isTrafficLoading}
          granularity={granularity}
          nodeTrafficItems={nodeTrafficItems}
          nodeTrafficPagination={nodeTrafficPagination}
          isNodeTrafficLoading={isNodeTrafficLoading}
          onNodeTrafficPageChange={setNodeTrafficPage}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-4 lg:gap-5 pb-safe">
        <PageHeader
          title={t('admin.dashboard.title')}
          action={<DateRangeFilter value={dateRangeValue} onChange={setDateRangeValue} />}
        />

        <DashboardOverviewStrip
          dashboard={dashboard}
          dashboardLoading={loading}
        />

        <LazyTrafficTrendChart
          data={trafficTrend?.points ?? []}
          granularity={granularity}
          loading={isTrafficLoading}
          trafficOverview={trafficOverview}
          trafficLoading={isTrafficLoading}
        />

        <div className="grid grid-cols-1 gap-4 lg:gap-5 lg:grid-cols-2">
          <TrafficRankingList
            userRanking={userRanking}
            subscriptionRanking={subscriptionRanking}
            loading={isTrafficLoading}
          />
          <NodeTrafficStats
            items={nodeTrafficItems}
            pagination={nodeTrafficPagination}
            loading={isNodeTrafficLoading}
            onPageChange={setNodeTrafficPage}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
