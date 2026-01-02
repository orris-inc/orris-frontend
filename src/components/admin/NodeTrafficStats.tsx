/**
 * Node Traffic Statistics Component
 * Displays node traffic statistics in card list format (consistent with TrafficRankingList)
 */

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
const getStatusColors = (status: string) => {
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
    <div
      className={cn(
        'flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl border transition-all duration-300',
        'bg-card',
        'hover:shadow-md',
        colors.border
      )}
    >
      {/* Node Icon with Status */}
      <div
        className={cn(
          'relative flex items-center justify-center min-w-8 h-8 sm:min-w-10 sm:h-10 rounded-md sm:rounded-lg border transition-all',
          colors.bg,
          colors.text,
          colors.border
        )}
      >
        <Server className="size-4 sm:size-5" strokeWidth={1.5} />
        {/* Status dot */}
        <div
          className={cn(
            'absolute -top-1 -right-1 size-2.5 sm:size-3 rounded-full border-2 border-card',
            colors.dot
          )}
        />
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
          {item.nodeName}
        </p>
        <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
          {item.nodeId}
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
 * Loading skeleton for node list
 */
const NodeListSkeleton = () => {
  return (
    <div className="h-[320px] sm:h-[480px] space-y-2 sm:space-y-3">
      {[...Array(7)].map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-border bg-card"
        >
          {/* Icon Skeleton */}
          <div className="min-w-8 h-8 sm:min-w-10 sm:h-10 bg-muted rounded-md sm:rounded-lg animate-pulse" />

          {/* Name Skeleton */}
          <div className="flex-1 space-y-2">
            <div className="h-3 sm:h-4 bg-muted rounded w-1/3 animate-pulse" />
            <div className="h-2.5 sm:h-3 bg-muted rounded w-1/2 animate-pulse" />
          </div>

          {/* Stats Skeleton */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:block h-3 w-16 bg-muted rounded animate-pulse" />
            <div className="hidden sm:block h-3 w-16 bg-muted rounded animate-pulse" />
            <div className="h-3 w-12 sm:w-16 bg-muted rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Empty state component
 */
const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Server className="size-12 text-muted-foreground/50 mb-3" strokeWidth={1.5} />
      <p className="text-sm text-muted-foreground">暂无节点流量数据</p>
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
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) => {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-t border-border">
      <span className="text-xs sm:text-sm text-muted-foreground">
        共 {total} 个节点
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-4 py-2.5 sm:px-3 sm:py-1.5 text-sm rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors touch-target min-h-[44px] sm:min-h-0"
        >
          上一页
        </button>
        <span className="text-xs sm:text-sm text-muted-foreground px-1">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-4 py-2.5 sm:px-3 sm:py-1.5 text-sm rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors touch-target min-h-[44px] sm:min-h-0"
        >
          下一页
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
  return (
    <AdminCard noPadding>
      {/* Header - height matches TrafficRankingList */}
      <div className="flex items-center justify-between px-4 sm:px-6 h-[56px] sm:h-[72px] border-b border-border">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">
          节点流量统计
        </h3>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-3 sm:pt-4">
        {loading ? (
          <NodeListSkeleton />
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <ScrollArea className="h-[320px] sm:h-[480px]">
            <div className="space-y-2 sm:space-y-3 pr-4">
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
        />
      )}
    </AdminCard>
  );
};
