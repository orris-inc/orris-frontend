/**
 * 关键指标概览卡片
 * 显示用户账户的关键统计信息
 */

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, CreditCard, Mail, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { User } from '@/features/auth/types/auth.types';
import { getSubscriptions } from '@/features/subscriptions/api/subscriptions-api';
import type { Subscription } from '@/features/subscriptions/types/subscriptions.types';

interface StatsOverviewProps {
  user: User;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: 'success' | 'error' | 'primary' | 'warning' | 'info';
  loading?: boolean;
}

const colorClasses = {
  success: {
    bg: 'bg-green-50 dark:bg-green-950',
    border: 'border-green-200 dark:border-green-800',
    iconBg: 'bg-green-500',
    text: 'text-green-700 dark:text-green-300',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-200 dark:border-red-800',
    iconBg: 'bg-red-500',
    text: 'text-red-700 dark:text-red-300',
  },
  primary: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-200 dark:border-blue-800',
    iconBg: 'bg-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950',
    border: 'border-amber-200 dark:border-amber-800',
    iconBg: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
  },
  info: {
    bg: 'bg-sky-50 dark:bg-sky-950',
    border: 'border-sky-200 dark:border-sky-800',
    iconBg: 'bg-sky-500',
    text: 'text-sky-700 dark:text-sky-300',
  },
};

const StatCard = ({ icon, label, value, color = 'primary', loading }: StatCardProps) => {
  const colors = colorClasses[color];

  return (
    <Card className={`flex-1 min-w-full sm:min-w-[200px] transition-all hover:shadow-md hover:-translate-y-0.5 ${colors.bg} border ${colors.border}`}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className={`flex items-center justify-center size-12 rounded-xl ${colors.iconBg} text-white shadow-sm`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground font-medium mb-1">{label}</p>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className={`text-2xl font-bold ${colors.text}`}>{value}</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export const StatsOverview = ({ user }: StatsOverviewProps) => {
  const [activeSubscriptionCount, setActiveSubscriptionCount] = useState(0);
  const [nearestExpiry, setNearestExpiry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptionStats = async () => {
      try {
        setLoading(true);
        const result = await getSubscriptions({ page: 1, page_size: 100 });

        if (result.items && result.items.length > 0) {
          // 统计激活的订阅
          const activeSubscriptions = result.items.filter(
            (sub: Subscription) => sub.IsActive && !sub.IsExpired
          );
          setActiveSubscriptionCount(activeSubscriptions.length);

          // 查找最近的到期日期
          const activeDates = activeSubscriptions
            .map((sub: Subscription) => sub.EndDate || sub.CurrentPeriodEnd)
            .filter(Boolean) as string[];

          if (activeDates.length > 0) {
            const sortedDates = activeDates.sort(
              (a, b) => new Date(a).getTime() - new Date(b).getTime()
            );
            const nearest = sortedDates[0];
            const daysUntilExpiry = Math.ceil(
              (new Date(nearest).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
            setNearestExpiry(daysUntilExpiry > 0 ? `${daysUntilExpiry} 天` : '已到期');
          }
        }
      } catch (err) {
        console.error('获取订阅统计失败:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionStats();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 活跃订阅数 */}
      <StatCard
        icon={<CreditCard className="size-6" />}
        label="活跃订阅"
        value={loading ? '-' : activeSubscriptionCount}
        color="primary"
        loading={loading}
      />

      {/* 最近到期时间 */}
      {activeSubscriptionCount > 0 && (
        <StatCard
          icon={<Calendar className="size-6" />}
          label="最近到期"
          value={nearestExpiry || '-'}
          color="warning"
          loading={loading}
        />
      )}

      {/* 邮箱验证状态 */}
      <StatCard
        icon={user.email_verified ? <CheckCircle className="size-6" /> : <XCircle className="size-6" />}
        label="邮箱状态"
        value={user.email_verified ? '已验证' : '未验证'}
        color={user.email_verified ? 'success' : 'error'}
      />

      {/* 登录方式 */}
      {user.oauth_provider && (
        <StatCard
          icon={<Mail className="size-6" />}
          label="登录方式"
          value={user.oauth_provider.toUpperCase()}
          color="info"
        />
      )}
    </div>
  );
};
