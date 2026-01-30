/**
 * Register Page
 * Supports passkey registration, email registration, and OAuth2 quick registration
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Fingerprint, Github, Check } from 'lucide-react';
import * as Progress from '@radix-ui/react-progress';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePasskeySignup } from '@/features/auth/hooks/usePasskeySignup';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { useVersionInfo } from '@/hooks';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { GoogleIcon, GitHubIcon } from '@/components/common/SocialIcons';
import { FormField, AuthAlert } from '@/components/auth';

// Register form data type
type RegisterFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

// Passkey signup form data type
type PasskeyFormData = {
  name: string;
  email: string;
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
              { value: '5', labelKey: 'landing.hero.stats.forwardingModes' },
              { value: '6', labelKey: 'landing.hero.stats.nodeProtocols' },
              { value: '3', labelKey: 'landing.hero.stats.tokenScopes' },
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

// Divider component
const OrDivider = ({ text }: { text: string }) => (
  <div className="relative my-6 [@media(max-height:982px)]:my-4">
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

export const RegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { register: registerUser, loginWithOAuth, isLoading, error, authError } = useAuth();
  const {
    isSupported: isPasskeySupported,
    isLoading: isPasskeyLoading,
    error: passkeyError,
    signupWithPasskey,
    clearError: clearPasskeyError,
  } = usePasskeySignup();
  const { showSuccess } = useNotificationStore();
  const { serverVersion, clientVersion } = useVersionInfo();
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPasskeyForm, setShowPasskeyForm] = useState(false);

  // Zod schema with i18n validation messages
  const registerSchema = z
    .object({
      name: z.string()
        .min(2, t('auth.validation.nameMinLength'))
        .max(100, t('auth.validation.nameMaxLength')),
      email: z.string().email(t('common.validation.email')),
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

  // Passkey form schema (only name and email)
  const passkeySchema = z.object({
    name: z.string()
      .min(2, t('auth.validation.nameMinLength'))
      .max(100, t('auth.validation.nameMaxLength')),
    email: z.string().email(t('common.validation.email')),
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

  const {
    register: registerPasskey,
    handleSubmit: handlePasskeySubmit,
    formState: { errors: passkeyErrors },
  } = useForm<PasskeyFormData>({
    resolver: zodResolver(passkeySchema),
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
    }
  };

  const onPasskeySubmit = async (data: PasskeyFormData) => {
    clearPasskeyError();
    const success = await signupWithPasskey(data.email, data.name);
    if (success) {
      showSuccess(t('auth.register.successPasskey'));
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

  const compactFieldProps = {
    containerClassName: '[@media(max-height:982px)]:space-y-1',
    labelClassName: '[@media(max-height:982px)]:text-xs',
    errorClassName: '[@media(max-height:982px)]:text-xs',
    hintClassName: '[@media(max-height:982px)]:text-xs',
    className: '[@media(max-height:982px)]:h-10 [@media(max-height:982px)]:text-sm',
  } as const;

  return (
    <div className="min-h-viewport w-full flex">
      {/* Left: Brand Panel (desktop only) */}
      <BrandPanel />

      {/* Right: Form Panel */}
      <div className="flex-1 flex flex-col bg-background min-h-viewport overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between p-4 lg:p-6 [@media(max-height:982px)]:p-3">
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
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-6 lg:p-8 lg:items-center [@media(max-height:982px)]:p-4">
            <div className="w-full max-w-sm">
              {/* Header */}
              <div className="text-center mb-8 [@media(max-height:982px)]:mb-5">
                <h2 className="text-fluid-xl font-bold text-foreground tracking-tight [@media(max-height:982px)]:text-2xl">
                  {t('auth.register.title')}
                </h2>
                <p className="mt-2 text-fluid-sm text-muted-foreground [@media(max-height:982px)]:text-sm">
                  {t('auth.register.subtitle')}
                </p>
              </div>

              {/* Error message */}
              {error && (
                <AuthAlert variant="error" className="mb-6 [@media(max-height:982px)]:mb-4">
                  {error}
                </AuthAlert>
              )}

              {/* OAuth registration buttons */}
              <div className="space-y-3 [@media(max-height:982px)]:space-y-2">
                <button
                  type="button"
                  onClick={() => handleOAuthRegister('google')}
                  disabled={isLoading}
                  className="flex h-11 w-full items-center justify-center gap-3 rounded-xl bg-background text-sm font-medium ring-1 ring-border transition-all hover:bg-muted/50 hover:ring-muted-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98] active:bg-muted/70 disabled:pointer-events-none disabled:opacity-50 [@media(max-height:982px)]:h-10"
                >
                  <GoogleIcon className="size-5" />
                  {t('auth.register.continueWithGoogle')}
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuthRegister('github')}
                  disabled={isLoading}
                  className="flex h-11 w-full items-center justify-center gap-3 rounded-xl bg-background text-sm font-medium ring-1 ring-border transition-all hover:bg-muted/50 hover:ring-muted-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98] active:bg-muted/70 disabled:pointer-events-none disabled:opacity-50 [@media(max-height:982px)]:h-10"
                >
                  <GitHubIcon className="size-5" />
                  {t('auth.register.continueWithGithub')}
                </button>
              </div>

              {/* Passkey signup (only shown when WebAuthn is supported) */}
              {isPasskeySupported && (
                <div className="[@media(max-height:982px)]:space-y-3">
                  <OrDivider text={t('auth.register.orUsePasskey')} />

                  {!showPasskeyForm ? (
                    <button
                      type="button"
                      onClick={() => {
                        clearPasskeyError();
                        setShowPasskeyForm(true);
                      }}
                      disabled={isLoading || isPasskeyLoading}
                      className="flex h-11 w-full items-center justify-center gap-3 rounded-xl bg-background text-sm font-medium ring-1 ring-border transition-all hover:bg-muted/50 hover:ring-muted-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98] active:bg-muted/70 disabled:pointer-events-none disabled:opacity-50 [@media(max-height:982px)]:h-10"
                    >
                      <Fingerprint className="size-5" />
                      {t('auth.register.signUpWithPasskey')}
                    </button>
                  ) : (
                    <form onSubmit={handlePasskeySubmit(onPasskeySubmit)} className="space-y-4 [@media(max-height:982px)]:space-y-3">
                      <FormField
                        label={t('common.fields.name')}
                        type="text"
                        autoComplete="name"
                        autoFocus
                        error={passkeyErrors.name?.message}
                        {...compactFieldProps}
                        {...registerPasskey('name')}
                      />

                      <FormField
                        label={t('auth.register.email')}
                        type="email"
                        autoComplete="email"
                        error={passkeyErrors.email?.message}
                        {...compactFieldProps}
                        {...registerPasskey('email')}
                      />

                      {passkeyError && (
                        <AuthAlert variant="error">
                          {passkeyError}
                        </AuthAlert>
                      )}

                      <div className="flex gap-3 [@media(max-height:982px)]:gap-2">
                        <button
                          type="submit"
                          disabled={isPasskeyLoading}
                          className="flex h-11 flex-1 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground ring-1 ring-primary/20 transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [@media(max-height:982px)]:h-10"
                        >
                          {isPasskeyLoading ? (
                            <>
                              <Loader2 className="mr-2 size-4 animate-spin" />
                              {t('auth.register.creatingPasskey')}
                            </>
                          ) : (
                            <>
                              <Fingerprint className="mr-2 size-4" />
                              {t('auth.register.createPasskey')}
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasskeyForm(false);
                            clearPasskeyError();
                          }}
                          className="flex h-11 flex-1 items-center justify-center rounded-xl bg-background text-sm font-medium ring-1 ring-border transition-all hover:bg-muted/50 hover:ring-muted-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98] active:bg-muted/70 disabled:pointer-events-none disabled:opacity-50 [@media(max-height:982px)]:h-10"
                        >
                          {t('common.actions.cancel')}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              <OrDivider text={t('auth.register.orContinueWith')} />

              {/* Registration form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 [@media(max-height:982px)]:space-y-3">
                <FormField
                  label={t('common.fields.name')}
                  type="text"
                  autoComplete="name"
                  error={errors.name?.message || authError?.fieldErrors?.name}
                  {...compactFieldProps}
                  {...register('name')}
                />

                <FormField
                  label={t('auth.register.email')}
                  type="email"
                  autoComplete="email"
                  error={errors.email?.message || authError?.fieldErrors?.email}
                  {...compactFieldProps}
                  {...register('email')}
                />

                <div className="grid gap-2">
                <FormField
                  label={t('auth.register.password')}
                  type="password"
                  autoComplete="new-password"
                  togglePasswordLabel={t('auth.register.togglePasswordVisibility')}
                  error={errors.password?.message || authError?.fieldErrors?.password}
                  {...compactFieldProps}
                  {...register('password', {
                    onChange: (e) => handlePasswordChange(e.target.value),
                  })}
                />
                  {!errors.password && !authError?.fieldErrors?.password && !password && (
                    <p className="text-xs text-muted-foreground">
                      {t('auth.register.passwordHint')}
                    </p>
                  )}
                  {password && (
                    <div className="grid gap-1 [@media(max-height:982px)]:hidden">
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

                <FormField
                  label={t('auth.register.confirmPassword')}
                  type="password"
                  autoComplete="new-password"
                  togglePasswordLabel={t('auth.register.togglePasswordVisibility')}
                  error={errors.confirmPassword?.message}
                  {...compactFieldProps}
                  {...register('confirmPassword')}
                />

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground ring-1 ring-primary/20 transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [@media(max-height:982px)]:h-10"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('auth.register.signUp')}
                </button>
              </form>

              {/* Login link */}
              <p className="mt-6 text-center text-sm text-muted-foreground [@media(max-height:982px)]:mt-4">
                {t('auth.register.haveAccount')}{' '}
                <RouterLink
                  to="/login"
                  className="font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  {t('auth.register.signInNow')}
                </RouterLink>
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-4 flex items-center justify-center gap-3 [@media(max-height:982px)]:p-3">
          <a
            href="https://github.com/orris-inc/orris"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            aria-label="GitHub"
          >
            <Github className="size-4" />
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
