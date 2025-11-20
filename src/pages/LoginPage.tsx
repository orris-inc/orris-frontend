/**
 * 登录页面
 * 支持邮箱密码登录和OAuth2登录（Google、GitHub）
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router';
import { useEffect, useState } from 'react';
import { Eye, EyeOff, Chrome, Github, Loader2, CircleCheck, CircleAlert } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { isAccountNotActiveError } from '@/shared/utils/error-messages';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

// Zod 4 登录表单验证
const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(8, '密码至少需要8个字符'),
  rememberMe: z.boolean().catch(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  const { login, loginWithOAuth, isLoading, error } = useAuth();
  const { showSuccess, showError } = useNotificationStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');

  // 从 location.state 获取提示消息（例如注册成功或密码重置成功）
  const state = location.state as { message?: string } | null;
  const successMessage = state?.message;

  // 已登录则根据用户角色跳转
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = user.role === 'admin' ? '/admin' : '/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const rememberMe = watch('rememberMe');

  const onSubmit = async (data: LoginFormData) => {
    setShowResendVerification(false);
    setUserEmail(data.email);

    try {
      await login(data);
      showSuccess('登录成功！');
    } catch (err) {
      // 检查是否是账号未激活错误
      if (isAccountNotActiveError(err)) {
        setShowResendVerification(true);
      }
      const errorMessage = err instanceof Error ? err.message : '登录失败，请重试';
      showError(errorMessage);
    }
  };

  const handleResendVerification = () => {
    // 跳转到验证待处理页面，用户可以在那里输入邮箱并重新发送验证邮件
    navigate('/verification-pending', {
      state: { email: userEmail },
    });
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    try {
      await loginWithOAuth(provider);
      showSuccess('登录成功！');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OAuth登录失败';
      showError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">欢迎回来</CardTitle>
            <CardDescription>登录您的 Orris 账号</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {/* 成功消息提示（如注册成功、密码重置成功等） */}
            {successMessage && (
              <Alert>
                <CircleCheck />
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            {/* 错误提示 */}
            {error && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertDescription>
                  <div className="flex items-center justify-between gap-2">
                    <span>{error}</span>
                    {showResendVerification && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={handleResendVerification}
                        className="h-auto p-0 text-current"
                      >
                        前往验证
                      </Button>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* 登录表单 */}
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
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

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => {
                      setValue('rememberMe', checked === true);
                    }}
                  />
                  <Label
                    htmlFor="rememberMe"
                    className="text-sm font-normal cursor-pointer"
                  >
                    记住我
                  </Label>
                </div>
                <RouterLink
                  to="/forgot-password"
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  忘记密码？
                </RouterLink>
              </div>

              <Button type="submit" size="lg" disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="animate-spin" />}
                登录
              </Button>
            </form>

            {/* 分隔线 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">或</span>
              </div>
            </div>

            {/* OAuth 登录按钮 */}
            <div className="grid gap-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => handleOAuthLogin('google')}
                disabled={isLoading}
              >
                <Chrome />
                使用 Google 登录
              </Button>

              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => handleOAuthLogin('github')}
                disabled={isLoading}
              >
                <Github />
                使用 GitHub 登录
              </Button>
            </div>

            {/* 注册链接 */}
            <div className="text-center text-sm text-muted-foreground">
              还没有账号？{' '}
              <RouterLink
                to="/register"
                className="text-primary underline-offset-4 hover:underline"
              >
                立即注册
              </RouterLink>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
