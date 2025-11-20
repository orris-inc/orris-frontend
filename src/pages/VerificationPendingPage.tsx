/**
 * 邮箱验证待处理页面
 * 用户注册成功后显示，提示用户查收验证邮件
 */

import { useState } from 'react';
import { useLocation, Link as RouterLink } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Loader2, Info, CircleCheck, TriangleAlert } from 'lucide-react';
import { resendVerificationEmail } from '@/features/auth/api/auth-api';
import { handleApiError } from '@/shared/lib/axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

// 表单验证
const resendSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
});

type ResendFormData = z.infer<typeof resendSchema>;

export const VerificationPendingPage = () => {
  const location = useLocation();
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 从路由 state 获取邮箱地址（如果有）
  const emailFromState = (location.state as { email?: string })?.email || '';

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Mail className="size-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">验证您的邮箱</CardTitle>
            <CardDescription>
              我们已向您的邮箱发送了一封验证邮件
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {/* 邮箱提示 */}
            {emailFromState && (
              <Alert>
                <Info className="size-4" />
                <AlertDescription>
                  验证邮件已发送至：<strong>{emailFromState}</strong>
                </AlertDescription>
              </Alert>
            )}

            {/* 成功提示 */}
            {success && (
              <Alert>
                <CircleCheck className="size-4" />
                <AlertDescription>
                  验证邮件已重新发送，请查收您的邮箱
                </AlertDescription>
              </Alert>
            )}

            {/* 错误提示 */}
            {error && (
              <Alert variant="destructive">
                <TriangleAlert className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* 操作说明 */}
            <div className="grid gap-2">
              <p className="text-sm text-muted-foreground">
                请按照以下步骤完成验证：
              </p>
              <ol className="grid gap-2 list-decimal list-inside text-sm text-muted-foreground">
                <li>打开您的邮箱收件箱</li>
                <li>找到来自 Orris 的验证邮件</li>
                <li>点击邮件中的验证链接</li>
              </ol>
            </div>

            {/* 重发表单 */}
            <div className="grid gap-4">
              <p className="text-sm text-muted-foreground">
                没有收到邮件？请输入您的邮箱地址重新发送：
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">邮箱地址</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    disabled={resending}
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <Button type="submit" size="lg" disabled={resending} className="w-full">
                  {resending && <Loader2 className="animate-spin" />}
                  重新发送验证邮件
                </Button>
              </form>
            </div>

            {/* 提示信息 */}
            <Alert>
              <TriangleAlert className="size-4" />
              <AlertDescription>
                请注意检查垃圾邮件文件夹。验证链接将在 24 小时后失效。
              </AlertDescription>
            </Alert>

            {/* 返回登录 */}
            <div className="text-center text-sm text-muted-foreground">
              已经验证过了？{' '}
              <RouterLink
                to="/login"
                className="text-primary underline-offset-4 hover:underline"
              >
                返回登录
              </RouterLink>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
