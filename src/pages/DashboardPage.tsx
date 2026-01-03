/**
 * Dashboard Main Page - Bento Grid Style
 * Apple-inspired asymmetric grid layout with traffic data focus
 */

import { useEffect, useState } from 'react';
import { CircleAlert, Calendar, Download, Upload, Shield } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { usePageTitle } from '@/shared/hooks';
import { getDashboard } from '@/api/user';
import type { DashboardResponse } from '@/api/user/types';
import { SubscriptionCard } from '@/components/dashboard/SubscriptionCard';
import { TrafficHeroCard } from '@/components/dashboard/TrafficHeroCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';

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
          <CircleAlert className="size-5" />
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

  // Format traffic for stat cards
  const uploadFormatted = totalUsage ? formatTraffic(totalUsage.upload) : { value: '-', unit: '' };
  const downloadFormatted = totalUsage ? formatTraffic(totalUsage.download) : { value: '-', unit: '' };

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

        {/* Bento Grid */}
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-4 lg:gap-5">
          {/* Traffic Hero Card - Left large card spanning 2 rows */}
          <TrafficHeroCard
            upload={totalUsage?.upload ?? 0}
            download={totalUsage?.download ?? 0}
            total={totalUsage?.total ?? 0}
            limit={totalTrafficLimit}
            isLoading={isLoading}
          />

          {/* Subscription Status - Top right */}
          <StatCard
            icon={<Shield className="size-5" />}
            iconBgClass="bg-success/10 ring-success/20"
            iconColorClass="text-success"
            title="订阅状态"
            value={isLoading ? '...' : (hasActiveSubscription ? '已激活' : '未激活')}
            subtitle={isLoading ? undefined : (hasActiveSubscription ? `${activeSubscriptions.length} 个活跃` : '暂无订阅')}
            isLoading={isLoading}
          />

          {/* Days Remaining */}
          <StatCard
            icon={<Calendar className="size-5" />}
            iconBgClass="bg-warning/10 ring-warning/20"
            iconColorClass="text-warning"
            title="剩余天数"
            value={isLoading ? '...' : (daysRemaining !== null ? daysRemaining : '-')}
            subtitle="天"
            isLoading={isLoading}
          />

          {/* Upload Traffic */}
          <StatCard
            icon={<Upload className="size-5" />}
            iconBgClass="bg-chart-upload/10 ring-chart-upload/20"
            iconColorClass="text-chart-upload"
            title="上传"
            value={isLoading ? '...' : `${uploadFormatted.value} ${uploadFormatted.unit}`}
            subtitle="本月累计"
            isLoading={isLoading}
          />

          {/* Download Traffic */}
          <StatCard
            icon={<Download className="size-5" />}
            iconBgClass="bg-chart-download/10 ring-chart-download/20"
            iconColorClass="text-chart-download"
            title="下载"
            value={isLoading ? '...' : `${downloadFormatted.value} ${downloadFormatted.unit}`}
            subtitle="本月累计"
            isLoading={isLoading}
          />

          {/* Quick Actions */}
          <QuickActionsCard />

          {/* Subscription Details - Full width */}
          <div className="col-span-4 md:col-span-6 lg:col-span-12">
            <SubscriptionCard
              subscriptions={subscriptions}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
