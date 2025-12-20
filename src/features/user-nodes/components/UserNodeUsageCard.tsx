/**
 * User node usage card component
 * Displays node quota usage information
 */

import { Server } from 'lucide-react';
import { Progress } from '@/components/common/Progress';

interface UserNodeUsageCardProps {
  /** Current number of nodes created */
  nodeCount: number;
  /** Maximum nodes allowed (0 or undefined = unlimited) */
  nodeLimit?: number;
  /** Loading state */
  isLoading?: boolean;
}

export const UserNodeUsageCard: React.FC<UserNodeUsageCardProps> = ({
  nodeCount,
  nodeLimit,
  isLoading = false,
}) => {
  const isUnlimited = !nodeLimit || nodeLimit === 0;
  const usagePercentage = isUnlimited ? 0 : Math.min((nodeCount / nodeLimit) * 100, 100);
  const isNearLimit = !isUnlimited && usagePercentage >= 80;
  const isAtLimit = !isUnlimited && nodeCount >= nodeLimit;

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-3 w-32 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className={`
          flex h-10 w-10 items-center justify-center rounded-full
          ${isAtLimit ? 'bg-destructive/10 text-destructive' : isNearLimit ? 'bg-yellow-500/10 text-yellow-600' : 'bg-primary/10 text-primary'}
        `}>
          <Server className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">节点配额</h3>
            <span className={`text-sm font-semibold ${isAtLimit ? 'text-destructive' : isNearLimit ? 'text-yellow-600' : ''}`}>
              {nodeCount} / {isUnlimited ? '无限制' : nodeLimit}
            </span>
          </div>

          {!isUnlimited && (
            <div className="mt-2">
              <Progress
                value={usagePercentage}
                className={`h-2 ${isAtLimit ? '[&>div]:bg-destructive' : isNearLimit ? '[&>div]:bg-yellow-500' : ''}`}
              />
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-2">
            {isUnlimited
              ? '您的套餐节点数量无限制'
              : isAtLimit
                ? '已达到节点数量上限'
                : isNearLimit
                  ? `还可创建 ${nodeLimit - nodeCount} 个节点`
                  : `已创建 ${nodeCount} 个节点`
            }
          </p>
        </div>
      </div>
    </div>
  );
};
