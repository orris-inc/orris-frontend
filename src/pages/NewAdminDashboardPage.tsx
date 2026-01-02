/**
 * Admin Dashboard - Refined Business Style
 * Uses real API data with traffic analytics
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { usePageTitle } from '@/shared/hooks';
import { listUsers } from '@/api/user';
import { adminListSubscriptions } from '@/api/subscription';
import { listNodes } from '@/api/node';
import {
  useAdminTrafficStats,
  useNodeTrafficStats,
  getDateRangeFromPreset,
  detectGranularity,
  type DateRangePreset,
} from '@/features/admin-traffic';
import {
  DateRangeSelector,
  TrafficTrendChart,
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
} from 'lucide-react';
import { formatTrafficBytes } from '@/api/admin';
import { Separator } from '@/components/common/Separator';

// ============ Stats Card Component ============
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
    <div className="group relative overflow-hidden bg-card backdrop-blur-xl rounded-xl p-3 sm:p-3.5 border border-border shadow-sm hover:shadow-md transition-all duration-200 ease-out">
      <div className="relative z-10 flex items-center gap-2 sm:gap-2.5">
        <div className={`${iconBg} p-1.5 sm:p-2 rounded-lg shrink-0 ring-1 ring-border/50`}>
          <div className={iconColor}>{icon}</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm sm:text-base lg:text-lg font-bold text-foreground tracking-tight tabular-nums truncate">
            {loading ? (
              <div className="h-4 sm:h-5 w-10 sm:w-12 bg-muted rounded animate-pulse" />
            ) : (
              value
            )}
          </div>
          <div className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">
            {title}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ Quick Action Card ============
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
  description,
  icon,
  iconBg,
  iconColor,
  onClick,
}: QuickActionCardProps) => {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left p-4 sm:p-5 rounded-xl sm:rounded-2xl overflow-hidden relative bg-card backdrop-blur-xl border border-border shadow-sm hover:shadow-xl active:shadow-md hover:border-primary/30 transition-all duration-200 ease-out hover:-translate-y-1 active:translate-y-0 min-h-[72px] sm:min-h-0 cursor-pointer"
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-primary/5 via-transparent to-transparent transition-opacity duration-200 pointer-events-none" />

      {/* Mobile: Horizontal compact layout, Desktop: Full layout */}
      <div className="relative z-10 flex items-center gap-3 sm:gap-4">
        <div
          className={`${iconBg} p-2.5 sm:p-3 rounded-xl shadow-sm ring-1 ring-border/50 group-hover:ring-2 group-hover:ring-primary/20 group-hover:scale-105 transition-all duration-200 shrink-0`}
        >
          <div className={iconColor}>{icon}</div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors duration-200 truncate">
            {title}
          </h3>
          <p className="hidden sm:block text-sm text-muted-foreground mt-0.5 line-clamp-1">
            {description}
          </p>
        </div>

        <div className="flex items-center justify-center size-7 sm:size-8 rounded-full bg-muted group-hover:bg-primary/10 transition-colors duration-200 shrink-0">
          <ArrowUpRight className="size-3.5 sm:size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
        </div>
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
      ring: 'ring-status-online/30',
      text: 'text-success',
      bg: 'bg-success-muted',
      iconBg: 'bg-success-muted',
      iconColor: 'text-success',
      pulse: true,
    },
    warning: {
      dot: 'bg-status-warning',
      ring: 'ring-status-warning/30',
      text: 'text-warning',
      bg: 'bg-warning-muted',
      iconBg: 'bg-warning-muted',
      iconColor: 'text-warning',
      pulse: true,
    },
    offline: {
      dot: 'bg-status-offline',
      ring: 'ring-status-offline/30',
      text: 'text-destructive',
      bg: 'bg-destructive/10',
      iconBg: 'bg-destructive/10',
      iconColor: 'text-destructive',
      pulse: false,
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0 group transition-colors duration-200 hover:bg-accent/50 -mx-2 px-2 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${config.iconBg} transition-colors duration-200`}>
          <div className={config.iconColor}>{icon}</div>
        </div>
        <span className="text-sm font-medium text-foreground">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-sm font-semibold px-2.5 py-1 rounded-lg ${config.text} ${config.bg} ring-1 ring-inset ring-current/10`}>
          {value}
        </span>
        <div className="relative flex items-center justify-center">
          <div className={`size-2.5 rounded-full ${config.dot} ring-2 ${config.ring}`} />
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

// ============ Dashboard Data Hook ============
interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalNodes: number;
  activeNodes: number;
}

const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalNodes: 0,
    activeNodes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [usersRes, subscriptionsRes, nodesRes] = await Promise.all([
          listUsers({ page: 1, pageSize: 1 }),
          adminListSubscriptions({ page: 1, pageSize: 1 }),
          listNodes({ page: 1, pageSize: 100, includeUserNodes: true }),
        ]);

        const nodes = nodesRes.items || [];
        const activeNodes = nodes.filter((node) => node.status === 'active').length;

        setStats({
          totalUsers: usersRes.total || 0,
          activeSubscriptions: subscriptionsRes.total || 0,
          totalNodes: nodesRes.total || 0,
          activeNodes,
        });
      } catch {
        // Failed to fetch statistics
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading };
};

// ============ Main Page Component ============
export const NewAdminDashboardPage = () => {
  usePageTitle('控制台');

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
            无法加载用户信息
          </p>
        </div>
      </AdminLayout>
    );
  }

  // Combined stats cards - basic stats + traffic stats in one row
  const statsCards = [
    {
      title: '总用户数',
      value: stats.totalUsers.toLocaleString(),
      icon: <Users className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-info-muted',
      iconColor: 'text-info',
      loading: loading,
    },
    {
      title: '订阅总数',
      value: stats.activeSubscriptions.toLocaleString(),
      icon: <CreditCard className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-success-muted',
      iconColor: 'text-success',
      loading: loading,
    },
    {
      title: '节点总数',
      value: stats.totalNodes.toLocaleString(),
      icon: <Server className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      loading: loading,
    },
    {
      title: '在线节点',
      value: stats.activeNodes.toLocaleString(),
      icon: <Activity className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-warning-muted',
      iconColor: 'text-warning',
      loading: loading,
    },
    {
      title: '总上传',
      value: trafficOverview ? formatTrafficBytes(trafficOverview.totalUpload) : '-',
      icon: <ArrowUp className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-chart-upload/10',
      iconColor: 'text-chart-upload',
      loading: isTrafficLoading,
    },
    {
      title: '总下载',
      value: trafficOverview ? formatTrafficBytes(trafficOverview.totalDownload) : '-',
      icon: <ArrowDown className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-chart-download/10',
      iconColor: 'text-chart-download',
      loading: isTrafficLoading,
    },
    {
      title: '总流量',
      value: trafficOverview ? formatTrafficBytes(trafficOverview.totalTraffic) : '-',
      icon: <Activity className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent',
      loading: isTrafficLoading,
    },
    {
      title: '活跃用户',
      value: trafficOverview ? trafficOverview.activeUsers.toLocaleString() : '-',
      icon: <Users className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-destructive/10',
      iconColor: 'text-destructive',
      loading: isTrafficLoading,
    },
  ];

  const quickActions = [
    {
      title: '用户',
      description: '管理所有用户账户和权限',
      icon: <Users className="size-4 sm:size-5" strokeWidth={1.5} />,
      iconBg: 'bg-info-muted',
      iconColor: 'text-info',
      onClick: () => navigate('/admin/users'),
    },
    {
      title: '订阅',
      description: '查看和管理用户订阅',
      icon: <CreditCard className="size-4 sm:size-5" strokeWidth={1.5} />,
      iconBg: 'bg-success-muted',
      iconColor: 'text-success',
      onClick: () => navigate('/admin/subscriptions'),
    },
    {
      title: '节点',
      description: '监控和配置服务器节点',
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
      label: '节点在线率',
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
      label: '活跃节点',
      status: stats.activeNodes > 0 ? ('online' as const) : ('offline' as const),
      value: `${stats.activeNodes} 个`,
      icon: <Activity className="size-4" strokeWidth={1.5} />,
    },
  ];

  return (
    <AdminLayout>
      <div className="py-6 sm:py-8">
        {/* Page header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="size-2 rounded-full bg-status-online animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              实时数据
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            控制台总览
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            欢迎回来，{user.displayName || user.email?.split('@')[0]}
          </p>
        </header>

        {/* All statistics cards - responsive grid layout */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
            {statsCards.map((stat, index) => (
              <StatsCard key={index} {...stat} />
            ))}
          </div>
        </section>

        <Separator className="my-6 sm:my-8" />

        {/* Traffic analytics section */}
        <section className="space-y-6">
          {/* Traffic trend chart with date selector */}
          <TrafficTrendChart
            data={trafficTrend?.points ?? []}
            granularity={granularity}
            loading={isTrafficLoading}
            headerAction={
              <DateRangeSelector
                value={dateRangePreset}
                onChange={setDateRangePreset}
              />
            }
          />

          {/* Traffic ranking and node stats - 1:1 layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <Separator className="my-6 sm:my-8" />

        {/* Quick actions and system status */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Left: Quick actions */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-foreground">
                  快速访问
                </h2>
                <span className="hidden sm:inline text-xs font-medium text-muted-foreground">
                  常用功能入口
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {quickActions.map((action, index) => (
                  <QuickActionCard key={index} {...action} />
                ))}
              </div>
            </div>

            {/* Right: System status */}
            <div>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-foreground">
                  系统状态
                </h2>
                <span className="hidden sm:inline text-xs font-medium text-muted-foreground">
                  健康监控
                </span>
              </div>
              <div className="overflow-hidden bg-card backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-border shadow-sm transition-shadow duration-200 hover:shadow-md">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 py-4"
                      >
                        <div className="size-10 bg-muted rounded-lg animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                        </div>
                        <div className="h-6 w-16 bg-muted rounded-lg animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    {systemStatuses.map((status, index) => (
                      <SystemStatus key={index} {...status} />
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
