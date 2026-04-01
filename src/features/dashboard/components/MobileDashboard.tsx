/**
 * Mobile Dashboard Component
 * 3-layer information density design:
 *   Layer 1 — Health Pulse (hero traffic + domain status rows)
 *   Layer 2 — Traffic Analytics (chart + period summary)
 *   Layer 3 — Deep Dive (ranking + node stats in unified tabs)
 *
 * Rendered when useBreakpoint().isMobile === true.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import {
  Users,
  CreditCard,
  Server,
  GitFork,
  Activity,
  ArrowUp,
  ArrowDown,
  Trophy,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { cardStyles, getButtonClass } from '@/lib/ui-styles';
import { formatTrafficBytes } from '@/api/admin';
import type { UserDisplayInfo } from '@/api/auth';
import type {
  AdminDashboardResponse,
  TrafficOverview,
  TrafficTrend,
  TrafficRankingItem,
  NodeTrafficStatsItem,
} from '@/api/admin';
import type { DateRangeValue } from '@/components/admin';
import { getRankingColors } from '@/components/admin/TrafficRankingList';
import { getStatusColors } from '@/components/admin/NodeTrafficStats';
import { DateRangeFilter, getDisplayLabel } from '@/components/admin/DateRangeFilter';
import { LazyTrafficTrendChart } from '@/components/admin/LazyCharts';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
} from '@/components/common/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/common/Tabs';
import { ScrollArea } from '@/components/common/ScrollArea';
import { SmartTruncate } from '@/components/common/SmartTruncate';
import type { TimeGranularity } from '@/features/admin-traffic';

// ============================================================================
// Types
// ============================================================================

export interface MobileDashboardProps {
  user: UserDisplayInfo;
  dashboard: AdminDashboardResponse | null;
  dashboardLoading: boolean;
  dateRangeValue: DateRangeValue;
  onDateRangeChange: (value: DateRangeValue) => void;
  trafficOverview: TrafficOverview | null;
  trafficTrend: TrafficTrend | null;
  userRanking: TrafficRankingItem[];
  subscriptionRanking: TrafficRankingItem[];
  isTrafficLoading: boolean;
  granularity: TimeGranularity;
  nodeTrafficItems: NodeTrafficStatsItem[];
  nodeTrafficPagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  isNodeTrafficLoading: boolean;
  onNodeTrafficPageChange: (page: number) => void;
}

// ============================================================================
// Layer 1a: Header
// ============================================================================

function MobileHeader({
  user,
  dateRangeValue,
  onDateRangeChange,
}: {
  user: UserDisplayInfo;
  dateRangeValue: DateRangeValue;
  onDateRangeChange: (v: DateRangeValue) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const displayLabel = getDisplayLabel(dateRangeValue, t);

  return (
    <div className="flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <h1 className="text-lg font-bold text-foreground truncate">
          {t('admin.dashboard.welcomeBack', {
            name: user.displayName || user.email?.split('@')[0],
          })}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">{t('admin.dashboard.title')}</p>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex items-center gap-1.5 shrink-0 ml-3',
              'rounded-full px-3 h-8',
              'bg-muted/60 ring-1 ring-border/50',
              'text-xs font-medium text-muted-foreground',
              'active:scale-[0.97] transition-all',
              'touch-target'
            )}
          >
            <Calendar className="size-3.5" />
            <span className="max-w-[90px] truncate">{displayLabel}</span>
          </button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t('filter.dateRange.label')}</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <DateRangeFilter
              variant="inline"
              value={dateRangeValue}
              onChange={(v) => {
                onDateRangeChange(v);
                setOpen(false);
              }}
              showLabel={false}
            />
          </SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ============================================================================
// Layer 1b: Today Traffic Hero
// ============================================================================

function TodayTrafficHero({
  dashboard,
  loading,
}: {
  dashboard: AdminDashboardResponse | null;
  loading: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className={cn(cardStyles, 'p-4 text-center')}>
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        {t('common.time.today')}
      </span>

      {loading ? (
        <div className="flex justify-center mt-2">
          <div className="h-9 w-24 rounded-lg bg-muted animate-pulse motion-reduce:animate-none" />
        </div>
      ) : (
        <p className="text-3xl font-bold tabular-nums text-foreground mt-1 leading-tight">
          {dashboard ? formatTrafficBytes(dashboard.trafficToday.total) : '-'}
        </p>
      )}

      <div className="flex items-center justify-center gap-4 mt-2">
        <div className="flex items-center gap-1 whitespace-nowrap">
          <ArrowUp className="size-3 text-chart-upload shrink-0" strokeWidth={2} />
          {loading ? (
            <div className="h-4 w-12 rounded bg-muted animate-pulse motion-reduce:animate-none" />
          ) : (
            <span className="text-xs font-semibold tabular-nums text-foreground">
              {dashboard ? formatTrafficBytes(dashboard.trafficToday.upload) : '-'}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">{t('admin.stats.trafficUpload')}</span>
        </div>
        <div className="w-px h-3 bg-border shrink-0" />
        <div className="flex items-center gap-1 whitespace-nowrap">
          <ArrowDown className="size-3 text-chart-download shrink-0" strokeWidth={2} />
          {loading ? (
            <div className="h-4 w-12 rounded bg-muted animate-pulse motion-reduce:animate-none" />
          ) : (
            <span className="text-xs font-semibold tabular-nums text-foreground">
              {dashboard ? formatTrafficBytes(dashboard.trafficToday.download) : '-'}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">{t('admin.stats.trafficDownload')}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Layer 1c: Domain Health Rows
// ============================================================================

interface DomainRow {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  secondary?: React.ReactNode;
  href: string;
}

function DomainHealthRows({
  dashboard,
  loading,
}: {
  dashboard: AdminDashboardResponse | null;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Build secondary indicators
  const usersSecondary = (() => {
    if (!dashboard) return null;
    if (dashboard.users.newToday > 0) {
      return (
        <span className="text-[10px] text-success font-medium">
          {t('admin.stats.newToday', { count: dashboard.users.newToday })}
        </span>
      );
    }
    if (dashboard.users.newThisWeek > 0) {
      return (
        <span className="text-[10px] text-muted-foreground">
          {t('admin.stats.newThisWeek', { count: dashboard.users.newThisWeek })}
        </span>
      );
    }
    return null;
  })();

  const subsSecondary = (() => {
    if (!dashboard) return null;
    const parts: React.ReactNode[] = [];
    const { expired, suspended, pendingPayment, expiringIn7Days } = dashboard.subscriptions;

    if (expiringIn7Days > 0) {
      parts.push(
        <span key="exp" className="text-[10px] text-warning font-medium">
          {t('admin.stats.expiringIn7d', { count: expiringIn7Days })}
        </span>
      );
    }
    if (suspended > 0) {
      parts.push(
        <span key="sus" className="text-[10px] text-destructive font-medium">
          {t('admin.stats.suspended', { count: suspended })}
        </span>
      );
    }
    if (expired > 0) {
      parts.push(
        <span key="exp2" className="text-[10px] text-muted-foreground">
          {t('admin.stats.expired', { count: expired })}
        </span>
      );
    }
    if (pendingPayment > 0) {
      parts.push(
        <span key="pay" className="text-[10px] text-warning font-medium">
          {t('admin.stats.pendingPayment', { count: pendingPayment })}
        </span>
      );
    }

    if (parts.length === 0) return null;
    return <div className="flex items-center gap-1.5">{parts}</div>;
  })();

  const nodesSecondary = (() => {
    if (!dashboard) return null;
    return (
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <span className="size-1.5 rounded-full bg-status-online" />
          <span className="tabular-nums">{dashboard.nodes.online}</span>
        </span>
        <span className="flex items-center gap-0.5">
          <span className="size-1.5 rounded-full bg-status-offline" />
          <span className="tabular-nums">{dashboard.nodes.offline}</span>
        </span>
      </div>
    );
  })();

  const forwardSecondary = (() => {
    if (!dashboard) return null;
    return (
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
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

  const rows: DomainRow[] = [
    {
      icon: Users,
      iconBg: 'bg-info/10',
      iconColor: 'text-info',
      label: t('admin.stats.totalUsers'),
      value: dashboard ? dashboard.users.total.toLocaleString() : '-',
      secondary: usersSecondary,
      href: '/admin/users',
    },
    {
      icon: CreditCard,
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
      label: t('admin.stats.totalSubscriptions'),
      value: dashboard ? dashboard.subscriptions.active.toLocaleString() : '-',
      secondary: subsSecondary,
      href: '/admin/subscriptions',
    },
    {
      icon: Server,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      label: t('admin.stats.totalNodes'),
      value: dashboard ? dashboard.nodes.total.toLocaleString() : '-',
      secondary: nodesSecondary,
      href: '/admin/nodes',
    },
    {
      icon: GitFork,
      iconBg: 'bg-relay/10',
      iconColor: 'text-relay',
      label: t('admin.stats.totalForwardRules'),
      value: dashboard ? dashboard.forward.totalRules.toLocaleString() : '-',
      secondary: forwardSecondary,
      href: '/admin/forward-rules',
    },
  ];

  if (loading) {
    return (
      <div className={cn(cardStyles, 'divide-y divide-border overflow-hidden')}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3.5 animate-pulse">
            <div className="size-8 rounded-lg bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-16 rounded bg-muted" />
            </div>
            <div className="h-5 w-8 rounded bg-muted" />
            <div className="size-3.5" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn(cardStyles, 'divide-y divide-border overflow-hidden')}>
      {rows.map((row) => {
        const Icon = row.icon;
        return (
          <button
            key={row.label}
            type="button"
            onClick={() => navigate(row.href)}
            className={cn(
              'flex items-center gap-3 p-3.5 w-full text-left',
              'active:bg-accent/50 transition-colors duration-150',
              'touch-target group'
            )}
          >
            <div
              className={cn(
                'size-8 rounded-lg flex items-center justify-center',
                'ring-1 ring-inset ring-border/50',
                row.iconBg
              )}
            >
              <Icon className={cn('size-4', row.iconColor)} strokeWidth={1.5} />
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-muted-foreground">{row.label}</span>
              {row.secondary && <div className="mt-0.5">{row.secondary}</div>}
            </div>

            <span className="text-lg font-bold tabular-nums text-foreground">
              {row.value}
            </span>

            <ChevronRight
              className="size-3.5 text-muted-foreground/40 shrink-0 transition-colors group-active:text-primary"
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Layer 3: Deep Dive — Ranking + Node Traffic (Unified Tabs)
// ============================================================================

function DeepDiveSection({
  userRanking,
  subscriptionRanking,
  isTrafficLoading,
  nodeTrafficItems,
  nodeTrafficPagination,
  isNodeTrafficLoading,
  onNodeTrafficPageChange,
}: {
  userRanking: TrafficRankingItem[];
  subscriptionRanking: TrafficRankingItem[];
  isTrafficLoading: boolean;
  nodeTrafficItems: NodeTrafficStatsItem[];
  nodeTrafficPagination: { page: number; pageSize: number; total: number };
  isNodeTrafficLoading: boolean;
  onNodeTrafficPageChange: (page: number) => void;
}) {
  const { t } = useTranslation();
  const totalPages = Math.ceil(
    nodeTrafficPagination.total / nodeTrafficPagination.pageSize
  );

  return (
    <div className={cn(cardStyles, 'overflow-hidden')}>
      <Tabs defaultValue="userRanking" className="w-full">
        <div className="px-3 pt-3 pb-2">
          <TabsList className="h-8 w-full">
            <TabsTrigger value="userRanking" className="text-[11px] flex-1">
              {t('admin.traffic.userRanking')}
            </TabsTrigger>
            <TabsTrigger value="subscriptionRanking" className="text-[11px] flex-1">
              {t('admin.traffic.subscriptionRanking')}
            </TabsTrigger>
            <TabsTrigger value="nodeTraffic" className="text-[11px] flex-1">
              {t('admin.traffic.nodeStats')}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* User Ranking */}
        <TabsContent value="userRanking" className="px-3 pb-3">
          {isTrafficLoading ? (
            <ListSkeleton />
          ) : userRanking.length === 0 ? (
            <EmptyState icon={Trophy} message={t('admin.traffic.noUserData')} />
          ) : (
            <ScrollArea className="max-h-[360px]">
              <div className="space-y-1.5 pr-2">
                {userRanking.map((item) => (
                  <RankingRow key={item.id} item={item} />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* Subscription Ranking */}
        <TabsContent value="subscriptionRanking" className="px-3 pb-3">
          {isTrafficLoading ? (
            <ListSkeleton />
          ) : subscriptionRanking.length === 0 ? (
            <EmptyState icon={Trophy} message={t('admin.traffic.noSubscriptionData')} />
          ) : (
            <ScrollArea className="max-h-[360px]">
              <div className="space-y-1.5 pr-2">
                {subscriptionRanking.map((item) => (
                  <RankingRow key={item.id} item={item} />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* Node Traffic Stats */}
        <TabsContent value="nodeTraffic" className="px-3 pb-3">
          {isNodeTrafficLoading ? (
            <ListSkeleton />
          ) : nodeTrafficItems.length === 0 ? (
            <EmptyState icon={Server} message={t('admin.traffic.noNodeData')} />
          ) : (
            <>
              <ScrollArea className="max-h-[360px]">
                <div className="space-y-1.5 pr-2">
                  {nodeTrafficItems.map((item) => (
                    <NodeRow key={item.nodeId} item={item} />
                  ))}
                </div>
              </ScrollArea>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-border">
                  <span className="text-[11px] text-muted-foreground">
                    {t('admin.traffic.totalNodes', { count: nodeTrafficPagination.total })}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onNodeTrafficPageChange(nodeTrafficPagination.page - 1)}
                      disabled={nodeTrafficPagination.page <= 1}
                      className={cn(getButtonClass('outline', 'sm'), 'text-xs touch-target')}
                    >
                      {t('common.actions.previous')}
                    </button>
                    <span className="text-[11px] text-muted-foreground px-1">
                      {nodeTrafficPagination.page}/{totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => onNodeTrafficPageChange(nodeTrafficPagination.page + 1)}
                      disabled={nodeTrafficPagination.page >= totalPages}
                      className={cn(getButtonClass('outline', 'sm'), 'text-xs touch-target')}
                    >
                      {t('common.actions.next')}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// Shared Sub-components
// ============================================================================

function RankingRow({ item }: { item: TrafficRankingItem }) {
  const colors = getRankingColors(item.rank);
  const isTopThree = item.rank <= 3;

  return (
    <div className={cn('rounded-lg border p-2.5 bg-card', colors.border)}>
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex items-center justify-center min-w-6 h-6 rounded-md border text-[10px]',
            colors.bg, colors.text, colors.border,
            isTopThree && 'font-bold'
          )}
        >
          {isTopThree ? (
            <Trophy className="size-3" strokeWidth={2} />
          ) : (
            <span className="font-semibold">#{item.rank}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <SmartTruncate text={item.name} className="text-xs font-semibold text-foreground" />
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="flex items-center gap-0.5">
            <ArrowUp className="size-2.5 text-chart-upload" strokeWidth={2} />
            <span className="font-medium tabular-nums">{formatTrafficBytes(item.upload)}</span>
          </span>
          <span className="flex items-center gap-0.5">
            <ArrowDown className="size-2.5 text-chart-download" strokeWidth={2} />
            <span className="font-medium tabular-nums">{formatTrafficBytes(item.download)}</span>
          </span>
          <span className="flex items-center gap-0.5">
            <Activity className="size-2.5 text-primary" strokeWidth={2} />
            <span className="font-bold tabular-nums">{formatTrafficBytes(item.total)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function NodeRow({ item }: { item: NodeTrafficStatsItem }) {
  const colors = getStatusColors(item.status);

  return (
    <div className={cn('rounded-lg border p-2.5 bg-card', colors.border)}>
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'relative flex items-center justify-center min-w-6 h-6 rounded-md border',
            colors.bg, colors.text, colors.border
          )}
        >
          <Server className="size-3" strokeWidth={1.5} />
          <div className={cn(
            'absolute -top-0.5 -right-0.5 size-1.5 rounded-full border border-card',
            colors.dot
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <SmartTruncate text={item.nodeName} className="text-xs font-semibold text-foreground" />
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="flex items-center gap-0.5">
            <ArrowUp className="size-2.5 text-chart-upload" strokeWidth={2} />
            <span className="font-medium tabular-nums">{formatTrafficBytes(item.upload)}</span>
          </span>
          <span className="flex items-center gap-0.5">
            <ArrowDown className="size-2.5 text-chart-download" strokeWidth={2} />
            <span className="font-medium tabular-nums">{formatTrafficBytes(item.download)}</span>
          </span>
          <span className="flex items-center gap-0.5">
            <Activity className="size-2.5 text-primary" strokeWidth={2} />
            <span className="font-bold tabular-nums">{formatTrafficBytes(item.total)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-2.5 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-muted" />
            <div className="flex-1">
              <div className="h-3 w-20 rounded bg-muted" />
            </div>
            <div className="h-3 w-24 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Icon className="size-10 text-muted-foreground/50 mb-2" strokeWidth={1.5} />
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function MobileDashboard({
  user,
  dashboard,
  dashboardLoading,
  dateRangeValue,
  onDateRangeChange,
  trafficOverview,
  trafficTrend,
  userRanking,
  subscriptionRanking,
  isTrafficLoading,
  granularity,
  nodeTrafficItems,
  nodeTrafficPagination,
  isNodeTrafficLoading,
  onNodeTrafficPageChange,
}: MobileDashboardProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 px-4 py-4 pb-safe">
      {/* ── Layer 1: Health Pulse ── */}

      {/* 1a. Header */}
      <MobileHeader
        user={user}
        dateRangeValue={dateRangeValue}
        onDateRangeChange={onDateRangeChange}
      />

      {/* 1b. Hero — Today's Traffic */}
      <TodayTrafficHero dashboard={dashboard} loading={dashboardLoading} />

      {/* 1c. Domain Health Rows */}
      <section aria-labelledby="mobile-domain-health">
        <h2 id="mobile-domain-health" className="sr-only">
          {t('admin.dashboard.platformStats')}
        </h2>
        <DomainHealthRows dashboard={dashboard} loading={dashboardLoading} />
      </section>

      {/* ── Layer 2: Traffic Analytics ── */}
      <section aria-labelledby="mobile-traffic-chart">
        <h2 id="mobile-traffic-chart" className="sr-only">
          {t('admin.dashboard.trafficAnalytics')}
        </h2>
        <LazyTrafficTrendChart
          data={trafficTrend?.points ?? []}
          granularity={granularity}
          loading={isTrafficLoading}
          trafficOverview={trafficOverview}
          trafficLoading={isTrafficLoading}
        />
      </section>

      {/* ── Layer 3: Deep Dive ── */}
      <section aria-labelledby="mobile-deep-dive">
        <h2 id="mobile-deep-dive" className="sr-only">
          {t('admin.traffic.ranking')}
        </h2>
        <DeepDiveSection
          userRanking={userRanking}
          subscriptionRanking={subscriptionRanking}
          isTrafficLoading={isTrafficLoading}
          nodeTrafficItems={nodeTrafficItems}
          nodeTrafficPagination={nodeTrafficPagination}
          isNodeTrafficLoading={isNodeTrafficLoading}
          onNodeTrafficPageChange={onNodeTrafficPageChange}
        />
      </section>
    </div>
  );
}
