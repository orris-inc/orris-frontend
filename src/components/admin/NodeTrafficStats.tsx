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
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
      dot: 'bg-emerald-500',
    };
  }
  if (statusLower === 'inactive' || statusLower === 'offline') {
    return {
      bg: 'bg-rose-50 dark:bg-rose-900/20',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-200 dark:border-rose-800',
      dot: 'bg-rose-500',
    };
  }
  if (statusLower === 'maintenance') {
    return {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800',
      dot: 'bg-amber-500',
    };
  }
  return {
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-400',
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
        'flex items-center gap-4 p-4 rounded-xl border transition-all duration-300',
        'bg-white dark:bg-slate-900',
        'hover:shadow-md hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50',
        colors.border
      )}
    >
      {/* Node Icon with Status */}
      <div
        className={cn(
          'relative flex items-center justify-center min-w-10 h-10 rounded-lg border transition-all',
          colors.bg,
          colors.text,
          colors.border
        )}
      >
        <Server className="size-5" strokeWidth={1.5} />
        {/* Status dot */}
        <div
          className={cn(
            'absolute -top-1 -right-1 size-3 rounded-full border-2 border-white dark:border-slate-900',
            colors.dot
          )}
        />
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
          {item.nodeName}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
          {item.nodeId}
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
 * Loading skeleton for node list
 */
const NodeListSkeleton = () => {
  return (
    <div className="h-[480px] space-y-3">
      {[...Array(7)].map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
        >
          {/* Icon Skeleton */}
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
const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Server className="size-12 text-slate-300 dark:text-slate-600 mb-3" strokeWidth={1.5} />
      <p className="text-sm text-slate-500 dark:text-slate-400">暂无节点流量数据</p>
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
    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800">
      <span className="text-sm text-slate-500 dark:text-slate-400">
        共 {total} 个节点
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          上一页
        </button>
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
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
      <div className="flex items-center justify-between px-6 h-[72px] border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          节点流量统计
        </h3>
      </div>

      {/* Content */}
      <div className="px-6 pb-6 pt-4">
        {loading ? (
          <NodeListSkeleton />
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <ScrollArea className="h-[480px]">
            <div className="space-y-3 pr-4">
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
