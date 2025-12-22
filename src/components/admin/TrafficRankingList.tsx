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
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800',
      };
    case 2:
      return {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-300 dark:border-slate-700',
      };
    case 3:
      return {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        text: 'text-orange-600 dark:text-orange-400',
        border: 'border-orange-200 dark:border-orange-800',
      };
    default:
      return {
        bg: 'bg-slate-50 dark:bg-slate-800/50',
        text: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-200 dark:border-slate-700',
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
        'flex items-center gap-4 p-4 rounded-xl border transition-all duration-300',
        'bg-white dark:bg-slate-900',
        'hover:shadow-md hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50',
        colors.border
      )}
    >
      {/* Rank Badge */}
      <div
        className={cn(
          'flex items-center justify-center min-w-10 h-10 rounded-lg border transition-all',
          colors.bg,
          colors.text,
          colors.border,
          isTopThree && 'font-bold'
        )}
      >
        {isTopThree ? (
          <Trophy className="size-5" strokeWidth={2} />
        ) : (
          <span className="font-semibold">#{item.rank}</span>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
          {item.name}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
          {item.id}
        </p>
      </div>

      {/* Traffic Stats */}
      <div className="flex items-center gap-4 text-xs">
        {/* Upload */}
        <div className="flex items-center gap-1.5">
          <ArrowUp className="size-3.5 text-blue-600 dark:text-blue-400" strokeWidth={2} />
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {formatTrafficBytes(item.upload)}
          </span>
        </div>

        {/* Download */}
        <div className="flex items-center gap-1.5">
          <ArrowDown className="size-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {formatTrafficBytes(item.download)}
          </span>
        </div>

        {/* Total */}
        <div className="flex items-center gap-1.5">
          <Activity className="size-3.5 text-violet-600 dark:text-violet-400" strokeWidth={2} />
          <span className="font-bold text-slate-900 dark:text-white">
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
    <div className="h-[480px] space-y-3">
      {[...Array(7)].map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
        >
          {/* Rank Badge Skeleton */}
          <div className="min-w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />

          {/* Name Skeleton */}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 animate-pulse" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 animate-pulse" />
          </div>

          {/* Stats Skeleton */}
          <div className="flex items-center gap-4">
            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
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
      <Trophy className="size-12 text-slate-300 dark:text-slate-600 mb-3" strokeWidth={1.5} />
      <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
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
        <div className="flex items-center justify-between px-6 h-[72px] border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            流量排行榜
          </h3>
          <TabsList>
            <TabsTrigger value="user">用户排行</TabsTrigger>
            <TabsTrigger value="subscription">订阅排行</TabsTrigger>
          </TabsList>
        </div>

        {/* User Ranking Tab */}
        <TabsContent value="user" className="px-6 pb-6 pt-4">
          {loading ? (
            <RankingListSkeleton />
          ) : userRanking.length === 0 ? (
            <EmptyState message="暂无用户流量数据" />
          ) : (
            <ScrollArea className="h-[480px]">
              <div className="space-y-3 pr-4">
                {userRanking.map((item) => (
                  <RankingItem key={item.id} item={item} />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* Subscription Ranking Tab */}
        <TabsContent value="subscription" className="px-6 pb-6 pt-4">
          {loading ? (
            <RankingListSkeleton />
          ) : subscriptionRanking.length === 0 ? (
            <EmptyState message="暂无订阅流量数据" />
          ) : (
            <ScrollArea className="h-[480px]">
              <div className="space-y-3 pr-4">
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
