/**
 * Forgot Password Page
 * Sends password reset email
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink } from 'react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Mail, Loader2, CircleAlert } from 'lucide-react';
import * as LabelPrimitive from '@radix-ui/react-label';
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

// Form data type
type ForgotPasswordFormData = {
  email: string;
};

export const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotificationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Zod schema with i18n validation messages
  const forgotPasswordSchema = z.object({
    email: z.string().email(t('common.validation.email')),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await authApi.forgotPassword(data);
      setSuccess(true);
      showSuccess(t('auth.forgotPassword.success'));
    } catch (err) {
      const errorMsg = extractErrorMessage(err);
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-viewport flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md">
          <div className={cardStyles}>
            <div className={cn(cardContentStyles, "pt-6 text-center grid gap-6")}>
              <div className="flex justify-center">
                <div className="size-20 rounded-full bg-success/10 flex items-center justify-center">
                  <Mail className="size-10 text-success" />
                </div>
              </div>

              <div className="grid gap-2">
                <h1 className="text-2xl font-bold">{t('auth.emailSent.title')}</h1>
                <p className="text-muted-foreground">
                  {t('auth.emailSent.description')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('auth.emailSent.spamNotice')}
                </p>
              </div>

              <RouterLink
                to="/login"
                className="inline-flex items-center justify-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
                aria-label={t('auth.forgotPassword.backToLogin')}
              >
                <ArrowLeft className="size-4" />
                <span className="hidden sm:inline">{t('auth.forgotPassword.backToLogin')}</span>
                <span className="sr-only sm:hidden">{t('auth.forgotPassword.backToLogin')}</span>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-viewport flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className={cardStyles}>
          <div className={cn(cardHeaderStyles, "text-center")}>
            <h3 className={cardTitleStyles}>{t('auth.forgotPassword.title')}</h3>
            <p className={cardDescriptionStyles}>{t('auth.forgotPassword.subtitle')}</p>
          </div>
          <div className={cn(cardContentStyles, "grid gap-6")}>
            {/* Error Message */}
            {error && (
              <div className={getAlertClass('destructive')}>
                <CircleAlert className="h-4 w-4" />
                <div className={alertDescriptionStyles}>{error}</div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
              <div className="grid gap-2">
                <LabelPrimitive.Root htmlFor="email" className={labelStyles}>{t('auth.forgotPassword.email')}</LabelPrimitive.Root>
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

              <button type="submit" disabled={isLoading} className={cn(getButtonClass('default', 'lg'), "w-full")}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('auth.forgotPassword.submit')}
              </button>
            </form>

            {/* Back to Login */}
            <div className="text-center">
              <RouterLink
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
                aria-label={t('auth.forgotPassword.backToLogin')}
              >
                <ArrowLeft className="size-4" />
                <span className="hidden sm:inline">{t('auth.forgotPassword.backToLogin')}</span>
                <span className="sr-only sm:hidden">{t('auth.forgotPassword.backToLogin')}</span>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
