/**
 * 个人资料设置页面
 * 提供完整的个人信息编辑界面
 */

import { Container, Paper, Typography, Box, Divider } from '@mui/material';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { AvatarUpload } from '@/features/profile/components/AvatarUpload';
import { BasicInfoTab } from '@/features/profile/components/BasicInfoTab';
import { DashboardLayout } from '@/layouts/DashboardLayout';

export const ProfileSettingsPage = () => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return (
      <DashboardLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            请先登录
          </Typography>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 页面标题 */}
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{
          fontWeight: 700,
          mb: 3,
        }}
      >
        个人资料设置
      </Typography>

      {/* 主内容区域 */}
      <Paper
        elevation={0}
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {/* 头像上传区域 */}
        <Box
          sx={{
            p: { xs: 3, sm: 4 },
            backgroundColor: 'background.default',
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            个人头像
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            点击上传新头像,支持JPG、PNG和WebP格式,文件大小不超过2MB
          </Typography>
          <AvatarUpload avatar={user.avatar} name={user.name} />
        </Box>

        <Divider />

        {/* 个人信息表单区域 */}
        <Box sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            基本信息
          </Typography>
          <BasicInfoTab user={user} />
        </Box>
      </Paper>

      {/* 帮助提示 */}
      <Box sx={{ mt: 3, p: 2, backgroundColor: 'info.lighter', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          💡 提示: 修改邮箱地址需要重新验证。如需更改密码,请访问账户设置页面。
        </Typography>
      </Box>
    </Container>
    </DashboardLayout>
  );
};
