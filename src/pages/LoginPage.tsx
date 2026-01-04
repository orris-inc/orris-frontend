/**
 * Login Page - Swiss Minimalism Style
 * Design philosophy: Clean grid, generous whitespace, typographic hierarchy
 * Supports email/password login and OAuth2 login (Google, GitHub)
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2, Check, AlertCircle, CheckCircle2 } from 'lucide-react';
import * as LabelPrimitive from '@radix-ui/react-label';
import * as Checkbox from '@radix-ui/react-checkbox';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { cn } from '@/lib/utils';

// Zod login form validation
const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(8, '密码至少需要8个字符'),
  rememberMe: z.boolean().catch(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Google icon SVG component
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

// GitHub icon SVG component
const GitHubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  const { login, loginWithOAuth, isLoading, error, authError } = useAuth();
  const { showSuccess } = useNotificationStore();
  const [showPassword, setShowPassword] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');

  const state = location.state as { message?: string } | null;
  const successMessage = state?.message;

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
    setUserEmail(data.email);

    try {
      await login(data);
      showSuccess('登录成功！');
    } catch {
      // Error already handled by useAuth
    }
  };

  // Check if account is not active based on authError
  const showResendVerification = authError?.type === 'account_not_active';

  const handleResendVerification = () => {
    navigate('/verification-pending', {
      state: { email: userEmail },
    });
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    try {
      await loginWithOAuth(provider);
      showSuccess('登录成功！');
    } catch {
      // Error already handled by useAuth
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-6 sm:p-8">
      {/* Grid background decoration */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_40%,transparent_100%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[420px]">
        {/* Header */}
        <header className="text-center mb-10">
          <RouterLink to="/" className="inline-block">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground hover:text-primary transition-colors">
              Orris
            </h1>
          </RouterLink>
          <p className="mt-3 text-muted-foreground">
            登录您的账号继续使用
          </p>
        </header>

        {/* Main card */}
        <main className="bg-card rounded-xl border border-border p-8 shadow-sm">
          {/* Success message */}
          {successMessage && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-lg bg-success-muted text-success">
              <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed">{successMessage}</p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="size-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm leading-relaxed">{error}</p>
                {showResendVerification && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    className="mt-2 text-sm font-medium underline underline-offset-4 hover:no-underline"
                  >
                    前往验证
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email field */}
            <div className="space-y-2">
              <LabelPrimitive.Root
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                邮箱
              </LabelPrimitive.Root>
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="name@example.com"
                aria-invalid={!!errors.email || !!authError?.fieldErrors?.email}
                className={cn(
                  'flex h-11 w-full rounded-lg border bg-background px-4 text-sm transition-colors',
                  'placeholder:text-muted-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  errors.email || authError?.fieldErrors?.email
                    ? 'border-destructive'
                    : 'border-input hover:border-muted-foreground/50'
                )}
                {...register('email')}
              />
              {(errors.email || authError?.fieldErrors?.email) && (
                <p className="text-sm text-destructive">
                  {errors.email?.message || authError?.fieldErrors?.email}
                </p>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <LabelPrimitive.Root
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                密码
              </LabelPrimitive.Root>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="输入密码"
                  aria-invalid={!!errors.password || !!authError?.fieldErrors?.password}
                  className={cn(
                    'flex h-11 w-full rounded-lg border bg-background px-4 pr-11 text-sm transition-colors',
                    'placeholder:text-muted-foreground',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    errors.password || authError?.fieldErrors?.password
                      ? 'border-destructive'
                      : 'border-input hover:border-muted-foreground/50'
                  )}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center size-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  aria-label="切换密码显示"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {(errors.password || authError?.fieldErrors?.password) && (
                <p className="text-sm text-destructive">
                  {errors.password?.message || authError?.fieldErrors?.password}
                </p>
              )}
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <Checkbox.Root
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setValue('rememberMe', checked === true)}
                  className="size-4.5 shrink-0 rounded border border-input bg-background transition-colors hover:border-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground"
                >
                  <Checkbox.Indicator className="flex items-center justify-center">
                    <Check className="size-3" strokeWidth={3} />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  记住我
                </span>
              </label>
              <RouterLink
                to="/forgot-password"
                className="text-sm text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors"
              >
                忘记密码？
              </RouterLink>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-xs uppercase tracking-wider text-muted-foreground">
                或
              </span>
            </div>
          </div>

          {/* OAuth buttons */}
          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              disabled={isLoading}
              className="flex items-center justify-center gap-3 w-full h-11 rounded-lg border border-input bg-background text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              <GoogleIcon className="size-5" />
              使用 Google 登录
            </button>
            <button
              type="button"
              onClick={() => handleOAuthLogin('github')}
              disabled={isLoading}
              className="flex items-center justify-center gap-3 w-full h-11 rounded-lg border border-input bg-background text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              <GitHubIcon className="size-5" />
              使用 GitHub 登录
            </button>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            还没有账号？{' '}
            <RouterLink
              to="/register"
              className="font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors"
            >
              立即注册
            </RouterLink>
          </p>
        </footer>
      </div>
    </div>
  );
};
