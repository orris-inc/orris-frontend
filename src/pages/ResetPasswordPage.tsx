/**
 * Reset Password Page
 * Reset password using token from email
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink, useSearchParams, useNavigate } from 'react-router';
import { useState, useMemo } from 'react';
import { ArrowLeft, Eye, EyeOff, Loader2, CircleAlert } from 'lucide-react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { useTranslation } from 'react-i18next';
import * as authApi from '@/api/auth';
import { extractErrorMessage } from '@/shared/utils/error-messages';
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

type ResetPasswordFormData = {
  password: string;
  confirmPassword: string;
};

export const ResetPasswordPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const { showSuccess, showError } = useNotificationStore();

  const resetPasswordSchema = useMemo(
    () =>
      z
        .object({
          password: z.string().min(8, t('auth.validation.passwordMinLength')),
          confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t('auth.validation.passwordMismatch'),
          path: ['confirmPassword'],
        }),
    [t]
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Check token
  if (!token) {
    return (
      <div className="min-h-viewport flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md">
          <div className={cardStyles}>
            <div className={cn(cardHeaderStyles, "text-center")}>
              <h3 className={cardTitleStyles}>{t('auth.resetPassword.invalidLink')}</h3>
              <p className={cardDescriptionStyles}>
                {t('auth.resetPassword.invalidLinkDesc')}
              </p>
            </div>
            <div className={cn(cardContentStyles, "text-center")}>
              <RouterLink
                to="/forgot-password"
                className="text-primary underline-offset-4 hover:underline"
              >
                {t('auth.resetPassword.requestNew')}
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await authApi.resetPassword({
        token,
        password: data.password,
      });

      showSuccess(t('auth.resetPassword.success'));
      // Success, redirect to login page
      navigate('/login', {
        state: { message: t('auth.resetPassword.successMessage') },
      });
    } catch (err) {
      const errorMsg = extractErrorMessage(err);
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-viewport flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className={cardStyles}>
          <div className={cn(cardHeaderStyles, "text-center")}>
            <h3 className={cn(cardTitleStyles, "text-3xl")}>{t('auth.resetPassword.title')}</h3>
            <p className={cardDescriptionStyles}>{t('auth.resetPassword.subtitle')}</p>
          </div>
          <div className={cn(cardContentStyles, "grid gap-6")}>
            {/* Error message */}
            {error && (
              <div className={getAlertClass('destructive')}>
                <CircleAlert className="h-4 w-4" />
                <div className={alertDescriptionStyles}>{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
              <div className="grid gap-2">
                <LabelPrimitive.Root htmlFor="password" className={labelStyles}>{t('auth.resetPassword.password')}</LabelPrimitive.Root>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    autoFocus
                    aria-invalid={!!errors.password}
                    className={cn(inputStyles, "pr-10")}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="absolute right-0.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground touch-target transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={t('auth.login.togglePasswordVisibility')}
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

              <div className="grid gap-2">
                <LabelPrimitive.Root htmlFor="confirmPassword" className={labelStyles}>{t('auth.resetPassword.confirmPassword')}</LabelPrimitive.Root>
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
                    className="absolute right-0.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground touch-target transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={t('auth.login.togglePasswordVisibility')}
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
                {t('auth.resetPassword.submit')}
              </button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              <RouterLink
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
                aria-label={t('auth.resetPassword.backToLogin')}
              >
                <ArrowLeft className="size-4" />
                <span className="hidden sm:inline">{t('auth.resetPassword.backToLogin')}</span>
                <span className="sr-only sm:hidden">{t('auth.resetPassword.backToLogin')}</span>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
