/**
 * 重置密码页面
 * 通过邮件中的token重置密码
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink, useSearchParams, useNavigate } from 'react-router';
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
  IconButton,
  InputAdornment,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import * as authApi from '@/features/auth/api/auth-api';
import { extractErrorMessage } from '@/shared/utils/error-messages';
import { useNotificationStore } from '@/shared/stores/notification-store';

// Zod验证
const resetPasswordSchema = z
  .object({
    password: z.string().min(8, '密码至少需要8个字符'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const { showSuccess, showError } = useNotificationStore();

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

  // 检查token
  if (!token) {
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
              <Typography variant="h5" component="h1" gutterBottom fontWeight="bold">
                无效的重置链接
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                该密码重置链接无效或已过期，请重新申请。
              </Typography>
              <Link component={RouterLink} to="/forgot-password">
                重新申请
              </Link>
            </CardContent>
          </Card>
        </Box>
      </Container>
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

      showSuccess('密码重置成功！');
      // 成功，跳转到登录页
      navigate('/login', {
        state: { message: '密码重置成功，请使用新密码登录' },
      });
    } catch (err) {
      console.error('重置密码错误:', err);
      const errorMsg = extractErrorMessage(err);
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setIsLoading(false);
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
            {/* 标题 */}
            <Typography variant="h4" component="h1" gutterBottom textAlign="center" fontWeight="bold">
              重置密码
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
              请输入您的新密码
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
                {...register('password')}
                label="新密码"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                error={!!errors.password}
                helperText={errors.password?.message}
                autoComplete="new-password"
                autoFocus
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          aria-label="切换密码显示"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                {...register('confirmPassword')}
                label="确认新密码"
                type={showConfirmPassword ? 'text' : 'password'}
                fullWidth
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                autoComplete="new-password"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                          aria-label="切换密码显示"
                        >
                          {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <LoadingButton
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                loading={isLoading}
              >
                重置密码
              </LoadingButton>
            </Stack>

            {/* 返回登录 */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Link component={RouterLink} to="/login" underline="hover">
                返回登录
              </Link>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};
