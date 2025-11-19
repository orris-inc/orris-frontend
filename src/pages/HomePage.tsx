/**
 * 首页
 * 登录后的主页面
 */

import { Container, Box, Typography, Card, CardContent, Button, Stack, Avatar } from '@mui/material';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const HomePage = () => {
  const { user } = useAuthStore();
  const { logout, isLoading } = useAuth();

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 8 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={3} alignItems="center">
              {/* 用户头像 */}
              <Avatar
                src={user?.avatar}
                alt={user?.name}
                sx={{
                  width: 100,
                  height: 100,
                  fontSize: '2.5rem',
                  bgcolor: 'primary.main',
                }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>

              {/* 欢迎信息 */}
              <Box textAlign="center">
                <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                  欢迎回来，{user?.name}！
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  您已成功登录 Orris
                </Typography>
              </Box>

              {/* 用户信息 */}
              <Card variant="outlined" sx={{ width: '100%' }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        邮箱
                      </Typography>
                      <Typography variant="body1">{user?.email}</Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        账号ID
                      </Typography>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                        {user?.id}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        邮箱验证状态
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: user?.email_verified ? 'success.main' : 'warning.main',
                        }}
                      >
                        {user?.email_verified ? '已验证' : '未验证'}
                      </Typography>
                    </Box>

                    {user?.oauth_provider && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          OAuth提供商
                        </Typography>
                        <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                          {user.oauth_provider}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              {/* 登出按钮 */}
              <Button
                variant="outlined"
                color="error"
                size="large"
                onClick={logout}
                disabled={isLoading}
                sx={{ mt: 2 }}
              >
                退出登录
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};
