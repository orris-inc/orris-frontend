/**
 * 用户端定价页面
 */

import { useState } from 'react';
import { PlanCardList } from '@/features/subscription-plans/components/PlanCardList';
import { SubscriptionConfirmDialog } from '@/features/subscription-plans/components/SubscriptionConfirmDialog';
import { usePublicPlans } from '@/features/subscription-plans/hooks/usePublicPlans';
import type { SubscriptionPlan } from '@/api/subscription/types';
import { DashboardLayout } from '@/layouts/DashboardLayout';

export const PricingPage = () => {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const { publicPlans, isLoading } = usePublicPlans();

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setConfirmDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 py-8 sm:py-12">
        {/* 标题区 */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            选择适合您的套餐
          </h1>
          <p className="text-lg text-muted-foreground">
            灵活的定价方案，满足不同规模团队的需求
          </p>
        </div>

        {/* 计划卡片列表 */}
        <PlanCardList
          plans={publicPlans}
          loading={isLoading}
          onSelectPlan={handleSelectPlan}
        />

        {/* 说明文字 */}
        <div className="text-sm text-muted-foreground">
          所有计划均支持随时升级或降级。部分计划提供多种计费周期选项，订阅时可灵活选择。如有疑问，请联系客服。
        </div>

        {/* 订阅确认对话框 */}
        <SubscriptionConfirmDialog
          open={confirmDialogOpen}
          plan={selectedPlan}
          onClose={() => {
            setConfirmDialogOpen(false);
            setSelectedPlan(null);
          }}
        />
      </div>
    </DashboardLayout>
  );
};
