/**
 * Node Traffic Statistics Component
 * Displays node traffic statistics in card list format (consistent with TrafficRankingList)
 */

import { useTranslation } from 'react-i18next';
import { Server, ArrowUp, ArrowDown, Activity } from 'lucide-react';
import { NodeTrafficStatsItem, formatTrafficBytes } from '@/api/admin';
import { AdminCard } from './AdminCard';
import { ScrollArea } from '@/components/common/ScrollArea';
import { cn } from '@/lib/utils';

interface NodeTrafficStatsProps {
  items: NodeTrafficStatsItem[];
  loading: boolean;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  onPageChange: (page: number) => void;
}

/**
 * Get status colors based on node status
 */
export const getStatusColors = (status: string) => {
  const statusLower = status.toLowerCase();
  if (statusLower === 'active' || statusLower === 'online') {
    return {
      bg: 'bg-success-muted',
      text: 'text-success',
      border: 'border-success/30',
      dot: 'bg-status-online',
    };
  }
  if (statusLower === 'inactive' || statusLower === 'offline') {
    return {
      bg: 'bg-destructive/10',
      text: 'text-destructive',
      border: 'border-destructive/30',
      dot: 'bg-status-offline',
    };
  }
  if (statusLower === 'maintenance') {
    return {
      bg: 'bg-warning-muted',
      text: 'text-warning',
      border: 'border-warning/30',
      dot: 'bg-status-warning',
    };
  }
  return {
    bg: 'bg-muted/50',
    text: 'text-muted-foreground',
    border: 'border-border',
    dot: 'bg-muted-foreground/50',
  };
};

/**
 * Node item component
 */
const NodeItem = ({ item }: { item: NodeTrafficStatsItem }) => {
  const colors = getStatusColors(item.status);

  return (
    <div className="flex items-center gap-2 @md:gap-4 py-2.5 @md:py-3">
      {/* Node Icon with Status */}
      <div
        className={cn(
          'relative flex items-center justify-center min-w-7 h-7 @md:min-w-8 @md:h-8 rounded-md @md:rounded-lg border transition-all',
          colors.bg,
          colors.text,
          colors.border
        )}
      >
        <Server className="size-3.5 @md:size-4" strokeWidth={1.5} />
        {/* Status dot */}
        <div
          className={cn(
            'absolute -top-0.5 -right-0.5 size-2 @md:size-2.5 rounded-full border-2 border-card',
            colors.dot
          )}
        />
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-xs @md:text-sm font-semibold text-foreground truncate">
          {item.nodeName}
        </p>
        <p className="text-[11px] @md:text-xs text-muted-foreground truncate">
          {item.nodeId}
        </p>
      </div>

      {/* Traffic Stats */}
      <div className="flex items-center gap-2 @md:gap-4 text-[11px] @md:text-xs">
        {/* Upload - hidden on mobile */}
        <div className="hidden @md:flex items-center gap-1.5 whitespace-nowrap">
          <ArrowUp className="size-3.5 text-chart-upload" strokeWidth={2} />
          <span className="font-medium text-foreground">
            {formatTrafficBytes(item.upload)}
          </span>
        </div>

        {/* Download - hidden on mobile */}
        <div className="hidden @md:flex items-center gap-1.5 whitespace-nowrap">
          <ArrowDown className="size-3.5 text-chart-download" strokeWidth={2} />
          <span className="font-medium text-foreground">
            {formatTrafficBytes(item.download)}
          </span>
        </div>

        {/* Total - always visible */}
        <div className="flex items-center gap-1 @md:gap-1.5 whitespace-nowrap">
          <Activity className="size-3 @md:size-3.5 text-primary" strokeWidth={2} />
          <span className="font-bold text-foreground">
            {formatTrafficBytes(item.total)}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Loading skeleton for node list
 */
const NodeListSkeleton = () => {
  return (
    <div className="h-[280px] @md:h-[360px] @lg:h-[480px] divide-y divide-border">
      {[...Array(7)].map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-2 @md:gap-4 py-2.5 @md:py-3"
        >
          {/* Icon Skeleton */}
          <div className="min-w-7 h-7 @md:min-w-8 @md:h-8 bg-muted rounded-md @md:rounded-lg animate-pulse motion-reduce:animate-none" />

          {/* Name Skeleton */}
          <div className="flex-1 space-y-2">
            <div className="h-3 @md:h-4 bg-muted rounded w-1/3 animate-pulse motion-reduce:animate-none" />
            <div className="h-2.5 @md:h-3 bg-muted rounded w-1/2 animate-pulse motion-reduce:animate-none" />
          </div>

          {/* Stats Skeleton */}
          <div className="flex items-center gap-2 @md:gap-4">
            <div className="hidden @md:block h-3 w-16 bg-muted rounded animate-pulse motion-reduce:animate-none" />
            <div className="hidden @md:block h-3 w-16 bg-muted rounded animate-pulse motion-reduce:animate-none" />
            <div className="h-3 w-12 @md:w-16 bg-muted rounded animate-pulse motion-reduce:animate-none" />
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
      <Server className="size-12 text-muted-foreground/50 mb-3" strokeWidth={1.5} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
};

/**
 * Pagination component
 */
const Pagination = ({
  page,
  pageSize,
  total,
  onPageChange,
  t,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}) => {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 @md:px-6 py-3 @md:py-4 border-t border-border">
      <span className="text-xs @md:text-sm text-muted-foreground">
        {t('admin.traffic.totalNodes', { count: total })}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-4 py-2.5 @md:px-3 @md:py-1.5 text-sm rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors touch-target min-h-[44px] @md:min-h-0"
        >
          {t('common.actions.previous')}
        </button>
        <span className="text-xs @md:text-sm text-muted-foreground px-1">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-4 py-2.5 @md:px-3 @md:py-1.5 text-sm rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors touch-target min-h-[44px] @md:min-h-0"
        >
          {t('common.actions.next')}
        </button>
      </div>
    </div>
  );
};

export const NodeTrafficStats = ({
  items,
  loading,
  pagination,
  onPageChange,
}: NodeTrafficStatsProps) => {
  const { t } = useTranslation();

  return (
    <AdminCard variant="bordered" noPadding className="@container">
      {/* Header - height matches TrafficRankingList */}
      <div className="flex items-center justify-between px-4 @md:px-6 py-3 @md:py-3.5 border-b border-border">
        <h3 className="text-base @md:text-lg font-semibold text-foreground">
          {t('admin.traffic.nodeStats')}
        </h3>
      </div>

      {/* Content */}
      <div className="px-4 @md:px-6 pb-4 @md:pb-6 pt-3 @md:pt-4">
        {loading ? (
          <NodeListSkeleton />
        ) : items.length === 0 ? (
          <EmptyState message={t('admin.traffic.noNodeData')} />
        ) : (
          <ScrollArea className="max-h-[280px] @md:max-h-[360px] @lg:max-h-[480px]">
            <div className="divide-y divide-border pr-4">
              {items.map((item) => (
                <NodeItem key={item.nodeId} item={item} />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Pagination */}
      {!loading && items.length > 0 && (
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onPageChange={onPageChange}
          t={t}
        />
      )}
    </AdminCard>
  );
};
