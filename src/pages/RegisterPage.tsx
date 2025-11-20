/**
 * 注册页面
 * 支持邮箱注册和OAuth2快速注册
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { Eye, EyeOff, Chrome, Github, Loader2, CircleAlert } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useNotificationStore } from '@/shared/stores/notification-store';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

// Zod 4 注册表单验证
const registerSchema = z
  .object({
    name: z.string().min(2, '姓名至少需要2个字符').max(100, '姓名最多100个字符'),
    email: z.string().email('请输入有效的邮箱地址'),
    password: z.string().min(8, '密码至少需要8个字符'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

// 密码强度计算
const calculatePasswordStrength = (password: string): number => {
  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 25;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
  if (/[0-9]/.test(password)) strength += 25;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 25;
  return Math.min(strength, 100);
};

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { register: registerUser, loginWithOAuth, isLoading, error } = useAuth();
  const { showSuccess, showError } = useNotificationStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // 已登录则跳转到Dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password', '');

  // 监听密码变化，计算强度
  const handlePasswordChange = (value: string) => {
    setPasswordStrength(calculatePasswordStrength(value));
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      showSuccess('注册成功！请查收验证邮件');
    } catch (err) {
      // 错误信息已在error state中，通过Alert显示
      const errorMessage = err instanceof Error ? err.message : '注册失败，请重试';
      showError(errorMessage);
    }
  };

  const handleOAuthRegister = async (provider: 'google' | 'github') => {
    try {
      await loginWithOAuth(provider);
      showSuccess('注册成功！');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OAuth注册失败';
      showError(errorMessage);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return 'hsl(var(--destructive))';
    if (passwordStrength < 50) return 'hsl(var(--warning))';
    if (passwordStrength < 75) return 'hsl(var(--chart-2))';
    return 'hsl(var(--chart-1))';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return '弱';
    if (passwordStrength < 50) return '中';
    if (passwordStrength < 75) return '良';
    return '强';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">创建账号</CardTitle>
            <CardDescription>加入 Orris，开始您的旅程</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {/* 错误提示 */}
            {error && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* 注册表单 */}
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">姓名</Label>
                <Input
                  id="name"
                  autoComplete="name"
                  autoFocus
                  aria-invalid={!!errors.name}
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
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
                    autoComplete="new-password"
                    aria-invalid={!!errors.password}
                    className="pr-10"
                    {...register('password', {
                      onChange: (e) => handlePasswordChange(e.target.value),
                    })}
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
                {password && (
                  <div className="grid gap-1">
                    <Progress
                      value={passwordStrength}
                      className="h-2"
                      style={{
                        // @ts-ignore - CSS custom property
                        '--progress-background': getPasswordStrengthColor(),
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      密码强度：{getPasswordStrengthText()}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">确认密码</Label>
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
                注册
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

            {/* OAuth 注册按钮 */}
            <div className="grid gap-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => handleOAuthRegister('google')}
                disabled={isLoading}
              >
                <Chrome />
                使用 Google 注册
              </Button>

              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => handleOAuthRegister('github')}
                disabled={isLoading}
              >
                <Github />
                使用 GitHub 注册
              </Button>
            </div>

            {/* 登录链接 */}
            <div className="text-center text-sm text-muted-foreground">
              已有账号？{' '}
              <RouterLink
                to="/login"
                className="text-primary underline-offset-4 hover:underline"
              >
                立即登录
              </RouterLink>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
