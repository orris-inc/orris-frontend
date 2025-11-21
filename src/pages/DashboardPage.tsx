/**
 * Dashboard 主页面
 * 显示用户信息和快捷操作
 */

import { CircleAlert } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { SubscriptionCard } from '@/components/dashboard/SubscriptionCard';
import { getAlertClass, alertDescriptionStyles } from '@/lib/ui-styles';

export const DashboardPage = () => {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <DashboardLayout>
        <div className={getAlertClass('destructive')}>
          <CircleAlert className="h-4 w-4" />
          <div className={alertDescriptionStyles}>无法加载用户信息</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 py-8 sm:py-12">
        {/* 标题区 */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            欢迎回来
          </h1>
          <p className="text-lg text-muted-foreground">
            {user.display_name || user.name || user.email?.split('@')[0] || '用户'}
          </p>
        </div>

        {/* 邮箱未验证提示 */}
        {!user.email_verified && (
          <div className="relative w-full rounded-2xl border-none bg-amber-50/80 backdrop-blur-xl dark:bg-amber-950/30 p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground">
            <CircleAlert className="size-4 text-amber-600" />
            <div className="text-sm [&_p]:leading-relaxed text-amber-800 dark:text-amber-200">
              您的邮箱尚未验证，请查收验证邮件
            </div>
          </div>
        )}

        {/* 订阅卡片 - 全宽显示 */}
        <SubscriptionCard />
      </div>
    </DashboardLayout>
  );
};
