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
  Settings,
  Monitor,
  Boxes,
  ArrowLeftRight,
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
}

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  onClick: () => void;
}

type StatusType = 'online' | 'warning' | 'offline';

interface SystemStatusProps {
  label: string;
  status: StatusType;
  value: string;
  icon: LucideIcon;
}

interface StatusConfig {
  dot: string;
  text: string;
  bg: string;
  iconColor: string;
  pulse: boolean;
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

  return (
    <div
      className={cn(
        '@container rounded-xl bg-card border border-border p-3 @[140px]:p-4',
        'transition-all duration-200 hover:shadow-md hover:border-border/80',
        className
      )}
    >
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
      </div>
    </div>
  );
};

// ============================================================================
// Quick Action Card Component
// ============================================================================

const QuickActionCard = ({
  title,
  description,
  icon: Icon,
  iconBg,
  iconColor,
  onClick,
}: QuickActionCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        '@container group w-full text-left rounded-xl overflow-hidden relative',
        'bg-card border border-border',
        'hover:bg-accent/30 hover:border-primary/30',
        'active:bg-accent/50',
        'transition-all duration-200',
        'cursor-pointer p-3 @sm:p-4',
        'min-h-[44px]' // Touch target
      )}
    >
      <div className="flex items-center gap-2 @sm:gap-3">
        <div
          className={cn(
            'p-2 @sm:p-2.5 rounded-lg @sm:rounded-xl',
            'group-hover:scale-105 transition-transform duration-200',
            'shrink-0',
            iconBg
          )}
        >
          <Icon className={cn('size-4 @sm:size-5', iconColor)} strokeWidth={1.5} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-xs @sm:text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-200 truncate">
            {title}
          </h3>
          <p className="text-[10px] @sm:text-xs text-muted-foreground truncate mt-0.5 hidden @sm:block">
            {description}
          </p>
        </div>

        <ArrowUpRight className="size-3.5 @sm:size-4 text-muted-foreground group-hover:text-primary transition-colors duration-200 shrink-0" />
      </div>
    </button>
  );
};

// ============================================================================
// System Status Component
// ============================================================================

const STATUS_CONFIG: Record<StatusType, StatusConfig> = {
  online: {
    dot: 'bg-status-online',
    text: 'text-success',
    bg: 'bg-success/10',
    iconColor: 'text-success',
    pulse: true,
  },
  warning: {
    dot: 'bg-status-warning',
    text: 'text-warning',
    bg: 'bg-warning/10',
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
} as const;

const SystemStatus = ({ label, status, value, icon: Icon }: SystemStatusProps) => {
  const config = STATUS_CONFIG[status];

  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0 group hover:bg-accent/30 -mx-3 px-3 rounded-lg transition-colors duration-150">
      <div className="flex items-center gap-2.5">
        <div className={cn('p-2 rounded-lg', config.bg)}>
          <Icon className={cn('size-4', config.iconColor)} strokeWidth={1.5} />
        </div>
        <span className="text-sm font-medium text-foreground">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', config.text, config.bg)}>
          {value}
        </span>
        <div className="relative flex items-center justify-center">
          <div className={cn('size-2.5 rounded-full', config.dot)} />
          {config.pulse && (
            <div
              className={cn('absolute inset-0 rounded-full animate-ping opacity-30', config.dot)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Section Header Component
// ============================================================================

interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
  className?: string;
}

const SectionHeader = ({ title, action, className }: SectionHeaderProps) => (
  <div className={cn('flex items-center justify-between mb-4', className)}>
    <h2 className="text-lg font-semibold text-foreground tracking-tight">{title}</h2>
    {action}
  </div>
);

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

  // Node online rate calculation
  const nodeOnlineRate =
    stats.totalNodes > 0
      ? Math.round((stats.activeNodes / stats.totalNodes) * 100)
      : 0;

  // Stats cards data - Primary metrics (large cards)
  const primaryStats = [
    {
      title: t('admin.stats.totalUsers'),
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      iconBg: 'bg-info/10',
      iconColor: 'text-info',
      loading,
    },
    {
      title: t('admin.stats.totalSubscriptions'),
      value: stats.activeSubscriptions.toLocaleString(),
      icon: CreditCard,
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
      loading,
    },
  ];

  // Secondary stats - Nodes and traffic
  const secondaryStats = [
    {
      title: t('admin.stats.totalNodes'),
      value: stats.totalNodes.toLocaleString(),
      icon: Server,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      loading,
    },
    {
      title: t('admin.stats.onlineNodes'),
      value: stats.activeNodes.toLocaleString(),
      icon: Activity,
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
      loading,
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

  // Quick actions data
  const quickActions = [
    {
      title: t('admin.quickAccess.users'),
      description: t('admin.quickAccess.usersDesc'),
      icon: Users,
      iconBg: 'bg-info/10',
      iconColor: 'text-info',
      onClick: () => navigate('/admin/users'),
    },
    {
      title: t('admin.quickAccess.subscriptions'),
      description: t('admin.quickAccess.subscriptionsDesc'),
      icon: CreditCard,
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
      onClick: () => navigate('/admin/subscriptions'),
    },
    {
      title: t('admin.quickAccess.nodes'),
      description: t('admin.quickAccess.nodesDesc'),
      icon: Server,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      onClick: () => navigate('/admin/nodes'),
    },
    {
      title: t('admin.quickAccess.liveMonitor'),
      description: t('admin.quickAccess.liveMonitorDesc'),
      icon: Monitor,
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
      onClick: () => navigate('/admin/monitor'),
    },
    {
      title: t('admin.quickAccess.forwardRules'),
      description: t('admin.quickAccess.forwardRulesDesc'),
      icon: ArrowLeftRight,
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent-foreground',
      onClick: () => navigate('/admin/forward-rules'),
    },
    {
      title: t('admin.quickAccess.resourceGroups'),
      description: t('admin.quickAccess.resourceGroupsDesc'),
      icon: Boxes,
      iconBg: 'bg-muted',
      iconColor: 'text-muted-foreground',
      onClick: () => navigate('/admin/resource-groups'),
    },
  ];

  // System status data
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
      icon: Server,
    },
    {
      label: t('admin.systemStatus.activeNodes'),
      status: stats.activeNodes > 0 ? ('online' as const) : ('offline' as const),
      value: t('admin.systemStatus.count', { count: stats.activeNodes }),
      icon: Activity,
    },
    {
      label: t('admin.systemStatus.activeUsers'),
      status: (trafficOverview?.activeUsers ?? 0) > 0 ? ('online' as const) : ('offline' as const),
      value: t('admin.systemStatus.count', { count: trafficOverview?.activeUsers ?? 0 }),
      icon: Users,
    },
  ];

  return (
    <AdminLayout>
      <div className="py-4 lg:py-6 space-y-4 sm:space-y-6 pb-safe">
        {/* ================================================================== */}
        {/* Page Header */}
        {/* ================================================================== */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
              {t('admin.dashboard.title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('admin.dashboard.welcomeBack', { name: user.displayName || user.email?.split('@')[0] })}
            </p>
          </div>
          <DateRangeSelector
            value={dateRangePreset}
            onChange={setDateRangePreset}
          />
        </header>

        {/* ================================================================== */}
        {/* Statistics Overview - Unified compact grid */}
        {/* ================================================================== */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {/* All stats in unified grid */}
            {[...primaryStats, ...secondaryStats].map((stat) => (
              <BentoStatCard key={stat.title} {...stat} />
            ))}
          </div>
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

        {/* ================================================================== */}
        {/* Quick Actions & System Status */}
        {/* ================================================================== */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Quick Actions - 2 columns on large screens */}
            <div className="lg:col-span-2">
              <SectionHeader title={t('admin.quickAccess.title')} />
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
                {quickActions.map((action) => (
                  <QuickActionCard key={action.title} {...action} />
                ))}
              </div>
            </div>

            {/* System Status - 1 column */}
            <div>
              <SectionHeader
                title={t('admin.systemStatus.title')}
                action={
                  <button
                    onClick={() => navigate('/admin/settings')}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <Settings className="size-3.5" />
                    {t('admin.systemStatus.settings')}
                  </button>
                }
              />
              <div className="bg-card rounded-xl p-4 border border-border">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 py-2"
                      >
                        <div className="size-8 bg-muted rounded-lg animate-pulse" />
                        <div className="flex-1">
                          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                        </div>
                        <div className="h-6 w-14 bg-muted rounded-full animate-pulse" />
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
