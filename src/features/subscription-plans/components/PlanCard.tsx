/**
 * Subscription Plan Card Component (User-facing)
 * Following StatCard and QuickActionsCard patterns
 * Uses container queries for responsive design
 */

import { Check, Zap, ArrowLeftRight, Layers } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { getButtonClass, getBadgeClass } from "@/lib/ui-styles";
import { PlanPricingSelector } from "./PlanPricingSelector";
import type { SubscriptionPlan, BillingCycle, PlanType } from "@/api/subscription/types";

// Plan type icons
const PLAN_TYPE_ICONS: Record<PlanType, React.ReactNode> = {
  node: <Zap className="size-3" />,
  forward: <ArrowLeftRight className="size-3" />,
  hybrid: <Layers className="size-3" />,
};

// Format traffic limit for display
const formatTrafficLimit = (bytes: number): string => {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1024) {
    return `${(gb / 1024).toFixed(0)} TB`;
  }
  return `${gb.toFixed(0)} GB`;
};

interface PlanCardProps {
  plan: SubscriptionPlan;
  recommended?: boolean;
  /** Selected billing cycle for filtering display */
  selectedCycle?: BillingCycle;
  onSelect?: (plan: SubscriptionPlan) => void;
}

function PlanCard({
  plan,
  recommended = false,
  selectedCycle,
  onSelect,
}: PlanCardProps) {
  const { t } = useTranslation();

  // Build features list from plan data
  const features: string[] = [];

  // Traffic limit from limits
  const trafficLimit = plan.limits?.trafficLimit as number | undefined;
  if (trafficLimit && trafficLimit > 0) {
    features.push(t("pricing.features.traffic", { value: formatTrafficLimit(trafficLimit) }));
  } else if (trafficLimit === 0 || trafficLimit === undefined) {
    // Only show unlimited traffic if plan type is node or hybrid
    if (plan.planType === 'node' || plan.planType === 'hybrid') {
      features.push(t("pricing.features.unlimitedTraffic"));
    }
  }

  // Node limit
  if (plan.nodeLimit && plan.nodeLimit > 0) {
    features.push(t("pricing.card.nodes", { count: plan.nodeLimit }));
  }

  // Get default billing cycle for PricingSelector
  const defaultBillingCycle = selectedCycle || plan.pricings?.[0]?.billingCycle;

  return (
    <div className="@container h-full">
      <div
        className={cn(
          "relative flex flex-col h-full p-4 @sm:p-5 rounded-xl",
          // Base: glass effect, @md container: solid card
          "glass-elevated @md:bg-card @md:ring-1 @md:ring-border @md:shadow-none @md:backdrop-blur-none",
          "transition-all duration-normal ease-smooth",
          "hover:shadow-md active:scale-[0.98]",
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
              {t("common.recommended")}
            </span>
          </div>
        )}

        <div className={cn("flex flex-col flex-1", recommended && "pt-2")}>
          {/* Plan name and type badge */}
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg @sm:text-xl font-semibold text-foreground">
              {plan.name}
            </h3>
            {plan.planType && (
              <span
                className={getBadgeClass(
                  "outline",
                  "text-[10px] px-1.5 py-0.5 flex items-center gap-1",
                )}
              >
                {PLAN_TYPE_ICONS[plan.planType]}
                <span>{t(`pricing.planType.${plan.planType}`)}</span>
              </span>
            )}
          </div>

          {/* Pricing selector */}
          <div className="mb-3 @sm:mb-4">
            {plan.pricings && plan.pricings.length > 0 ? (
              <PlanPricingSelector
                pricings={plan.pricings}
                defaultBillingCycle={defaultBillingCycle}
              />
            ) : (
              <div className="text-muted-foreground">
                {t("pricing.card.priceTbd")}
              </div>
            )}
          </div>

          {/* Description */}
          {plan.description && (
            <p className="text-xs @sm:text-sm text-muted-foreground mb-3 @sm:mb-4">
              {plan.description}
            </p>
          )}

          {/* Divider */}
          <div className="border-t border-border/50 my-2 @sm:my-3" />

          {/* Features list */}
          {features.length > 0 && (
            <ul className="space-y-1.5 @sm:space-y-2 mb-3 @sm:mb-4 flex-1">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-xs @sm:text-sm">
                  <div className="p-0.5 @sm:p-1 rounded-md bg-success/10 ring-1 ring-success/20 shrink-0">
                    <Check className="size-3 text-success" />
                  </div>
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Select button - min-h-11 ensures 44px touch target */}
          <button
            className={getButtonClass(
              recommended ? "default" : "outline",
              "default",
              "w-full mt-auto min-h-11",
            )}
            onClick={() => onSelect?.(plan)}
          >
            {t("pricing.card.selectPlan")}
          </button>
        </div>
      </div>
    </div>
  );
}

export { PlanCard };
