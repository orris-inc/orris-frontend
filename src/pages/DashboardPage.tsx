/**
 * Dashboard Main Page - Minimalist Style
 */

import { useEffect, useState } from 'react';
import {
  CircleAlert,
  TrendingUp,
  Calendar,
  Zap,
  Download,
  Upload,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { usePageTitle } from '@/shared/hooks';
import { getDashboard } from '@/api/user';
import type { DashboardResponse } from '@/api/user/types';
import { SubscriptionCard } from '@/components/dashboard/SubscriptionCard';

/**
 * Format bytes to readable traffic units
 */
const formatTraffic = (bytes: number): { value: string; unit: string } => {
  if (bytes === 0) return { value: '0', unit: 'B' };
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = (bytes / Math.pow(k, i)).toFixed(1);
  return { value, unit: units[i] };
};

export const DashboardPage = () => {
  usePageTitle('仪表盘');

  const { user } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getDashboard();
        setDashboardData(data);
      } catch {
        // Failed to fetch dashboard data
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          <CircleAlert className="h-5 w-5" />
          <span>无法加载用户信息</span>
        </div>
      </DashboardLayout>
    );
  }

  const subscriptions = dashboardData?.subscriptions ?? [];
  const activeSubscriptions = subscriptions.filter((sub) => sub.isActive);
  const hasActiveSubscription = activeSubscriptions.length > 0;
  const primarySubscription = activeSubscriptions[0];
  const totalUsage = dashboardData?.totalUsage;

  // Calculate total traffic limit from all active subscriptions
  const totalTrafficLimit = activeSubscriptions.reduce((sum, sub) => {
    const limits = sub.plan?.limits as { trafficLimit?: number } | undefined;
    return sum + (limits?.trafficLimit ?? 0);
  }, 0);

  const getDaysRemaining = (endDate?: string) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const daysRemaining = primarySubscription ? getDaysRemaining(primarySubscription.currentPeriodEnd) : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {user.displayName || user.email?.split('@')[0] || '用户'}
          </h1>
          <p className="text-muted-foreground">欢迎回来</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Subscription Status */}
          <div className="p-5 rounded-xl bg-card border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Shield className="h-5 w-5 text-emerald-500" />
              </div>
              <span className="text-sm text-muted-foreground">订阅状态</span>
            </div>
            <div className="text-2xl font-semibold">
              {isLoading ? (
                <span className="inline-block w-16 h-7 bg-muted animate-pulse rounded" />
              ) : hasActiveSubscription ? '已激活' : '未激活'}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {isLoading ? (
                <span className="inline-block w-12 h-4 bg-muted animate-pulse rounded" />
              ) : hasActiveSubscription ? `${activeSubscriptions.length} 个活跃` : '暂无订阅'}
            </p>
          </div>

          {/* Remaining Days */}
          <div className="p-5 rounded-xl bg-card border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Calendar className="h-5 w-5 text-amber-500" />
              </div>
              <span className="text-sm text-muted-foreground">剩余天数</span>
            </div>
            <div className="text-2xl font-semibold font-mono">
              {isLoading ? (
                <span className="inline-block w-10 h-7 bg-muted animate-pulse rounded" />
              ) : daysRemaining !== null ? daysRemaining : '-'}
            </div>
            <p className="text-sm text-muted-foreground mt-1">天</p>
          </div>

          {/* Upload Traffic */}
          <div className="p-5 rounded-xl bg-card border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Upload className="h-5 w-5 text-blue-500" />
              </div>
              <span className="text-sm text-muted-foreground">上传</span>
            </div>
            <div className="text-2xl font-semibold font-mono">
              {isLoading ? (
                <span className="inline-block w-14 h-7 bg-muted animate-pulse rounded" />
              ) : totalUsage ? formatTraffic(totalUsage.upload).value : '-'}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {isLoading ? (
                <span className="inline-block w-10 h-4 bg-muted animate-pulse rounded" />
              ) : totalUsage ? `${formatTraffic(totalUsage.upload).unit} 本月` : '本月'}
            </p>
          </div>

          {/* Download Traffic */}
          <div className="p-5 rounded-xl bg-card border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-pink-500/10">
                <Download className="h-5 w-5 text-pink-500" />
              </div>
              <span className="text-sm text-muted-foreground">下载</span>
            </div>
            <div className="text-2xl font-semibold font-mono">
              {isLoading ? (
                <span className="inline-block w-14 h-7 bg-muted animate-pulse rounded" />
              ) : totalUsage ? formatTraffic(totalUsage.download).value : '-'}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {isLoading ? (
                <span className="inline-block w-10 h-4 bg-muted animate-pulse rounded" />
              ) : totalUsage ? `${formatTraffic(totalUsage.download).unit} 本月` : '本月'}
            </p>
          </div>
        </div>

        {/* Traffic Progress */}
        <div className="p-5 rounded-xl bg-card border">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-muted-foreground">总流量使用</span>
            <span className="text-sm font-mono">
              {totalUsage ? formatTraffic(totalUsage.total).value : '-'}{' '}
              {totalUsage ? formatTraffic(totalUsage.total).unit : ''} /{' '}
              {totalTrafficLimit > 0 ? formatTraffic(totalTrafficLimit).value : '-'}{' '}
              {totalTrafficLimit > 0 ? formatTraffic(totalTrafficLimit).unit : ''}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary"
              style={{
                width: totalTrafficLimit > 0 && totalUsage
                  ? `${Math.min((totalUsage.total / totalTrafficLimit) * 100, 100)}%`
                  : '0%',
              }}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="/pricing"
            className="flex items-center gap-4 p-4 rounded-xl bg-card border hover:border-primary/50 transition-colors group"
          >
            <div className="p-2 rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="font-medium">升级订阅</div>
              <div className="text-sm text-muted-foreground">获取更多流量</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </a>

          <a
            href="/pricing"
            className="flex items-center gap-4 p-4 rounded-xl bg-card border hover:border-primary/50 transition-colors group"
          >
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="flex-1">
              <div className="font-medium">查看套餐</div>
              <div className="text-sm text-muted-foreground">对比所有方案</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </a>
        </div>

        {/* Subscription Details */}
        <SubscriptionCard
          subscriptions={subscriptions}
          isLoading={isLoading}
        />
      </div>
    </DashboardLayout>
  );
};
