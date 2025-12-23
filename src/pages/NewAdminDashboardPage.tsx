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
    <div className="group relative bg-white dark:bg-slate-900 rounded-lg p-3 sm:p-4 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200 hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className={`${iconBg} p-2 rounded-lg shrink-0`}>
          <div className={iconColor}>{icon}</div>
        </div>
        <div className="min-w-0">
          <div className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white whitespace-nowrap">
            {loading ? (
              <div className="h-5 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            ) : (
              value
            )}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
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
      className="group w-full text-left p-2 sm:p-4 md:p-5 rounded-lg sm:rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300 touch-target"
    >
      {/* Mobile: Vertical layout */}
      <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left gap-2 sm:gap-4">
        <div
          className={`${iconBg} p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-sm group-hover:scale-105 transition-transform`}
        >
          <div className={iconColor}>{icon}</div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-xs sm:text-base font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
            {title}
          </h3>
          <p className="hidden sm:block text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>

        <ArrowUpRight className="hidden sm:block size-5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
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
      dot: 'bg-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400',
      pulse: true,
    },
    warning: {
      dot: 'bg-amber-500',
      text: 'text-amber-600 dark:text-amber-400',
      pulse: true,
    },
    offline: {
      dot: 'bg-rose-500',
      text: 'text-rose-600 dark:text-rose-400',
      pulse: false,
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="flex items-center gap-3">
        <div className="text-slate-400 dark:text-slate-500">{icon}</div>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-semibold ${config.text}`}>{value}</span>
        <div className="relative">
          <div className={`size-2 rounded-full ${config.dot}`} />
          {config.pulse && (
            <div
              className={`absolute inset-0 rounded-full ${config.dot} animate-ping opacity-50`}
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
        <div className="p-4 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30">
          <p className="text-sm text-rose-900 dark:text-rose-200">
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
      iconBg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      loading: loading,
    },
    {
      title: '订阅总数',
      value: stats.activeSubscriptions.toLocaleString(),
      icon: <CreditCard className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      loading: loading,
    },
    {
      title: '节点总数',
      value: stats.totalNodes.toLocaleString(),
      icon: <Server className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-violet-50 dark:bg-violet-900/20',
      iconColor: 'text-violet-600 dark:text-violet-400',
      loading: loading,
    },
    {
      title: '在线节点',
      value: stats.activeNodes.toLocaleString(),
      icon: <Activity className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      loading: loading,
    },
    {
      title: '总上传',
      value: trafficOverview ? formatTrafficBytes(trafficOverview.totalUpload) : '-',
      icon: <ArrowUp className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-sky-50 dark:bg-sky-900/20',
      iconColor: 'text-sky-600 dark:text-sky-400',
      loading: isTrafficLoading,
    },
    {
      title: '总下载',
      value: trafficOverview ? formatTrafficBytes(trafficOverview.totalDownload) : '-',
      icon: <ArrowDown className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-teal-50 dark:bg-teal-900/20',
      iconColor: 'text-teal-600 dark:text-teal-400',
      loading: isTrafficLoading,
    },
    {
      title: '总流量',
      value: trafficOverview ? formatTrafficBytes(trafficOverview.totalTraffic) : '-',
      icon: <Activity className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-indigo-50 dark:bg-indigo-900/20',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      loading: isTrafficLoading,
    },
    {
      title: '活跃用户',
      value: trafficOverview ? trafficOverview.activeUsers.toLocaleString() : '-',
      icon: <Users className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-rose-50 dark:bg-rose-900/20',
      iconColor: 'text-rose-600 dark:text-rose-400',
      loading: isTrafficLoading,
    },
  ];

  const quickActions = [
    {
      title: '用户',
      description: '管理所有用户账户和权限',
      icon: <Users className="size-4 sm:size-5" strokeWidth={1.5} />,
      iconBg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      onClick: () => navigate('/admin/users'),
    },
    {
      title: '订阅',
      description: '查看和管理用户订阅',
      icon: <CreditCard className="size-4 sm:size-5" strokeWidth={1.5} />,
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      onClick: () => navigate('/admin/subscriptions'),
    },
    {
      title: '节点',
      description: '监控和配置服务器节点',
      icon: <Server className="size-4 sm:size-5" strokeWidth={1.5} />,
      iconBg: 'bg-violet-50 dark:bg-violet-900/20',
      iconColor: 'text-violet-600 dark:text-violet-400',
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
      <div className="py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
            控制台总览
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            欢迎回来，{user.displayName || user.email?.split('@')[0]}
          </p>
        </div>

        {/* All statistics cards in one row */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {statsCards.map((stat, index) => (
              <StatsCard key={index} {...stat} />
            ))}
          </div>
        </section>

        <Separator className="my-8" />

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

        <Separator className="my-8" />

        {/* Quick actions and system status */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧：快速操作 */}
            <div className="lg:col-span-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                快速访问
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 sm:gap-4">
                {quickActions.map((action, index) => (
                  <QuickActionCard key={index} {...action} />
                ))}
              </div>
            </div>

            {/* 右侧：系统状态 */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                系统状态
              </h2>
              <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"
                      />
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
