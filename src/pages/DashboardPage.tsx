/**
 * Dashboard 主页面 - 简约风格
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
import { listSubscriptions, getTrafficStats } from '@/api/subscription';
import type { Subscription, TrafficSummary } from '@/api/subscription/types';
import { SubscriptionCard } from '@/components/dashboard/SubscriptionCard';

/**
 * 格式化字节数为可读的流量单位
 */
const formatTraffic = (bytes: number): { value: string; unit: string } => {
  if (bytes === 0) return { value: '0', unit: 'B' };
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = (bytes / Math.pow(k, i)).toFixed(1);
  return { value, unit: units[i] };
};

/**
 * 获取本月的起止时间
 */
const getMonthRange = (): { from: string; to: string } => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return {
    from: firstDay.toISOString(),
    to: lastDay.toISOString(),
  };
};

export const DashboardPage = () => {
  const { user } = useAuthStore();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [totalTrafficSummary, setTotalTrafficSummary] = useState<TrafficSummary | null>(null);
  const [totalTrafficLimit, setTotalTrafficLimit] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await listSubscriptions({ page: 1, pageSize: 100 });
        if (result.items && result.items.length > 0) {
          setSubscriptions(result.items);

          const activeSubscriptions = result.items.filter((sub: Subscription) => sub.status === 'active');
          if (activeSubscriptions.length > 0) {
            const { from, to } = getMonthRange();

            // 获取所有活跃订阅的流量并汇总
            const trafficPromises = activeSubscriptions.map((sub) =>
              getTrafficStats(sub.id, { from, to }).catch(() => null)
            );
            const trafficResults = await Promise.all(trafficPromises);

            // 汇总所有订阅的流量
            let totalUpload = 0;
            let totalDownload = 0;
            let total = 0;
            let totalLimit = 0;

            trafficResults.forEach((trafficData, index) => {
              if (trafficData?.summary) {
                totalUpload += trafficData.summary.totalUpload;
                totalDownload += trafficData.summary.totalDownload;
                total += trafficData.summary.total;
              }
              // 累加每个订阅的流量限制
              const limits = activeSubscriptions[index].plan?.limits as { trafficLimit?: number } | undefined;
              if (limits?.trafficLimit) {
                totalLimit += limits.trafficLimit;
              }
            });

            setTotalTrafficSummary({ totalUpload, totalDownload, total });
            setTotalTrafficLimit(totalLimit);
          }
        }
      } catch (err) {
        console.error('获取订阅信息失败:', err);
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

  const activeSubscriptions = subscriptions.filter((sub) => sub.status === 'active');
  const hasActiveSubscription = activeSubscriptions.length > 0;
  const primarySubscription = activeSubscriptions[0];

  const getDaysRemaining = (endDate?: string) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const daysRemaining = primarySubscription ? getDaysRemaining(primarySubscription.endDate) : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 欢迎 */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {user.displayName || user.email?.split('@')[0] || '用户'}
          </h1>
          <p className="text-muted-foreground">欢迎回来</p>
        </div>

        {/* 邮箱未验证提示 */}
        {!user.emailVerified && (
          <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <CircleAlert className="h-5 w-5 text-amber-500" />
            <div>
              <p className="font-medium text-amber-600 dark:text-amber-400">邮箱未验证</p>
              <p className="text-sm text-muted-foreground">请查收验证邮件以解锁完整功能</p>
            </div>
          </div>
        )}

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 订阅状态 */}
          <div className="p-5 rounded-xl bg-card border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Shield className="h-5 w-5 text-emerald-500" />
              </div>
              <span className="text-sm text-muted-foreground">订阅状态</span>
            </div>
            <div className="text-2xl font-semibold">
              {hasActiveSubscription ? '已激活' : '未激活'}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {hasActiveSubscription ? `${activeSubscriptions.length} 个活跃` : '暂无订阅'}
            </p>
          </div>

          {/* 剩余天数 */}
          <div className="p-5 rounded-xl bg-card border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Calendar className="h-5 w-5 text-amber-500" />
              </div>
              <span className="text-sm text-muted-foreground">剩余天数</span>
            </div>
            <div className="text-2xl font-semibold font-mono">
              {daysRemaining !== null ? daysRemaining : '-'}
            </div>
            <p className="text-sm text-muted-foreground mt-1">天</p>
          </div>

          {/* 上传流量 */}
          <div className="p-5 rounded-xl bg-card border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Upload className="h-5 w-5 text-blue-500" />
              </div>
              <span className="text-sm text-muted-foreground">上传</span>
            </div>
            <div className="text-2xl font-semibold font-mono">
              {totalTrafficSummary ? formatTraffic(totalTrafficSummary.totalUpload).value : '-'}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {totalTrafficSummary ? formatTraffic(totalTrafficSummary.totalUpload).unit : ''} 本月
            </p>
          </div>

          {/* 下载流量 */}
          <div className="p-5 rounded-xl bg-card border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-pink-500/10">
                <Download className="h-5 w-5 text-pink-500" />
              </div>
              <span className="text-sm text-muted-foreground">下载</span>
            </div>
            <div className="text-2xl font-semibold font-mono">
              {totalTrafficSummary ? formatTraffic(totalTrafficSummary.totalDownload).value : '-'}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {totalTrafficSummary ? formatTraffic(totalTrafficSummary.totalDownload).unit : ''} 本月
            </p>
          </div>
        </div>

        {/* 流量进度 */}
        <div className="p-5 rounded-xl bg-card border">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-muted-foreground">总流量使用</span>
            <span className="text-sm font-mono">
              {totalTrafficSummary ? formatTraffic(totalTrafficSummary.total).value : '-'}{' '}
              {totalTrafficSummary ? formatTraffic(totalTrafficSummary.total).unit : ''} /{' '}
              {totalTrafficLimit > 0 ? formatTraffic(totalTrafficLimit).value : '-'}{' '}
              {totalTrafficLimit > 0 ? formatTraffic(totalTrafficLimit).unit : ''}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary"
              style={{
                width: totalTrafficLimit > 0 && totalTrafficSummary
                  ? `${Math.min((totalTrafficSummary.total / totalTrafficLimit) * 100, 100)}%`
                  : '0%',
              }}
            />
          </div>
        </div>

        {/* 快捷操作 */}
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

        {/* 订阅详情 */}
        <SubscriptionCard />
      </div>
    </DashboardLayout>
  );
};
