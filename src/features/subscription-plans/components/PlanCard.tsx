/**
 * 订阅计划卡片组件（用户端）
 */

import { Separator } from '@/components/common/Separator';
import { getButtonClass, getBadgeClass, cardStyles, cardContentStyles } from '@/lib/ui-styles';
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
          {plan.Name}
        </h2>

        {/* 计费周期标签 - 仅在没有多定价时显示 */}
        {!hasPricings && (
          <div className="mb-4">
            <BillingCycleBadge billingCycle={plan.BillingCycle} />
          </div>
        )}

        {/* 价格展示 */}
        <div className="mb-4">
          {hasPricings ? (
            // 使用新的定价选择器组件
            <PlanPricingSelector
              pricings={plan.pricings!}
              defaultBillingCycle={plan.BillingCycle}
            />
          ) : (
            // 向后兼容：使用单一价格
            <>
              <div className="text-3xl font-bold">
                {currencySymbol}{formattedPrice}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                每{plan.BillingCycle === 'monthly' ? '月' : plan.BillingCycle === 'annual' ? '年' : '周期'}
              </p>
            </>
          )}
        </div>

        {/* 描述 */}
        {plan.Description && (
          <p className="text-sm text-muted-foreground mb-4">
            {plan.Description}
          </p>
        )}

        <Separator className="my-4" />

        {/* 功能列表 */}
        {plan.Features && plan.Features.length > 0 && (
          <div className="mb-4 flex-1">
            <h3 className="text-sm font-semibold mb-3">
              功能特性
            </h3>
            <PlanFeatureList features={plan.Features} />
          </div>
        )}

        {/* 限制信息 */}
        {(plan.MaxUsers || plan.MaxProjects) && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground">
              {plan.MaxUsers && `最多 ${plan.MaxUsers} 个用户`}
              {plan.MaxUsers && plan.MaxProjects && ' · '}
              {plan.MaxProjects && `${plan.MaxProjects} 个项目`}
            </p>
          </div>
        )}

        {/* 试用天数 */}
        {plan.TrialDays && plan.TrialDays > 0 && (
          <div className="mb-4">
            <span className={getBadgeClass('secondary', 'font-semibold')}>
              免费试用 {plan.TrialDays} 天
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
