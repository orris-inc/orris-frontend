/**
 * Admin Dashboard - Refined Business Style
 * Uses real API data with traffic analytics
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { usePageTitle } from '@/shared/hooks';
import { useBreakpoint, useVersionInfo } from '@/hooks';
import {
  useAdminTrafficStats,
  useNodeTrafficStats,
  useDashboardStats,
  getDateRangeFromPreset,
  detectGranularity,
  type DateRangePreset,
} from '@/features/admin-traffic';
import {
  DateRangeSelector,
  LazyTrafficTrendChart,
  TrafficRankingList,
  NodeTrafficStats,
} from '@/components/admin';
import { MobileAdminDashboard } from '@/components/mobile/admin';
import {
  Users,
  CreditCard,
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  Server,
  Activity,
} from 'lucide-react';
import { formatTrafficBytes } from '@/api/admin';
import { Separator } from '@/components/common/Separator';

// ============ Stats Card Component ============
// Uses container queries for component-level responsiveness
interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  loading?: boolean;
}

const StatsCard = ({
  title,
  value,
  icon,
  iconBg,
  iconColor,
  loading,
}: StatsCardProps) => {
  return (
    <div className="@container group relative overflow-hidden bg-card rounded-lg border border-border hover:bg-accent/30 transition-colors duration-150">
      {/* Responsive padding: compact by default, larger when container allows */}
      <div className="relative z-10 flex items-center gap-1.5 @[120px]:gap-2 px-2 py-1.5 @[120px]:px-2.5 @[120px]:py-2 @[180px]:px-3">
        {/* Icon: scales with container */}
        <div className={`${iconBg} p-1 @[120px]:p-1.5 @[180px]:p-2 rounded-md shrink-0`}>
          <div className={`${iconColor} [&>svg]:size-3.5 @[120px]:[&>svg]:size-4 @[180px]:[&>svg]:size-5`}>
            {icon}
          </div>
        </div>
        {/* Content area */}
        <div className="min-w-0 flex-1">
          <div className="text-xs @[120px]:text-sm @[180px]:text-base font-semibold text-foreground tracking-tight tabular-nums truncate leading-tight">
            {loading ? (
              <div className="h-3 @[120px]:h-4 w-8 @[120px]:w-10 bg-muted rounded animate-pulse" />
            ) : (
              value
            )}
          </div>
          <div className="text-[9px] @[120px]:text-[10px] @[180px]:text-xs font-medium text-muted-foreground truncate leading-tight">
            {title}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ Quick Action Card ============
// Uses container queries for component-level responsiveness
interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  onClick: () => void;
}

const QuickActionCard = ({
  title,
  icon,
  iconBg,
  iconColor,
  onClick,
}: QuickActionCardProps) => {
  return (
    <button
      onClick={onClick}
      className="@container group w-full text-left rounded-lg overflow-hidden relative bg-card border border-border hover:bg-accent/30 hover:border-primary/30 transition-colors duration-150 cursor-pointer"
    >
      {/* Responsive padding and layout */}
      <div className="relative z-10 flex items-center gap-2 @[200px]:gap-2.5 px-2.5 py-2 @[200px]:px-3 @[200px]:py-2.5">
        <div
          className={`${iconBg} p-1.5 @[200px]:p-2 rounded-md @[200px]:rounded-lg group-hover:scale-105 transition-transform duration-150 shrink-0`}
        >
          <div className={`${iconColor} [&>svg]:size-4 @[200px]:[&>svg]:size-5`}>
            {icon}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-xs @[200px]:text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-150 truncate">
            {title}
          </h3>
        </div>

        <ArrowUpRight className="size-3.5 @[200px]:size-4 text-muted-foreground group-hover:text-primary transition-colors duration-150 shrink-0" />
      </div>
    </button>
  );
};

// ============ System Status ============
interface SystemStatusProps {
  label: string;
  status: 'online' | 'warning' | 'offline';
  value: string;
  icon: React.ReactNode;
}

const SystemStatus = ({ label, status, value, icon }: SystemStatusProps) => {
  const statusConfig = {
    online: {
      dot: 'bg-status-online',
      text: 'text-success',
      bg: 'bg-success-muted',
      iconColor: 'text-success',
      pulse: true,
    },
    warning: {
      dot: 'bg-status-warning',
      text: 'text-warning',
      bg: 'bg-warning-muted',
      iconColor: 'text-warning',
      pulse: true,
    },
    offline: {
      dot: 'bg-status-offline',
      text: 'text-destructive',
      bg: 'bg-destructive/10',
      iconColor: 'text-destructive',
      pulse: false,
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0 group hover:bg-accent/30 -mx-2 px-2 rounded transition-colors duration-150">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-md ${config.bg}`}>
          <div className={config.iconColor}>{icon}</div>
        </div>
        <span className="text-sm font-medium text-foreground">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${config.text} ${config.bg}`}>
          {value}
        </span>
        <div className="relative flex items-center justify-center">
          <div className={`size-2 rounded-full ${config.dot}`} />
          {config.pulse && (
            <div
              className={`absolute inset-0 rounded-full ${config.dot} animate-ping opacity-30`}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ============ Main Page Component ============
export const NewAdminDashboardPage = () => {
  const { t } = useTranslation();
  usePageTitle(t('admin.dashboard.title'));

  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const { serverVersion, clientVersion } = useVersionInfo();
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

  // Mobile view - optimized for touch interactions
  if (isMobile) {
    return (
      <AdminLayout>
        <MobileAdminDashboard
          userName={user.displayName || user.email?.split('@')[0]}
          serverVersion={serverVersion ?? undefined}
          clientVersion={clientVersion}
          stats={stats}
          trafficOverview={trafficOverview ?? undefined}
          trafficTrend={trafficTrend ?? undefined}
          dateRangePreset={dateRangePreset}
          onDateRangeChange={setDateRangePreset}
          granularity={granularity}
          loading={loading}
          trafficLoading={isTrafficLoading}
        />
      </AdminLayout>
    );
  }

  // Combined stats cards - basic stats + traffic stats in one row
  const statsCards = [
    {
      title: t('admin.stats.totalUsers'),
      value: stats.totalUsers.toLocaleString(),
      icon: <Users className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-info-muted',
      iconColor: 'text-info',
      loading,
    },
    {
      title: t('admin.stats.totalSubscriptions'),
      value: stats.activeSubscriptions.toLocaleString(),
      icon: <CreditCard className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-success-muted',
      iconColor: 'text-success',
      loading,
    },
    {
      title: t('admin.stats.totalNodes'),
      value: stats.totalNodes.toLocaleString(),
      icon: <Server className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      loading,
    },
    {
      title: t('admin.stats.onlineNodes'),
      value: stats.activeNodes.toLocaleString(),
      icon: <Activity className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-warning-muted',
      iconColor: 'text-warning',
      loading,
    },
    {
      title: t('admin.stats.totalUpload'),
      value: trafficOverview ? formatTrafficBytes(trafficOverview.totalUpload) : '-',
      icon: <ArrowUp className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-chart-upload/10',
      iconColor: 'text-chart-upload',
      loading: isTrafficLoading,
    },
    {
      title: t('admin.stats.totalDownload'),
      value: trafficOverview ? formatTrafficBytes(trafficOverview.totalDownload) : '-',
      icon: <ArrowDown className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-chart-download/10',
      iconColor: 'text-chart-download',
      loading: isTrafficLoading,
    },
    {
      title: t('admin.stats.totalTraffic'),
      value: trafficOverview ? formatTrafficBytes(trafficOverview.totalTraffic) : '-',
      icon: <Activity className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent',
      loading: isTrafficLoading,
    },
    {
      title: t('admin.stats.activeUsers'),
      value: trafficOverview ? trafficOverview.activeUsers.toLocaleString() : '-',
      icon: <Users className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-destructive/10',
      iconColor: 'text-destructive',
      loading: isTrafficLoading,
    },
  ];

  const quickActions = [
    {
      title: t('admin.quickAccess.users'),
      description: t('admin.quickAccess.usersDesc'),
      icon: <Users className="size-4 sm:size-5" strokeWidth={1.5} />,
      iconBg: 'bg-info-muted',
      iconColor: 'text-info',
      onClick: () => navigate('/admin/users'),
    },
    {
      title: t('admin.quickAccess.subscriptions'),
      description: t('admin.quickAccess.subscriptionsDesc'),
      icon: <CreditCard className="size-4 sm:size-5" strokeWidth={1.5} />,
      iconBg: 'bg-success-muted',
      iconColor: 'text-success',
      onClick: () => navigate('/admin/subscriptions'),
    },
    {
      title: t('admin.quickAccess.nodes'),
      description: t('admin.quickAccess.nodesDesc'),
      icon: <Server className="size-4 sm:size-5" strokeWidth={1.5} />,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      onClick: () => navigate('/admin/nodes'),
    },
  ];

  const nodeOnlineRate =
    stats.totalNodes > 0
      ? Math.round((stats.activeNodes / stats.totalNodes) * 100)
      : 0;

  const systemStatuses = [
    {
      label: t('admin.systemStatus.nodeOnlineRate'),
      status:
        nodeOnlineRate >= 90
          ? ('online' as const)
          : nodeOnlineRate >= 70
            ? ('warning' as const)
            : ('offline' as const),
      value: `${nodeOnlineRate}%`,
      icon: <Server className="size-4" strokeWidth={1.5} />,
    },
    {
      label: t('admin.systemStatus.activeNodes'),
      status: stats.activeNodes > 0 ? ('online' as const) : ('offline' as const),
      value: t('admin.systemStatus.count', { count: stats.activeNodes }),
      icon: <Activity className="size-4" strokeWidth={1.5} />,
    },
  ];

  return (
    <AdminLayout>
      <div className="py-4 sm:py-6">
        {/* Compact page header */}
        <header className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              {t('admin.dashboard.title')}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {t('admin.dashboard.welcomeBack', { name: user.displayName || user.email?.split('@')[0] })}
            </p>
          </div>
          <DateRangeSelector
            value={dateRangePreset}
            onChange={setDateRangePreset}
          />
        </header>

        {/* All statistics cards - responsive grid layout */}
        <section className="mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {statsCards.map((stat) => (
              <StatsCard key={stat.title} {...stat} />
            ))}
          </div>
        </section>

        {/* Traffic analytics section */}
        <section className="space-y-4">
          {/* Traffic trend chart */}
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

        <Separator className="my-4" />

        {/* Quick actions and system status - compact layout */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Left: Quick actions */}
            <div className="lg:col-span-3">
              <h2 className="text-sm font-semibold text-foreground mb-2">
                {t('admin.quickAccess.title')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {quickActions.map((action) => (
                  <QuickActionCard key={action.title} {...action} />
                ))}
              </div>
            </div>

            {/* Right: System status */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-2">
                {t('admin.systemStatus.title')}
              </h2>
              <div className="bg-card rounded-lg p-3 border border-border">
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 py-2"
                      >
                        <div className="size-7 bg-muted rounded-md animate-pulse" />
                        <div className="flex-1">
                          <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                        </div>
                        <div className="h-5 w-12 bg-muted rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    {systemStatuses.map((status) => (
                      <SystemStatus key={status.label} {...status} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

      </div>
    </AdminLayout>
  );
};
