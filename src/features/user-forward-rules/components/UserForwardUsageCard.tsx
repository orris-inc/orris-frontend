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
      <div className="p-5 rounded-xl bg-card border">
        <div className="space-y-4">
          <Skeleton className="h-5 w-24" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

  const upload = formatTraffic(usage.trafficUsed);
  const uploadLimit = usage.trafficLimit > 0 ? formatTraffic(usage.trafficLimit) : null;

  return (
    <div className="p-5 rounded-xl bg-card border">
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-medium text-foreground">配额使用情况</h3>
          <p className="text-sm text-muted-foreground">您当前的规则配额和流量使用状态</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 规则数量 */}
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded bg-blue-500/10">
                <Server className="h-4 w-4 text-blue-500" />
              </div>
              <span className="text-xs text-muted-foreground">规则数量</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-semibold font-mono">{usage.ruleCount}</span>
                {usage.ruleLimit > 0 ? (
                  <span className="text-sm text-muted-foreground">/ {usage.ruleLimit}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">/ ∞</span>
                )}
              </div>
              {usage.ruleLimit > 0 ? (
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${Math.min(ruleUsagePercent, 100)}%` }}
                  />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">无限制</p>
              )}
            </div>
          </div>

          {/* 流量使用 */}
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded bg-emerald-500/10">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="text-xs text-muted-foreground">流量使用</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-semibold font-mono">{upload.value}</span>
                <span className="text-sm text-muted-foreground">{upload.unit}</span>
                {uploadLimit && (
                  <>
                    <span className="text-sm text-muted-foreground">
                      / {uploadLimit.value} {uploadLimit.unit}
                    </span>
                  </>
                )}
              </div>
              {usage.trafficLimit > 0 ? (
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.min(trafficUsagePercent, 100)}%` }}
                  />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">无限制</p>
              )}
            </div>
          </div>

          {/* 允许的规则类型 */}
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded bg-purple-500/10">
                <Layers className="h-4 w-4 text-purple-500" />
              </div>
              <span className="text-xs text-muted-foreground">允许的类型</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {usage.allowedTypes.length > 0 ? (
                usage.allowedTypes.map((type) => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {RULE_TYPE_LABELS[type] || type}
                  </Badge>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">无可用类型</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
