/**
 * 用户端定价页面
 */

import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { PlanCardList } from '@/features/subscription-plans/components/PlanCardList';
import { SubscriptionConfirmDialog } from '@/features/subscription-plans/components/SubscriptionConfirmDialog';
import { usePublicPlans } from '@/features/subscription-plans/hooks/usePublicPlans';
import type { BillingCycle, SubscriptionPlan } from '@/features/subscription-plans/types/subscription-plans.types';
import { DashboardLayout } from '@/layouts/DashboardLayout';

export const PricingPage = () => {
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle | 'all'>('all');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const { publicPlans, loading } = usePublicPlans(
    selectedCycle === 'all' ? undefined : selectedCycle
  );

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setConfirmDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <Container maxWidth="lg">
        <Box py={8}>
        {/* 页面标题 */}
        <Box textAlign="center" mb={6}>
          <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
            选择适合您的套餐
          </Typography>
          <Typography variant="h6" color="text.secondary" paragraph>
            灵活的定价方案，满足不同规模团队的需求
          </Typography>
        </Box>

        {/* 计费周期切换 */}
        <Box display="flex" justifyContent="center" mb={4}>
          <ToggleButtonGroup
            value={selectedCycle}
            exclusive
            onChange={(_, newValue) => {
              if (newValue !== null) {
                setSelectedCycle(newValue);
              }
            }}
            aria-label="计费周期"
          >
            <ToggleButton value="all">全部</ToggleButton>
            <ToggleButton value="monthly">月付</ToggleButton>
            <ToggleButton value="quarterly">季付</ToggleButton>
            <ToggleButton value="annual">年付</ToggleButton>
            <ToggleButton value="lifetime">终身</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* 计划卡片列表 */}
        <PlanCardList
          plans={publicPlans}
          loading={loading}
          onSelectPlan={handleSelectPlan}
        />

        {/* 说明文字 */}
        <Box mt={8} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            所有计划均支持随时升级或降级。部分计划提供多种计费周期选项，订阅时可灵活选择。如有疑问，请联系客服。
          </Typography>
        </Box>

        {/* 订阅确认对话框 */}
        <SubscriptionConfirmDialog
          open={confirmDialogOpen}
          plan={selectedPlan}
          onClose={() => {
            setConfirmDialogOpen(false);
            setSelectedPlan(null);
          }}
        />
        </Box>
      </Container>
    </DashboardLayout>
  );
};
