/**
 * 邮箱验证页面
 * 处理用户点击验证邮件链接后的验证逻辑
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { Loader2, CircleCheck, CircleAlert, Info } from 'lucide-react';
import { verifyEmail } from '@/features/auth/api/auth-api';
import { handleApiError } from '@/shared/lib/axios';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
        await verifyEmail(token);
        setStatus('success');
      } catch (err) {
        const errorMsg = handleApiError(err);
        setErrorMessage(errorMsg);

        // 判断是否已验证
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
    // 由于我们没有存储用户邮箱，这里需要用户手动输入
    // 或者跳转到 verification-pending 页面让用户输入
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
              <CardTitle className="text-2xl">正在验证您的邮箱...</CardTitle>
              <CardDescription>
                请稍候，我们正在确认您的邮箱地址
              </CardDescription>
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
              <CardTitle className="text-2xl">邮箱验证成功！</CardTitle>
              <CardDescription>
                您的邮箱已成功验证，现在可以登录您的账号了
              </CardDescription>
            </div>
            <Button
              size="lg"
              onClick={handleGoToLogin}
              className="w-full"
            >
              前往登录
            </Button>
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
              <CardTitle className="text-2xl">邮箱已验证</CardTitle>
              <CardDescription>
                您的邮箱之前已经验证过了，可以直接登录
              </CardDescription>
            </div>
            <Button
              size="lg"
              onClick={handleGoToLogin}
              className="w-full"
            >
              前往登录
            </Button>
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
              <CardTitle className="text-2xl">验证失败</CardTitle>

              <Alert variant="destructive">
                <CircleAlert className="size-4" />
                <AlertDescription>
                  {errorMessage || '验证链接已失效或无效'}
                </AlertDescription>
              </Alert>

              <CardDescription>
                验证链接可能已过期或无效，请尝试重新发送验证邮件
              </CardDescription>

              <div className="grid gap-2">
                <Button
                  size="lg"
                  onClick={handleResendEmail}
                  className="w-full"
                >
                  重新发送验证邮件
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleGoToLogin}
                  className="w-full"
                >
                  返回登录
                </Button>
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
        <Card>
          <CardContent className="pt-6">
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
