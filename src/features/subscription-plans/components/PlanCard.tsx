/**
 * 订阅计划卡片组件（用户端）
 */

import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Divider,
} from '@mui/material';
import { BillingCycleBadge } from './BillingCycleBadge';
import { PlanFeatureList } from './PlanFeatureList';
import { PlanPricingSelector } from './PlanPricingSelector';
import type { SubscriptionPlan } from '../types/subscription-plans.types';

interface PlanCardProps {
  plan: SubscriptionPlan;
  recommended?: boolean;
  onSelect?: (plan: SubscriptionPlan) => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  recommended = false,
  onSelect,
}) => {
  // 检查是否有多定价选项
  const hasPricings = plan.pricings && plan.pricings.length > 0;

  // 格式化价格（分转元）- 用于向后兼容，当没有pricings时使用
  const formattedPrice = (plan.Price / 100).toFixed(2);
  const currencySymbol = plan.Currency === 'CNY' ? '¥' : '$';

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        border: recommended ? 2 : 1,
        borderColor: recommended ? 'primary.main' : 'divider',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      {/* 推荐标签 */}
      {recommended && (
        <Box
          sx={{
            position: 'absolute',
            top: -12,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: 'primary.main',
            color: 'white',
            px: 2,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.75rem',
            fontWeight: 'bold',
          }}
        >
          推荐
        </Box>
      )}

      <CardContent sx={{ flexGrow: 1, pt: recommended ? 3 : 2 }}>
        {/* 计划名称 */}
        <Typography variant="h5" component="h2" gutterBottom fontWeight="bold">
          {plan.Name}
        </Typography>

        {/* 计费周期标签 - 仅在没有多定价时显示 */}
        {!hasPricings && (
          <Box mb={2}>
            <BillingCycleBadge billingCycle={plan.BillingCycle} />
          </Box>
        )}

        {/* 价格展示 */}
        <Box mb={2}>
          {hasPricings ? (
            // 使用新的定价选择器组件
            <PlanPricingSelector
              pricings={plan.pricings!}
              defaultBillingCycle={plan.BillingCycle}
            />
          ) : (
            // 向后兼容：使用单一价格
            <>
              <Typography variant="h3" component="div" fontWeight="bold">
                {currencySymbol}{formattedPrice}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                每{plan.BillingCycle === 'monthly' ? '月' : plan.BillingCycle === 'annual' ? '年' : '周期'}
              </Typography>
            </>
          )}
        </Box>

        {/* 描述 */}
        {plan.Description && (
          <Typography variant="body2" color="text.secondary" mb={2}>
            {plan.Description}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        {/* 功能列表 */}
        {plan.Features && plan.Features.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
              功能特性
            </Typography>
            <PlanFeatureList features={plan.Features} />
          </Box>
        )}

        {/* 限制信息 */}
        {(plan.MaxUsers || plan.MaxProjects) && (
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary" display="block">
              {plan.MaxUsers && `最多 ${plan.MaxUsers} 个用户`}
              {plan.MaxUsers && plan.MaxProjects && ' · '}
              {plan.MaxProjects && `${plan.MaxProjects} 个项目`}
            </Typography>
          </Box>
        )}

        {/* 试用天数 */}
        {plan.TrialDays && plan.TrialDays > 0 && (
          <Box mt={1}>
            <Typography variant="caption" color="success.main" fontWeight="bold">
              免费试用 {plan.TrialDays} 天
            </Typography>
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          variant={recommended ? 'contained' : 'outlined'}
          fullWidth
          size="large"
          onClick={() => onSelect?.(plan)}
        >
          选择计划
        </Button>
      </CardActions>
    </Card>
  );
};
