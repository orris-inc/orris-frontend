/**
 * 登录页面
 * 支持邮箱密码登录和OAuth2登录（Google、GitHub）
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router';
import { useEffect, useState } from 'react';
import { Eye, EyeOff, Chrome, Github, Loader2, CircleCheck, CircleAlert, Check } from 'lucide-react';
import * as LabelPrimitive from '@radix-ui/react-label';
import * as Checkbox from '@radix-ui/react-checkbox';
import * as Separator from '@radix-ui/react-separator';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { isAccountNotActiveError } from '@/shared/utils/error-messages';
import { getButtonClass, inputStyles, labelStyles, getAlertClass, alertDescriptionStyles } from '@/lib/ui-styles';
import { cn } from '@/lib/utils';

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
    <div className="min-h-screen flex bg-background">
      {/* 左侧 - 装饰区 */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-12 relative overflow-hidden">
        {/* 装饰性背景 */}
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />

        {/* Logo - 左上角 */}
        <div className="relative z-10">
          <h1 className="text-5xl font-bold text-white">Orris</h1>
        </div>
      </div>

      {/* 右侧 - 登录表单区 */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight">欢迎回来</h2>
            <p className="text-muted-foreground mt-2">登录您的账号继续使用</p>
          </div>

          <div className="grid gap-6">
            {/* 成功消息提示（如注册成功、密码重置成功等） */}
            {successMessage && (
              <div className={getAlertClass('default')}>
                <CircleCheck className="h-4 w-4" />
                <div className={alertDescriptionStyles}>{successMessage}</div>
              </div>
            )}

            {/* 错误提示 */}
            {error && (
              <div className={getAlertClass('destructive')}>
                <CircleAlert className="h-4 w-4" />
                <div className={alertDescriptionStyles}>
                  <div className="flex items-center justify-between gap-2">
                    <span>{error}</span>
                    {showResendVerification && (
                      <button
                        onClick={handleResendVerification}
                        className={cn(getButtonClass('link', 'sm'), "h-auto p-0 text-current")}
                      >
                        前往验证
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 登录表单 */}
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

              <div className="grid gap-2">
                <LabelPrimitive.Root htmlFor="password" className={labelStyles}>密码</LabelPrimitive.Root>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
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

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox.Root
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => {
                      setValue('rememberMe', checked === true);
                    }}
                    className="peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  >
                    <Checkbox.Indicator className="flex items-center justify-center text-current">
                      <Check className="h-3 w-3" />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <LabelPrimitive.Root
                    htmlFor="rememberMe"
                    className="text-sm font-normal cursor-pointer"
                  >
                    记住我
                  </LabelPrimitive.Root>
                </div>
                <RouterLink
                  to="/forgot-password"
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  忘记密码？
                </RouterLink>
              </div>

              <button type="submit" disabled={isLoading} className={cn(getButtonClass('default', 'lg'), "w-full")}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                登录
              </button>
            </form>

            {/* 分隔线 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator.Root className="w-full h-[1px] bg-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">或</span>
              </div>
            </div>

            {/* OAuth 登录按钮 */}
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => handleOAuthLogin('google')}
                disabled={isLoading}
                className={getButtonClass('outline', 'lg')}
              >
                <Chrome className="mr-2 h-4 w-4" />
                使用 Google 登录
              </button>

              <button
                type="button"
                onClick={() => handleOAuthLogin('github')}
                disabled={isLoading}
                className={getButtonClass('outline', 'lg')}
              >
                <Github className="mr-2 h-4 w-4" />
                使用 GitHub 登录
              </button>
            </div>

            {/* 注册链接 */}
            <div className="text-center text-sm text-muted-foreground">
              还没有账号？{' '}
              <RouterLink
                to="/register"
                className="text-primary underline-offset-4 hover:underline font-medium"
              >
                立即注册
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
