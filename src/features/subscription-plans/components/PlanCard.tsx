/**
 * 订阅计划卡片组件（用户端）
 */

import { Separator } from '@/components/common/Separator';
import { getButtonClass, getBadgeClass, cardStyles, cardContentStyles } from '@/lib/ui-styles';
import { PlanPricingSelector } from './PlanPricingSelector';
import type { SubscriptionPlan } from '@/api/subscription/types';

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
  return (
    <div
      className={`${cardStyles} relative h-full flex flex-col overflow-hidden rounded-2xl transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
        recommended
          ? 'border-2 border-primary bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-950/30 dark:to-blue-950/10'
          : 'border bg-card'
      }`}
    >
      {/* 推荐标签 */}
      {recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className={getBadgeClass('default', 'px-4 py-1 rounded-full font-semibold shadow-sm')}>
            推荐
          </span>
        </div>
      )}

      <div className={`${cardContentStyles} flex-1 flex flex-col p-6 ${recommended ? 'pt-8' : ''}`}>
        {/* 计划名称 */}
        <h2 className="text-2xl font-bold mb-3">
          {plan.name}
        </h2>

        {/* 价格展示 - 使用定价选择器 */}
        <div className="mb-4">
          {plan.pricings && plan.pricings.length > 0 ? (
            <PlanPricingSelector
              pricings={plan.pricings}
              defaultBillingCycle={plan.pricings[0]?.billingCycle}
            />
          ) : (
            <div className="text-muted-foreground">价格待定</div>
          )}
        </div>

        {/* 描述 */}
        {plan.description && (
          <p className="text-sm text-muted-foreground mb-4">
            {plan.description}
          </p>
        )}

        <Separator className="my-4" />

        {/* 限制信息 - 只有当值大于 0 时才显示 */}
        {(plan.maxUsers > 0 || plan.maxProjects > 0) && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground">
              {plan.maxUsers > 0 && `最多 ${plan.maxUsers} 个用户`}
              {plan.maxUsers > 0 && plan.maxProjects > 0 && ' · '}
              {plan.maxProjects > 0 && `${plan.maxProjects} 个项目`}
            </p>
          </div>
        )}

        {/* 试用天数 */}
        {plan.trialDays > 0 && (
          <div className="mb-4">
            <span className={getBadgeClass('secondary', 'font-semibold')}>
              免费试用 {plan.trialDays} 天
            </span>
          </div>
        )}

        {/* 选择按钮 */}
        <button
          className={getButtonClass(recommended ? 'default' : 'outline', 'lg', 'w-full rounded-xl mt-auto')}
          onClick={() => onSelect?.(plan)}
        >
          选择计划
        </button>
      </div>
    </div>
  );
};
