/**
 * 用户转发规则配额和使用情况卡片
 */

import { Server, TrendingUp, Layers } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Skeleton } from '@/components/common/Skeleton';
import type { UserForwardUsage } from '@/api/forward';

interface UserForwardUsageCardProps {
  usage: UserForwardUsage | null;
  isLoading: boolean;
}

/**
 * 格式化字节数为可读的流量单位
 */
const formatTraffic = (bytes: number): { value: string; unit: string } => {
  if (bytes === 0) return { value: '0', unit: 'B' };
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = (bytes / Math.pow(k, i)).toFixed(1);
  return { value, unit: units[i] };
};

/**
 * 规则类型映射表
 */
const RULE_TYPE_LABELS: Record<string, string> = {
  direct: '直连',
  entry: '入口',
  exit: '出口',
  chain: '链式',
  direct_chain: '直连链',
};

export const UserForwardUsageCard: React.FC<UserForwardUsageCardProps> = ({
  usage,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="p-4 sm:p-5 rounded-2xl glass">
        <div className="space-y-4">
          <Skeleton className="h-5 w-24" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <Skeleton className="h-20 sm:h-16 rounded-xl" />
            <Skeleton className="h-20 sm:h-16 rounded-xl" />
            <Skeleton className="h-20 sm:h-16 rounded-xl" />
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

  const upload = formatTraffic(usage.trafficUsed);
  const uploadLimit = usage.trafficLimit > 0 ? formatTraffic(usage.trafficLimit) : null;

  return (
    <div className="p-3 sm:p-4 rounded-2xl glass">
      <div className="space-y-3 sm:space-y-4">
        {/* Header - hidden on mobile for density */}
        <h3 className="text-sm font-medium text-foreground hidden sm:block">配额使用情况</h3>

        {/* Stats grid - horizontal scroll on mobile for density */}
        <div className="flex gap-2 sm:grid sm:grid-cols-3 sm:gap-3 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1 sm:mx-0 sm:px-0">
          {/* 规则数量 */}
          <div className="flex-shrink-0 w-[140px] sm:w-auto p-2.5 sm:p-3 rounded-xl bg-muted/50 glass-elevated">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="p-1 rounded-md bg-blue-500/10">
                <Server className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <span className="text-[10px] sm:text-xs text-muted-foreground">规则</span>
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg sm:text-xl font-semibold font-mono">{usage.ruleCount}</span>
              <span className="text-xs text-muted-foreground">/ {usage.ruleLimit > 0 ? usage.ruleLimit : '∞'}</span>
            </div>
            {usage.ruleLimit > 0 && (
              <div className="w-full bg-muted rounded-full h-1 mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${Math.min(ruleUsagePercent, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* 流量使用 */}
          <div className="flex-shrink-0 w-[140px] sm:w-auto p-2.5 sm:p-3 rounded-xl bg-muted/50 glass-elevated">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="p-1 rounded-md bg-emerald-500/10">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <span className="text-[10px] sm:text-xs text-muted-foreground">流量</span>
            </div>
            <div className="flex items-baseline gap-0.5 flex-wrap">
              <span className="text-lg sm:text-xl font-semibold font-mono">{upload.value}</span>
              <span className="text-xs text-muted-foreground">{upload.unit}</span>
              {uploadLimit && (
                <span className="text-[10px] text-muted-foreground">/ {uploadLimit.value}{uploadLimit.unit}</span>
              )}
            </div>
            {usage.trafficLimit > 0 && (
              <div className="w-full bg-muted rounded-full h-1 mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${Math.min(trafficUsagePercent, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* 允许的规则类型 */}
          <div className="flex-shrink-0 w-[140px] sm:w-auto p-2.5 sm:p-3 rounded-xl bg-muted/50 glass-elevated">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="p-1 rounded-md bg-purple-500/10">
                <Layers className="h-3.5 w-3.5 text-purple-500" />
              </div>
              <span className="text-[10px] sm:text-xs text-muted-foreground">类型</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {usage.allowedTypes.length > 0 ? (
                usage.allowedTypes.map((type) => (
                  <Badge key={type} variant="secondary" className="text-[10px] px-1.5 h-5">
                    {RULE_TYPE_LABELS[type] || type}
                  </Badge>
                ))
              ) : (
                <span className="text-[10px] text-muted-foreground">无</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
