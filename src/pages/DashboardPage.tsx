/**
 * Dashboard 主页面
 * 显示用户信息和快捷操作
 */

import { Box, Typography, Alert } from '@mui/material';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { UserProfileCard } from '@/components/dashboard/UserProfileCard';
import { SubscriptionCard } from '@/components/dashboard/SubscriptionCard';
import { QuickLinks } from '@/components/dashboard/QuickLinks';
import WavingHandIcon from '@mui/icons-material/WavingHand';

export const DashboardPage = () => {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <DashboardLayout>
        <Alert severity="error">无法加载用户信息</Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ py: { xs: 2, sm: 4 } }}>
        {/* 欢迎标题 */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <WavingHandIcon sx={{ fontSize: 32, color: 'warning.main' }} />
            <Typography variant="h4" component="h1" fontWeight="bold">
              欢迎回来，{user.display_name || user.name || user.email?.split('@')[0] || '用户'}！
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            这是您的个人控制面板，您可以在这里查看和管理您的账户信息。
          </Typography>
        </Box>

        {/* 关键指标栏 */}
        <Box sx={{ mb: 3 }}>
          <StatsOverview user={user} />
        </Box>

        {/* 邮箱未验证提示 */}
        {!user.email_verified && (
          <Box sx={{ mb: 3 }}>
            <Alert severity="warning">
              您的邮箱尚未验证，请查收验证邮件以激活全部功能。
            </Alert>
          </Box>
        )}

        {/* 主要内容区 - 3列网格布局 */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            },
            gap: 3,
          }}
        >
          {/* 用户资料卡片 */}
          <UserProfileCard user={user} />

          {/* 订阅卡片 */}
          <SubscriptionCard />

          {/* 快速链接 */}
          <QuickLinks />
        </Box>
      </Box>
    </DashboardLayout>
  );
};
