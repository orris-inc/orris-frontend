/**
 * Subscription forward rule quota and usage card
 */

import { Server, TrendingUp, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/common/Badge';
import { Skeleton } from '@/components/common/Skeleton';
import type { SubscriptionForwardUsage } from '@/api/forward';

interface SubscriptionForwardUsageCardProps {
  usage: SubscriptionForwardUsage | null;
  isLoading: boolean;
}

/**
 * Format bytes to readable traffic unit
 */
const formatTraffic = (bytes: number): { value: string; unit: string } => {
  if (bytes === 0) return { value: '0', unit: 'B' };
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = (bytes / Math.pow(k, i)).toFixed(1);
  return { value, unit: units[i] };
};


export const SubscriptionForwardUsageCard: React.FC<SubscriptionForwardUsageCardProps> = ({
  usage,
  isLoading,
}) => {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <div className="@container p-5 rounded-xl bg-card border">
        <div className="space-y-4">
          <Skeleton className="h-5 w-24" />
          <div className="grid grid-cols-1 @md:grid-cols-3 gap-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </div>
      </div>
    );
  }

  if (!usage) {
    return null;
  }

  const ruleUsagePercent = usage.ruleLimit > 0 ? (usage.ruleCount / usage.ruleLimit) * 100 : 0;
  const trafficUsagePercent =
    usage.trafficLimit > 0 ? (usage.trafficUsed / usage.trafficLimit) * 100 : 0;

  const trafficUsed = formatTraffic(usage.trafficUsed);
  const trafficLimit = usage.trafficLimit > 0 ? formatTraffic(usage.trafficLimit) : null;

  return (
    <div className="@container p-3 @sm:p-4 rounded-xl bg-card border">
      <div className="space-y-2 @sm:space-y-3">
        {/* Header - hidden on small containers */}
        <h3 className="text-sm font-medium text-foreground hidden @sm:block">{t('forwardUsage.forwardQuota')}</h3>

        {/* Stats - horizontal scroll on small containers, grid on larger */}
        <div className="flex gap-2 @sm:grid @sm:grid-cols-3 @sm:gap-3 overflow-x-auto pb-1 @sm:pb-0 -mx-1 px-1 @sm:mx-0 @sm:px-0 scrollbar-hide">
          {/* Rule count */}
          <div className="flex-shrink-0 w-[130px] @sm:w-auto p-2.5 @sm:p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="p-1 rounded bg-blue-500/10">
                <Server className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <span className="text-[10px] @sm:text-xs text-muted-foreground">{t('forwardUsage.rules')}</span>
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg @sm:text-xl font-semibold font-mono">{usage.ruleCount}</span>
              <span className="text-xs text-muted-foreground">/ {usage.ruleLimit > 0 ? usage.ruleLimit : '∞'}</span>
            </div>
            {usage.ruleLimit > 0 && (
              <div className="w-full bg-muted rounded-full h-1 mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${Math.min(ruleUsagePercent, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Traffic usage */}
          <div className="flex-shrink-0 w-[130px] @sm:w-auto p-2.5 @sm:p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="p-1 rounded bg-emerald-500/10">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <span className="text-[10px] @sm:text-xs text-muted-foreground">{t('forwardUsage.traffic')}</span>
            </div>
            <div className="flex items-baseline gap-0.5 flex-wrap">
              <span className="text-lg @sm:text-xl font-semibold font-mono">{trafficUsed.value}</span>
              <span className="text-xs text-muted-foreground">{trafficUsed.unit}</span>
              {trafficLimit && (
                <span className="text-[10px] text-muted-foreground">/ {trafficLimit.value}{trafficLimit.unit}</span>
              )}
            </div>
            {usage.trafficLimit > 0 && (
              <div className="w-full bg-muted rounded-full h-1 mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.min(trafficUsagePercent, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Allowed rule types */}
          <div className="flex-shrink-0 w-[130px] @sm:w-auto p-2.5 @sm:p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="p-1 rounded bg-purple-500/10">
                <Layers className="h-3.5 w-3.5 text-purple-500" />
              </div>
              <span className="text-[10px] @sm:text-xs text-muted-foreground">{t('forwardUsage.types')}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {usage.allowedTypes.length > 0 ? (
                usage.allowedTypes.map((type) => (
                  <Badge key={type} variant="secondary" className="text-[10px] px-1.5 h-5">
                    {t(`forwardUsage.ruleTypes.${type}`)}
                  </Badge>
                ))
              ) : (
                <span className="text-[10px] text-muted-foreground">{t('common.none')}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
