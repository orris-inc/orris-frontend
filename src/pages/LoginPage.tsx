/**
 * Login Page - Modern Split Layout
 * Design: Left panel with branding, right panel with form
 * Responsive: Single column on mobile, split on desktop
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Check } from 'lucide-react';
import * as Checkbox from '@radix-ui/react-checkbox';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { useVersionInfo } from '@/hooks';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { GoogleIcon, GitHubIcon } from '@/components/common/SocialIcons';
import { FormField, AuthAlert } from '@/components/auth';

// ============ Types ============
type LoginFormData = {
  email: string;
  password: string;
  rememberMe: boolean;
};

// ============ Brand Panel ============
// Uses landing page translations for consistency
const BrandPanel = () => {
  const { t } = useTranslation();

  // Feature list using landing page feature keys
  const features = [
    {
      titleKey: 'landing.features.dashboard.title',
      descriptionKey: 'landing.features.dashboard.description',
    },
    {
      titleKey: 'landing.features.forwarding.title',
      descriptionKey: 'landing.features.forwarding.description',
    },
    {
      titleKey: 'landing.features.subscriptions.title',
      descriptionKey: 'landing.features.subscriptions.description',
    },
  ];

  return (
    <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80">
      {/* Decorative pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      {/* Floating shapes */}
      <div className="absolute top-20 left-20 size-32 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute bottom-32 right-16 size-48 rounded-full bg-white/10 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
        <div className="max-w-lg">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 text-white/90 text-sm font-medium mb-6">
            {t('landing.hero.badge')}
          </div>

          {/* Logo & Title */}
          <h1 className="text-4xl xl:text-5xl font-bold text-white tracking-tight mb-2">
            {t('landing.hero.title')}
          </h1>
          <h2 className="text-4xl xl:text-5xl font-bold text-white/90 tracking-tight mb-6">
            {t('landing.hero.titleHighlight')}
          </h2>

          {/* Subtitle */}
          <p className="text-lg xl:text-xl text-white/80 leading-relaxed mb-10">
            {t('landing.hero.subtitle')}
          </p>

          {/* Features list */}
          <ul className="space-y-4">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="flex items-center justify-center size-6 rounded-full bg-white/20 mt-0.5 shrink-0">
                  <Check className="size-3.5 text-white" strokeWidth={3} />
                </div>
                <div>
                  <p className="font-medium text-white">{t(feature.titleKey)}</p>
                  <p className="text-sm text-white/70 mt-0.5">{t(feature.descriptionKey)}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Stats */}
          <div className="flex items-center gap-8 mt-10 pt-8 border-t border-white/20">
            {[
              { value: '5+', labelKey: 'landing.hero.stats.forwardingModes' },
              { value: '99.9%', labelKey: 'landing.hero.stats.uptimeSla' },
              { value: '24/7', labelKey: 'landing.hero.stats.alwaysOn' },
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-white/70">{t(stat.labelKey)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ Divider ============
const OrDivider = ({ text }: { text: string }) => (
  <div className="relative my-6">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-border" />
    </div>
    <div className="relative flex justify-center">
      <span className="bg-card px-4 text-xs uppercase tracking-wider text-muted-foreground">
        {text}
      </span>
    </div>
  </div>
);

// ============ Main Page ============
export const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  const { login, loginWithOAuth, isLoading, error, authError } = useAuth();
  const { showSuccess } = useNotificationStore();
  const { serverVersion, clientVersion } = useVersionInfo();
  const [userEmail, setUserEmail] = useState('');

  // Zod schema
  const loginSchema = z.object({
    email: z.string().email(t('auth.validation.emailInvalid')),
    password: z.string().min(8, t('auth.validation.passwordMinLength')),
    rememberMe: z.boolean().catch(false),
  });

  const state = location.state as { message?: string } | null;
  const successMessage = state?.message;

  // Redirect if authenticated
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
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const rememberMe = watch('rememberMe');

  const onSubmit = async (data: LoginFormData) => {
    setUserEmail(data.email);
    try {
      await login(data);
      showSuccess(t('auth.login.success'));
    } catch {
      // Handled by useAuth
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    try {
      await loginWithOAuth(provider);
      showSuccess(t('auth.login.success'));
    } catch {
      // Handled by useAuth
    }
  };

  const showResendVerification = authError?.type === 'account_not_active';

  return (
    <div className="min-h-viewport w-full flex">
      {/* Left: Brand Panel (desktop only) */}
      <BrandPanel />

      {/* Right: Form Panel */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Top bar */}
        <header className="flex items-center justify-between p-4 lg:p-6">
          {/* Mobile logo */}
          <RouterLink to="/" className="lg:hidden">
            <span className="text-xl font-bold text-foreground">Orris</span>
          </RouterLink>
          <div className="hidden lg:block" />

          {/* Controls */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>

        {/* Form container */}
        <main className="flex-1 flex items-center justify-center p-6 lg:p-8">
          <div className="w-full max-w-sm">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-fluid-xl font-bold text-foreground tracking-tight">
                {t('auth.login.title', 'Welcome back')}
              </h2>
              <p className="mt-2 text-fluid-sm text-muted-foreground">
                {t('auth.login.subtitle')}
              </p>
            </div>

            {/* Alerts */}
            {successMessage && (
              <AuthAlert variant="success" className="mb-6">
                {successMessage}
              </AuthAlert>
            )}

            {error && (
              <AuthAlert
                variant="error"
                className="mb-6"
                action={
                  showResendVerification && (
                    <button
                      type="button"
                      onClick={() => navigate('/verification-pending', { state: { email: userEmail } })}
                      className="text-sm font-medium underline underline-offset-4 hover:no-underline"
                    >
                      {t('auth.login.goToVerification')}
                    </button>
                  )
                }
              >
                {error}
              </AuthAlert>
            )}

            {/* OAuth buttons first (social proof) */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleOAuthLogin('google')}
                disabled={isLoading}
                className="flex h-11 w-full items-center justify-center gap-3 rounded-lg bg-background text-sm font-medium shadow-sm ring-1 ring-inset ring-input transition-all hover:bg-muted/50 hover:ring-muted-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:bg-muted/70 disabled:pointer-events-none disabled:opacity-50"
              >
                <GoogleIcon className="size-5" />
                {t('auth.login.continueWithGoogle')}
              </button>
              <button
                type="button"
                onClick={() => handleOAuthLogin('github')}
                disabled={isLoading}
                className="flex h-11 w-full items-center justify-center gap-3 rounded-lg bg-background text-sm font-medium shadow-sm ring-1 ring-inset ring-input transition-all hover:bg-muted/50 hover:ring-muted-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:bg-muted/70 disabled:pointer-events-none disabled:opacity-50"
              >
                <GitHubIcon className="size-5" />
                {t('auth.login.continueWithGithub')}
              </button>
            </div>

            <OrDivider text={t('auth.login.orContinueWith')} />

            {/* Login form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                label={t('auth.login.email')}
                type="email"
                autoComplete="email"
                autoFocus
                error={errors.email?.message || authError?.fieldErrors?.email}
                {...register('email')}
              />

              <FormField
                label={t('auth.login.password')}
                type="password"
                autoComplete="current-password"
                error={errors.password?.message || authError?.fieldErrors?.password}
                togglePasswordLabel={t('auth.login.togglePasswordVisibility')}
                {...register('password')}
              />

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between pt-1">
                <label className="group flex cursor-pointer items-center gap-2.5">
                  <Checkbox.Root
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setValue('rememberMe', checked === true)}
                    className="size-5 shrink-0 rounded-md border border-input bg-background transition-all duration-150 hover:border-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  >
                    <Checkbox.Indicator className="flex items-center justify-center">
                      <Check className="size-3.5" strokeWidth={3} />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <span className="text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                    {t('auth.login.rememberMe')}
                  </span>
                </label>
                <RouterLink
                  to="/forgot-password"
                  className="text-sm text-primary transition-colors hover:text-primary/80"
                >
                  {t('auth.login.forgotPassword')}
                </RouterLink>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {t('auth.login.signingIn')}
                  </>
                ) : (
                  t('auth.login.signIn')
                )}
              </button>
            </form>

            {/* Sign up link */}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t('auth.login.noAccount')}{' '}
              <RouterLink
                to="/register"
                className="font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {t('auth.login.signUpNow')}
              </RouterLink>
            </p>
          </div>
        </main>

        {/* Footer */}
        {(serverVersion || clientVersion) && (
          <footer className="p-4 text-center">
            <p className="text-xs text-muted-foreground/50 font-mono">
              {[serverVersion, clientVersion].filter(Boolean).join(' · ')}
            </p>
          </footer>
        )}
      </div>
    </div>
  );
};
