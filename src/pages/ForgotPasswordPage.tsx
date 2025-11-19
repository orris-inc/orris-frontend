/**
 * 忘记密码页面
 * 发送密码重置邮件
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink } from 'react-router';
import { useState } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  TextField,
  Typography,
  Stack,
  Link,
  Alert,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmailIcon from '@mui/icons-material/Email';
import * as authApi from '@/features/auth/api/auth-api';
import { extractErrorMessage } from '@/shared/utils/error-messages';
import { useNotificationStore } from '@/shared/stores/notification-store';

// Zod验证
const forgotPasswordSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage = () => {
  const { showSuccess, showError } = useNotificationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      showSuccess('重置邮件已发送，请查收邮箱');
    } catch (err) {
      console.error('忘记密码错误:', err);
      const errorMsg = extractErrorMessage(err);
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
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
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'success.lighter',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <EmailIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>

              <Typography variant="h5" component="h1" gutterBottom fontWeight="bold">
                邮件已发送
              </Typography>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                我们已经向您的邮箱发送了密码重置链接，请查收邮件并按照指引重置密码。
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                如果您没有收到邮件，请检查垃圾邮件文件夹或稍后重试。
              </Typography>

              <Link
                component={RouterLink}
                to="/login"
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
              >
                <ArrowBackIcon fontSize="small" />
                返回登录
              </Link>
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  }

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
            {/* 标题 */}
            <Typography variant="h4" component="h1" gutterBottom textAlign="center" fontWeight="bold">
              忘记密码
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
              输入您的邮箱地址，我们将发送密码重置链接
            </Typography>

            {/* 错误提示 */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* 表单 */}
            <Stack component="form" spacing={3} onSubmit={handleSubmit(onSubmit)}>
              <TextField
                {...register('email')}
                label="邮箱"
                type="email"
                fullWidth
                error={!!errors.email}
                helperText={errors.email?.message}
                autoComplete="email"
                autoFocus
              />

              <LoadingButton
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                loading={isLoading}
              >
                发送重置链接
              </LoadingButton>
            </Stack>

            {/* 返回登录 */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Link
                component={RouterLink}
                to="/login"
                underline="hover"
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
              >
                <ArrowBackIcon fontSize="small" />
                返回登录
              </Link>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};
