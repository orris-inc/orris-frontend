/**
 * Subscription Plan Card Component (User-facing)
 * Following StatCard and QuickActionsCard patterns
 */

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getButtonClass, getBadgeClass } from "@/lib/ui-styles";
import { PlanPricingSelector } from "./PlanPricingSelector";
import type { SubscriptionPlan } from "@/api/subscription/types";

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
  // Build features list from plan data
  const features: string[] = [];
  if (plan.maxUsers > 0) {
    features.push(`最多 ${plan.maxUsers} 个用户`);
  }
  if (plan.maxProjects > 0) {
    features.push(`${plan.maxProjects} 个项目`);
  }
  if (plan.nodeLimit && plan.nodeLimit > 0) {
    features.push(`${plan.nodeLimit} 个节点`);
  }
  if (plan.apiRateLimit > 0) {
    features.push(`${plan.apiRateLimit} 次/分钟 API`);
  }

  return (
    <div
      className={cn(
        "relative flex flex-col h-full p-5 rounded-xl bg-card border",
        "transition-all hover:shadow-md",
        recommended && "border-primary ring-1 ring-primary/20",
      )}
    >
      {/* Recommended badge */}
      {recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span
            className={getBadgeClass(
              "default",
              "px-3 py-1 rounded-full font-medium shadow-sm",
            )}
          >
            推荐
          </span>
        </div>
      )}

      <div className={cn("flex flex-col flex-1", recommended && "pt-2")}>
        {/* Plan name */}
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {plan.name}
        </h3>

        {/* Pricing selector */}
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

        {/* Description */}
        {plan.description && (
          <p className="text-sm text-muted-foreground mb-4">
            {plan.description}
          </p>
        )}

        {/* Divider */}
        <div className="border-t border-border my-3" />

        {/* Features list */}
        {features.length > 0 && (
          <ul className="space-y-2 mb-4 flex-1">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <div className="p-1 rounded-md bg-success/10 ring-1 ring-success/20">
                  <Check className="size-3 text-success" />
                </div>
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Trial badge */}
        {plan.trialDays > 0 && (
          <div className="mb-4">
            <span className={getBadgeClass("secondary", "text-xs font-medium")}>
              免费试用 {plan.trialDays} 天
            </span>
          </div>
        )}

        {/* Select button */}
        <button
          className={getButtonClass(
            recommended ? "default" : "outline",
            "default",
            "w-full mt-auto",
          )}
          onClick={() => onSelect?.(plan)}
        >
          选择计划
        </button>
      </div>
    </div>
  );
};
