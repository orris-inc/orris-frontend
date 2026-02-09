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
import { Loader2, Check, Fingerprint } from 'lucide-react';
import * as Checkbox from '@radix-ui/react-checkbox';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePasskey } from '@/features/auth/hooks/usePasskey';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { useVersionInfo } from '@/hooks';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { GoogleIcon, GitHubIcon } from '@/components/common/SocialIcons';
import { FormField, AuthAlert } from '@/components/auth';
import { usePublicBranding } from '@/features/settings';
import { getButtonClass } from '@/lib/ui-styles';

// ============ Types ============
type LoginFormData = {
  email: string;
  password: string;
  rememberMe: boolean;
};

// ============ Brand Panel ============
// Simplified branding display
const BrandPanel = ({
  logoUrl,
  appName,
}: {
  logoUrl: string | null;
  appName: string | null;
}) => {
  const { t } = useTranslation();

  return (
    <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80">
      {/* Decorative pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      {/* Floating shapes */}
      <div className="absolute top-20 left-20 size-32 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute bottom-32 right-16 size-48 rounded-full bg-white/10 blur-3xl" />

      {/* Content - Centered branding */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
        {logoUrl && (
          <img
            src={logoUrl}
            alt={appName || 'Logo'}
            className="h-16 w-auto mb-6"
          />
        )}
        <h1 className="text-4xl xl:text-5xl font-bold text-white tracking-tight text-center">
          {appName || 'Orris'}
        </h1>
        <p className="mt-4 text-lg text-white/80 text-center max-w-md">
          {t('landing.hero.subtitle')}
        </p>
      </div>
    </div>
  );
};

// ============ Divider ============
const OrDivider = ({ text }: { text: string }) => (
  <div className="relative my-5">
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
  const {
    isSupported: isPasskeySupported,
    isLoading: isPasskeyLoading,
    error: passkeyError,
    loginWithPasskey,
    clearError: clearPasskeyError,
  } = usePasskey();
  const { showSuccess } = useNotificationStore();
  const { serverVersion, clientVersion } = useVersionInfo();
  const { appName, logoUrl, isLoading: isBrandingLoading } = usePublicBranding();
  const [userEmail, setUserEmail] = useState('');

  // Zod schema - only basic validation, real validation done by backend
  const loginSchema = z.object({
    email: z.string().email(t('common.validation.email')),
    password: z.string().min(1, t('auth.validation.passwordRequired')),
    rememberMe: z.boolean().catch(false),
  });

  const state = location.state as { message?: string; registrationSuccess?: boolean } | null;
  const successMessage = state?.registrationSuccess
    ? t('auth.login.registrationSuccess')
    : state?.message;

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
      <BrandPanel logoUrl={logoUrl} appName={appName} />

      {/* Right: Form Panel */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Top bar */}
        <header className="flex items-center justify-between p-4 lg:p-6">
          {/* Logo - top left (industry standard) */}
          <RouterLink to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            {isBrandingLoading ? (
              <div className="h-6 w-20 bg-muted animate-pulse rounded" />
            ) : (
              <>
                {logoUrl && (
                  <img src={logoUrl} alt={appName || 'Logo'} className="h-8 w-auto" />
                )}
                <span className="text-lg font-semibold text-foreground">{appName || 'Orris'}</span>
              </>
            )}
          </RouterLink>

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
            <h2 className="text-center text-xl font-semibold text-foreground mb-6">
              {t('auth.login.title', 'Welcome back')}
            </h2>

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

            {/* Quick login options (OAuth + Passkey) */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleOAuthLogin('google')}
                disabled={isLoading}
                className={getButtonClass('outline', 'default', 'h-11 w-full gap-3')}
              >
                <GoogleIcon className="size-5" />
                {t('auth.login.continueWithGoogle')}
              </button>
              <button
                type="button"
                onClick={() => handleOAuthLogin('github')}
                disabled={isLoading}
                className={getButtonClass('outline', 'default', 'h-11 w-full gap-3')}
              >
                <GitHubIcon className="size-5" />
                {t('auth.login.continueWithGithub')}
              </button>
              {isPasskeySupported && (
                <button
                  type="button"
                  onClick={() => {
                    clearPasskeyError();
                    loginWithPasskey();
                  }}
                  disabled={isLoading || isPasskeyLoading}
                  className={getButtonClass('outline', 'default', 'h-11 w-full gap-3')}
                >
                  {isPasskeyLoading ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      {t('auth.login.signingInWithPasskey')}
                    </>
                  ) : (
                    <>
                      <Fingerprint className="size-5" />
                      {t('auth.login.signInWithPasskey')}
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Passkey error */}
            {passkeyError && (
              <AuthAlert variant="error" className="mt-3">
                {passkeyError}
              </AuthAlert>
            )}

            <OrDivider text={t('auth.login.orContinueWith')} />

            {/* Login form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <FormField
                label={t('auth.login.email')}
                type="email"
                autoComplete="email"
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
                className={getButtonClass('default', 'default', 'h-11 w-full font-semibold')}
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
            <p className="mt-5 text-center text-sm text-muted-foreground">
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
        <footer className="p-4 flex items-center justify-center gap-3">
          <a
            href="https://github.com/orris-inc/orris"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            aria-label="GitHub"
          >
            <GitHubIcon className="size-4" />
          </a>
          {(serverVersion || clientVersion) && (
            <span className="text-xs text-muted-foreground/50 font-mono">
              {[serverVersion, clientVersion].filter(Boolean).join(' · ')}
            </span>
          )}
        </footer>
      </div>
    </div>
  );
};
