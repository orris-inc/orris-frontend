/**
 * Email Verification Page
 * Handles verification logic after user clicks the verification email link
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Loader2, CircleCheck, CircleAlert, Info } from 'lucide-react';
import { verifyEmail } from '@/api/auth';
import { handleApiError } from '@/shared/lib/axios';
import {
  getButtonClass,
  cardStyles,
  cardContentStyles,
  cardTitleStyles,
  cardDescriptionStyles,
  getAlertClass,
  alertDescriptionStyles
} from '@/lib/ui-styles';
import { cn } from '@/lib/utils';

type VerificationStatus = 'loading' | 'success' | 'error' | 'already_verified';

export const EmailVerificationPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const token = searchParams.get('token');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setErrorMessage(t('auth.emailVerification.missingToken'));
        return;
      }

      try {
        await verifyEmail({ token });
        setStatus('success');
      } catch (err) {
        const errorMsg = handleApiError(err);
        setErrorMessage(errorMsg);

        // Check if already verified
        if (errorMsg.includes('已验证') || errorMsg.includes('already verified')) {
          setStatus('already_verified');
        } else {
          setStatus('error');
        }
      }
    };

    verify();
  }, [token, t]);

  const handleResendEmail = async () => {
    // Since we don't store user email here, redirect to verification-pending page
    // where the user can input their email
    navigate('/verification-pending');
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="grid gap-6 text-center">
            <div className="flex justify-center">
              <Loader2 className="size-16 animate-spin text-primary" />
            </div>
            <div className="grid gap-2">
              <h3 className={cardTitleStyles}>{t('auth.emailVerification.verifying')}</h3>
              <p className={cardDescriptionStyles}>
                {t('auth.emailVerification.verifyingDesc')}
              </p>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="grid gap-6 text-center">
            <div className="flex justify-center">
              <div className="p-4 bg-green-500/10 rounded-full">
                <CircleCheck className="size-12 text-green-500" />
              </div>
            </div>
            <div className="grid gap-2">
              <h3 className={cardTitleStyles}>{t('auth.emailVerification.successTitle')}</h3>
              <p className={cardDescriptionStyles}>
                {t('auth.emailVerification.successDesc')}
              </p>
            </div>
            <button
              onClick={handleGoToLogin}
              className={cn(getButtonClass('default', 'lg'), "w-full")}
            >
              {t('auth.emailVerification.goToLogin')}
            </button>
          </div>
        );

      case 'already_verified':
        return (
          <div className="grid gap-6 text-center">
            <div className="flex justify-center">
              <div className="p-4 bg-blue-500/10 rounded-full">
                <Info className="size-12 text-blue-500" />
              </div>
            </div>
            <div className="grid gap-2">
              <h3 className={cardTitleStyles}>{t('auth.emailVerification.alreadyVerifiedTitle')}</h3>
              <p className={cardDescriptionStyles}>
                {t('auth.emailVerification.alreadyVerifiedDesc')}
              </p>
            </div>
            <button
              onClick={handleGoToLogin}
              className={cn(getButtonClass('default', 'lg'), "w-full")}
            >
              {t('auth.emailVerification.goToLogin')}
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="grid gap-6 text-center">
            <div className="flex justify-center">
              <div className="p-4 bg-destructive/10 rounded-full">
                <CircleAlert className="size-12 text-destructive" />
              </div>
            </div>
            <div className="grid gap-4">
              <h3 className={cardTitleStyles}>{t('auth.emailVerification.failedTitle')}</h3>

              <div className={getAlertClass('destructive')}>
                <CircleAlert className="size-4" />
                <div className={alertDescriptionStyles}>
                  {errorMessage || t('auth.emailVerification.invalidLink')}
                </div>
              </div>

              <p className={cardDescriptionStyles}>
                {t('auth.emailVerification.failedDesc')}
              </p>

              <div className="grid gap-2">
                <button
                  onClick={handleResendEmail}
                  className={cn(getButtonClass('default', 'lg'), "w-full")}
                >
                  {t('auth.emailVerification.resendEmail')}
                </button>
                <button
                  onClick={handleGoToLogin}
                  className={cn(getButtonClass('outline', 'lg'), "w-full")}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <ArrowLeft className="size-4" />
                    <span className="hidden sm:inline">{t('auth.emailVerification.backToLogin')}</span>
                    <span className="sr-only sm:hidden">{t('auth.emailVerification.backToLogin')}</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-viewport flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className={cardStyles}>
          <div className={cardContentStyles}>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};
