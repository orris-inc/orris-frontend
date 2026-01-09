/**
 * Profile settings page
 * Provides complete personal information editing interface with iOS 26 Liquid Glass style
 */

import * as Separator from '@radix-ui/react-separator';
import { Info } from 'lucide-react';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { usePageTitle } from '@/shared/hooks';
import { AvatarUpload } from '@/features/profile/components/AvatarUpload';
import { BasicInfoTab } from '@/features/profile/components/BasicInfoTab';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import {
  cardTitleStyles,
  cardDescriptionStyles,
  alertDescriptionStyles
} from '@/lib/ui-styles';

export const ProfileSettingsPage = () => {
  usePageTitle('个人资料');

  const user = useAuthStore((state) => state.user);

  if (!user) {
    return (
      <DashboardLayout>
        <div className="container max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          <p className="text-lg text-muted-foreground">请先登录</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-5xl px-4 py-6 pb-safe sm:px-6 sm:py-8">
        {/* Page title */}
        <h1 className="mb-4 text-fluid-2xl font-bold sm:mb-6 sm:text-4xl">
          个人资料设置
        </h1>

        {/* Main content area - iOS 26 Liquid Glass card */}
        <div className="glass-elevated rounded-2xl overflow-hidden animate-spring-in">
          {/* Avatar upload section */}
          <div className="flex flex-col space-y-1.5 p-4 sm:p-6 bg-muted/30">
            <h3 className={`${cardTitleStyles} text-xl sm:text-2xl`}>
              个人头像
            </h3>
            <p className={`${cardDescriptionStyles} text-xs sm:text-sm`}>
              点击上传新头像，支持JPG、PNG和WebP格式，文件大小不超过2MB
            </p>
          </div>
          <div className="p-4 pt-4 sm:p-6 sm:pt-6">
            <AvatarUpload avatar={undefined} name={user.displayName} />
          </div>

          {/* Separator with translucent border */}
          <Separator.Root className="my-0 h-[1px] bg-border/50" />

          {/* Basic info form section */}
          <div className="flex flex-col space-y-1.5 p-4 sm:p-6">
            <h3 className={`${cardTitleStyles} text-xl sm:text-2xl`}>
              基本信息
            </h3>
          </div>
          <div className="p-4 pt-0 sm:p-6 sm:pt-0">
            <BasicInfoTab user={user} />
          </div>
        </div>

        {/* Help tip - iOS 26 Liquid Glass style */}
        <div className="glass relative mt-4 w-full rounded-xl p-4 sm:mt-6 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground">
          <Info className="size-4" />
          <div className={alertDescriptionStyles}>
            提示: 修改邮箱地址需要重新验证。如需更改密码，请访问账户设置页面。
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
