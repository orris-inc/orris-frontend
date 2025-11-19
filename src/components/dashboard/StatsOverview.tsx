/**
 * 关键指标概览卡片
 * 显示用户账户的关键统计信息
 */

import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Stack,
  Typography,
  Skeleton,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import EmailIcon from '@mui/icons-material/Email';
import EventIcon from '@mui/icons-material/Event';
import type { User } from '@/features/auth/types/auth.types';
import { getSubscriptions } from '@/features/subscriptions/api/subscriptions-api';
import type { Subscription } from '@/features/subscriptions/types/subscriptions.types';

interface StatsOverviewProps {
  user: User;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: 'success' | 'error' | 'primary' | 'warning' | 'info';
  loading?: boolean;
}

const StatCard = ({ icon, label, value, color = 'primary', loading }: StatCardProps) => (
  <Card
    elevation={0}
    sx={{
      flex: 1,
      minWidth: { xs: '100%', sm: '150px' },
      bgcolor: `${color}.lighter`,
      border: 1,
      borderColor: `${color}.light`,
    }}
  >
    <Box sx={{ p: 2 }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 1.5,
            bgcolor: `${color}.main`,
            color: 'white',
          }}
        >
          {icon}
        </Box>
        <Box flex={1}>
          <Typography variant="caption" color="text.secondary" display="block">
            {label}
          </Typography>
          {loading ? (
            <Skeleton width={60} height={28} />
          ) : (
            <Typography variant="h6" fontWeight="bold" color={`${color}.dark`}>
              {value}
            </Typography>
          )}
        </Box>
      </Stack>
    </Box>
  </Card>
);

export const StatsOverview = ({ user }: StatsOverviewProps) => {
  const [activeSubscriptionCount, setActiveSubscriptionCount] = useState(0);
  const [nearestExpiry, setNearestExpiry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptionStats = async () => {
      try {
        setLoading(true);
        const result = await getSubscriptions({ page: 1, page_size: 100 });

        if (result.items && result.items.length > 0) {
          // 统计激活的订阅
          const activeSubscriptions = result.items.filter(
            (sub: Subscription) => sub.IsActive && !sub.IsExpired
          );
          setActiveSubscriptionCount(activeSubscriptions.length);

          // 查找最近的到期日期
          const activeDates = activeSubscriptions
            .map((sub: Subscription) => sub.EndDate || sub.CurrentPeriodEnd)
            .filter(Boolean) as string[];

          if (activeDates.length > 0) {
            const sortedDates = activeDates.sort(
              (a, b) => new Date(a).getTime() - new Date(b).getTime()
            );
            const nearest = sortedDates[0];
            const daysUntilExpiry = Math.ceil(
              (new Date(nearest).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
            setNearestExpiry(daysUntilExpiry > 0 ? `${daysUntilExpiry} 天` : '已到期');
          }
        }
      } catch (err) {
        console.error('获取订阅统计失败:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionStats();
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
      }}
    >
      {/* 活跃订阅数 */}
      <StatCard
        icon={<SubscriptionsIcon />}
        label="活跃订阅"
        value={loading ? '-' : activeSubscriptionCount}
        color="primary"
        loading={loading}
      />

      {/* 最近到期时间 */}
      {activeSubscriptionCount > 0 && (
        <StatCard
          icon={<EventIcon />}
          label="最近到期"
          value={nearestExpiry || '-'}
          color="primary"
          loading={loading}
        />
      )}

      {/* 邮箱验证状态 */}
      <StatCard
        icon={user.email_verified ? <CheckCircleIcon /> : <CancelIcon />}
        label="邮箱状态"
        value={user.email_verified ? '已验证' : '未验证'}
        color="primary"
      />

      {/* 登录方式 */}
      {user.oauth_provider && (
        <StatCard
          icon={<EmailIcon />}
          label="登录方式"
          value={user.oauth_provider.toUpperCase()}
          color="primary"
        />
      )}
    </Box>
  );
};
