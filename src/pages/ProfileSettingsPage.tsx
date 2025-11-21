/**
 * 个人资料设置页面
 * 提供完整的个人信息编辑界面
 */

import * as Separator from '@radix-ui/react-separator';
import { Info } from 'lucide-react';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { AvatarUpload } from '@/features/profile/components/AvatarUpload';
import { BasicInfoTab } from '@/features/profile/components/BasicInfoTab';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import {
  cardStyles,
  cardHeaderStyles,
  cardTitleStyles,
  cardDescriptionStyles,
  cardContentStyles,
  getAlertClass,
  alertDescriptionStyles
} from '@/lib/ui-styles';

export const ProfileSettingsPage = () => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return (
      <DashboardLayout>
        <div className="container max-w-5xl py-8">
          <p className="text-lg text-muted-foreground">请先登录</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-5xl py-8">
        {/* 页面标题 */}
        <h1 className="mb-6 text-4xl font-bold">个人资料设置</h1>

        {/* 主内容区域 */}
        <div className={cardStyles}>
          {/* 头像上传区域 */}
          <div className={`${cardHeaderStyles} bg-muted/50`}>
            <h3 className={cardTitleStyles}>个人头像</h3>
            <p className={cardDescriptionStyles}>
              点击上传新头像，支持JPG、PNG和WebP格式，文件大小不超过2MB
            </p>
          </div>
          <div className={`${cardContentStyles} pt-6`}>
            <AvatarUpload avatar={user.avatar} name={user.name} />
          </div>

          <Separator.Root className="my-0 h-[1px] bg-border" />

          {/* 个人信息表单区域 */}
          <div className={cardHeaderStyles}>
            <h3 className={cardTitleStyles}>基本信息</h3>
          </div>
          <div className={cardContentStyles}>
            <BasicInfoTab user={user} />
          </div>
        </div>

        {/* 帮助提示 */}
        <div className={getAlertClass('default', 'mt-6')}>
          <Info className="size-4" />
          <div className={alertDescriptionStyles}>
            提示: 修改邮箱地址需要重新验证。如需更改密码，请访问账户设置页面。
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
