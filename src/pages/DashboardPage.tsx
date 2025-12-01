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
import { getSubscriptions } from '@/features/subscriptions/api/subscriptions-api';
import type { Subscription } from '@/features/subscriptions/types/subscriptions.types';
import { SubscriptionCard } from '@/components/dashboard/SubscriptionCard';

export const DashboardPage = () => {
  const { user } = useAuthStore();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const result = await getSubscriptions({ page: 1, page_size: 100 });
        if (result.items && result.items.length > 0) {
          setSubscriptions(result.items);
        }
      } catch (err) {
        console.error('获取订阅信息失败:', err);
      }
    };

    fetchSubscriptions();
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

  const activeSubscriptions = subscriptions.filter((sub) => sub.IsActive && !sub.IsExpired);
  const hasActiveSubscription = activeSubscriptions.length > 0;
  const primarySubscription = activeSubscriptions[0];

  const getDaysRemaining = (endDate?: string) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const daysRemaining = primarySubscription ? getDaysRemaining(primarySubscription.EndDate) : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 欢迎 */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {user.display_name || user.name || user.email?.split('@')[0] || '用户'}
          </h1>
          <p className="text-muted-foreground">欢迎回来</p>
        </div>

        {/* 邮箱未验证提示 */}
        {!user.email_verified && (
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
            <div className="text-2xl font-semibold font-mono">2.4</div>
            <p className="text-sm text-muted-foreground mt-1">GB 本月</p>
          </div>

          {/* 下载流量 */}
          <div className="p-5 rounded-xl bg-card border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-pink-500/10">
                <Download className="h-5 w-5 text-pink-500" />
              </div>
              <span className="text-sm text-muted-foreground">下载</span>
            </div>
            <div className="text-2xl font-semibold font-mono">18.7</div>
            <p className="text-sm text-muted-foreground mt-1">GB 本月</p>
          </div>
        </div>

        {/* 流量进度 */}
        <div className="p-5 rounded-xl bg-card border">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-muted-foreground">流量使用</span>
            <span className="text-sm font-mono">21.1 / 100 GB</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: '21.1%' }} />
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
