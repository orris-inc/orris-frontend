/**
 * Dashboard 主页面
 * 显示用户信息和快捷操作
 */

import { Hand, CircleAlert } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { UserProfileCard } from '@/components/dashboard/UserProfileCard';
import { SubscriptionCard } from '@/components/dashboard/SubscriptionCard';
import { QuickLinks } from '@/components/dashboard/QuickLinks';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const DashboardPage = () => {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>无法加载用户信息</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 py-6 sm:py-8">
        {/* 欢迎标题区 */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Hand className="size-10 text-amber-500 drop-shadow-sm" />
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                欢迎回来，{user.display_name || user.name || user.email?.split('@')[0] || '用户'}！
              </h1>
              <p className="text-muted-foreground mt-1">
                这是您的个人控制面板，管理您的账户和订阅
              </p>
            </div>
          </div>
        </div>

        {/* 邮箱未验证提示 */}
        {!user.email_verified && (
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <CircleAlert className="size-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              您的邮箱尚未验证，请查收验证邮件以激活全部功能
            </AlertDescription>
          </Alert>
        )}

        {/* 关键指标栏 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">账户概览</h2>
          <StatsOverview user={user} />
        </div>

        {/* 主要内容区 - 响应式网格布局 */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">详细信息</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 用户资料卡片 */}
            <div className="lg:col-span-1">
              <UserProfileCard user={user} />
            </div>

            {/* 订阅卡片 */}
            <div className="lg:col-span-1">
              <SubscriptionCard />
            </div>

            {/* 快速链接 */}
            <div className="lg:col-span-1">
              <QuickLinks />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
