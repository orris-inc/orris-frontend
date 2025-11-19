/**
 * 注册页面
 * 支持邮箱注册和OAuth2快速注册
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
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
  LinearProgress,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useNotificationStore } from '@/shared/stores/notification-store';

// Zod 4 注册表单验证
const registerSchema = z
  .object({
    name: z.string().min(2, '姓名至少需要2个字符').max(100, '姓名最多100个字符'),
    email: z.string().email('请输入有效的邮箱地址'),
    password: z.string().min(8, '密码至少需要8个字符'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

// 密码强度计算
const calculatePasswordStrength = (password: string): number => {
  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 25;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
  if (/[0-9]/.test(password)) strength += 25;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 25;
  return Math.min(strength, 100);
};

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { register: registerUser, loginWithOAuth, isLoading, error } = useAuth();
  const { showSuccess, showError } = useNotificationStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // 已登录则跳转到Dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password', '');

  // 监听密码变化，计算强度
  const handlePasswordChange = (value: string) => {
    setPasswordStrength(calculatePasswordStrength(value));
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      showSuccess('注册成功！请查收验证邮件');
    } catch (err) {
      // 错误信息已在error state中，通过Alert显示
      const errorMessage = err instanceof Error ? err.message : '注册失败，请重试';
      showError(errorMessage);
    }
  };

  const handleOAuthRegister = async (provider: 'google' | 'github') => {
    try {
      await loginWithOAuth(provider);
      showSuccess('注册成功！');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OAuth注册失败';
      showError(errorMessage);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return 'error';
    if (passwordStrength < 50) return 'warning';
    if (passwordStrength < 75) return 'info';
    return 'success';
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
              创建账号
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
              加入 Orris，开始您的旅程
            </Typography>

            {/* 错误提示 */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* 注册表单 */}
            <Stack component="form" spacing={3} onSubmit={handleSubmit(onSubmit)}>
              <TextField
                {...register('name')}
                label="姓名"
                fullWidth
                error={!!errors.name}
                helperText={errors.name?.message}
                autoComplete="name"
                autoFocus
              />

              <TextField
                {...register('email')}
                label="邮箱"
                type="email"
                fullWidth
                error={!!errors.email}
                helperText={errors.email?.message}
                autoComplete="email"
              />

              <Box>
                <TextField
                  {...register('password')}
                  label="密码"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  autoComplete="new-password"
                  onChange={(e) => {
                    register('password').onChange(e);
                    handlePasswordChange(e.target.value);
                  }}
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
                {password && (
                  <Box sx={{ mt: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={passwordStrength}
                      color={getPasswordStrengthColor()}
                    />
                    <Typography variant="caption" color="text.secondary">
                      密码强度：
                      {passwordStrength < 25 && '弱'}
                      {passwordStrength >= 25 && passwordStrength < 50 && '中'}
                      {passwordStrength >= 50 && passwordStrength < 75 && '良'}
                      {passwordStrength >= 75 && '强'}
                    </Typography>
                  </Box>
                )}
              </Box>

              <TextField
                {...register('confirmPassword')}
                label="确认密码"
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
                注册
              </LoadingButton>
            </Stack>

            {/* 分隔线 */}
            <Divider sx={{ my: 3 }}>或</Divider>

            {/* OAuth 注册按钮 */}
            <Stack spacing={2}>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                startIcon={<GoogleIcon />}
                onClick={() => handleOAuthRegister('google')}
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
                使用 Google 注册
              </Button>

              <Button
                variant="outlined"
                size="large"
                fullWidth
                startIcon={<GitHubIcon />}
                onClick={() => handleOAuthRegister('github')}
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
                使用 GitHub 注册
              </Button>
            </Stack>

            {/* 登录链接 */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                已有账号？{' '}
                <Link component={RouterLink} to="/login" underline="hover">
                  立即登录
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};
