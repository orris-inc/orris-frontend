/**
 * 邮箱验证待处理页面
 * 用户注册成功后显示，提示用户查收验证邮件
 */

import { useState } from 'react';
import { useLocation, Link as RouterLink } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Alert,
  Stack,
  TextField,
  Link,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import EmailIcon from '@mui/icons-material/Email';
import { resendVerificationEmail } from '@/features/auth/api/auth-api';
import { handleApiError } from '@/shared/lib/axios';

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
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Card sx={{ width: '100%' }}>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={3} alignItems="center">
              {/* 图标 */}
              <EmailIcon sx={{ fontSize: 80, color: 'primary.main' }} />

              {/* 标题 */}
              <Typography variant="h5" textAlign="center" fontWeight="bold">
                验证您的邮箱
              </Typography>

              {/* 说明文字 */}
              <Typography variant="body1" color="text.secondary" textAlign="center">
                我们已向您的邮箱发送了一封验证邮件
              </Typography>

              {emailFromState && (
                <Alert severity="info" sx={{ width: '100%' }}>
                  <Typography variant="body2">
                    验证邮件已发送至：<strong>{emailFromState}</strong>
                  </Typography>
                </Alert>
              )}

              {/* 成功提示 */}
              {success && (
                <Alert severity="success" sx={{ width: '100%' }}>
                  验证邮件已重新发送，请查收您的邮箱
                </Alert>
              )}

              {/* 错误提示 */}
              {error && (
                <Alert severity="error" sx={{ width: '100%' }}>
                  {error}
                </Alert>
              )}

              {/* 操作说明 */}
              <Box sx={{ width: '100%' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  请按照以下步骤完成验证：
                </Typography>
                <Stack component="ol" spacing={1} sx={{ pl: 2 }}>
                  <Typography component="li" variant="body2" color="text.secondary">
                    打开您的邮箱收件箱
                  </Typography>
                  <Typography component="li" variant="body2" color="text.secondary">
                    找到来自 Orris 的验证邮件
                  </Typography>
                  <Typography component="li" variant="body2" color="text.secondary">
                    点击邮件中的验证链接
                  </Typography>
                </Stack>
              </Box>

              {/* 重发表单 */}
              <Box sx={{ width: '100%', pt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  没有收到邮件？请输入您的邮箱地址重新发送：
                </Typography>

                <Stack
                  component="form"
                  spacing={2}
                  onSubmit={handleSubmit(onSubmit)}
                  sx={{ mt: 2 }}
                >
                  <TextField
                    {...register('email')}
                    label="邮箱地址"
                    type="email"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    autoComplete="email"
                    disabled={resending}
                  />

                  <LoadingButton
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    loading={resending}
                  >
                    重新发送验证邮件
                  </LoadingButton>
                </Stack>
              </Box>

              {/* 提示信息 */}
              <Alert severity="warning" sx={{ width: '100%' }}>
                <Typography variant="body2">
                  请注意检查垃圾邮件文件夹。验证链接将在 24 小时后失效。
                </Typography>
              </Alert>

              {/* 返回登录 */}
              <Box sx={{ textAlign: 'center', width: '100%' }}>
                <Typography variant="body2" color="text.secondary">
                  已经验证过了？{' '}
                  <Link component={RouterLink} to="/login" underline="hover">
                    返回登录
                  </Link>
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};
