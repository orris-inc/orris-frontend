/**
 * 订阅计划卡片列表组件（用户端）
 */

import { Box, Typography, CircularProgress } from '@mui/material';
import { PlanCard } from './PlanCard';
import type { SubscriptionPlan } from '../types/subscription-plans.types';

interface PlanCardListProps {
  plans: SubscriptionPlan[];
  loading?: boolean;
  recommendedPlanId?: number;
  onSelectPlan?: (plan: SubscriptionPlan) => void;
}

export const PlanCardList: React.FC<PlanCardListProps> = ({
  plans,
  loading = false,
  recommendedPlanId,
  onSelectPlan,
}) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h6" color="text.secondary">
          暂无可用的订阅计划
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
      {plans.map((plan) => (
        <Box key={plan.ID}>
          <PlanCard
            plan={plan}
            recommended={plan.ID === recommendedPlanId}
            onSelect={onSelectPlan}
          />
        </Box>
      ))}
    </Box>
  );
};
