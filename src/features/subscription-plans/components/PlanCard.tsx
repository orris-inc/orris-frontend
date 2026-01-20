/**
 * Subscription Plan Card Component (User-facing)
 * Following StatCard and QuickActionsCard patterns
 */

import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { getButtonClass, getBadgeClass } from "@/lib/ui-styles";
import { PlanPricingSelector } from "./PlanPricingSelector";
import type { SubscriptionPlan } from "@/api/subscription/types";

interface PlanCardProps {
  plan: SubscriptionPlan;
  recommended?: boolean;
  onSelect?: (plan: SubscriptionPlan) => void;
}

function PlanCard({
  plan,
  recommended = false,
  onSelect,
}: PlanCardProps) {
  const { t } = useTranslation();

  // Build features list from plan data
  const features: string[] = [];
  if (plan.maxUsers > 0) {
    features.push(t("pricing.card.maxUsers", { count: plan.maxUsers }));
  }
  if (plan.maxProjects > 0) {
    features.push(t("pricing.card.projects", { count: plan.maxProjects }));
  }
  if (plan.nodeLimit && plan.nodeLimit > 0) {
    features.push(t("pricing.card.nodes", { count: plan.nodeLimit }));
  }
  if (plan.apiRateLimit > 0) {
    features.push(t("pricing.card.apiRate", { count: plan.apiRateLimit }));
  }

  return (
    <div
      className={cn(
        "relative flex flex-col h-full p-4 sm:p-5 rounded-xl",
        // Mobile: glass effect, Desktop: solid card
        "glass-elevated md:bg-card md:border md:shadow-none md:backdrop-blur-none",
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
            {t("pricing.card.recommended")}
          </span>
        </div>
      )}

      <div className={cn("flex flex-col flex-1", recommended && "pt-2")}>
        {/* Plan name */}
        <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
          {plan.name}
        </h3>

        {/* Pricing selector */}
        <div className="mb-3 sm:mb-4">
          {plan.pricings && plan.pricings.length > 0 ? (
            <PlanPricingSelector
              pricings={plan.pricings}
              defaultBillingCycle={plan.pricings[0]?.billingCycle}
            />
          ) : (
            <div className="text-muted-foreground">
              {t("pricing.card.priceTbd")}
            </div>
          )}
        </div>

        {/* Description */}
        {plan.description && (
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
            {plan.description}
          </p>
        )}

        {/* Divider */}
        <div className="border-t border-border/50 my-2 sm:my-3" />

        {/* Features list */}
        {features.length > 0 && (
          <ul className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4 flex-1">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-xs sm:text-sm">
                <div className="p-0.5 sm:p-1 rounded-md bg-success/10 ring-1 ring-success/20 shrink-0">
                  <Check className="size-3 text-success" />
                </div>
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Trial badge */}
        {plan.trialDays > 0 && (
          <div className="mb-3 sm:mb-4">
            <span className={getBadgeClass("secondary", "text-xs font-medium")}>
              {t("pricing.card.freeTrial", { days: plan.trialDays })}
            </span>
          </div>
        )}

        {/* Select button */}
        <button
          className={getButtonClass(
            recommended ? "default" : "outline",
            "default",
            "w-full mt-auto touch-target",
          )}
          onClick={() => onSelect?.(plan)}
        >
          {t("pricing.card.selectPlan")}
        </button>
      </div>
    </div>
  );
}

export { PlanCard };
