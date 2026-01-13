/**
 * Email Verification Pending Page
 * Displayed after successful registration, prompting user to check verification email
 */

import { useState } from 'react';
import { useLocation, Link as RouterLink } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Loader2, Info, CircleCheck, TriangleAlert } from 'lucide-react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { handleApiError, apiClient } from '@/shared/lib/axios';
import type { APIResponse } from '@/shared/types/api.types';
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
  alertDescriptionStyles,
} from '@/lib/ui-styles';
import { cn } from '@/lib/utils';

// Temporary implementation - waiting for backend auto-generated API support
const resendVerificationEmail = async (email: string): Promise<void> => {
  await apiClient.post<APIResponse<null>>('/auth/resend-verification', { email });
};

// Form data type
type ResendFormData = {
  email: string;
};

export const VerificationPendingPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get email address from route state (if available)
  const emailFromState = (location.state as { email?: string })?.email || '';

  // Zod schema with i18n validation messages
  const resendSchema = z.object({
    email: z.string().email(t('auth.validation.emailInvalid')),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResendFormData>({
    resolver: zodResolver(resendSchema),
    defaultValues: {
      email: emailFromState,
    },
  });

  const onSubmit = async (data: ResendFormData) => {
    setResending(true);
    setError(null);
    setSuccess(false);

    try {
      await resendVerificationEmail(data.email);
      setSuccess(true);
    } catch (err) {
      const errorMsg = handleApiError(err);
      setError(errorMsg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-viewport flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className={cardStyles}>
          <div className={cn(cardHeaderStyles, "text-center")}>
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Mail className="size-12 text-primary" />
              </div>
            </div>
            <h3 className={cn(cardTitleStyles, "text-2xl")}>{t('auth.verifyEmail.title')}</h3>
            <p className={cardDescriptionStyles}>
              {t('auth.verifyEmail.subtitle')}
            </p>
          </div>
          <div className={cn(cardContentStyles, "grid gap-6")}>
            {/* 邮箱提示 */}
            {emailFromState && (
              <div className={getAlertClass('default')}>
                <Info className="size-4" />
                <div className={alertDescriptionStyles}>
                  {t('auth.verifyEmail.emailSentTo')}<strong>{emailFromState}</strong>
                </div>
              </div>
            )}

            {/* 成功提示 */}
            {success && (
              <div className={getAlertClass('default')}>
                <CircleCheck className="size-4" />
                <div className={alertDescriptionStyles}>
                  {t('auth.verifyEmail.resendSuccess')}
                </div>
              </div>
            )}

            {/* 错误提示 */}
            {error && (
              <div className={getAlertClass('destructive')}>
                <TriangleAlert className="size-4" />
                <div className={alertDescriptionStyles}>{error}</div>
              </div>
            )}

            {/* 操作说明 */}
            <div className="grid gap-2">
              <p className="text-sm text-muted-foreground">
                {t('auth.verifyEmail.steps.title')}
              </p>
              <ol className="grid gap-2 list-decimal list-inside text-sm text-muted-foreground">
                <li>{t('auth.verifyEmail.steps.step1')}</li>
                <li>{t('auth.verifyEmail.steps.step2')}</li>
                <li>{t('auth.verifyEmail.steps.step3')}</li>
              </ol>
            </div>

            {/* 重发表单 */}
            <div className="grid gap-4">
              <p className="text-sm text-muted-foreground">
                {t('auth.verifyEmail.resendPrompt')}
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
                <div className="grid gap-2">
                  <LabelPrimitive.Root htmlFor="email" className={labelStyles}>
                    {t('auth.verifyEmail.emailAddress')}
                  </LabelPrimitive.Root>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    disabled={resending}
                    className={inputStyles}
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={resending}
                  className={cn(getButtonClass('default', 'lg'), "w-full")}
                >
                  {resending && <Loader2 className="animate-spin" />}
                  {t('auth.verifyEmail.resend')}
                </button>
              </form>
            </div>

            {/* 提示信息 */}
            <div className={getAlertClass('default')}>
              <TriangleAlert className="size-4" />
              <div className={alertDescriptionStyles}>
                {t('auth.verifyEmail.spamNotice')}
              </div>
            </div>

            {/* 返回登录 */}
            <div className="text-center text-sm text-muted-foreground">
              {t('auth.verifyEmail.alreadyVerified')}{' '}
              <RouterLink
                to="/login"
                className="text-primary underline-offset-4 hover:underline"
              >
                {t('auth.verifyEmail.backToLogin')}
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
