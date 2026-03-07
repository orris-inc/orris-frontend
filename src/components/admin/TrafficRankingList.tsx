/**
 * Traffic Ranking List Component
 * Displays user and subscription traffic rankings with tabs
 */

import { useTranslation } from 'react-i18next';
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
export const getRankingColors = (rank: number) => {
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
    <div className="flex items-center gap-2 @md:gap-3 py-2 @md:py-2.5">
      {/* Rank Badge */}
      <div
        className={cn(
          'flex items-center justify-center size-7 @md:size-8 rounded-md border',
          colors.bg,
          colors.text,
          colors.border,
          isTopThree && 'font-bold'
        )}
      >
        {isTopThree ? (
          <Trophy className="size-3.5 @md:size-4" strokeWidth={2} />
        ) : (
          <span className="font-semibold text-xs">#{item.rank}</span>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-foreground truncate">
          {item.name}
        </p>
        <p className="text-[11px] text-muted-foreground/60 truncate">
          {item.id}
        </p>
      </div>

      {/* Traffic Stats */}
      <div className="flex items-center gap-2 @md:gap-3 text-[11px] @md:text-xs">
        {/* Upload - hidden on small container */}
        <div className="hidden @md:flex items-center gap-1 whitespace-nowrap">
          <ArrowUp className="size-3 text-chart-upload" strokeWidth={2} />
          <span className="font-medium text-foreground tabular-nums">
            {formatTrafficBytes(item.upload)}
          </span>
        </div>

        {/* Download - hidden on small container */}
        <div className="hidden @md:flex items-center gap-1 whitespace-nowrap">
          <ArrowDown className="size-3 text-chart-download" strokeWidth={2} />
          <span className="font-medium text-foreground tabular-nums">
            {formatTrafficBytes(item.download)}
          </span>
        </div>

        {/* Total - always visible */}
        <div className="flex items-center gap-1 whitespace-nowrap">
          <Activity className="size-3 text-muted-foreground/60" strokeWidth={2} />
          <span className="font-semibold text-foreground tabular-nums">
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
    <div className="h-[280px] @md:h-[360px] @lg:h-[480px] divide-y divide-border/60">
      {[...Array(7)].map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-2 @md:gap-3 py-2 @md:py-2.5"
        >
          {/* Rank Badge Skeleton */}
          <div className="size-7 @md:size-8 bg-muted rounded-md animate-pulse motion-reduce:animate-none" />

          {/* Name Skeleton */}
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-muted rounded w-1/3 animate-pulse motion-reduce:animate-none" />
            <div className="h-2.5 bg-muted rounded w-1/2 animate-pulse motion-reduce:animate-none" />
          </div>

          {/* Stats Skeleton */}
          <div className="flex items-center gap-3">
            <div className="h-3 w-14 bg-muted rounded animate-pulse motion-reduce:animate-none" />
            <div className="h-3 w-14 bg-muted rounded animate-pulse motion-reduce:animate-none" />
            <div className="h-3 w-14 bg-muted rounded animate-pulse motion-reduce:animate-none" />
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
      <Trophy className="size-8 text-muted-foreground/40 mb-2" strokeWidth={1.5} />
      <p className="text-[13px] text-muted-foreground">{message}</p>
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
  const { t } = useTranslation();

  return (
    <AdminCard variant="bordered" noPadding>
      <Tabs defaultValue="user" className="@container w-full">
        {/* Header with Title and Tabs */}
        <div className="flex items-center justify-between px-4 @md:px-6 py-2.5 @md:py-3 border-b border-border/60">
          <h3 className="text-[13px] font-semibold text-foreground">
            {t('admin.traffic.ranking')}
          </h3>
          <TabsList className="h-7 @md:h-8">
            <TabsTrigger value="user" className="text-xs px-2 @md:px-2.5">{t('admin.traffic.userRanking')}</TabsTrigger>
            <TabsTrigger value="subscription" className="text-xs px-2 @md:px-2.5">{t('admin.traffic.subscriptionRanking')}</TabsTrigger>
          </TabsList>
        </div>

        {/* User Ranking Tab */}
        <TabsContent value="user" className="px-4 @md:px-6 pb-3 @md:pb-4 pt-2 @md:pt-3">
          {loading ? (
            <RankingListSkeleton />
          ) : userRanking.length === 0 ? (
            <EmptyState message={t('admin.traffic.noUserData')} />
          ) : (
            <ScrollArea className="max-h-[280px] @md:max-h-[360px] @lg:max-h-[480px]">
              <div className="divide-y divide-border/60 pr-4">
                {userRanking.map((item) => (
                  <RankingItem key={item.id} item={item} />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* Subscription Ranking Tab */}
        <TabsContent value="subscription" className="px-4 @md:px-6 pb-3 @md:pb-4 pt-2 @md:pt-3">
          {loading ? (
            <RankingListSkeleton />
          ) : subscriptionRanking.length === 0 ? (
            <EmptyState message={t('admin.traffic.noSubscriptionData')} />
          ) : (
            <ScrollArea className="max-h-[280px] @md:max-h-[360px] @lg:max-h-[480px]">
              <div className="divide-y divide-border/60 pr-4">
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
