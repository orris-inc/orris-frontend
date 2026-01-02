/**
 * Traffic Ranking List Component
 * Displays user and subscription traffic rankings with tabs
 */

import { Trophy, ArrowUp, ArrowDown, Activity } from 'lucide-react';
import { TrafficRankingItem, formatTrafficBytes } from '@/api/admin';
import { AdminCard } from './AdminCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/common/Tabs';
import { ScrollArea } from '@/components/common/ScrollArea';
import { cn } from '@/lib/utils';

interface TrafficRankingListProps {
  userRanking: TrafficRankingItem[];
  subscriptionRanking: TrafficRankingItem[];
  loading: boolean;
}

/**
 * Get ranking badge color based on rank position
 */
const getRankingColors = (rank: number) => {
  switch (rank) {
    case 1:
      return {
        bg: 'bg-rank-gold-muted',
        text: 'text-rank-gold',
        border: 'border-rank-gold/30',
      };
    case 2:
      return {
        bg: 'bg-muted',
        text: 'text-rank-silver',
        border: 'border-border',
      };
    case 3:
      return {
        bg: 'bg-rank-bronze-muted',
        text: 'text-rank-bronze',
        border: 'border-rank-bronze/30',
      };
    default:
      return {
        bg: 'bg-muted/50',
        text: 'text-muted-foreground',
        border: 'border-border',
      };
  }
};

/**
 * Ranking item component
 */
const RankingItem = ({ item }: { item: TrafficRankingItem }) => {
  const colors = getRankingColors(item.rank);
  const isTopThree = item.rank <= 3;

  return (
    <div
      className={cn(
        'flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl border transition-all duration-300',
        'bg-card',
        'hover:shadow-md',
        colors.border
      )}
    >
      {/* Rank Badge */}
      <div
        className={cn(
          'flex items-center justify-center min-w-8 h-8 sm:min-w-10 sm:h-10 rounded-md sm:rounded-lg border transition-all',
          colors.bg,
          colors.text,
          colors.border,
          isTopThree && 'font-bold'
        )}
      >
        {isTopThree ? (
          <Trophy className="size-4 sm:size-5" strokeWidth={2} />
        ) : (
          <span className="font-semibold text-xs sm:text-sm">#{item.rank}</span>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
          {item.name}
        </p>
        <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
          {item.id}
        </p>
      </div>

      {/* Traffic Stats */}
      <div className="flex items-center gap-2 sm:gap-4 text-[11px] sm:text-xs">
        {/* Upload - hidden on mobile */}
        <div className="hidden sm:flex items-center gap-1.5 whitespace-nowrap">
          <ArrowUp className="size-3.5 text-chart-upload" strokeWidth={2} />
          <span className="font-medium text-foreground">
            {formatTrafficBytes(item.upload)}
          </span>
        </div>

        {/* Download - hidden on mobile */}
        <div className="hidden sm:flex items-center gap-1.5 whitespace-nowrap">
          <ArrowDown className="size-3.5 text-chart-download" strokeWidth={2} />
          <span className="font-medium text-foreground">
            {formatTrafficBytes(item.download)}
          </span>
        </div>

        {/* Total - always visible */}
        <div className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap">
          <Activity className="size-3 sm:size-3.5 text-primary" strokeWidth={2} />
          <span className="font-bold text-foreground">
            {formatTrafficBytes(item.total)}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Loading skeleton for ranking list
 */
const RankingListSkeleton = () => {
  return (
    <div className="h-[320px] sm:h-[480px] space-y-2 sm:space-y-3">
      {[...Array(7)].map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-border bg-card"
        >
          {/* Rank Badge Skeleton */}
          <div className="min-w-10 h-10 bg-muted rounded-lg animate-pulse" />

          {/* Name Skeleton */}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
            <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
          </div>

          {/* Stats Skeleton */}
          <div className="flex items-center gap-4">
            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Empty state component
 */
const EmptyState = ({ message }: { message: string }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Trophy className="size-12 text-muted-foreground/50 mb-3" strokeWidth={1.5} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
};

/**
 * Main TrafficRankingList component
 */
export const TrafficRankingList = ({
  userRanking,
  subscriptionRanking,
  loading,
}: TrafficRankingListProps) => {
  return (
    <AdminCard noPadding>
      <Tabs defaultValue="user" className="w-full">
        {/* Header with Title and Tabs */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-0 sm:h-[72px] border-b border-border">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">
            流量排行榜
          </h3>
          <TabsList className="h-8 sm:h-9">
            <TabsTrigger value="user" className="text-xs sm:text-sm px-2.5 sm:px-3">用户排行</TabsTrigger>
            <TabsTrigger value="subscription" className="text-xs sm:text-sm px-2.5 sm:px-3">订阅排行</TabsTrigger>
          </TabsList>
        </div>

        {/* User Ranking Tab */}
        <TabsContent value="user" className="px-4 sm:px-6 pb-4 sm:pb-6 pt-3 sm:pt-4">
          {loading ? (
            <RankingListSkeleton />
          ) : userRanking.length === 0 ? (
            <EmptyState message="暂无用户流量数据" />
          ) : (
            <ScrollArea className="h-[320px] sm:h-[480px]">
              <div className="space-y-2 sm:space-y-3 pr-4">
                {userRanking.map((item) => (
                  <RankingItem key={item.id} item={item} />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* Subscription Ranking Tab */}
        <TabsContent value="subscription" className="px-4 sm:px-6 pb-4 sm:pb-6 pt-3 sm:pt-4">
          {loading ? (
            <RankingListSkeleton />
          ) : subscriptionRanking.length === 0 ? (
            <EmptyState message="暂无订阅流量数据" />
          ) : (
            <ScrollArea className="h-[320px] sm:h-[480px]">
              <div className="space-y-2 sm:space-y-3 pr-4">
                {subscriptionRanking.map((item) => (
                  <RankingItem key={item.id} item={item} />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </AdminCard>
  );
};
