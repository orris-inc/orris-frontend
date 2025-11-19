/**
 * 邮箱验证页面
 * 处理用户点击验证邮件链接后的验证逻辑
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { verifyEmail } from '@/features/auth/api/auth-api';
import { handleApiError } from '@/shared/lib/axios';

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
          <Stack spacing={3} alignItems="center">
            <CircularProgress size={60} />
            <Typography variant="h5" textAlign="center">
              正在验证您的邮箱...
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              请稍候，我们正在确认您的邮箱地址
            </Typography>
          </Stack>
        );

      case 'success':
        return (
          <Stack spacing={3} alignItems="center">
            <CheckCircleOutlineIcon sx={{ fontSize: 80, color: 'success.main' }} />
            <Typography variant="h5" textAlign="center" fontWeight="bold">
              邮箱验证成功！
            </Typography>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              您的邮箱已成功验证，现在可以登录您的账号了
            </Typography>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleGoToLogin}
              sx={{ mt: 2 }}
            >
              前往登录
            </Button>
          </Stack>
        );

      case 'already_verified':
        return (
          <Stack spacing={3} alignItems="center">
            <CheckCircleOutlineIcon sx={{ fontSize: 80, color: 'info.main' }} />
            <Typography variant="h5" textAlign="center" fontWeight="bold">
              邮箱已验证
            </Typography>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              您的邮箱之前已经验证过了，可以直接登录
            </Typography>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleGoToLogin}
              sx={{ mt: 2 }}
            >
              前往登录
            </Button>
          </Stack>
        );

      case 'error':
        return (
          <Stack spacing={3} alignItems="center">
            <ErrorOutlineIcon sx={{ fontSize: 80, color: 'error.main' }} />
            <Typography variant="h5" textAlign="center" fontWeight="bold">
              验证失败
            </Typography>

            <Alert severity="error" sx={{ width: '100%' }}>
              {errorMessage || '验证链接已失效或无效'}
            </Alert>

            <Typography variant="body2" color="text.secondary" textAlign="center">
              验证链接可能已过期或无效，请尝试重新发送验证邮件
            </Typography>

            <Stack spacing={2} sx={{ width: '100%' }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleResendEmail}
              >
                重新发送验证邮件
              </Button>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={handleGoToLogin}
              >
                返回登录
              </Button>
            </Stack>
          </Stack>
        );

      default:
        return null;
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
            {renderContent()}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};
