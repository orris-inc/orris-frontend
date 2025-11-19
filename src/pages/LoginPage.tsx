/**
 * 登录页面
 * 支持邮箱密码登录和OAuth2登录（Google、GitHub）
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router';
import { useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Stack,
  Divider,
  Link,
  Alert,
  IconButton,
  InputAdornment,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { useState } from 'react';
import { isAccountNotActiveError } from '@/shared/utils/error-messages';

// Zod 4 登录表单验证
const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(8, '密码至少需要8个字符'),
  rememberMe: z.boolean().catch(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  const { login, loginWithOAuth, isLoading, error } = useAuth();
  const { showSuccess, showError } = useNotificationStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');

  // 从 location.state 获取提示消息（例如注册成功或密码重置成功）
  const state = location.state as { message?: string } | null;
  const successMessage = state?.message;

  // 已登录则根据用户角色跳转
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = user.role === 'admin' ? '/admin' : '/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setShowResendVerification(false);
    setUserEmail(data.email);

    try {
      await login(data);
      showSuccess('登录成功！');
    } catch (err) {
      // 检查是否是账号未激活错误
      if (isAccountNotActiveError(err)) {
        setShowResendVerification(true);
      }
      const errorMessage = err instanceof Error ? err.message : '登录失败，请重试';
      showError(errorMessage);
    }
  };

  const handleResendVerification = () => {
    // 跳转到验证待处理页面，用户可以在那里输入邮箱并重新发送验证邮件
    navigate('/verification-pending', {
      state: { email: userEmail },
    });
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    try {
      await loginWithOAuth(provider);
      showSuccess('登录成功！');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OAuth登录失败';
      showError(errorMessage);
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
              欢迎回来
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
              登录您的 Orris 账号
            </Typography>

            {/* 成功消息提示（如注册成功、密码重置成功等） */}
            {successMessage && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {successMessage}
              </Alert>
            )}

            {/* 错误提示 */}
            {error && (
              <Alert
                severity="error"
                sx={{ mb: 3 }}
                action={
                  showResendVerification ? (
                    <Button
                      color="inherit"
                      size="small"
                      onClick={handleResendVerification}
                    >
                      前往验证
                    </Button>
                  ) : undefined
                }
              >
                {error}
              </Alert>
            )}

            {/* 登录表单 */}
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

              <TextField
                {...register('password')}
                label="密码"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                error={!!errors.password}
                helperText={errors.password?.message}
                autoComplete="current-password"
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

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      {...register('rememberMe')}
                      defaultChecked={false}
                      color="primary"
                    />
                  }
                  label="记住我"
                />
                <Link
                  component={RouterLink}
                  to="/forgot-password"
                  variant="body2"
                  underline="hover"
                >
                  忘记密码？
                </Link>
              </Box>

              <LoadingButton
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                loading={isLoading}
              >
                登录
              </LoadingButton>
            </Stack>

            {/* 分隔线 */}
            <Divider sx={{ my: 3 }}>或</Divider>

            {/* OAuth 登录按钮 */}
            <Stack spacing={2}>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                startIcon={<GoogleIcon />}
                onClick={() => handleOAuthLogin('google')}
                disabled={isLoading}
                sx={{
                  color: '#DB4437',
                  borderColor: '#DB4437',
                  '&:hover': {
                    borderColor: '#DB4437',
                    bgcolor: 'rgba(219, 68, 55, 0.04)',
                  },
                }}
              >
                使用 Google 登录
              </Button>

              <Button
                variant="outlined"
                size="large"
                fullWidth
                startIcon={<GitHubIcon />}
                onClick={() => handleOAuthLogin('github')}
                disabled={isLoading}
                sx={{
                  color: '#24292e',
                  borderColor: '#24292e',
                  '&:hover': {
                    borderColor: '#24292e',
                    bgcolor: 'rgba(36, 41, 46, 0.04)',
                  },
                }}
              >
                使用 GitHub 登录
              </Button>
            </Stack>

            {/* 注册链接 */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                还没有账号？{' '}
                <Link component={RouterLink} to="/register" underline="hover">
                  立即注册
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};
