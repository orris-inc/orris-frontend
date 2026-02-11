/**
 * PlanCatalogGrid - Card grid container for subscription plans
 *
 * Responsive grid: 1 col mobile → 2 cols sm → 3 cols lg.
 * Includes loading skeleton, empty state, and pagination.
 */

import { useTranslation } from 'react-i18next';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cardStyles } from '@/lib/ui-styles';
import { PlanCatalogCard } from './PlanCatalogCard';
import type { SubscriptionPlan } from '@/api/subscription/types';

// ============================================================================
// Types
// ============================================================================

export interface PlanCatalogGridProps {
  plans: SubscriptionPlan[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onEdit: (plan: SubscriptionPlan) => void;
  onDuplicate?: (plan: SubscriptionPlan) => void;
  onToggleStatus: (plan: SubscriptionPlan) => void;
  onViewSubscriptions?: (plan: SubscriptionPlan) => void;
  onDelete?: (plan: SubscriptionPlan) => void;
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function CardSkeleton() {
  return (
    <div className={cn(cardStyles, 'overflow-hidden border-l-[3px] border-l-border p-4')}>
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 w-16 bg-muted rounded-full animate-pulse motion-reduce:animate-none" />
      </div>
      <div className="space-y-1.5 mb-3">
        <div className="h-4 w-3/4 bg-muted rounded animate-pulse motion-reduce:animate-none" />
        <div className="h-3 w-1/2 bg-muted rounded animate-pulse motion-reduce:animate-none" />
      </div>
      <div className="mb-3">
        <div className="h-7 w-24 bg-muted rounded animate-pulse motion-reduce:animate-none" />
      </div>
      <div className="flex gap-2 mb-3">
        <div className="h-6 w-16 bg-muted rounded-lg animate-pulse motion-reduce:animate-none" />
        <div className="h-6 w-12 bg-muted rounded-lg animate-pulse motion-reduce:animate-none" />
      </div>
      <div className="pt-3 border-t border-border/50">
        <div className="h-4 w-20 bg-muted rounded-full animate-pulse motion-reduce:animate-none" />
      </div>
    </div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
      <div className="size-12 rounded-xl bg-muted flex items-center justify-center mb-3">
        <Package className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">
        {t('admin.plans.table.noPlans')}
      </p>
    </div>
  );
}

// ============================================================================
// Pagination
// ============================================================================

function GridPagination({
  page,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const { t } = useTranslation();
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-xs text-muted-foreground">
        {t('common.pagination.total', { count: total })}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={cn(
            'px-3 h-8 rounded-lg text-xs font-medium transition-colors',
            'ring-1 ring-border bg-background',
            'hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {t('common.pagination.previous')}
        </button>
        <span className="px-3 text-xs text-muted-foreground tabular-nums">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={cn(
            'px-3 h-8 rounded-lg text-xs font-medium transition-colors',
            'ring-1 ring-border bg-background',
            'hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {t('common.pagination.next')}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function PlanCatalogGrid({
  plans,
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onViewSubscriptions,
  onDelete,
}: PlanCatalogGridProps) {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
        ) : plans.length === 0 ? (
          <EmptyState />
        ) : (
          plans.map((plan) => (
            <PlanCatalogCard
              key={plan.id}
              plan={plan}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onToggleStatus={onToggleStatus}
              onViewSubscriptions={onViewSubscriptions}
              onDelete={onDelete}
            />
          ))
        )}
      </div>

      {!loading && plans.length > 0 && (
        <GridPagination
          page={page}
          total={total}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
