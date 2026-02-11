/**
 * Dashboard Overview Strip
 *
 * 4 domain health cards (Users, Subscriptions, Nodes, Forward)
 * + compact "Today's Traffic" bar — all powered by GET /admin/dashboard.
 *
 * Each card surfaces a primary metric with a contextual secondary
 * indicator (growth, expiry warning, online/offline dots, agent status).
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import {
  Users,
  CreditCard,
  Server,
  GitFork,
  ArrowUp,
  ArrowDown,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { cardStyles } from '@/lib/ui-styles';
import { formatTrafficBytes } from '@/api/admin';
import type { AdminDashboardResponse } from '@/api/admin';

// ============================================================================
// Types
// ============================================================================

interface DashboardOverviewStripProps {
  dashboard: AdminDashboardResponse | null;
  dashboardLoading: boolean;
}

// ============================================================================
// Health Card
// ============================================================================

function HealthCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  secondary,
  loading,
  onClick,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  secondary?: React.ReactNode;
  loading: boolean;
  onClick?: () => void;
}) {
  const content = (
    <div className="p-3.5 lg:p-4">
      {/* Header: icon + label + chevron */}
      <div className="flex items-center gap-2 mb-2.5">
        <div className={cn('p-1.5 rounded-lg ring-1 ring-inset ring-border/50', iconBg)}>
          <Icon className={cn('size-3.5', iconColor)} strokeWidth={1.5} />
        </div>
        <span className="text-xs font-medium text-muted-foreground flex-1 truncate">
          {label}
        </span>
        {onClick && (
          <ChevronRight
            className="size-3.5 text-muted-foreground/40 shrink-0 transition-colors group-hover:text-primary"
            strokeWidth={1.5}
          />
        )}
      </div>

      {/* Primary metric */}
      {loading ? (
        <div className="h-7 w-14 bg-muted rounded animate-pulse motion-reduce:animate-none" />
      ) : (
        <div className="text-xl lg:text-2xl font-semibold tabular-nums text-foreground leading-none">
          {value}
        </div>
      )}

      {/* Secondary detail */}
      <div className="mt-1.5 min-h-[1.125rem]">
        {loading ? (
          <div className="h-3.5 w-20 bg-muted rounded animate-pulse motion-reduce:animate-none" />
        ) : (
          secondary
        )}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          cardStyles,
          'text-left w-full',
          'transition-all duration-150',
          'hover:ring-primary/30 hover:shadow-sm',
          'active:scale-[0.98]',
          'group cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        )}
      >
        {content}
      </button>
    );
  }

  return <div className={cardStyles}>{content}</div>;
}

// ============================================================================
// Traffic Metric Cell (shared between today / period rows)
// ============================================================================

interface TrafficMetricItem {
  key: string;
  icon: React.ElementType;
  iconColor: string;
  label: string;
  value: string;
  loading: boolean;
}

function TrafficMetricCell({ item }: { item: TrafficMetricItem }) {
  const Icon = item.icon;
  return (
    <div className="flex items-center gap-2 bg-card px-3 py-2.5 min-h-[44px]">
      <Icon className={cn('size-3.5 shrink-0', item.iconColor)} strokeWidth={1.5} />
      <div className="min-w-0 flex-1">
        {item.loading ? (
          <div className="h-4 w-12 bg-muted rounded animate-pulse motion-reduce:animate-none" />
        ) : (
          <span className="text-sm font-semibold tabular-nums">{item.value}</span>
        )}
        <p className="text-[10px] font-medium text-muted-foreground truncate">
          {item.label}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function DashboardOverviewStrip({
  dashboard,
  dashboardLoading,
}: DashboardOverviewStripProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // -- Secondary indicators --------------------------------------------------

  const usersSecondary = (() => {
    if (!dashboard || dashboardLoading) return null;
    if (dashboard.users.newToday > 0) {
      return (
        <span className="text-xs text-success font-medium">
          {t('admin.stats.newToday', { count: dashboard.users.newToday })}
        </span>
      );
    }
    if (dashboard.users.newThisWeek > 0) {
      return (
        <span className="text-xs text-muted-foreground">
          {t('admin.stats.newThisWeek', { count: dashboard.users.newThisWeek })}
        </span>
      );
    }
    return null;
  })();

  const subsSecondary = (() => {
    if (!dashboard || dashboardLoading) return null;
    const { expired, suspended, pendingPayment, expiringIn7Days } = dashboard.subscriptions;

    const stateParts: string[] = [];
    if (expired > 0) stateParts.push(t('admin.stats.expired', { count: expired }));
    if (suspended > 0) stateParts.push(t('admin.stats.suspended', { count: suspended }));
    if (pendingPayment > 0) stateParts.push(t('admin.stats.pendingPayment', { count: pendingPayment }));

    const hasStates = stateParts.length > 0;
    const hasExpiring = expiringIn7Days > 0;

    if (!hasStates && !hasExpiring) return null;

    return (
      <div className="flex flex-col gap-0.5">
        {hasStates && (
          <span className="text-xs text-muted-foreground">
            {stateParts.join(' · ')}
          </span>
        )}
        {hasExpiring && (
          <span className="text-xs text-warning font-medium">
            {t('admin.stats.expiringIn7d', { count: expiringIn7Days })}
          </span>
        )}
      </div>
    );
  })();

  const nodesSecondary = (() => {
    if (!dashboard || dashboardLoading) return null;
    return (
      <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-status-online" />
          <span className="tabular-nums">{dashboard.nodes.online}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-status-offline" />
          <span className="tabular-nums">{dashboard.nodes.offline}</span>
        </span>
      </div>
    );
  })();

  const forwardSecondary = (() => {
    if (!dashboard || dashboardLoading) return null;
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span className="size-1.5 rounded-full bg-status-online" />
        <span>
          {t('admin.stats.agents', {
            online: dashboard.forward.onlineAgents,
            total: dashboard.forward.totalAgents,
          })}
        </span>
      </div>
    );
  })();

  // -- Today traffic metric items ---------------------------------------------

  const todayTrafficItems: TrafficMetricItem[] = [
    {
      key: 'today-upload',
      icon: ArrowUp,
      iconColor: 'text-chart-upload',
      label: t('admin.stats.trafficUpload'),
      value: dashboard ? formatTrafficBytes(dashboard.trafficToday.upload) : '-',
      loading: dashboardLoading,
    },
    {
      key: 'today-download',
      icon: ArrowDown,
      iconColor: 'text-chart-download',
      label: t('admin.stats.trafficDownload'),
      value: dashboard ? formatTrafficBytes(dashboard.trafficToday.download) : '-',
      loading: dashboardLoading,
    },
    {
      key: 'today-total',
      icon: Activity,
      iconColor: 'text-relay',
      label: t('admin.stats.trafficTotal'),
      value: dashboard ? formatTrafficBytes(dashboard.trafficToday.total) : '-',
      loading: dashboardLoading,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Domain Health Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <HealthCard
          icon={Users}
          iconBg="bg-info/10"
          iconColor="text-info"
          label={t('admin.stats.totalUsers')}
          value={dashboard ? dashboard.users.total.toLocaleString() : '-'}
          secondary={usersSecondary}
          loading={dashboardLoading}
          onClick={() => navigate('/admin/users')}
        />
        <HealthCard
          icon={CreditCard}
          iconBg="bg-success/10"
          iconColor="text-success"
          label={t('admin.stats.totalSubscriptions')}
          value={dashboard ? dashboard.subscriptions.active.toLocaleString() : '-'}
          secondary={subsSecondary}
          loading={dashboardLoading}
          onClick={() => navigate('/admin/subscriptions')}
        />
        <HealthCard
          icon={Server}
          iconBg="bg-primary/10"
          iconColor="text-primary"
          label={t('admin.stats.totalNodes')}
          value={dashboard ? dashboard.nodes.total.toLocaleString() : '-'}
          secondary={nodesSecondary}
          loading={dashboardLoading}
          onClick={() => navigate('/admin/nodes')}
        />
        <HealthCard
          icon={GitFork}
          iconBg="bg-relay/10"
          iconColor="text-relay"
          label={t('admin.stats.totalForwardRules')}
          value={dashboard ? dashboard.forward.totalRules.toLocaleString() : '-'}
          secondary={forwardSecondary}
          loading={dashboardLoading}
          onClick={() => navigate('/admin/forward-rules')}
        />
      </div>

      {/* Today's Traffic */}
      <div className={cn(cardStyles, 'overflow-hidden')}>
        <div className="px-3 pt-2.5 pb-1.5">
          <span className="text-[11px] font-medium text-muted-foreground">
            {t('common.time.today')}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-px bg-border">
          {todayTrafficItems.map((item) => (
            <TrafficMetricCell key={item.key} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
