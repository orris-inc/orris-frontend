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
import * as authApi from '@/features/auth/api/auth-api';
import { extractErrorMessage } from '@/shared/utils/error-messages';
import { useNotificationStore } from '@/shared/stores/notification-store';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
          <Card>
            <CardHeader className="text-center">
              <CardTitle>无效的重置链接</CardTitle>
              <CardDescription>
                该密码重置链接无效或已过期，请重新申请。
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <RouterLink
                to="/forgot-password"
                className="text-primary underline-offset-4 hover:underline"
              >
                重新申请
              </RouterLink>
            </CardContent>
          </Card>
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
      console.error('重置密码错误:', err);
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
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">重置密码</CardTitle>
            <CardDescription>请输入您的新密码</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {/* 错误提示 */}
            {error && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* 表单 */}
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="password">新密码</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    autoFocus
                    aria-invalid={!!errors.password}
                    className="pr-10"
                    {...register('password')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="切换密码显示"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">确认新密码</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    aria-invalid={!!errors.confirmPassword}
                    className="pr-10"
                    {...register('confirmPassword')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label="切换密码显示"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" size="lg" disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="animate-spin" />}
                重置密码
              </Button>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
