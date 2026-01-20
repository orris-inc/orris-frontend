/**
 * Register Page
 * Supports email registration and OAuth2 quick registration
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Chrome, Github, Loader2, CircleAlert } from 'lucide-react';
import * as LabelPrimitive from '@radix-ui/react-label';
import * as Separator from '@radix-ui/react-separator';
import * as Progress from '@radix-ui/react-progress';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { ThemeToggle } from '@/components/common/ThemeToggle';
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

// Register form data type
type RegisterFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

// Calculate password strength
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { register: registerUser, loginWithOAuth, isLoading, error, authError } = useAuth();
  const { showSuccess } = useNotificationStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Zod schema with i18n validation messages
  const registerSchema = z
    .object({
      name: z.string()
        .min(2, t('auth.validation.nameMinLength'))
        .max(100, t('auth.validation.nameMaxLength')),
      email: z.string().email(t('auth.validation.emailInvalid')),
      password: z
        .string()
        .min(8, t('auth.validation.passwordMinLength'))
        .regex(/[A-Z]/, t('auth.validation.passwordUppercase')),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('auth.validation.passwordMismatch'),
      path: ['confirmPassword'],
    });

  // Redirect to Dashboard if already logged in
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

  // Watch password changes and calculate strength
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
      showSuccess(t('auth.register.success'));
    } catch {
      // Error already handled by useAuth
      // authError is now available for field-level error display
    }
  };

  const handleOAuthRegister = async (provider: 'google' | 'github') => {
    try {
      await loginWithOAuth(provider);
      showSuccess(t('auth.register.successOAuth'));
    } catch {
      // Error already handled by useAuth
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return 'var(--color-destructive)';
    if (passwordStrength < 50) return 'var(--color-warning)';
    if (passwordStrength < 75) return 'var(--color-chart-2)';
    return 'var(--color-chart-1)';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return t('auth.register.strengthWeak');
    if (passwordStrength < 50) return t('auth.register.strengthFair');
    if (passwordStrength < 75) return t('auth.register.strengthGood');
    return t('auth.register.strengthStrong');
  };

  return (
    <div className="min-h-viewport flex items-center justify-center p-4 bg-background">
      {/* Top right controls */}
      <div className="fixed top-4 right-4 z-20 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className={cardStyles}>
          <div className={cn(cardHeaderStyles, "text-center")}>
            <h3 className={cn(cardTitleStyles, "text-3xl")}>{t('auth.register.title')}</h3>
            <p className={cardDescriptionStyles}>{t('auth.register.subtitle')}</p>
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
                <LabelPrimitive.Root htmlFor="name" className={labelStyles}>{t('auth.register.name')}</LabelPrimitive.Root>
                <input
                  id="name"
                  autoComplete="name"
                  autoFocus
                  aria-invalid={!!errors.name || !!authError?.fieldErrors?.name}
                  className={inputStyles}
                  {...register('name')}
                />
                {(errors.name || authError?.fieldErrors?.name) && (
                  <p className="text-sm text-destructive">
                    {errors.name?.message || authError?.fieldErrors?.name}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <LabelPrimitive.Root htmlFor="email" className={labelStyles}>{t('auth.register.email')}</LabelPrimitive.Root>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!errors.email || !!authError?.fieldErrors?.email}
                  className={inputStyles}
                  {...register('email')}
                />
                {(errors.email || authError?.fieldErrors?.email) && (
                  <p className="text-sm text-destructive">
                    {errors.email?.message || authError?.fieldErrors?.email}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <LabelPrimitive.Root htmlFor="password" className={labelStyles}>{t('auth.register.password')}</LabelPrimitive.Root>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    aria-invalid={!!errors.password || !!authError?.fieldErrors?.password}
                    className={cn(inputStyles, "pr-10")}
                    {...register('password', {
                      onChange: (e) => handlePasswordChange(e.target.value),
                    })}
                  />
                  <button
                    type="button"
                    className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground h-8 w-8 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={t('auth.register.togglePasswordVisibility')}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {!errors.password && !authError?.fieldErrors?.password && !password && (
                  <p className="text-xs text-muted-foreground">
                    {t('auth.register.passwordHint')}
                  </p>
                )}
                {(errors.password || authError?.fieldErrors?.password) && (
                  <p className="text-sm text-destructive">
                    {errors.password?.message || authError?.fieldErrors?.password}
                  </p>
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
                      {t('auth.register.passwordStrength')}{getPasswordStrengthText()}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <LabelPrimitive.Root htmlFor="confirmPassword" className={labelStyles}>{t('auth.register.confirmPassword')}</LabelPrimitive.Root>
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
                    aria-label={t('auth.register.togglePasswordVisibility')}
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
                {t('auth.register.signUp')}
              </button>
            </form>

            {/* 分隔线 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator.Root className="w-full h-[1px] bg-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">{t('auth.register.orContinueWith')}</span>
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
                {t('auth.register.continueWithGoogle')}
              </button>

              <button
                type="button"
                onClick={() => handleOAuthRegister('github')}
                disabled={isLoading}
                className={getButtonClass('outline', 'lg')}
              >
                <Github className="mr-2 h-4 w-4" />
                {t('auth.register.continueWithGithub')}
              </button>
            </div>

            {/* 登录链接 */}
            <div className="text-center text-sm text-muted-foreground">
              {t('auth.register.haveAccount')}{' '}
              <RouterLink
                to="/login"
                className="text-primary underline-offset-4 hover:underline"
              >
                {t('auth.register.signInNow')}
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
