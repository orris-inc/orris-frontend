/**
 * 管理端控制台 - 精致商务风格
 * 清晰的视觉层次，优雅的色彩分离
 */

import { useNavigate } from 'react-router';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import {
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Server,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  UserPlus,
  ShoppingCart,
  Activity,
  Globe,
  Shield,
  Sparkles,
} from 'lucide-react';

// ============ 统计卡片组件 ============
interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  accentColor: string;
}

const StatsCard = ({
  title,
  value,
  change,
  changeType,
  icon,
  iconBg,
  iconColor,
  accentColor
}: StatsCardProps) => {
  const changeStyles = {
    increase: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400',
    decrease: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400',
    neutral: 'text-slate-600 bg-slate-50 dark:bg-slate-900/20 dark:text-slate-400',
  };

  const ChangeIcon = changeType === 'increase' ? TrendingUp : changeType === 'decrease' ? TrendingDown : Activity;

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50">
      {/* 顶部装饰线 */}
      <div className={`absolute top-0 left-6 right-6 h-0.5 ${accentColor} rounded-full opacity-0 group-hover:opacity-100 transition-opacity`} />

      <div className="flex items-start justify-between mb-5">
        {/* 图标容器 - 清晰的背景分离 */}
        <div className={`${iconBg} p-3.5 rounded-xl shadow-sm`}>
          <div className={iconColor}>
            {icon}
          </div>
        </div>

        {/* 变化指标 */}
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${changeStyles[changeType]}`}>
          <ChangeIcon className="size-3.5" />
          <span>{change}</span>
        </div>
      </div>

      {/* 数值和标题 */}
      <div className="space-y-1">
        <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
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
  badge?: string;
}

const QuickActionCard = ({
  title,
  description,
  icon,
  iconBg,
  iconColor,
  onClick,
  badge
}: QuickActionCardProps) => {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300"
    >
      <div className="flex items-center gap-4">
        {/* 清晰的图标容器 */}
        <div className={`${iconBg} p-3 rounded-xl shadow-sm group-hover:scale-105 transition-transform`}>
          <div className={iconColor}>
            {icon}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {title}
            </h3>
            {badge && (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>

        <ArrowUpRight className="size-5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
      </div>
    </button>
  );
};

// ============ 活动项 ============
interface ActivityItemProps {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description: string;
  time: string;
  icon: React.ReactNode;
}

const ActivityItem = ({ type, title, description, time, icon }: ActivityItemProps) => {
  const typeStyles = {
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      icon: 'text-emerald-600 dark:text-emerald-400',
      dot: 'bg-emerald-500',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      icon: 'text-amber-600 dark:text-amber-400',
      dot: 'bg-amber-500',
    },
    error: {
      bg: 'bg-rose-50 dark:bg-rose-900/20',
      icon: 'text-rose-600 dark:text-rose-400',
      dot: 'bg-rose-500',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      icon: 'text-blue-600 dark:text-blue-400',
      dot: 'bg-blue-500',
    },
  };

  const styles = typeStyles[type];

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
      <div className={`${styles.bg} p-2 rounded-lg shrink-0`}>
        <div className={styles.icon}>
          {icon}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className={`size-1.5 rounded-full ${styles.dot}`} />
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {title}
          </p>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 ml-3.5">
          {description}
        </p>
      </div>
      <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
        {time}
      </span>
    </div>
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
        <div className="text-slate-400 dark:text-slate-500">
          {icon}
        </div>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-semibold ${config.text}`}>
          {value}
        </span>
        <div className="relative">
          <div className={`size-2 rounded-full ${config.dot}`} />
          {config.pulse && (
            <div className={`absolute inset-0 rounded-full ${config.dot} animate-ping opacity-50`} />
          )}
        </div>
      </div>
    </div>
  );
};

// ============ 主页面组件 ============
export const NewAdminDashboardPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  if (!user) {
    return (
      <AdminLayout>
        <div className="p-4 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30">
          <p className="text-sm text-rose-900 dark:text-rose-200">无法加载用户信息</p>
        </div>
      </AdminLayout>
    );
  }

  const stats = [
    {
      title: '总用户数',
      value: '2,847',
      change: '+12.5%',
      changeType: 'increase' as const,
      icon: <Users className="size-6" strokeWidth={1.5} />,
      iconBg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      accentColor: 'bg-blue-500',
    },
    {
      title: '活跃订阅',
      value: '1,428',
      change: '+8.2%',
      changeType: 'increase' as const,
      icon: <CreditCard className="size-6" strokeWidth={1.5} />,
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      accentColor: 'bg-emerald-500',
    },
    {
      title: '月度收入',
      value: '¥156,890',
      change: '+23.1%',
      changeType: 'increase' as const,
      icon: <Wallet className="size-6" strokeWidth={1.5} />,
      iconBg: 'bg-violet-50 dark:bg-violet-900/20',
      iconColor: 'text-violet-600 dark:text-violet-400',
      accentColor: 'bg-violet-500',
    },
    {
      title: '系统负载',
      value: '45%',
      change: '-5.3%',
      changeType: 'increase' as const,
      icon: <Activity className="size-6" strokeWidth={1.5} />,
      iconBg: 'bg-orange-50 dark:bg-orange-900/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
      accentColor: 'bg-orange-500',
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
      title: '订阅计划',
      description: '配置和管理订阅套餐',
      icon: <ShoppingCart className="size-5" strokeWidth={1.5} />,
      iconBg: 'bg-violet-50 dark:bg-violet-900/20',
      iconColor: 'text-violet-600 dark:text-violet-400',
      onClick: () => navigate('/admin/subscription-plans'),
    },
    {
      title: '节点管理',
      description: '监控和配置服务器节点',
      icon: <Server className="size-5" strokeWidth={1.5} />,
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      onClick: () => navigate('/admin/nodes'),
      badge: '2',
    },
    {
      title: '系统设置',
      description: '配置全局系统参数',
      icon: <Shield className="size-5" strokeWidth={1.5} />,
      iconBg: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      onClick: () => {},
    },
  ];

  const recentActivities = [
    {
      type: 'success' as const,
      title: '新用户注册',
      description: 'zhang.wei@example.com 已完成验证',
      time: '2分钟前',
      icon: <UserPlus className="size-4" strokeWidth={1.5} />,
    },
    {
      type: 'info' as const,
      title: '订阅更新',
      description: 'test@gmail.com 升级到企业版',
      time: '15分钟前',
      icon: <CreditCard className="size-4" strokeWidth={1.5} />,
    },
    {
      type: 'warning' as const,
      title: '节点性能警告',
      description: '东京节点 JP-02 延迟超过阈值',
      time: '1小时前',
      icon: <AlertTriangle className="size-4" strokeWidth={1.5} />,
    },
    {
      type: 'success' as const,
      title: '支付成功',
      description: '收到订单 #12847 付款 ¥299',
      time: '2小时前',
      icon: <Wallet className="size-4" strokeWidth={1.5} />,
    },
    {
      type: 'info' as const,
      title: '系统备份',
      description: '数据库自动备份已完成',
      time: '3小时前',
      icon: <CheckCircle2 className="size-4" strokeWidth={1.5} />,
    },
  ];

  const systemStatuses = [
    { label: 'API 服务', status: 'online' as const, value: '运行中', icon: <Globe className="size-4" strokeWidth={1.5} /> },
    { label: '数据库', status: 'online' as const, value: '99.9%', icon: <Server className="size-4" strokeWidth={1.5} /> },
    { label: '缓存服务', status: 'online' as const, value: '正常', icon: <Zap className="size-4" strokeWidth={1.5} /> },
    { label: '消息队列', status: 'warning' as const, value: '85%', icon: <Activity className="size-4" strokeWidth={1.5} /> },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 py-8">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                控制台总览
              </h1>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <Sparkles className="size-3.5" />
                在线
              </div>
            </div>
            <p className="text-base text-slate-500 dark:text-slate-400">
              欢迎回来，{user.display_name || user.name || user.email?.split('@')[0]}
            </p>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-lg shadow-slate-900/10 dark:shadow-white/10">
            <Zap className="size-4" />
            快速操作
          </button>
        </div>

        {/* 核心数据指标 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        {/* 主要内容区 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：快速操作 + 系统状态 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 快速操作 */}
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

            {/* 系统状态 */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  系统状态
                </h3>
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                  实时监控
                </span>
              </div>
              <div>
                {systemStatuses.map((status, index) => (
                  <SystemStatus key={index} {...status} />
                ))}
              </div>
            </div>
          </div>

          {/* 右侧：实时动态 */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              实时动态
            </h2>
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                {recentActivities.map((activity, index) => (
                  <ActivityItem key={index} {...activity} />
                ))}
              </div>
              <button className="w-full mt-3 py-2.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                查看全部活动
              </button>
            </div>
          </div>
        </div>

        {/* 底部横幅 */}
        <div className="relative overflow-hidden rounded-2xl bg-slate-900 dark:bg-slate-800 p-8">
          {/* 装饰元素 */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-violet-500/20 to-transparent rounded-full blur-3xl" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
                <Zap className="size-7 text-white" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  系统运行稳定
                </h3>
                <p className="text-slate-300">
                  平台已稳定运行 128 天，服务可用率 99.98%
                </p>
              </div>
            </div>
            <button className="px-5 py-2.5 bg-white text-slate-900 rounded-xl font-semibold hover:bg-slate-100 transition-colors shadow-lg">
              查看详情
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
