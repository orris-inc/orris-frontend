/**
 * User node usage card component
 * Displays node quota usage information
 */

import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const isUnlimited = !nodeLimit || nodeLimit === 0;
  const usagePercentage = isUnlimited ? 0 : Math.min((nodeCount / nodeLimit) * 100, 100);
  const isNearLimit = !isUnlimited && usagePercentage >= 80;
  const isAtLimit = !isUnlimited && nodeCount >= nodeLimit;

  if (isLoading) {
    return (
      <div className="@container glass rounded-xl p-4 ">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 @sm:h-10 @sm:w-10 rounded-full bg-muted/50 animate-pulse motion-reduce:animate-none" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-muted/50 rounded animate-pulse motion-reduce:animate-none" />
            <div className="h-3 w-32 bg-muted/50 rounded animate-pulse motion-reduce:animate-none" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="@container glass rounded-xl p-3 @sm:p-4  transition-all duration-normal ease-smooth">
      <div className="flex items-center gap-2.5 @sm:gap-3">
        {/* Status icon - compact on mobile */}
        <div className={`
          flex h-9 w-9 @sm:h-10 @sm:w-10 items-center justify-center rounded-full shrink-0
          transition-colors duration-fast
          ${isAtLimit ? 'bg-destructive/10 text-destructive' : isNearLimit ? 'bg-yellow-500/10 text-yellow-600' : 'bg-primary/10 text-primary'}
        `}>
          <Server className="h-4 w-4 @sm:h-5 @sm:w-5" />
        </div>
        <div className="flex-1 min-w-0">
          {/* Header row - inline on mobile */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs @sm:text-sm font-medium text-muted-foreground">{t('userNodes.stats.quota')}</span>
            <span className={`text-sm font-semibold font-mono ${isAtLimit ? 'text-destructive' : isNearLimit ? 'text-yellow-600' : ''}`}>
              {nodeCount} / {isUnlimited ? '∞' : nodeLimit}
            </span>
          </div>

          {/* Progress bar - compact */}
          {!isUnlimited && (
            <div className="mt-1.5">
              <Progress
                value={usagePercentage}
                className={`h-1.5 @sm:h-2 ${isAtLimit ? '[&>div]:bg-destructive' : isNearLimit ? '[&>div]:bg-yellow-500' : ''}`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
