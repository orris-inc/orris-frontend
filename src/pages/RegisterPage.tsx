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
import * as LabelPrimitive from '@radix-ui/react-label';
import * as Separator from '@radix-ui/react-separator';
import * as Progress from '@radix-ui/react-progress';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/features/auth/stores/auth-store';
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

// Zod 4 注册表单验证
const registerSchema = z
  .object({
    name: z.string().min(2, '姓名至少需要2个字符').max(100, '姓名最多100个字符'),
    email: z.string().email('请输入有效的邮箱地址'),
    password: z
      .string()
      .min(8, '密码至少需要8个字符')
      .regex(/[A-Z]/, '密码必须至少包含一个大写字母'),
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
        <div className={cardStyles}>
          <div className={cn(cardHeaderStyles, "text-center")}>
            <h3 className={cn(cardTitleStyles, "text-3xl")}>创建账号</h3>
            <p className={cardDescriptionStyles}>加入 Orris，开始您的旅程</p>
          </div>
          <div className={cn(cardContentStyles, "grid gap-6")}>
            {/* 错误提示 */}
            {error && (
              <div className={getAlertClass('destructive')}>
                <CircleAlert className="h-4 w-4" />
                <div className={alertDescriptionStyles}>{error}</div>
              </div>
            )}

            {/* 注册表单 */}
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
              <div className="grid gap-2">
                <LabelPrimitive.Root htmlFor="name" className={labelStyles}>姓名</LabelPrimitive.Root>
                <input
                  id="name"
                  autoComplete="name"
                  autoFocus
                  aria-invalid={!!errors.name}
                  className={inputStyles}
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <LabelPrimitive.Root htmlFor="email" className={labelStyles}>邮箱</LabelPrimitive.Root>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
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
                    autoComplete="new-password"
                    aria-invalid={!!errors.password}
                    className={cn(inputStyles, "pr-10")}
                    {...register('password', {
                      onChange: (e) => handlePasswordChange(e.target.value),
                    })}
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
                {!errors.password && !password && (
                  <p className="text-xs text-muted-foreground">
                    密码至少需要 8 个字符，且包含至少一个大写字母
                  </p>
                )}
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
                {password && (
                  <div className="grid gap-1">
                    <Progress.Root
                      value={passwordStrength}
                      className="relative h-2 w-full overflow-hidden rounded-full bg-secondary"
                    >
                      <Progress.Indicator
                        className="h-full w-full flex-1 transition-all"
                        style={{
                          backgroundColor: getPasswordStrengthColor(),
                          transform: `translateX(-${100 - passwordStrength}%)`,
                        }}
                      />
                    </Progress.Root>
                    <p className="text-xs text-muted-foreground">
                      密码强度：{getPasswordStrengthText()}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <LabelPrimitive.Root htmlFor="confirmPassword" className={labelStyles}>确认密码</LabelPrimitive.Root>
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
                注册
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

            {/* OAuth 注册按钮 */}
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => handleOAuthRegister('google')}
                disabled={isLoading}
                className={getButtonClass('outline', 'lg')}
              >
                <Chrome className="mr-2 h-4 w-4" />
                使用 Google 注册
              </button>

              <button
                type="button"
                onClick={() => handleOAuthRegister('github')}
                disabled={isLoading}
                className={getButtonClass('outline', 'lg')}
              >
                <Github className="mr-2 h-4 w-4" />
                使用 GitHub 注册
              </button>
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
          </div>
        </div>
      </div>
    </div>
  );
};
