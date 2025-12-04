/**
 * 管理端控制台 - 精致商务风格
 * 使用真实 API 数据
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { listUsers } from '@/api/user';
import { adminListSubscriptions } from '@/api/admin';
import { listNodes } from '@/api/node';
import type { Subscription } from '@/api/subscription';
import {
  Users,
  CreditCard,
  ArrowUpRight,
  Server,
  Activity,
  Shield,
  Layers,
} from 'lucide-react';

// ============ 统计卡片组件 ============
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
    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50">
      <div className="flex items-start justify-between mb-5">
        <div className={`${iconBg} p-3.5 rounded-xl shadow-sm`}>
          <div className={iconColor}>{icon}</div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {loading ? (
            <div className="h-9 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          ) : (
            value
          )}
        </div>
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {title}
        </div>
      </div>
    </div>
  );
};

// ============ 快速操作卡片 ============
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
      className="group w-full text-left p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300"
    >
      <div className="flex items-center gap-4">
        <div
          className={`${iconBg} p-3 rounded-xl shadow-sm group-hover:scale-105 transition-transform`}
        >
          <div className={iconColor}>{icon}</div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>

        <ArrowUpRight className="size-5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
      </div>
    </button>
  );
};

// ============ 系统状态 ============
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

// ============ Dashboard 数据 Hook ============
interface UserSubscriptionItem {
  userId: number;
  userName: string;
  userEmail: string;
  planName: string;
  status: string;
  isActive: boolean;
}

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalNodes: number;
  activeNodes: number;
  userSubscriptions: UserSubscriptionItem[];
}

const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalNodes: 0,
    activeNodes: 0,
    userSubscriptions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [usersRes, subscriptionsRes, nodesRes] = await Promise.all([
          listUsers({ page: 1, pageSize: 1 }),
          adminListSubscriptions({ page: 1, pageSize: 20 }),
          listNodes({ page: 1, pageSize: 100 }),
        ]);

        const nodes = nodesRes.items || [];
        const activeNodes = nodes.filter((node) => node.status === 'active').length;

        // 用户订阅列表
        const subscriptions = subscriptionsRes.items || [];
        const userSubscriptions: UserSubscriptionItem[] = subscriptions.map((sub: Subscription) => ({
          userId: sub.userId,
          userName: '-', // User 字段需要后端提供
          userEmail: '-', // User 字段需要后端提供
          planName: sub.plan?.name || '-',
          status: sub.status,
          isActive: sub.status === 'active',
        }));

        setStats({
          totalUsers: usersRes.total || 0,
          activeSubscriptions: subscriptionsRes.total || 0,
          totalNodes: nodesRes.total || 0,
          activeNodes,
          userSubscriptions,
        });
      } catch (error) {
        console.error('获取统计数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading };
};

// ============ 主页面组件 ============
export const NewAdminDashboardPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { stats, loading } = useDashboardStats();

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

  const statsCards = [
    {
      title: '总用户数',
      value: stats.totalUsers.toLocaleString(),
      icon: <Users className="size-6" strokeWidth={1.5} />,
      iconBg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: '订阅总数',
      value: stats.activeSubscriptions.toLocaleString(),
      icon: <CreditCard className="size-6" strokeWidth={1.5} />,
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: '节点总数',
      value: stats.totalNodes.toLocaleString(),
      icon: <Server className="size-6" strokeWidth={1.5} />,
      iconBg: 'bg-violet-50 dark:bg-violet-900/20',
      iconColor: 'text-violet-600 dark:text-violet-400',
    },
    {
      title: '在线节点',
      value: stats.activeNodes.toLocaleString(),
      icon: <Activity className="size-6" strokeWidth={1.5} />,
      iconBg: 'bg-orange-50 dark:bg-orange-900/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
  ];

  const quickActions = [
    {
      title: '用户管理',
      description: '管理所有用户账户和权限',
      icon: <Users className="size-5" strokeWidth={1.5} />,
      iconBg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      onClick: () => navigate('/admin/users'),
    },
    {
      title: '订阅管理',
      description: '查看和管理用户订阅',
      icon: <CreditCard className="size-5" strokeWidth={1.5} />,
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      onClick: () => navigate('/admin/subscriptions'),
    },
    {
      title: '节点管理',
      description: '监控和配置服务器节点',
      icon: <Server className="size-5" strokeWidth={1.5} />,
      iconBg: 'bg-violet-50 dark:bg-violet-900/20',
      iconColor: 'text-violet-600 dark:text-violet-400',
      onClick: () => navigate('/admin/nodes'),
    },
    {
      title: '节点组管理',
      description: '管理节点分组和权限',
      icon: <Layers className="size-5" strokeWidth={1.5} />,
      iconBg: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      onClick: () => navigate('/admin/node-groups'),
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
    {
      label: '系统状态',
      status: 'online' as const,
      value: '正常',
      icon: <Shield className="size-4" strokeWidth={1.5} />,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 py-8">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
                控制台总览
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              欢迎回来，
              {user.displayName || user.email?.split('@')[0]}
            </p>
          </div>
        </div>

        {/* 核心数据指标 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {statsCards.map((stat, index) => (
            <StatsCard key={index} {...stat} loading={loading} />
          ))}
        </div>

        {/* 用户订阅统计 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <Users className="size-5 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                用户订阅统计
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                最近订阅用户列表
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">用户</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">邮箱</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">套餐</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {stats.userSubscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">暂无订阅数据</td>
                    </tr>
                  ) : (
                    stats.userSubscriptions.map((sub, index) => (
                      <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-5 py-3 text-sm font-medium text-slate-900 dark:text-white">
                          {sub.userName}
                        </td>
                        <td className="px-5 py-3 text-sm text-slate-600 dark:text-slate-400">
                          {sub.userEmail}
                        </td>
                        <td className="px-5 py-3 text-sm text-slate-700 dark:text-slate-300">
                          {sub.planName}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                            sub.isActive
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            <span className={`size-1.5 rounded-full ${sub.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {sub.isActive ? '活跃' : '未激活'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 主要内容区 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：快速操作 */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                快速访问
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <QuickActionCard key={index} {...action} />
                ))}
              </div>
            </div>
          </div>

          {/* 右侧：系统状态 */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              系统状态
            </h2>
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
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
      </div>
    </AdminLayout>
  );
};
