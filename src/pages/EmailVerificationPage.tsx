/**
 * Email Verification Page
 * Handles verification logic after user clicks the verification email link
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { Loader2, CircleCheck, CircleAlert, Info } from 'lucide-react';
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const token = searchParams.get('token');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setErrorMessage('验证链接无效，缺少验证令牌');
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
  }, [token]);

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
              <h3 className={cardTitleStyles}>正在验证您的邮箱...</h3>
              <p className={cardDescriptionStyles}>
                请稍候，我们正在确认您的邮箱地址
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
              <h3 className={cardTitleStyles}>邮箱验证成功！</h3>
              <p className={cardDescriptionStyles}>
                您的邮箱已成功验证，现在可以登录您的账号了
              </p>
            </div>
            <button
              onClick={handleGoToLogin}
              className={cn(getButtonClass('default', 'lg'), "w-full")}
            >
              前往登录
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
              <h3 className={cardTitleStyles}>邮箱已验证</h3>
              <p className={cardDescriptionStyles}>
                您的邮箱之前已经验证过了，可以直接登录
              </p>
            </div>
            <button
              onClick={handleGoToLogin}
              className={cn(getButtonClass('default', 'lg'), "w-full")}
            >
              前往登录
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
              <h3 className={cardTitleStyles}>验证失败</h3>

              <div className={getAlertClass('destructive')}>
                <CircleAlert className="size-4" />
                <div className={alertDescriptionStyles}>
                  {errorMessage || '验证链接已失效或无效'}
                </div>
              </div>

              <p className={cardDescriptionStyles}>
                验证链接可能已过期或无效，请尝试重新发送验证邮件
              </p>

              <div className="grid gap-2">
                <button
                  onClick={handleResendEmail}
                  className={cn(getButtonClass('default', 'lg'), "w-full")}
                >
                  重新发送验证邮件
                </button>
                <button
                  onClick={handleGoToLogin}
                  className={cn(getButtonClass('outline', 'lg'), "w-full")}
                >
                  返回登录
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
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
