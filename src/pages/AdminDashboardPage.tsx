/**
 * 管理端首页
 * 展示管理员控制面板，包含数据统计和快速操作入口
 *
 * @module AdminDashboardPage
 * @description 管理员专用的仪表板页面，提供系统整体数据概览和管理功能快速入口
 *
 * 功能特性：
 * - 展示系统关键数据统计（用户数、订阅数、收入等）
 * - 提供快速操作入口（用户管理、订阅计划管理）
 * - 响应式布局设计，适配不同屏幕尺寸
 * - 使用 Material-UI 组件实现现代化界面
 *
 * TODO: 后续需要接入实际的 API 获取动态数据
 * - 接入用户统计 API
 * - 接入订阅统计 API
 * - 接入收入统计 API
 * - 添加数据刷新机制
 * - 添加数据加载状态
 * - 添加错误处理
 */

import { Box, Typography, Card, CardContent, Button, Stack, Alert } from '@mui/material';
import { useNavigate } from 'react-router';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SettingsIcon from '@mui/icons-material/Settings';

/**
 * 数据统计卡片的属性接口
 */
interface StatCardProps {
  /** 卡片标题 */
  title: string;
  /** 主要显示的数值 */
  value: string | number;
  /** 图标组件 */
  icon: React.ReactNode;
  /** 卡片的主题色 */
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  /** 可选的副标题或描述 */
  subtitle?: string;
  /** 增长趋势百分比（可选） */
  trend?: string;
}

/**
 * 数据统计卡片组件
 *
 * @component
 * @param {StatCardProps} props - 卡片属性
 * @returns {JSX.Element} 统计卡片
 *
 * @example
 * <StatCard
 *   title="总用户数"
 *   value={1234}
 *   icon={<PeopleIcon />}
 *   color="primary"
 *   subtitle="活跃用户"
 *   trend="+12%"
 * />
 */
const StatCard = ({ title, value, icon, color, subtitle, trend }: StatCardProps) => {
  return (
    <Card
      elevation={2}
      sx={{
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 2,
              bgcolor: `${color}.main`,
              color: 'white',
            }}
          >
            {icon}
          </Box>
          {trend && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 0.5,
                borderRadius: 1,
                bgcolor: 'success.light',
                color: 'success.dark',
              }}
            >
              <TrendingUpIcon fontSize="small" />
              <Typography variant="caption" fontWeight="bold">
                {trend}
              </Typography>
            </Box>
          )}
        </Box>

        <Typography variant="h4" fontWeight="bold" gutterBottom>
          {value}
        </Typography>

        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {title}
        </Typography>

        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * 快速操作按钮的属性接口
 */
interface QuickActionProps {
  /** 按钮标题 */
  title: string;
  /** 按钮描述 */
  description: string;
  /** 图标组件 */
  icon: React.ReactNode;
  /** 点击事件处理函数 */
  onClick: () => void;
  /** 按钮颜色 */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
}

/**
 * 快速操作按钮组件
 *
 * @component
 * @param {QuickActionProps} props - 按钮属性
 * @returns {JSX.Element} 快速操作按钮
 *
 * @example
 * <QuickActionButton
 *   title="用户管理"
 *   description="管理系统用户"
 *   icon={<PeopleIcon />}
 *   onClick={() => navigate('/dashboard/users')}
 *   color="primary"
 * />
 */
const QuickActionButton = ({ title, description, icon, onClick, color = 'primary' }: QuickActionProps) => {
  return (
    <Card
      elevation={2}
      sx={{
        height: '100%',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
        },
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: `${color}.light`,
              color: `${color}.main`,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </Box>
          <ArrowForwardIcon color="action" />
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * 管理端首页组件
 *
 * @component
 * @returns {JSX.Element} 管理端首页
 *
 * @description
 * 展示管理员控制面板，包含：
 * 1. 欢迎信息
 * 2. 关键数据统计卡片（Grid 布局）
 * 3. 快速操作入口
 *
 * 使用 DashboardLayout 布局包裹，自动处理导航栏和权限
 *
 * @example
 * <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
 */
export const AdminDashboardPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // 如果用户信息未加载，显示错误提示
  if (!user) {
    return (
      <AdminLayout>
        <Alert severity="error">无法加载用户信息</Alert>
      </AdminLayout>
    );
  }

  // TODO: 后续需要从 API 获取真实数据
  // 当前使用静态数据进行展示
  const statisticsData = [
    {
      title: '总用户数',
      value: '1,234',
      icon: <PeopleIcon sx={{ fontSize: 28 }} />,
      color: 'primary' as const,
      subtitle: '本月新增 89 位用户',
      trend: '+12%',
    },
    {
      title: '活跃订阅',
      value: '456',
      icon: <SubscriptionsIcon sx={{ fontSize: 28 }} />,
      color: 'success' as const,
      subtitle: '订阅转化率 37%',
      trend: '+8%',
    },
    {
      title: '本月收入',
      value: '¥23,456',
      icon: <AttachMoneyIcon sx={{ fontSize: 28 }} />,
      color: 'warning' as const,
      subtitle: '环比上月增长',
      trend: '+15%',
    },
    {
      title: '待处理事项',
      value: '12',
      icon: <SettingsIcon sx={{ fontSize: 28 }} />,
      color: 'error' as const,
      subtitle: '需要您的关注',
    },
  ];

  // 快速操作配置
  const quickActions = [
    {
      title: '用户管理',
      description: '查看和管理系统用户',
      icon: <PeopleIcon sx={{ fontSize: 28 }} />,
      color: 'primary' as const,
      onClick: () => navigate('/admin/users'),
    },
    {
      title: '订阅计划管理',
      description: '配置和管理订阅计划',
      icon: <SubscriptionsIcon sx={{ fontSize: 28 }} />,
      color: 'secondary' as const,
      onClick: () => navigate('/admin/subscription-plans'),
    },
  ];

  return (
    <AdminLayout>
      <Box sx={{ py: { xs: 2, sm: 4 } }}>
        {/* 欢迎标题 */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <DashboardIcon sx={{ fontSize: 36, color: 'primary.main' }} />
            <Typography variant="h4" component="h1" fontWeight="bold">
              管理员控制面板
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            欢迎回来，{user.display_name || user.name || user.email?.split('@')[0]}！
            这是您的管理中心，您可以在这里查看系统运营数据和进行管理操作。
          </Typography>
        </Box>

        {/* 提示信息 */}
        <Alert severity="info" sx={{ mb: 4 }}>
          当前显示的是静态演示数据。正式环境中，数据将实时从后端 API 获取。
        </Alert>

        {/* 数据统计卡片 - 响应式 CSS Grid 布局 */}
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
          数据概览
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: 3,
            mb: 4,
          }}
        >
          {statisticsData.map((stat, index) => (
            <Box key={index}>
              <StatCard
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
                subtitle={stat.subtitle}
                trend={stat.trend}
              />
            </Box>
          ))}
        </Box>

        {/* 快速操作 */}
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
          快速操作
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, 1fr)',
            },
            gap: 3,
          }}
        >
          {quickActions.map((action, index) => (
            <Box key={index}>
              <QuickActionButton
                title={action.title}
                description={action.description}
                icon={action.icon}
                onClick={action.onClick}
                color={action.color}
              />
            </Box>
          ))}
        </Box>

        {/* 新用户增长卡片（额外的视觉元素） */}
        <Card elevation={2} sx={{ mt: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 64,
                  height: 64,
                  borderRadius: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                }}
              >
                <GroupAddIcon sx={{ fontSize: 36, color: 'white' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight="bold" color="white" gutterBottom>
                  用户增长趋势良好
                </Typography>
                <Typography variant="body2" color="rgba(255, 255, 255, 0.9)">
                  本月新增用户数较上月增长 12%，活跃度提升 8%。继续保持！
                </Typography>
              </Box>
              <Button
                variant="contained"
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                  },
                }}
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/admin/users')}
              >
                查看详情
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </AdminLayout>
  );
};
