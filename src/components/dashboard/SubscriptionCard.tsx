/**
 * 用户订阅卡片
 * 显示用户当前订阅信息
 */

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getSubscriptions } from '@/features/subscriptions/api/subscriptions-api';
import type { Subscription } from '@/features/subscriptions/types/subscriptions.types';

/**
 * 获取订阅状态的显示配置
 */
const getStatusConfig = (subscription: Subscription) => {
  if (subscription.IsExpired) {
    return {
      label: '已过期',
      color: 'error' as const,
      icon: <ErrorIcon fontSize="small" />,
    };
  }

  if (!subscription.IsActive) {
    return {
      label: '未激活',
      color: 'default' as const,
      icon: <InfoIcon fontSize="small" />,
    };
  }

  switch (subscription.Status) {
    case 'active':
      return {
        label: '激活中',
        color: 'success' as const,
        icon: <CheckCircleIcon fontSize="small" />,
      };
    case 'cancelled':
      return {
        label: '已取消',
        color: 'warning' as const,
        icon: <WarningIcon fontSize="small" />,
      };
    case 'pending':
      return {
        label: '待处理',
        color: 'info' as const,
        icon: <InfoIcon fontSize="small" />,
      };
    default:
      return {
        label: subscription.Status,
        color: 'default' as const,
        icon: <InfoIcon fontSize="small" />,
      };
  }
};

/**
 * 格式化日期显示
 */
const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

/**
 * 格式化价格显示
 */
const formatPrice = (price?: number, currency?: string) => {
  if (price === undefined) return '-';
  const formattedPrice = (price / 100).toFixed(2);
  const currencySymbol = currency === 'CNY' ? '¥' : currency === 'USD' ? '$' : currency || '';
  return `${currencySymbol}${formattedPrice}`;
};

export const SubscriptionCard = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false); // 是否显示全部订阅

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);
        setError(null);

        // 获取用户的所有订阅
        const result = await getSubscriptions({ page: 1, page_size: 100 });

        if (result.items && result.items.length > 0) {
          setSubscriptions(result.items);
        } else {
          setSubscriptions([]);
        }
      } catch (err) {
        console.error('获取订阅信息失败:', err);
        setError('加载订阅信息失败');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  // 加载中状态
  if (loading) {
    return (
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            我的订阅
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={32} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  // 错误状态
  if (error) {
    return (
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            我的订阅
          </Typography>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  // 无订阅状态
  if (subscriptions.length === 0) {
    return (
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            我的订阅
          </Typography>
          <Box sx={{ py: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              您还没有任何订阅
            </Alert>
            <Button variant="contained" color="primary" fullWidth href="/pricing">
              查看订阅计划
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // 有订阅数据 - 显示折叠列表
  // 分离激活和非激活的订阅
  const activeSubscriptions = subscriptions.filter(
    (sub) => sub.IsActive && !sub.IsExpired
  );
  const inactiveSubscriptions = subscriptions.filter(
    (sub) => !sub.IsActive || sub.IsExpired
  );

  // 决定显示哪些订阅
  const displaySubscriptions = showAll ? subscriptions : activeSubscriptions;

  return (
    <Card elevation={2}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            我的订阅
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={`${activeSubscriptions.length} 个激活`}
              size="small"
              color="success"
              variant="outlined"
            />
            {inactiveSubscriptions.length > 0 && (
              <Chip
                label={`${inactiveSubscriptions.length} 个其他`}
                size="small"
                variant="outlined"
              />
            )}
          </Stack>
        </Stack>

        {/* 显示激活订阅或全部订阅 */}
        {displaySubscriptions.length === 0 ? (
          <Alert severity="info">
            {showAll ? '没有订阅' : '没有激活的订阅'}
          </Alert>
        ) : (
          <Stack spacing={1}>
            {displaySubscriptions.map((subscription) => {
            const statusConfig = getStatusConfig(subscription);
            const isActive = subscription.IsActive && !subscription.IsExpired;

            return (
              <Accordion
                key={subscription.ID}
                elevation={0}
                sx={{
                  border: isActive ? 2 : 1,
                  borderColor: isActive ? 'success.main' : 'divider',
                  borderRadius: 1,
                  '&:before': { display: 'none' },
                  '&.Mui-expanded': { margin: 0 },
                }}
              >
                {/* 折叠头部 - 简要信息 */}
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    bgcolor: isActive ? 'success.lighter' : 'background.paper',
                    '&.Mui-expanded': { minHeight: 48 },
                    '& .MuiAccordionSummary-content.Mui-expanded': { margin: '12px 0' },
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ width: '100%', pr: 1 }}
                  >
                    <Typography variant="subtitle1" fontWeight={600}>
                      {subscription.Plan?.Name || '未知计划'}
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      {statusConfig.icon}
                      <Typography
                        variant="body2"
                        color={`${statusConfig.color}.main`}
                        fontWeight={500}
                      >
                        {statusConfig.label}
                      </Typography>
                    </Stack>
                  </Stack>
                </AccordionSummary>

                {/* 折叠内容 - 详细信息 */}
                <AccordionDetails sx={{ pt: 0 }}>
                  <List disablePadding dense>
                    {/* 价格 */}
                    {subscription.Plan?.Price !== undefined && (
                      <ListItem disablePadding sx={{ py: 0.5 }}>
                        <ListItemText
                          primary="价格"
                          primaryTypographyProps={{
                            variant: 'body2',
                            color: 'text.secondary',
                          }}
                        />
                        <Typography variant="body2" fontWeight={500}>
                          {formatPrice(subscription.Plan.Price, subscription.Plan.Currency)}
                        </Typography>
                      </ListItem>
                    )}

                    {/* 自动续费 */}
                    <ListItem disablePadding sx={{ py: 0.5 }}>
                      <ListItemText
                        primary="自动续费"
                        primaryTypographyProps={{
                          variant: 'body2',
                          color: 'text.secondary',
                        }}
                      />
                      <Chip
                        label={subscription.AutoRenew ? '已开启' : '已关闭'}
                        size="small"
                        color={subscription.AutoRenew ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </ListItem>

                    {/* 开始日期 */}
                    <ListItem disablePadding sx={{ py: 0.5 }}>
                      <ListItemText
                        primary="开始日期"
                        primaryTypographyProps={{
                          variant: 'body2',
                          color: 'text.secondary',
                        }}
                      />
                      <Typography variant="body2" fontWeight={500}>
                        {formatDate(subscription.StartDate)}
                      </Typography>
                    </ListItem>

                    {/* 到期日期 */}
                    {subscription.EndDate && (
                      <ListItem disablePadding sx={{ py: 0.5 }}>
                        <ListItemText
                          primary="到期日期"
                          primaryTypographyProps={{
                            variant: 'body2',
                            color: 'text.secondary',
                          }}
                        />
                        <Typography variant="body2" fontWeight={500}>
                          {formatDate(subscription.EndDate)}
                        </Typography>
                      </ListItem>
                    )}

                    {/* 当前计费周期 */}
                    {subscription.CurrentPeriodEnd && isActive && (
                      <ListItem disablePadding sx={{ py: 0.5 }}>
                        <ListItemText
                          primary="下次续费"
                          primaryTypographyProps={{
                            variant: 'body2',
                            color: 'text.secondary',
                          }}
                        />
                        <Typography variant="body2" fontWeight={500}>
                          {formatDate(subscription.CurrentPeriodEnd)}
                        </Typography>
                      </ListItem>
                    )}
                  </List>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Stack>
        )}

        {/* 切换显示全部/仅激活 */}
        {inactiveSubscriptions.length > 0 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              size="small"
              variant="text"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? '只看激活订阅' : `查看全部订阅 (${subscriptions.length})`}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
