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
 * - 使用 shadcn/ui 组件实现现代化界面
 *
 * TODO: 后续需要接入实际的 API 获取动态数据
 * - 接入用户统计 API
 * - 接入订阅统计 API
 * - 接入收入统计 API
 * - 添加数据刷新机制
 * - 添加数据加载状态
 * - 添加错误处理
 */

import { useNavigate } from 'react-router';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  DollarSign,
  TrendingUp,
  UserPlus,
  ArrowRight,
  Settings,
  Info,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
 *   icon={<Users />}
 *   color="primary"
 *   subtitle="活跃用户"
 *   trend="+12%"
 * />
 */
const StatCard = ({ title, value, icon, color, subtitle, trend }: StatCardProps) => {
  // 根据颜色映射背景样式
  const colorClassMap = {
    primary: 'bg-blue-500',
    secondary: 'bg-purple-500',
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    info: 'bg-cyan-500',
  };

  return (
    <Card className="h-full transition-transform hover:-translate-y-1 hover:shadow-lg">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`flex items-center justify-center w-14 h-14 rounded-lg text-white ${colorClassMap[color]}`}>
            {icon}
          </div>
          {trend && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-700">
              <TrendingUp className="size-4" />
              <span className="text-xs font-bold">{trend}</span>
            </div>
          )}
        </div>

        <h3 className="text-3xl font-bold mb-1">{value}</h3>

        <p className="text-sm text-muted-foreground font-medium">{title}</p>

        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
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
 *   icon={<Users />}
 *   onClick={() => navigate('/dashboard/users')}
 *   color="primary"
 * />
 */
const QuickActionButton = ({ title, description, icon, onClick, color = 'primary' }: QuickActionProps) => {
  // 根据颜色映射背景样式
  const colorClassMap = {
    primary: 'bg-blue-50 text-blue-600',
    secondary: 'bg-purple-50 text-purple-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-amber-50 text-amber-600',
    error: 'bg-red-50 text-red-600',
    info: 'bg-cyan-50 text-cyan-600',
  };

  return (
    <Card
      className="h-full cursor-pointer transition-transform hover:-translate-y-0.5 hover:shadow-lg"
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${colorClassMap[color]}`}>
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <ArrowRight className="size-5 text-muted-foreground" />
        </div>
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
        <Alert variant="destructive">
          <AlertDescription>无法加载用户信息</AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  // TODO: 后续需要从 API 获取真实数据
  // 当前使用静态数据进行展示
  const statisticsData = [
    {
      title: '总用户数',
      value: '1,234',
      icon: <Users className="size-7" />,
      color: 'primary' as const,
      subtitle: '本月新增 89 位用户',
      trend: '+12%',
    },
    {
      title: '活跃订阅',
      value: '456',
      icon: <CreditCard className="size-7" />,
      color: 'success' as const,
      subtitle: '订阅转化率 37%',
      trend: '+8%',
    },
    {
      title: '本月收入',
      value: '¥23,456',
      icon: <DollarSign className="size-7" />,
      color: 'warning' as const,
      subtitle: '环比上月增长',
      trend: '+15%',
    },
    {
      title: '待处理事项',
      value: '12',
      icon: <Settings className="size-7" />,
      color: 'error' as const,
      subtitle: '需要您的关注',
    },
  ];

  // 快速操作配置
  const quickActions = [
    {
      title: '用户管理',
      description: '查看和管理系统用户',
      icon: <Users className="size-7" />,
      color: 'primary' as const,
      onClick: () => navigate('/admin/users'),
    },
    {
      title: '订阅计划管理',
      description: '配置和管理订阅计划',
      icon: <CreditCard className="size-7" />,
      color: 'secondary' as const,
      onClick: () => navigate('/admin/subscription-plans'),
    },
  ];

  return (
    <AdminLayout>
      <div className="py-4 sm:py-6">
        {/* 欢迎标题 */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <LayoutDashboard className="size-9 text-primary" />
            <h1 className="text-4xl font-bold">管理员控制面板</h1>
          </div>
          <p className="text-muted-foreground">
            欢迎回来，{user.display_name || user.name || user.email?.split('@')[0]}！
            这是您的管理中心，您可以在这里查看系统运营数据和进行管理操作。
          </p>
        </div>

        {/* 提示信息 */}
        <Alert className="mb-6">
          <Info className="size-4" />
          <AlertDescription>
            当前显示的是静态演示数据。正式环境中，数据将实时从后端 API 获取。
          </AlertDescription>
        </Alert>

        {/* 数据统计卡片 - 响应式 CSS Grid 布局 */}
        <h2 className="text-xl font-bold mb-4">数据概览</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          {statisticsData.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              subtitle={stat.subtitle}
              trend={stat.trend}
            />
          ))}
        </div>

        {/* 快速操作 */}
        <h2 className="text-xl font-bold mb-4">快速操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action, index) => (
            <QuickActionButton
              key={index}
              title={action.title}
              description={action.description}
              icon={action.icon}
              onClick={action.onClick}
              color={action.color}
            />
          ))}
        </div>

        {/* 新用户增长卡片（额外的视觉元素） */}
        <Card className="mt-6 bg-gradient-to-br from-purple-600 to-purple-800 text-white">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-white/20">
                <UserPlus className="size-9 text-white" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg font-bold mb-1">用户增长趋势良好</h3>
                <p className="text-sm text-white/90">
                  本月新增用户数较上月增长 12%，活跃度提升 8%。继续保持！
                </p>
              </div>
              <Button
                variant="secondary"
                className="bg-white text-purple-700 hover:bg-white/90"
                onClick={() => navigate('/admin/users')}
              >
                查看详情
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};
