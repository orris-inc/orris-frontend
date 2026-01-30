/**
 * Admin Dashboard Page
 * Tailwind Application UI style with real API data
 * Mobile-first responsive design
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { usePageTitle } from '@/shared/hooks';
import {
  useAdminTrafficStats,
  useNodeTrafficStats,
  useDashboardStats,
  getDateRangeFromPreset,
  detectGranularity,
  type DateRangePreset,
} from '@/features/admin-traffic';
import {
  PageHeader,
  DateRangeSelector,
  LazyTrafficTrendChart,
  TrafficRankingList,
  NodeTrafficStats,
} from '@/components/admin';
import {
  Users,
  CreditCard,
  Server,
  Activity,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { formatTrafficBytes } from '@/api/admin';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  loading?: boolean;
  onClick?: () => void;
}

// ============================================================================
// Stat Card Component - Following Tailwind UI Stats Pattern
// ============================================================================

function StatCard({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  loading,
  onClick,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl bg-card px-4 py-5 ring-1 ring-border sm:p-6">
        <div className="animate-pulse">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-16 rounded bg-muted" />
              <div className="h-6 w-12 rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const content = (
    <div className="flex items-center gap-3">
      <div className={cn('rounded-lg p-2.5 ring-1 ring-inset ring-border/50', iconBg)}>
        <Icon className={cn('size-5', iconColor)} strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <dt className="truncate text-sm font-medium text-muted-foreground">{title}</dt>
        <dd className="mt-0.5 text-xl font-semibold tracking-tight text-foreground tabular-nums sm:text-2xl">
          {value}
        </dd>
      </div>
      {onClick && (
        <ChevronRight
          className="size-5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary"
          strokeWidth={1.5}
        />
      )}
    </div>
  );

  const baseClassName = cn(
    'overflow-hidden rounded-xl bg-card px-4 py-5 ring-1 ring-border sm:p-6',
    'transition-all duration-200',
    'active:scale-[0.98]',
    onClick && 'cursor-pointer group hover:ring-primary/30 hover:shadow-md'
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(baseClassName, 'w-full text-left')}>
        {content}
      </button>
    );
  }

  return <div className={baseClassName}>{content}</div>;
}

// ============================================================================
// Main Page Component
// ============================================================================

export function NewAdminDashboardPage() {
  const { t } = useTranslation();
  usePageTitle(t('admin.dashboard.title'));

  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { stats, loading } = useDashboardStats();

  // Traffic analytics state
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('last7days');
  const [nodeTrafficPage, setNodeTrafficPage] = useState(1);

  // Get date range from preset
  const dateRange = getDateRangeFromPreset(dateRangePreset);
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

  // Statistics configuration
  const platformStats: StatCardProps[] = [
    {
      title: t('admin.stats.totalUsers'),
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      iconBg: 'bg-info/10',
      iconColor: 'text-info',
      loading,
      onClick: () => navigate('/admin/users'),
    },
    {
      title: t('admin.stats.totalSubscriptions'),
      value: stats.activeSubscriptions.toLocaleString(),
      icon: CreditCard,
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
      loading,
      onClick: () => navigate('/admin/subscriptions'),
    },
    {
      title: t('admin.stats.totalNodes'),
      value: stats.totalNodes.toLocaleString(),
      icon: Server,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      loading,
      onClick: () => navigate('/admin/nodes'),
    },
    {
      title: t('admin.stats.onlineNodes'),
      value: stats.activeNodes.toLocaleString(),
      icon: Activity,
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
      loading,
      onClick: () => navigate('/admin/monitor'),
    },
  ];

  const trafficStats: StatCardProps[] = [
    {
      title: t('admin.stats.totalUpload'),
      value: trafficOverview ? formatTrafficBytes(trafficOverview.totalUpload) : '-',
      icon: ArrowUp,
      iconBg: 'bg-chart-upload/10',
      iconColor: 'text-chart-upload',
      loading: isTrafficLoading,
    },
    {
      title: t('admin.stats.totalDownload'),
      value: trafficOverview ? formatTrafficBytes(trafficOverview.totalDownload) : '-',
      icon: ArrowDown,
      iconBg: 'bg-chart-download/10',
      iconColor: 'text-chart-download',
      loading: isTrafficLoading,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 py-4 pb-safe lg:py-6">
        {/* Page Header */}
        <PageHeader
          title={t('admin.dashboard.title')}
          description={t('admin.dashboard.welcomeBack', {
            name: user.displayName || user.email?.split('@')[0],
          })}
          action={<DateRangeSelector value={dateRangePreset} onChange={setDateRangePreset} />}
        />

        {/* Platform Statistics - Tailwind UI Stats Grid */}
        <section aria-labelledby="platform-stats-heading">
          <h2 id="platform-stats-heading" className="sr-only">
            {t('admin.dashboard.platformStats')}
          </h2>
          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {platformStats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </dl>
        </section>

        {/* Traffic Statistics */}
        <section aria-labelledby="traffic-stats-heading">
          <h2 id="traffic-stats-heading" className="sr-only">
            {t('admin.dashboard.trafficStats')}
          </h2>
          <dl className="grid grid-cols-2 gap-4">
            {trafficStats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </dl>
        </section>

        {/* Traffic Analytics Section */}
        <section className="space-y-4" aria-labelledby="traffic-analytics-heading">
          <h2 id="traffic-analytics-heading" className="sr-only">
            {t('admin.dashboard.trafficAnalytics')}
          </h2>

          {/* Traffic Trend Chart */}
          <LazyTrafficTrendChart
            data={trafficTrend?.points ?? []}
            granularity={granularity}
            loading={isTrafficLoading}
            overview={trafficOverview ?? undefined}
          />

          {/* Traffic Ranking and Node Stats */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
        </section>
      </div>
    </AdminLayout>
  );
}
