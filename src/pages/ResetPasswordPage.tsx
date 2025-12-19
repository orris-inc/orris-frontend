/**
 * 重置密码页面
 * 通过邮件中的token重置密码
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink, useSearchParams, useNavigate } from 'react-router';
import { useState } from 'react';
import { Eye, EyeOff, Loader2, CircleAlert } from 'lucide-react';
import * as LabelPrimitive from '@radix-ui/react-label';
import * as authApi from '@/api/auth';
import { extractErrorMessage } from '@/shared/utils/error-messages';
import { useNotificationStore } from '@/shared/stores/notification-store';
import {
  getButtonClass,
  inputStyles,
  labelStyles,
  cardStyles,
  cardHeaderStyles,
  cardTitleStyles,
  cardDescriptionStyles,
  cardContentStyles,
  getAlertClass,
  alertDescriptionStyles
} from '@/lib/ui-styles';
import { cn } from '@/lib/utils';

// Zod验证
const resetPasswordSchema = z
  .object({
    password: z.string().min(8, '密码至少需要8个字符'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const { showSuccess, showError } = useNotificationStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // 检查token
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md">
          <div className={cardStyles}>
            <div className={cn(cardHeaderStyles, "text-center")}>
              <h3 className={cardTitleStyles}>无效的重置链接</h3>
              <p className={cardDescriptionStyles}>
                该密码重置链接无效或已过期，请重新申请。
              </p>
            </div>
            <div className={cn(cardContentStyles, "text-center")}>
              <RouterLink
                to="/forgot-password"
                className="text-primary underline-offset-4 hover:underline"
              >
                重新申请
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await authApi.resetPassword({
        token,
        password: data.password,
      });

      showSuccess('密码重置成功！');
      // 成功，跳转到登录页
      navigate('/login', {
        state: { message: '密码重置成功，请使用新密码登录' },
      });
    } catch (err) {
      const errorMsg = extractErrorMessage(err);
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className={cardStyles}>
          <div className={cn(cardHeaderStyles, "text-center")}>
            <h3 className={cn(cardTitleStyles, "text-3xl")}>重置密码</h3>
            <p className={cardDescriptionStyles}>请输入您的新密码</p>
          </div>
          <div className={cn(cardContentStyles, "grid gap-6")}>
            {/* 错误提示 */}
            {error && (
              <div className={getAlertClass('destructive')}>
                <CircleAlert className="h-4 w-4" />
                <div className={alertDescriptionStyles}>{error}</div>
              </div>
            )}

            {/* 表单 */}
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
              <div className="grid gap-2">
                <LabelPrimitive.Root htmlFor="password" className={labelStyles}>新密码</LabelPrimitive.Root>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    autoFocus
                    aria-invalid={!!errors.password}
                    className={cn(inputStyles, "pr-10")}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground h-8 w-8 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="切换密码显示"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <LabelPrimitive.Root htmlFor="confirmPassword" className={labelStyles}>确认新密码</LabelPrimitive.Root>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    aria-invalid={!!errors.confirmPassword}
                    className={cn(inputStyles, "pr-10")}
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground h-8 w-8 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label="切换密码显示"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button type="submit" disabled={isLoading} className={cn(getButtonClass('default', 'lg'), "w-full")}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                重置密码
              </button>
            </form>

            {/* 返回登录 */}
            <div className="text-center text-sm text-muted-foreground">
              <RouterLink
                to="/login"
                className="text-primary underline-offset-4 hover:underline"
              >
                返回登录
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
