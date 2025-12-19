/**
 * 忘记密码页面
 * 发送密码重置邮件
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink } from 'react-router';
import { useState } from 'react';
import { ArrowLeft, Mail, Loader2, CircleAlert } from 'lucide-react';
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
const forgotPasswordSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage = () => {
  const { showSuccess, showError } = useNotificationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await authApi.forgotPassword(data);
      setSuccess(true);
      showSuccess('重置邮件已发送,请查收邮箱');
    } catch (err) {
      const errorMsg = extractErrorMessage(err);
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md">
          <div className={cardStyles}>
            <div className={cn(cardContentStyles, "pt-6 text-center grid gap-6")}>
              <div className="flex justify-center">
                <div className="size-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <Mail className="size-10 text-green-600 dark:text-green-500" />
                </div>
              </div>

              <div className="grid gap-2">
                <h1 className="text-2xl font-bold">邮件已发送</h1>
                <p className="text-muted-foreground">
                  我们已经向您的邮箱发送了密码重置链接,请查收邮件并按照指引重置密码。
                </p>
                <p className="text-sm text-muted-foreground">
                  如果您没有收到邮件,请检查垃圾邮件文件夹或稍后重试。
                </p>
              </div>

              <RouterLink
                to="/login"
                className="inline-flex items-center justify-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
              >
                <ArrowLeft className="size-4" />
                返回登录
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className={cardStyles}>
          <div className={cn(cardHeaderStyles, "text-center")}>
            <h3 className={cardTitleStyles}>忘记密码</h3>
            <p className={cardDescriptionStyles}>输入您的邮箱地址,我们将发送密码重置链接</p>
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
                <LabelPrimitive.Root htmlFor="email" className={labelStyles}>邮箱</LabelPrimitive.Root>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  aria-invalid={!!errors.email}
                  className={inputStyles}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <button type="submit" disabled={isLoading} className={cn(getButtonClass('default', 'lg'), "w-full")}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                发送重置链接
              </button>
            </form>

            {/* 返回登录 */}
            <div className="text-center">
              <RouterLink
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
              >
                <ArrowLeft className="size-4" />
                返回登录
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
