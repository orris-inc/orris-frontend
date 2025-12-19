import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Loader2 } from 'lucide-react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { useProfile } from '../hooks/useProfile';
import {
  updateProfileSchema,
  type UpdateProfileFormData,
} from '../types/profile.types';
import type { UserDisplayInfo } from '@/api/auth';

interface BasicInfoTabProps {
  user: UserDisplayInfo;
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
      name: user.displayName || '',
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
    } catch {
      // 错误已在useProfile中处理
    }
  };

  return (
    <div className="py-2">
      {/* 基本信息表单 */}
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
        {/* 用户名 */}
        <div className="grid gap-2">
          <LabelPrimitive.Root htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            用户名
          </LabelPrimitive.Root>
          <input
            id="name"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...register('name')}
            aria-invalid={!!errors.name}
          />
          <p className="text-sm text-muted-foreground">
            {errors.name?.message || '2-100个字符'}
          </p>
        </div>

        {/* 邮箱 */}
        <div className="grid gap-2">
          <LabelPrimitive.Root htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            邮箱
          </LabelPrimitive.Root>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="email"
              type="email"
              className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register('email')}
              aria-invalid={!!errors.email}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {errors.email?.message || '修改邮箱后需要重新验证'}
          </p>
        </div>

        {/* 账号状态 */}
        <div className="grid gap-2">
          <LabelPrimitive.Root className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            账号状态
          </LabelPrimitive.Root>
          <div>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${user.status === 'active'
                ? 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80'
                : 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}>
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
            </span>
          </div>
        </div>

        {/* 邮箱修改提醒 */}
        {isDirty && (
          <div className="relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground">
            <Mail className="size-4" />
            <div className="text-sm [&_p]:leading-relaxed">
              修改邮箱地址后需要重新验证，请查收验证邮件
            </div>
          </div>
        )}

        {/* 保存按钮 */}
        <button
          type="submit"
          disabled={!isDirty || isLoading}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          保存更改
        </button>
      </form>
    </div>
  );
};
