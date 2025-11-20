/**
 * 个人资料设置页面
 * 提供完整的个人信息编辑界面
 */

import { Info } from 'lucide-react';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { AvatarUpload } from '@/features/profile/components/AvatarUpload';
import { BasicInfoTab } from '@/features/profile/components/BasicInfoTab';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

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
        <Card>
          {/* 头像上传区域 */}
          <CardHeader className="bg-muted/50">
            <CardTitle>个人头像</CardTitle>
            <CardDescription>
              点击上传新头像，支持JPG、PNG和WebP格式，文件大小不超过2MB
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <AvatarUpload avatar={user.avatar} name={user.name} />
          </CardContent>

          <Separator />

          {/* 个人信息表单区域 */}
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent>
            <BasicInfoTab user={user} />
          </CardContent>
        </Card>

        {/* 帮助提示 */}
        <Alert className="mt-6">
          <Info className="size-4" />
          <AlertDescription>
            提示: 修改邮箱地址需要重新验证。如需更改密码，请访问账户设置页面。
          </AlertDescription>
        </Alert>
      </div>
    </DashboardLayout>
  );
};
