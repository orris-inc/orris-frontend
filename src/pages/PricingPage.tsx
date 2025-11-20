/**
 * 用户端定价页面
 */

import { useState } from 'react';
import { PlanCardList } from '@/features/subscription-plans/components/PlanCardList';
import { SubscriptionConfirmDialog } from '@/features/subscription-plans/components/SubscriptionConfirmDialog';
import { usePublicPlans } from '@/features/subscription-plans/hooks/usePublicPlans';
import type { BillingCycle, SubscriptionPlan } from '@/features/subscription-plans/types/subscription-plans.types';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          {/* 页面标题 */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">
              选择适合您的套餐
            </h1>
            <p className="text-lg text-muted-foreground">
              灵活的定价方案，满足不同规模团队的需求
            </p>
          </div>

          {/* 计费周期切换 */}
          <div className="flex justify-center mb-4">
            <ToggleGroup
              type="single"
              value={selectedCycle}
              onValueChange={(value) => {
                if (value) {
                  setSelectedCycle(value as BillingCycle | 'all');
                }
              }}
              className="border rounded-lg"
            >
              <ToggleGroupItem value="all" aria-label="全部">
                全部
              </ToggleGroupItem>
              <ToggleGroupItem value="monthly" aria-label="月付">
                月付
              </ToggleGroupItem>
              <ToggleGroupItem value="quarterly" aria-label="季付">
                季付
              </ToggleGroupItem>
              <ToggleGroupItem value="annual" aria-label="年付">
                年付
              </ToggleGroupItem>
              <ToggleGroupItem value="lifetime" aria-label="终身">
                终身
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* 计划卡片列表 */}
          <PlanCardList
            plans={publicPlans}
            loading={loading}
            onSelectPlan={handleSelectPlan}
          />

          {/* 说明文字 */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              所有计划均支持随时升级或降级。部分计划提供多种计费周期选项，订阅时可灵活选择。如有疑问，请联系客服。
            </p>
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
      </div>
    </DashboardLayout>
  );
};
