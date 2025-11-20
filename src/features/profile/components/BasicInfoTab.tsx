import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProfile } from '../hooks/useProfile';
import {
  updateProfileSchema,
  type UpdateProfileFormData,
} from '../types/profile.types';
import type { User } from '@/features/auth/types/auth.types';

interface BasicInfoTabProps {
  user: User;
}

/**
 * 基本信息Tab
 */
export const BasicInfoTab = ({ user }: BasicInfoTabProps) => {
  const { updateProfile, isLoading } = useProfile();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name || user.display_name || '',
      email: user.email || '',
    },
  });

  const onSubmit = async (data: UpdateProfileFormData) => {
    try {
      // 只发送有值的字段
      const payload: UpdateProfileFormData = {};
      if (data.name && data.name.trim()) {
        payload.name = data.name.trim();
      }
      if (data.email && data.email.trim() && data.email !== user.email) {
        payload.email = data.email.trim();
      }

      await updateProfile(payload);
    } catch (error) {
      // 错误已在useProfile中处理
    }
  };

  return (
    <div className="py-2">
      {/* 基本信息表单 */}
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
        {/* 用户名 */}
        <div className="grid gap-2">
          <Label htmlFor="name">用户名</Label>
          <Input
            id="name"
            {...register('name')}
            aria-invalid={!!errors.name}
          />
          <p className="text-sm text-muted-foreground">
            {errors.name?.message || '2-100个字符'}
          </p>
        </div>

        {/* 邮箱 */}
        <div className="grid gap-2">
          <Label htmlFor="email">邮箱</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              className="pl-10"
              {...register('email')}
              aria-invalid={!!errors.email}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {errors.email?.message || '修改邮箱后需要重新验证'}
          </p>
          <div className="flex items-center gap-2">
            {user.email_verified ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="size-3" />
                已验证
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <AlertCircle className="size-3" />
                未验证
              </Badge>
            )}
          </div>
        </div>

        {/* 显示名称（只读，由后端生成） */}
        {user.display_name && (
          <div className="grid gap-2">
            <Label htmlFor="display_name">显示名称</Label>
            <Input
              id="display_name"
              value={user.display_name}
              disabled
            />
            <p className="text-sm text-muted-foreground">由系统自动生成</p>
          </div>
        )}

        {/* 用户标识（只读） */}
        {user.initials && (
          <div className="grid gap-2">
            <Label htmlFor="initials">姓名首字母</Label>
            <Input
              id="initials"
              value={user.initials}
              disabled
            />
            <p className="text-sm text-muted-foreground">由系统自动生成</p>
          </div>
        )}

        {/* 账号状态 */}
        <div className="grid gap-2">
          <Label>账号状态</Label>
          <div>
            <Badge
              variant={user.status === 'active' ? 'default' : 'secondary'}
            >
              {
                user.status === 'active'
                  ? '正常'
                  : user.status === 'inactive'
                  ? '未激活'
                  : user.status === 'suspended'
                  ? '已暂停'
                  : user.status === 'pending'
                  ? '待处理'
                  : '未知'
              }
            </Badge>
          </div>
        </div>

        {/* OAuth提供商 */}
        {user.oauth_provider && (
          <div className="grid gap-2">
            <Label>登录方式</Label>
            <div>
              <Badge variant="outline">
                {
                  user.oauth_provider === 'google'
                    ? 'Google'
                    : user.oauth_provider === 'github'
                    ? 'GitHub'
                    : user.oauth_provider
                }
              </Badge>
            </div>
          </div>
        )}

        {/* 注册时间 */}
        <div className="grid gap-2">
          <Label>注册时间</Label>
          <p className="text-sm">
            {new Date(user.created_at).toLocaleString('zh-CN')}
          </p>
        </div>

        {/* 最后更新时间 */}
        {user.updated_at && (
          <div className="grid gap-2">
            <Label>最后更新</Label>
            <p className="text-sm">
              {new Date(user.updated_at).toLocaleString('zh-CN')}
            </p>
          </div>
        )}

        {/* 邮箱修改提醒 */}
        {isDirty && (
          <Alert>
            <Mail className="size-4" />
            <AlertDescription>
              修改邮箱地址后需要重新验证，请查收验证邮件
            </AlertDescription>
          </Alert>
        )}

        {/* 保存按钮 */}
        <Button
          type="submit"
          disabled={!isDirty || isLoading}
          className="w-full"
        >
          {isLoading && <Loader2 className="animate-spin" />}
          保存更改
        </Button>
      </form>
    </div>
  );
};
