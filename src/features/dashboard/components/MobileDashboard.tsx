/**
 * Mobile Dashboard Component
 * Modern SaaS admin style (Linear/Vercel/Stripe) — mobile-only.
 * Rendered when useBreakpoint().isMobile === true.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  CreditCard,
  Server,
  Activity,
  ArrowUp,
  ArrowDown,
  Trophy,
  ChevronDown,
  Calendar,
  UserCheck,
  GitFork,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { cardStyles, getButtonClass } from '@/lib/ui-styles';
import { formatTrafficBytes } from '@/api/admin';
import type { UserDisplayInfo } from '@/api/auth';
import type {
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
import type { TimeGranularity } from '@/features/admin-traffic';

// ============================================================================
// Types
// ============================================================================

export interface MobileDashboardProps {
  user: UserDisplayInfo;
  stats: {
    totalUsers: number;
    activeSubscriptions: number;
    totalNodes: number;
    activeNodes: number;
  };
  loading: boolean;
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
// Section 1: Header
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
      {/* Left: greeting */}
      <div className="min-w-0 flex-1">
        <h1 className="text-lg font-bold text-foreground truncate">
          {t('admin.dashboard.welcomeBack', {
            name: user.displayName || user.email?.split('@')[0],
          })}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">{t('admin.dashboard.title')}</p>
      </div>

      {/* Right: date filter pill */}
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
// Section 2: Platform Stats (2x2 grid)
// ============================================================================

interface StatItem {
  title: string;
  value: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  href: string;
}

function PlatformStatsGrid({
  stats,
  loading,
}: {
  stats: StatItem[];
  loading: boolean;
}) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn(cardStyles, 'p-4 animate-pulse')}>
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-muted" />
              <div className="h-6 w-10 rounded bg-muted" />
            </div>
            <div className="h-3 w-16 rounded bg-muted mt-2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <button
            key={stat.title}
            type="button"
            onClick={() => navigate(stat.href)}
            className={cn(
              cardStyles,
              'p-4 text-left w-full',
              'active:scale-[0.98] transition-all duration-150',
              'group touch-target'
            )}
          >
            <div className="flex items-center gap-2.5">
              <div className={cn('size-8 rounded-lg flex items-center justify-center ring-1 ring-inset ring-border/50', stat.iconBg)}>
                <Icon className={cn('size-4', stat.iconColor)} strokeWidth={1.5} />
              </div>
              <span className="text-xl font-bold tabular-nums text-foreground">{stat.value}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 truncate">{stat.title}</p>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Section 3b: Traffic Overview Meta (compact stats row)
// ============================================================================

function TrafficOverviewMeta({
  overview,
  loading,
}: {
  overview: TrafficOverview | null;
  loading: boolean;
}) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className={cn(cardStyles, 'p-3')}>
        <div className="grid grid-cols-3 gap-3 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="size-7 rounded-md bg-muted" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-8 rounded bg-muted" />
                <div className="h-2.5 w-12 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!overview) return null;

  const items = [
    {
      icon: UserCheck,
      value: overview.activeUsers.toLocaleString(),
      label: t('admin.stats.activeUsers'),
      color: 'text-info',
      bg: 'bg-info/10',
    },
    {
      icon: CreditCard,
      value: overview.activeSubscriptions.toLocaleString(),
      label: t('admin.stats.activeSubscriptions'),
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      icon: GitFork,
      value: overview.totalForwardRules.toLocaleString(),
      label: t('admin.stats.totalForwardRules'),
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
  ];

  return (
    <div className={cn(cardStyles, 'p-3')}>
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-2">
              <div className={cn('size-7 rounded-md flex items-center justify-center ring-1 ring-inset ring-border/50', item.bg)}>
                <Icon className={cn('size-3.5', item.color)} strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold tabular-nums text-foreground leading-tight">{item.value}</p>
                <p className="text-[10px] text-muted-foreground truncate leading-tight">{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Section 5: Traffic Ranking (Collapsible)
// ============================================================================

const collapsibleVariants = {
  hidden: { height: 0, opacity: 0 },
  visible: { height: 'auto', opacity: 1 },
};

const collapsibleTransition = {
  height: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const },
  opacity: { duration: 0.2, ease: 'easeOut' as const },
};

function TrafficRankingSection({
  userRanking,
  subscriptionRanking,
  isLoading,
}: {
  userRanking: TrafficRankingItem[];
  subscriptionRanking: TrafficRankingItem[];
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'w-full flex items-center justify-between',
          cardStyles,
          'p-4 active:scale-[0.98] transition-[transform,box-shadow] touch-target'
        )}
      >
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-rank-gold-muted flex items-center justify-center ring-1 ring-inset ring-border/50">
            <Trophy className="size-4 text-rank-gold" strokeWidth={1.5} />
          </div>
          <span className="text-sm font-semibold text-foreground">
            {t('admin.traffic.ranking')}
          </span>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          <ChevronDown className="size-4 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="ranking-content"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={collapsibleVariants}
            transition={collapsibleTransition}
            className="overflow-hidden"
          >
            <div className={cn('mt-2 overflow-hidden', cardStyles)}>
              <Tabs defaultValue="user" className="w-full">
                <div className="px-4 py-3 border-b border-border">
                  <TabsList className="h-8 w-full">
                    <TabsTrigger value="user" className="text-xs flex-1">
                      {t('admin.traffic.userRanking')}
                    </TabsTrigger>
                    <TabsTrigger value="subscription" className="text-xs flex-1">
                      {t('admin.traffic.subscriptionRanking')}
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="user" className="px-3 py-3">
                  {isLoading ? (
                    <RankingListSkeleton />
                  ) : userRanking.length === 0 ? (
                    <RankingEmptyState message={t('admin.traffic.noUserData')} />
                  ) : (
                    <ScrollArea className="max-h-[320px]">
                      <div className="space-y-2 pr-2">
                        {userRanking.map((item) => (
                          <MobileRankingItem key={item.id} item={item} />
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>

                <TabsContent value="subscription" className="px-3 py-3">
                  {isLoading ? (
                    <RankingListSkeleton />
                  ) : subscriptionRanking.length === 0 ? (
                    <RankingEmptyState message={t('admin.traffic.noSubscriptionData')} />
                  ) : (
                    <ScrollArea className="max-h-[320px]">
                      <div className="space-y-2 pr-2">
                        {subscriptionRanking.map((item) => (
                          <MobileRankingItem key={item.id} item={item} />
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileRankingItem({ item }: { item: TrafficRankingItem }) {
  const colors = getRankingColors(item.rank);
  const isTopThree = item.rank <= 3;

  return (
    <div className={cn('rounded-lg border p-3 bg-card', colors.border)}>
      <div className="flex items-center gap-2">
        {/* Rank badge */}
        <div
          className={cn(
            'flex items-center justify-center min-w-7 h-7 rounded-md border',
            colors.bg, colors.text, colors.border,
            isTopThree && 'font-bold'
          )}
        >
          {isTopThree ? (
            <Trophy className="size-3.5" strokeWidth={2} />
          ) : (
            <span className="text-[11px] font-semibold">#{item.rank}</span>
          )}
        </div>
        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
          <p className="text-[10px] text-muted-foreground truncate">{item.id}</p>
        </div>
      </div>
      {/* Full traffic data stacked */}
      <div className="mt-2 grid grid-cols-3 gap-1 text-[11px]">
        <div className="flex items-center gap-1">
          <ArrowUp className="size-3 text-chart-upload" strokeWidth={2} />
          <span className="font-medium tabular-nums">{formatTrafficBytes(item.upload)}</span>
        </div>
        <div className="flex items-center gap-1">
          <ArrowDown className="size-3 text-chart-download" strokeWidth={2} />
          <span className="font-medium tabular-nums">{formatTrafficBytes(item.download)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Activity className="size-3 text-primary" strokeWidth={2} />
          <span className="font-bold tabular-nums">{formatTrafficBytes(item.total)}</span>
        </div>
      </div>
    </div>
  );
}

function RankingListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-3 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-md bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="h-2.5 w-28 rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RankingEmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Trophy className="size-10 text-muted-foreground/50 mb-2" strokeWidth={1.5} />
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

// ============================================================================
// Section 6: Node Traffic Stats (Collapsible)
// ============================================================================

function NodeTrafficSection({
  items,
  pagination,
  isLoading,
  onPageChange,
}: {
  items: NodeTrafficStatsItem[];
  pagination: { page: number; pageSize: number; total: number };
  isLoading: boolean;
  onPageChange: (page: number) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'w-full flex items-center justify-between',
          cardStyles,
          'p-4 active:scale-[0.98] transition-[transform,box-shadow] touch-target'
        )}
      >
        <div className="flex items-center gap-2.5">
          <div className="relative size-8 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-inset ring-border/50">
            <Server className="size-4 text-primary" strokeWidth={1.5} />
            <div className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-status-online border border-card" />
          </div>
          <span className="text-sm font-semibold text-foreground">
            {t('admin.traffic.nodeStats')}
          </span>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          <ChevronDown className="size-4 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="node-content"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={collapsibleVariants}
            transition={collapsibleTransition}
            className="overflow-hidden"
          >
            <div className={cn('mt-2 overflow-hidden', cardStyles)}>
              <div className="px-3 py-3">
                {isLoading ? (
                  <NodeListSkeleton />
                ) : items.length === 0 ? (
                  <NodeEmptyState message={t('admin.traffic.noNodeData')} />
                ) : (
                  <ScrollArea className="max-h-[320px]">
                    <div className="space-y-2 pr-2">
                      {items.map((item) => (
                        <MobileNodeItem key={item.nodeId} item={item} />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>

              {/* Compact pagination */}
              {!isLoading && items.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-between px-3 py-2.5 border-t border-border">
                  <span className="text-[11px] text-muted-foreground">
                    {t('admin.traffic.totalNodes', { count: pagination.total })}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onPageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className={cn(getButtonClass('outline', 'sm'), 'text-xs touch-target')}
                    >
                      {t('common.actions.previous')}
                    </button>
                    <span className="text-[11px] text-muted-foreground px-1">
                      {pagination.page}/{totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => onPageChange(pagination.page + 1)}
                      disabled={pagination.page >= totalPages}
                      className={cn(getButtonClass('outline', 'sm'), 'text-xs touch-target')}
                    >
                      {t('common.actions.next')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileNodeItem({ item }: { item: NodeTrafficStatsItem }) {
  const colors = getStatusColors(item.status);

  return (
    <div className={cn('rounded-lg border p-3 bg-card', colors.border)}>
      <div className="flex items-center gap-2">
        {/* Node icon with status */}
        <div
          className={cn(
            'relative flex items-center justify-center min-w-7 h-7 rounded-md border',
            colors.bg, colors.text, colors.border
          )}
        >
          <Server className="size-3.5" strokeWidth={1.5} />
          <div className={cn('absolute -top-0.5 -right-0.5 size-2 rounded-full border border-card', colors.dot)} />
        </div>
        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{item.nodeName}</p>
          <p className="text-[10px] text-muted-foreground truncate">{item.nodeId}</p>
        </div>
      </div>
      {/* Full traffic data stacked */}
      <div className="mt-2 grid grid-cols-3 gap-1 text-[11px]">
        <div className="flex items-center gap-1">
          <ArrowUp className="size-3 text-chart-upload" strokeWidth={2} />
          <span className="font-medium tabular-nums">{formatTrafficBytes(item.upload)}</span>
        </div>
        <div className="flex items-center gap-1">
          <ArrowDown className="size-3 text-chart-download" strokeWidth={2} />
          <span className="font-medium tabular-nums">{formatTrafficBytes(item.download)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Activity className="size-3 text-primary" strokeWidth={2} />
          <span className="font-bold tabular-nums">{formatTrafficBytes(item.total)}</span>
        </div>
      </div>
    </div>
  );
}

function NodeListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-3 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-md bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-2.5 w-32 rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function NodeEmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Server className="size-10 text-muted-foreground/50 mb-2" strokeWidth={1.5} />
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function MobileDashboard({
  user,
  stats,
  loading,
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

  const platformStats: StatItem[] = [
    {
      title: t('admin.stats.totalUsers'),
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      iconBg: 'bg-info/10',
      iconColor: 'text-info',
      href: '/admin/users',
    },
    {
      title: t('admin.stats.totalSubscriptions'),
      value: stats.activeSubscriptions.toLocaleString(),
      icon: CreditCard,
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
      href: '/admin/subscriptions',
    },
    {
      title: t('admin.stats.totalNodes'),
      value: stats.totalNodes.toLocaleString(),
      icon: Server,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      href: '/admin/nodes',
    },
    {
      title: t('admin.stats.onlineNodes'),
      value: stats.activeNodes.toLocaleString(),
      icon: Activity,
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
      href: '/admin/monitor',
    },
  ];

  return (
    <div className="space-y-4 px-4 py-4 pb-safe">
      {/* 1. Header */}
      <MobileHeader
        user={user}
        dateRangeValue={dateRangeValue}
        onDateRangeChange={onDateRangeChange}
      />

      {/* 2. Platform Stats */}
      <section aria-labelledby="mobile-platform-stats">
        <h2 id="mobile-platform-stats" className="sr-only">
          {t('admin.dashboard.platformStats')}
        </h2>
        <PlatformStatsGrid stats={platformStats} loading={loading} />
      </section>

      {/* 3. Traffic Chart */}
      <section aria-labelledby="mobile-traffic-chart">
        <h2 id="mobile-traffic-chart" className="sr-only">
          {t('admin.dashboard.trafficAnalytics')}
        </h2>
        <LazyTrafficTrendChart
          data={trafficTrend?.points ?? []}
          granularity={granularity}
          loading={isTrafficLoading}
          overview={trafficOverview ?? undefined}
        />
      </section>

      {/* 4. Traffic Overview Meta */}
      <TrafficOverviewMeta overview={trafficOverview} loading={isTrafficLoading} />

      {/* 5. Traffic Ranking */}
      <TrafficRankingSection
        userRanking={userRanking}
        subscriptionRanking={subscriptionRanking}
        isLoading={isTrafficLoading}
      />

      {/* 6. Node Traffic Stats */}
      <NodeTrafficSection
        items={nodeTrafficItems}
        pagination={nodeTrafficPagination}
        isLoading={isNodeTrafficLoading}
        onPageChange={onNodeTrafficPageChange}
      />
    </div>
  );
}
