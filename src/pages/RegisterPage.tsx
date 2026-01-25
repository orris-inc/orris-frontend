/**
 * Register Page
 * Supports passkey registration, email registration, and OAuth2 quick registration
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Fingerprint, Github } from 'lucide-react';
import * as Progress from '@radix-ui/react-progress';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePasskeySignup } from '@/features/auth/hooks/usePasskeySignup';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { GoogleIcon, GitHubIcon } from '@/components/common/SocialIcons';
import { FormField, AuthAlert } from '@/components/auth';
import {
  getButtonClass,
  cardStyles,
  cardHeaderStyles,
  cardTitleStyles,
  cardDescriptionStyles,
  cardContentStyles,
} from '@/lib/ui-styles';
import { cn } from '@/lib/utils';

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

  return (
    <div className="min-h-viewport flex items-center justify-center p-4 bg-background">
      {/* Top right controls */}
      <div className="fixed top-4 right-4 z-20 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className={cardStyles}>
          <div className={cn(cardHeaderStyles, 'text-center')}>
            <h3 className={cn(cardTitleStyles, 'text-3xl')}>{t('auth.register.title')}</h3>
            <p className={cardDescriptionStyles}>{t('auth.register.subtitle')}</p>
          </div>
          <div className={cn(cardContentStyles, 'grid gap-6')}>
            {/* Error message */}
            {error && (
              <AuthAlert variant="error">
                {error}
              </AuthAlert>
            )}

            {/* OAuth registration buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleOAuthRegister('google')}
                disabled={isLoading}
                className="flex h-11 w-full items-center justify-center gap-3 rounded-lg bg-background text-sm font-medium shadow-sm ring-1 ring-inset ring-input transition-all hover:bg-muted/50 hover:ring-muted-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:bg-muted/70 disabled:pointer-events-none disabled:opacity-50"
              >
                <GoogleIcon className="size-5" />
                {t('auth.register.continueWithGoogle')}
              </button>
              <button
                type="button"
                onClick={() => handleOAuthRegister('github')}
                disabled={isLoading}
                className="flex h-11 w-full items-center justify-center gap-3 rounded-lg bg-background text-sm font-medium shadow-sm ring-1 ring-inset ring-input transition-all hover:bg-muted/50 hover:ring-muted-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:bg-muted/70 disabled:pointer-events-none disabled:opacity-50"
              >
                <GitHubIcon className="size-5" />
                {t('auth.register.continueWithGithub')}
              </button>
            </div>

            {/* Passkey signup (only shown when WebAuthn is supported) */}
            {isPasskeySupported && (
              <>
                <OrDivider text={t('auth.register.orUsePasskey')} />

                {!showPasskeyForm ? (
                  <button
                    type="button"
                    onClick={() => {
                      clearPasskeyError();
                      setShowPasskeyForm(true);
                    }}
                    disabled={isLoading || isPasskeyLoading}
                    className="flex h-11 w-full items-center justify-center gap-3 rounded-lg bg-background text-sm font-medium shadow-sm ring-1 ring-inset ring-input transition-all hover:bg-muted/50 hover:ring-muted-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:bg-muted/70 disabled:pointer-events-none disabled:opacity-50"
                  >
                    <Fingerprint className="size-5" />
                    {t('auth.register.signUpWithPasskey')}
                  </button>
                ) : (
                  <form onSubmit={handlePasskeySubmit(onPasskeySubmit)} className="space-y-4">
                    <FormField
                      label={t('common.fields.name')}
                      type="text"
                      autoComplete="name"
                      autoFocus
                      error={passkeyErrors.name?.message}
                      {...registerPasskey('name')}
                    />

                    <FormField
                      label={t('auth.register.email')}
                      type="email"
                      autoComplete="email"
                      error={passkeyErrors.email?.message}
                      {...registerPasskey('email')}
                    />

                    {passkeyError && (
                      <AuthAlert variant="error">
                        {passkeyError}
                      </AuthAlert>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasskeyForm(false);
                          clearPasskeyError();
                        }}
                        className={cn(getButtonClass('outline', 'lg'), 'flex-1')}
                      >
                        {t('common.actions.cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={isPasskeyLoading}
                        className={cn(getButtonClass('default', 'lg'), 'flex-1')}
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
                    </div>
                  </form>
                )}
              </>
            )}

            <OrDivider text={t('auth.register.orContinueWith')} />

            {/* Registration form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                label={t('common.fields.name')}
                type="text"
                autoComplete="name"
                error={errors.name?.message || authError?.fieldErrors?.name}
                {...register('name')}
              />

              <FormField
                label={t('auth.register.email')}
                type="email"
                autoComplete="email"
                error={errors.email?.message || authError?.fieldErrors?.email}
                {...register('email')}
              />

              <div className="grid gap-2">
                <FormField
                  label={t('auth.register.password')}
                  type="password"
                  autoComplete="new-password"
                  togglePasswordLabel={t('auth.register.togglePasswordVisibility')}
                  error={errors.password?.message || authError?.fieldErrors?.password}
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

              <FormField
                label={t('auth.register.confirmPassword')}
                type="password"
                autoComplete="new-password"
                togglePasswordLabel={t('auth.register.togglePasswordVisibility')}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

              <button
                type="submit"
                disabled={isLoading}
                className={cn(getButtonClass('default', 'lg'), 'w-full')}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('auth.register.signUp')}
              </button>
            </form>

            {/* Login link */}
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

        {/* Footer */}
        <div className="mt-6 flex justify-center">
          <a
            href="https://github.com/orris-inc/orris"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            aria-label="GitHub"
          >
            <Github className="size-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
