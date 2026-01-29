/**
 * Admin Dashboard - Modern Bento Grid Design
 * Uses real API data with traffic analytics
 * Desktop-first responsive design with Bento Grid layout
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
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  Server,
  Activity,
  type LucideIcon,
} from 'lucide-react';
import { formatTrafficBytes } from '@/api/admin';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface BentoStatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  loading?: boolean;
  className?: string;
  /** Optional click handler for navigation */
  onClick?: () => void;
}


// ============================================================================
// Bento Stat Card Component
// ============================================================================

const BentoStatCard = ({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  loading,
  className,
  onClick,
}: BentoStatCardProps) => {
  if (loading) {
    return (
      <div
        className={cn(
          '@container rounded-xl bg-card border border-border p-3 @[140px]:p-4',
          'transition-shadow hover:shadow-md',
          className
        )}
      >
        <div className="flex items-center gap-2.5 @[140px]:gap-3">
          <div className="rounded-lg bg-muted animate-pulse size-9 @[140px]:size-10 shrink-0" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="h-3 w-10 bg-muted rounded animate-pulse" />
            <div className="h-5 w-14 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const content = (
    <div className="flex items-center gap-2.5 @[140px]:gap-3">
      {/* Icon */}
      <div
        className={cn(
          'rounded-lg ring-1 ring-inset p-2 @[140px]:p-2.5 shrink-0',
          iconBg,
          iconBg.includes('/') ? 'ring-current/20' : 'ring-border'
        )}
      >
        <Icon className={cn('size-4 @[140px]:size-5', iconColor)} strokeWidth={1.5} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] @[140px]:text-xs text-muted-foreground font-medium">
          {title}
        </p>
        <p className="text-base @[140px]:text-lg font-semibold tabular-nums text-foreground tracking-tight">
          {value}
        </p>
      </div>

      {/* Arrow indicator for clickable cards */}
      {onClick && (
        <ArrowUpRight className="size-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
      )}
    </div>
  );

  const baseClasses = cn(
    '@container rounded-xl bg-card border border-border p-3 @[140px]:p-4',
    'transition-all duration-200 hover:shadow-md hover:border-border/80',
    onClick && 'cursor-pointer group hover:border-primary/30',
    className
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(baseClasses, 'w-full text-left')}
      >
        {content}
      </button>
    );
  }

  return <div className={baseClasses}>{content}</div>;
};

// ============================================================================
// Main Page Component
// ============================================================================

export const NewAdminDashboardPage = () => {
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
        <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/10">
          <p className="text-sm text-destructive">
            {t('admin.dashboard.unableToLoadUser')}
          </p>
        </div>
      </AdminLayout>
    );
  }

  // All stat cards - uniform layout with navigation
  const allStats = [
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
      <div className="py-4 lg:py-6 space-y-4 sm:space-y-6 pb-safe">
        {/* ================================================================== */}
        {/* Page Header - Using PageHeader component */}
        {/* ================================================================== */}
        <PageHeader
          title={t('admin.dashboard.title')}
          description={t('admin.dashboard.welcomeBack', { name: user.displayName || user.email?.split('@')[0] })}
          action={
            <DateRangeSelector
              value={dateRangePreset}
              onChange={setDateRangePreset}
            />
          }
        />

        {/* ================================================================== */}
        {/* Statistics Overview - Tailwind UI Stats pattern */}
        {/* Mobile: 2 cols, Tablet: 3 cols, Desktop: 6 cols */}
        {/* ================================================================== */}
        <section>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {allStats.map((stat) => (
              <BentoStatCard key={stat.title} {...stat} />
            ))}
          </dl>
        </section>

        {/* ================================================================== */}
        {/* Traffic Analytics Section */}
        {/* ================================================================== */}
        <section className="space-y-4">
          {/* Traffic trend chart - full width */}
          <LazyTrafficTrendChart
            data={trafficTrend?.points ?? []}
            granularity={granularity}
            loading={isTrafficLoading}
            overview={trafficOverview ?? undefined}
          />

          {/* Traffic ranking and node stats - 1:1 layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
};
