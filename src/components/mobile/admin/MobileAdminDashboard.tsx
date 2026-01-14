/**
 * Mobile Admin Dashboard Component
 *
 * A mobile-optimized version of the admin dashboard following iOS 26 Liquid Glass design.
 * Features:
 * - Horizontal scrolling stats cards
 * - Compact date range selector
 * - Simplified traffic overview
 * - iOS Settings-style quick actions
 * - Touch-friendly interactions
 */

import { useTranslation } from 'react-i18next';
import { useViewTransitionHandler } from '@/hooks/useViewTransition';
import {
  Users,
  CreditCard,
  Server,
  Activity,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  Settings,
  Monitor,
  Boxes,
  ArrowLeftRight,
  Cpu,
} from 'lucide-react';
import { MobileStatsScroller } from './MobileStatsScroller';
import { MobileGroupedList, MobileListItem } from './MobileGroupedList';
import { DateRangeSelector, LazyTrafficTrendChart } from '@/components/admin';
import { formatTrafficBytes, type TrafficTrendPoint } from '@/api/admin';
import { cn } from '@/lib/utils';
import type {
  DateRangePreset,
} from '@/features/admin-traffic';

// ============================================================================
// Types
// ============================================================================

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalNodes: number;
  activeNodes: number;
}

interface TrafficOverview {
  totalUpload: number;
  totalDownload: number;
  totalTraffic: number;
  activeUsers: number;
}

interface MobileAdminDashboardProps {
  /** User display name */
  userName?: string;
  /** Server version */
  serverVersion?: string;
  /** Client version */
  clientVersion?: string;
  /** Dashboard basic stats */
  stats: DashboardStats;
  /** Traffic overview data */
  trafficOverview?: TrafficOverview;
  /** Traffic trend data for chart */
  trafficTrend?: {
    points: TrafficTrendPoint[];
  };
  /** Current date range preset */
  dateRangePreset: DateRangePreset;
  /** Date range preset change handler */
  onDateRangeChange: (preset: DateRangePreset) => void;
  /** Granularity for chart display */
  granularity: 'hour' | 'day' | 'month';
  /** Loading state for basic stats */
  loading?: boolean;
  /** Loading state for traffic data */
  trafficLoading?: boolean;
}

// ============================================================================
// Quick Action Item Component
// ============================================================================

interface QuickActionItemProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle?: string;
  onClick: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

const QuickActionItem = ({
  icon,
  iconBg,
  title,
  subtitle,
  onClick,
  isFirst = false,
  isLast = false,
}: QuickActionItemProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex w-full items-center gap-3 px-4 py-3',
        'min-h-[52px]',
        isFirst && isLast && 'rounded-2xl',
        isFirst && !isLast && 'rounded-t-2xl',
        !isFirst && isLast && 'rounded-b-2xl',
        !isLast && 'border-b border-border/30',
        'cursor-pointer text-left',
        'transition-colors duration-150',
        'motion-reduce:transition-none',
        'active:bg-muted/80'
      )}
    >
      {/* Icon */}
      <span
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
          iconBg
        )}
      >
        {icon}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-foreground">
          {title}
        </span>
        {subtitle && (
          <span className="block text-sm text-muted-foreground truncate">
            {subtitle}
          </span>
        )}
      </div>

      {/* Chevron */}
      <ChevronRight
        className="h-5 w-5 flex-shrink-0 text-muted-foreground/50"
        aria-hidden="true"
      />
    </button>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const MobileAdminDashboard = ({
  userName,
  serverVersion,
  clientVersion,
  stats,
  trafficOverview,
  trafficTrend,
  dateRangePreset,
  onDateRangeChange,
  granularity,
  loading = false,
  trafficLoading = false,
}: MobileAdminDashboardProps) => {
  const { t } = useTranslation();
  const navigateWithTransition = useViewTransitionHandler();

  // Stats cards data
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
      loading: trafficLoading,
    },
    {
      title: t('admin.stats.totalDownload'),
      value: trafficOverview ? formatTrafficBytes(trafficOverview.totalDownload) : '-',
      icon: <ArrowDown className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-chart-download/10',
      iconColor: 'text-chart-download',
      loading: trafficLoading,
    },
  ];

  // Quick action items
  const quickActions = [
    {
      icon: <Users className="size-5 text-info" strokeWidth={1.5} />,
      iconBg: 'bg-info-muted',
      title: t('admin.quickAccess.users'),
      subtitle: t('admin.quickAccess.usersDesc'),
      path: '/admin/users',
    },
    {
      icon: <CreditCard className="size-5 text-success" strokeWidth={1.5} />,
      iconBg: 'bg-success-muted',
      title: t('admin.quickAccess.subscriptions'),
      subtitle: t('admin.quickAccess.subscriptionsDesc'),
      path: '/admin/subscriptions',
    },
    {
      icon: <Server className="size-5 text-primary" strokeWidth={1.5} />,
      iconBg: 'bg-primary/10',
      title: t('admin.quickAccess.nodeAgent'),
      subtitle: t('admin.quickAccess.nodeAgentDesc'),
      path: '/admin/nodes',
    },
    {
      icon: <Monitor className="size-5 text-warning" strokeWidth={1.5} />,
      iconBg: 'bg-warning-muted',
      title: t('admin.quickAccess.liveMonitor'),
      subtitle: t('admin.quickAccess.liveMonitorDesc'),
      path: '/admin/monitor',
    },
  ];

  // More management items
  const moreManagementItems = [
    {
      icon: <ArrowLeftRight className="size-5" strokeWidth={1.5} />,
      iconBg: 'bg-muted/60',
      title: t('admin.moreManagement.forwardRules'),
      path: '/admin/forward-rules',
    },
    {
      icon: <Cpu className="size-5" strokeWidth={1.5} />,
      iconBg: 'bg-muted/60',
      title: t('admin.moreManagement.forwardAgent'),
      path: '/admin/forward-agents',
    },
    {
      icon: <Boxes className="size-5" strokeWidth={1.5} />,
      iconBg: 'bg-muted/60',
      title: t('admin.moreManagement.resourceGroups'),
      path: '/admin/resource-groups',
    },
    {
      icon: <Settings className="size-5" strokeWidth={1.5} />,
      iconBg: 'bg-muted/60',
      title: t('admin.moreManagement.systemSettings'),
      path: '/admin/settings',
    },
  ];

  return (
    <div className="pb-safe">
      {/* Header Section */}
      <header className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              {t('admin.dashboard.title')}
            </h1>
            {userName && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {t('admin.dashboard.welcomeBack', { name: userName })}
              </p>
            )}
          </div>
          <DateRangeSelector
            value={dateRangePreset}
            onChange={onDateRangeChange}
          />
        </div>
      </header>

      {/* Stats Cards - Horizontal Scroll */}
      <section className="mb-4">
        <MobileStatsScroller stats={statsCards} />
      </section>

      {/* Traffic Trend Chart */}
      <section className="px-4 mb-4">
        <LazyTrafficTrendChart
          data={trafficTrend?.points ?? []}
          granularity={granularity}
          loading={trafficLoading}
          overview={trafficOverview}
        />
      </section>

      {/* Quick Actions */}
      <section className="px-4 mb-4">
        <h2 className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2 px-0">
          {t('admin.quickAccess.title')}
        </h2>
        <div className="rounded-2xl overflow-hidden bg-card/60 backdrop-blur-sm shadow-sm shadow-black/5">
          {quickActions.map((action, index) => (
            <QuickActionItem
              key={action.path}
              icon={action.icon}
              iconBg={action.iconBg}
              title={action.title}
              subtitle={action.subtitle}
              onClick={() => navigateWithTransition(action.path)}
              isFirst={index === 0}
              isLast={index === quickActions.length - 1}
            />
          ))}
        </div>
      </section>

      {/* More Management */}
      <section className="px-4 mb-6">
        <MobileGroupedList title={t('admin.moreManagement.title')}>
          {moreManagementItems.map((item, index) => (
            <MobileListItem
              key={item.path}
              icon={item.icon}
              iconBg={item.iconBg}
              title={item.title}
              showChevron
              onClick={() => navigateWithTransition(item.path)}
              first={index === 0}
              last={index === moreManagementItems.length - 1}
            />
          ))}
        </MobileGroupedList>
      </section>

      {/* Version info */}
      {(serverVersion || clientVersion) && (
        <section className="px-4 mb-6">
          <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground/50">
            {serverVersion && (
              <span className="font-mono">{serverVersion}</span>
            )}
            {serverVersion && clientVersion && (
              <span>·</span>
            )}
            {clientVersion && (
              <span className="font-mono">{clientVersion}</span>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

MobileAdminDashboard.displayName = 'MobileAdminDashboard';
