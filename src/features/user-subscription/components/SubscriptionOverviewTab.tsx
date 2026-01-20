/**
 * Subscription Overview Tab Component
 * Displays subscription status, traffic, subscription link, and time info
 * Modern Bento Grid design with improved visual hierarchy
 */

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  Upload,
  Download,
  Link2,
  RefreshCw,
  Loader2,
  Zap,
  TrendingUp,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getBadgeClass, getButtonClass } from "@/lib/ui-styles";
import type { Subscription } from "@/api/subscription/types";
import { getTrafficStats } from "@/api/subscription";
import { SubscriptionLinkSelector } from "@/components/subscription";
import { SubscriptionTrafficChart } from "./SubscriptionTrafficChart";

interface SubscriptionOverviewTabProps {
  subscription: Subscription;
  onResetLink: () => Promise<void>;
  isResettingLink: boolean;
}

/**
 * Format bytes to readable traffic units
 */
const formatTraffic = (bytes: number): { value: string; unit: string } => {
  if (bytes === 0) return { value: "0", unit: "B" };
  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = (bytes / Math.pow(k, i)).toFixed(1);
  return { value, unit: units[i] };
};

/**
 * Format date for display (full format)
 */
const formatDate = (dateString?: string): string => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

/**
 * Get subscription status display configuration
 */
const getStatusConfig = (status: string) => {
  switch (status) {
    case "active":
      return {
        labelKey: "subscriptionStatus.active",
        variant: "success" as const,
        color: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-500/10",
        ringColor: "ring-emerald-500/20",
      };
    case "expired":
      return {
        labelKey: "subscriptionStatus.expired",
        variant: "destructive" as const,
        color: "text-destructive",
        bgColor: "bg-destructive/10",
        ringColor: "ring-destructive/20",
      };
    case "cancelled":
      return {
        labelKey: "subscriptionStatus.cancelled",
        variant: "outline" as const,
        color: "text-muted-foreground",
        bgColor: "bg-muted",
        ringColor: "ring-border",
      };
    case "pending":
      return {
        labelKey: "subscriptionStatus.pending",
        variant: "secondary" as const,
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-500/10",
        ringColor: "ring-amber-500/20",
      };
    case "renewed":
      return {
        labelKey: "subscriptionStatus.renewed",
        variant: "success" as const,
        color: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-500/10",
        ringColor: "ring-emerald-500/20",
      };
    default:
      return {
        labelKey: status,
        variant: "secondary" as const,
        color: "text-muted-foreground",
        bgColor: "bg-muted",
        ringColor: "ring-border",
      };
  }
};

/**
 * Calculate remaining days
 */
const getDaysRemaining = (endDate?: string): number | null => {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil(
    (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff > 0 ? diff : 0;
};

/**
 * Calculate total subscription days
 */
const getTotalDays = (startDate?: string, endDate?: string): number | null => {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff > 0 ? diff : 0;
};

/**
 * Circular progress ring component
 */
const CircularProgress: React.FC<{
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}> = ({ percentage, size = 120, strokeWidth = 8, className, children }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-primary)" />
            <stop offset="100%" stopColor="oklch(from var(--color-primary) l c h / 0.6)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

/**
 * Progress bar component with animation
 */
const ProgressBar: React.FC<{
  value: number;
  max: number;
  className?: string;
  barClassName?: string;
  showLabel?: boolean;
  labelFormat?: (value: number, max: number) => string;
}> = ({
  value,
  max,
  className,
  barClassName,
  showLabel = true,
  labelFormat,
}) => {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const label = labelFormat ? labelFormat(value, max) : `${value} / ${max}`;

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="text-muted-foreground tabular-nums">
            {percentage.toFixed(0)}%
          </span>
        </div>
      )}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            barClassName || "bg-primary"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export const SubscriptionOverviewTab: React.FC<
  SubscriptionOverviewTabProps
> = ({ subscription, onResetLink, isResettingLink }) => {
  const { t } = useTranslation();
  const statusConfig = getStatusConfig(subscription.status);
  const daysRemaining = getDaysRemaining(subscription.currentPeriodEnd);
  const totalDays = getTotalDays(
    subscription.currentPeriodStart,
    subscription.currentPeriodEnd
  );
  const daysUsed =
    totalDays !== null && daysRemaining !== null ? totalDays - daysRemaining : 0;
  const periodProgress =
    totalDays !== null && totalDays > 0 ? (daysUsed / totalDays) * 100 : 0;
  const limits = subscription.plan?.limits as
    | { trafficLimit?: number }
    | undefined;
  const trafficLimit = limits?.trafficLimit ?? 0;

  // Query traffic stats for current billing period
  const { data: trafficStats } = useQuery({
    queryKey: [
      "subscriptionTraffic",
      subscription.id,
      subscription.currentPeriodStart,
    ],
    queryFn: () => {
      const from = subscription.currentPeriodStart;
      const to = subscription.currentPeriodEnd || new Date().toISOString();
      return getTrafficStats(subscription.id, { from, to });
    },
    enabled: !!subscription.id && !!subscription.currentPeriodStart,
  });

  // Calculate traffic usage from traffic stats
  const trafficUsage = useMemo(() => {
    if (!trafficStats?.summary) {
      return { upload: 0, download: 0, total: 0 };
    }
    return {
      upload: trafficStats.summary.totalUpload,
      download: trafficStats.summary.totalDownload,
      total: trafficStats.summary.total,
    };
  }, [trafficStats?.summary]);

  // Calculate traffic usage percentage
  const trafficPercentage =
    trafficLimit > 0 ? (trafficUsage.total / trafficLimit) * 100 : 0;

  // Format traffic for progress bar label
  const formatTrafficLabel = (used: number, limit: number) => {
    const usedFormatted = formatTraffic(used);
    const limitFormatted = formatTraffic(limit);
    return `${usedFormatted.value} ${usedFormatted.unit} / ${limitFormatted.value} ${limitFormatted.unit}`;
  };

  const handleResetLink = async () => {
    if (!confirm(t("userSubscription.confirmResetLink"))) {
      return;
    }
    await onResetLink();
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Mobile: 3-column grid stats row */}
      <div className="grid grid-cols-3 gap-2 sm:hidden">
        {/* Days Remaining - compact */}
        <div
          className={cn(
            "p-2 rounded-xl",
            "bg-gradient-to-br border",
            statusConfig.bgColor,
            statusConfig.ringColor,
            "ring-1"
          )}
        >
          <span className={cn(getBadgeClass(statusConfig.variant), "text-[10px] px-1.5 py-0 mb-1 inline-block")}>{t(statusConfig.labelKey)}</span>
          <div className="flex items-baseline gap-0.5">
            <span className={cn("text-xl font-bold tabular-nums", statusConfig.color)}>
              {daysRemaining !== null ? daysRemaining : "-"}
            </span>
            <span className="text-[10px] text-muted-foreground">{t("userSubscription.days")}</span>
          </div>
        </div>

        {/* Traffic - compact */}
        <div className="p-2 rounded-xl bg-card border">
          <div className="flex items-center gap-1 mb-0.5">
            <TrendingUp className="size-3 text-chart-download" />
            <span className="text-[10px] text-muted-foreground">{t("userSubscription.traffic")}</span>
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-lg font-bold tabular-nums">{trafficPercentage.toFixed(0)}</span>
            <span className="text-[10px] text-muted-foreground">%</span>
          </div>
          <p className="text-[10px] text-muted-foreground truncate">
            {formatTraffic(trafficUsage.total).value}{formatTraffic(trafficUsage.total).unit}
          </p>
        </div>

        {/* Period - compact */}
        <div className="p-2 rounded-xl bg-card border">
          <div className="flex items-center gap-1 mb-0.5">
            <Clock className="size-3 text-primary" />
            <span className="text-[10px] text-muted-foreground">{t("userSubscription.expires")}</span>
          </div>
          <p className="text-xs font-medium tabular-nums leading-tight">{formatDate(subscription.currentPeriodEnd)}</p>
        </div>
      </div>

      {/* Desktop: Bento Grid Layout */}
      <div className="hidden sm:grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Hero Card - Days Remaining (Featured) */}
        <div
          className={cn(
            "lg:col-span-1 relative overflow-hidden rounded-xl p-3 sm:p-4",
            "bg-gradient-to-br border",
            statusConfig.bgColor,
            statusConfig.ringColor,
            "ring-1"
          )}
        >
          <div className="relative flex flex-col h-full">
            {/* Status Badge */}
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span
                className={cn(
                  getBadgeClass(statusConfig.variant),
                  "text-xs"
                )}
              >
                {t(statusConfig.labelKey)}
              </span>
              <div
                className={cn(
                  "p-1.5 rounded-md",
                  statusConfig.bgColor,
                  "ring-1",
                  statusConfig.ringColor
                )}
              >
                <Clock className={cn("size-3.5", statusConfig.color)} />
              </div>
            </div>

            {/* Main Value */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-baseline gap-1.5">
                <span
                  className={cn(
                    "text-3xl sm:text-4xl font-bold tabular-nums tracking-tight",
                    statusConfig.color
                  )}
                >
                  {daysRemaining !== null ? daysRemaining : "-"}
                </span>
                <span className="text-sm text-muted-foreground font-medium">
                  {t("userSubscription.days")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{t("userSubscription.remainingValidity")}</p>
            </div>

            {/* Period Progress */}
            {totalDays !== null && totalDays > 0 && (
              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-current/10">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{t("userSubscription.periodProgress")}</span>
                  <span className="tabular-nums">
                    {periodProgress.toFixed(0)}%
                  </span>
                </div>
                <div className="h-1 bg-current/10 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700 ease-out",
                      subscription.isActive
                        ? "bg-emerald-500"
                        : "bg-muted-foreground"
                    )}
                    style={{ width: `${periodProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Plan Info Card */}
        <div className="lg:col-span-1 p-3 sm:p-4 rounded-xl bg-card border">
          <div className="flex items-center gap-2 sm:gap-2.5 mb-2 sm:mb-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <Zap className="size-3.5 sm:size-4 text-primary" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-semibold">
                {subscription.plan?.name || t("userSubscription.currentSubscription")}
              </h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{t("userSubscription.currentSubscription")}</p>
            </div>
          </div>

          <div className="space-y-0">
            {/* Start Date */}
            <div className="flex items-center justify-between py-1 sm:py-1.5 border-b border-border/50">
              <span className="text-[10px] sm:text-xs text-muted-foreground">{t("subscription.startDate")}</span>
              <span className="text-[10px] sm:text-xs font-medium tabular-nums">
                {formatDate(subscription.currentPeriodStart)}
              </span>
            </div>
            {/* End Date */}
            <div className="flex items-center justify-between py-1 sm:py-1.5 border-b border-border/50">
              <span className="text-[10px] sm:text-xs text-muted-foreground">{t("subscription.endDate")}</span>
              <span className="text-[10px] sm:text-xs font-medium tabular-nums">
                {formatDate(subscription.currentPeriodEnd)}
              </span>
            </div>
            {/* Total Days */}
            <div className="flex items-center justify-between py-1 sm:py-1.5">
              <span className="text-[10px] sm:text-xs text-muted-foreground">{t("userSubscription.cycleDays")}</span>
              <span className="text-[10px] sm:text-xs font-medium tabular-nums">
                {totalDays !== null ? `${totalDays} ${t("userSubscription.days")}` : "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Traffic Overview Card */}
        <div className="lg:col-span-1 p-3 sm:p-4 rounded-xl bg-card border">
          <div className="flex items-center gap-2 sm:gap-2.5 mb-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-chart-download/10 ring-1 ring-chart-download/20">
              <TrendingUp className="size-3.5 sm:size-4 text-chart-download" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-semibold">{t("userSubscription.trafficOverview")}</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{t("userSubscription.currentPeriodUsage")}</p>
            </div>
          </div>

          {/* Circular Progress */}
          <div className="flex items-center justify-center py-1">
            <CircularProgress
              percentage={Math.min(trafficPercentage, 100)}
              size={70}
              strokeWidth={5}
            >
              <div className="text-center">
                <span className="text-base sm:text-lg font-bold tabular-nums">
                  {trafficPercentage.toFixed(0)}
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground">%</span>
              </div>
            </CircularProgress>
          </div>

          {/* Traffic Summary */}
          <div className="mt-2 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between text-[10px] sm:text-xs">
              <span className="text-muted-foreground">{t("userSubscription.used")}</span>
              <span className="font-medium tabular-nums">
                {formatTraffic(trafficUsage.total).value}{" "}
                <span className="text-muted-foreground font-normal">
                  {formatTraffic(trafficUsage.total).unit}
                </span>
              </span>
            </div>
            {trafficLimit > 0 && (
              <div className="flex items-center justify-between text-[10px] sm:text-xs mt-0.5">
                <span className="text-muted-foreground">{t("userSubscription.totalQuota")}</span>
                <span className="font-medium tabular-nums">
                  {formatTraffic(trafficLimit).value}{" "}
                  <span className="text-muted-foreground font-normal">
                    {formatTraffic(trafficLimit).unit}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Traffic Details Card */}
      <div className="p-3 sm:p-4 rounded-xl bg-card border">
        <div className="flex items-center gap-2 sm:gap-2.5 mb-2 sm:mb-3">
          <div className="p-1 sm:p-1.5 rounded-md bg-primary/10 ring-1 ring-primary/20">
            <Gauge className="size-3 sm:size-3.5 text-primary" />
          </div>
          <h3 className="text-xs sm:text-sm font-semibold">{t("userSubscription.trafficDetails")}</h3>
        </div>

        {/* Traffic Stats Grid - 3 columns on all screens */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3 mb-2 sm:mb-3">
          {/* Upload */}
          <div className="p-2 sm:p-3 rounded-lg bg-chart-upload/5 ring-1 ring-chart-upload/10">
            <div className="flex items-center gap-1 mb-1">
              <Upload className="size-3 sm:size-4 text-chart-upload" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">{t("userSubscription.upload")}</span>
            </div>
            <p className="text-sm sm:text-base font-semibold tabular-nums">
              {formatTraffic(trafficUsage.upload).value}
              <span className="text-[10px] sm:text-xs font-normal text-muted-foreground ml-0.5">
                {formatTraffic(trafficUsage.upload).unit}
              </span>
            </p>
          </div>

          {/* Download */}
          <div className="p-2 sm:p-3 rounded-lg bg-chart-download/5 ring-1 ring-chart-download/10">
            <div className="flex items-center gap-1 mb-1">
              <Download className="size-3 sm:size-4 text-chart-download" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">{t("userSubscription.download")}</span>
            </div>
            <p className="text-sm sm:text-base font-semibold tabular-nums">
              {formatTraffic(trafficUsage.download).value}
              <span className="text-[10px] sm:text-xs font-normal text-muted-foreground ml-0.5">
                {formatTraffic(trafficUsage.download).unit}
              </span>
            </p>
          </div>

          {/* Total */}
          <div className="p-2 sm:p-3 rounded-lg bg-primary/5 ring-1 ring-primary/10">
            <div className="flex items-center gap-1 mb-1">
              <Zap className="size-3 sm:size-4 text-primary" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">{t("userSubscription.total")}</span>
            </div>
            <p className="text-sm sm:text-base font-semibold tabular-nums">
              {formatTraffic(trafficUsage.total).value}
              <span className="text-[10px] sm:text-xs font-normal text-muted-foreground ml-0.5">
                {formatTraffic(trafficUsage.total).unit}
              </span>
            </p>
          </div>
        </div>

        {/* Traffic Quota Progress */}
        {trafficLimit > 0 && (
          <ProgressBar
            value={trafficUsage.total}
            max={trafficLimit}
            barClassName="bg-gradient-to-r from-chart-upload to-chart-download"
            labelFormat={formatTrafficLabel}
          />
        )}
      </div>

      {/* Traffic Trend Chart */}
      <SubscriptionTrafficChart subscription={subscription} />

      {/* Subscription Link */}
      {subscription.isActive && subscription.subscribeUrl && (
        <div className="p-3 sm:p-4 rounded-xl bg-card border transition-all duration-200 hover:shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 ring-1 ring-primary/20">
                <Link2 className="size-3.5 sm:size-4 text-primary" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-semibold">{t("userSubscription.subscriptionLink")}</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                  {t("userSubscription.selectFormatAndCopy")}
                </p>
              </div>
            </div>
            <button
              onClick={handleResetLink}
              disabled={isResettingLink}
              className={cn(
                getButtonClass("outline", "sm", "h-7 sm:h-8 text-[10px] sm:text-xs gap-1 sm:gap-1.5 px-2 sm:px-3"),
                "transition-all duration-200 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
              )}
            >
              {isResettingLink ? (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  <span className="hidden sm:inline">{t("userSubscription.resetting")}</span>
                </>
              ) : (
                <>
                  <RefreshCw className="size-3" />
                  <span className="hidden sm:inline">{t("userSubscription.resetLink")}</span>
                  <span className="sm:hidden">{t("userSubscription.reset")}</span>
                </>
              )}
            </button>
          </div>
          <SubscriptionLinkSelector subscribeUrl={subscription.subscribeUrl} />
        </div>
      )}
    </div>
  );
};
