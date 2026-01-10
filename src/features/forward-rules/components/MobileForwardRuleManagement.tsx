/**
 * MobileForwardRuleManagement - iOS 26 Liquid Glass styled forward rule management for mobile
 *
 * Designed to work inside AdminLayout:
 * - Compact inline header with title and actions
 * - Stats scroller for quick overview
 * - Search input with dropdown filters (status, protocol, rule type)
 * - Pull-to-refresh pattern (simulated via refresh button)
 * - Card list with pagination
 * - Empty and loading states with proper feedback
 * - All touch targets minimum 44px
 */

import { useState, useMemo, useCallback } from 'react';
import {
  Plus,
  RefreshCw,
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  Activity,
  RotateCw,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
} from 'lucide-react';
import { MobileStatsScroller } from '@/components/mobile/admin';
import { AdminBadge } from '@/components/admin';
import { Skeleton } from '@/components/common/Skeleton';
import { cn } from '@/lib/utils';
import { MobileForwardRuleCard } from './MobileForwardRuleCard';
import type { ForwardRule, ForwardAgent, ForwardStatus, ForwardProtocol, RuleOverallStatusResponse } from '@/api/forward';
import type { Node } from '@/api/node';

// ============================================================================
// Types
// ============================================================================

export interface MobileForwardRuleManagementProps {
  rules: ForwardRule[];
  agentsMap?: Record<string, ForwardAgent>;
  nodes?: Node[];
  polledStatusMap?: Record<string, RuleOverallStatusResponse>;
  pollingRuleIds?: string[];
  loading?: boolean;
  refreshing?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (rule: ForwardRule) => void;
  onEnable: (rule: ForwardRule) => void;
  onDisable: (rule: ForwardRule) => void;
  onDelete: (rule: ForwardRule) => void;
  onProbe?: (rule: ForwardRule) => void;
  probingRuleId?: string | null;
  onPageChange: (page: number) => void;
}

type StatusFilter = 'all' | ForwardStatus;
type ProtocolFilter = 'all' | ForwardProtocol;
type RuleTypeFilter = 'all' | 'direct' | 'entry' | 'chain' | 'direct_chain';

// ============================================================================
// Filter Options
// ============================================================================

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'enabled', label: '启用' },
  { value: 'disabled', label: '禁用' },
];

const PROTOCOL_FILTERS: { value: ProtocolFilter; label: string }[] = [
  { value: 'all', label: '全部协议' },
  { value: 'tcp', label: 'TCP' },
  { value: 'udp', label: 'UDP' },
  { value: 'both', label: 'TCP/UDP' },
];

const RULE_TYPE_FILTERS: { value: RuleTypeFilter; label: string }[] = [
  { value: 'all', label: '全部类型' },
  { value: 'direct', label: '直连' },
  { value: 'entry', label: '入口' },
  { value: 'chain', label: '链式' },
  { value: 'direct_chain', label: '直连链' },
];

// ============================================================================
// Loading Skeleton
// ============================================================================

const CardSkeleton = () => (
  <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 p-4 space-y-3">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-5 w-5 rounded-full" />
    </div>
  </div>
);

const LoadingSkeleton = () => (
  <div className="space-y-2.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

// ============================================================================
// Empty State
// ============================================================================

interface EmptyStateProps {
  hasFilter: boolean;
  onClearFilter: () => void;
}

const EmptyState = ({ hasFilter, onClearFilter }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
      <ArrowLeftRight className="size-8 text-muted-foreground" />
    </div>
    <p className="text-base font-medium text-foreground mb-1">
      {hasFilter ? '未找到匹配规则' : '暂无转发规则'}
    </p>
    <p className="text-sm text-muted-foreground text-center mb-4">
      {hasFilter ? '尝试调整搜索条件或清除筛选' : '点击右上角按钮创建第一个规则'}
    </p>
    {hasFilter && (
      <button
        onClick={onClearFilter}
        className={cn(
          'px-4 py-2 min-h-[44px]',
          'rounded-full',
          'text-sm font-medium',
          'bg-primary text-primary-foreground',
          'motion-safe:active:scale-[0.97]'
        )}
      >
        清除筛选
      </button>
    )}
  </div>
);

// ============================================================================
// Pagination
// ============================================================================

interface PaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ page, total, pageSize, onPageChange }: PaginationProps) => {
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 py-4 px-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={cn(
          'size-10 rounded-full',
          'flex items-center justify-center',
          'bg-foreground/5',
          'transition-colors',
          page <= 1 ? 'opacity-40' : 'hover:bg-foreground/10 motion-safe:active:scale-[0.97]'
        )}
      >
        <ChevronLeft className="size-5" />
      </button>

      <span className="text-sm text-muted-foreground tabular-nums">
        {page} / {totalPages}
      </span>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={cn(
          'size-10 rounded-full',
          'flex items-center justify-center',
          'bg-foreground/5',
          'transition-colors',
          page >= totalPages ? 'opacity-40' : 'hover:bg-foreground/10 motion-safe:active:scale-[0.97]'
        )}
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const MobileForwardRuleManagement = ({
  rules,
  agentsMap = {},
  nodes = [],
  polledStatusMap = {},
  pollingRuleIds = [],
  loading = false,
  refreshing = false,
  page,
  pageSize,
  total,
  onRefresh,
  onCreate,
  onEdit,
  onEnable,
  onDisable,
  onDelete,
  onProbe,
  probingRuleId,
  onPageChange,
}: MobileForwardRuleManagementProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [protocolFilter, setProtocolFilter] = useState<ProtocolFilter>('all');
  const [ruleTypeFilter, setRuleTypeFilter] = useState<RuleTypeFilter>('all');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  // Calculate stats from rules
  const stats = useMemo(() => {
    const enabled = rules.filter((r) => r.status === 'enabled').length;
    const disabled = rules.filter((r) => r.status === 'disabled').length;
    const syncing = rules.filter((r) => r.syncStatus === 'pending').length;
    const running = rules.filter((r) => r.runStatus === 'running').length;
    return { total, enabled, disabled, syncing, running };
  }, [rules, total]);

  // Filter rules by search, status, protocol, and type
  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      // Status filter
      if (statusFilter !== 'all' && rule.status !== statusFilter) {
        return false;
      }

      // Protocol filter
      if (protocolFilter !== 'all' && rule.protocol !== protocolFilter) {
        return false;
      }

      // Rule type filter
      if (ruleTypeFilter !== 'all' && rule.ruleType !== ruleTypeFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchName = rule.name?.toLowerCase().includes(query);
        const matchRemark = rule.remark?.toLowerCase().includes(query);
        const matchId = rule.id.toLowerCase().includes(query);
        if (!matchName && !matchRemark && !matchId) {
          return false;
        }
      }

      return true;
    });
  }, [rules, searchQuery, statusFilter, protocolFilter, ruleTypeFilter]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setProtocolFilter('all');
    setRuleTypeFilter('all');
  }, []);

  const hasFilter = searchQuery !== '' || statusFilter !== 'all' || protocolFilter !== 'all' || ruleTypeFilter !== 'all';

  // Count active filters (excluding search)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (protocolFilter !== 'all') count++;
    if (ruleTypeFilter !== 'all') count++;
    return count;
  }, [statusFilter, protocolFilter, ruleTypeFilter]);

  // Stats configuration for MobileStatsScroller
  const statsConfig = [
    {
      title: '总规则',
      value: stats.total,
      icon: <ArrowLeftRight className="size-3.5" />,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      loading,
    },
    {
      title: '启用',
      value: stats.enabled,
      icon: <CheckCircle2 className="size-3.5" />,
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
      loading,
    },
    {
      title: '禁用',
      value: stats.disabled,
      icon: <XCircle className="size-3.5" />,
      iconBg: 'bg-muted/50',
      iconColor: 'text-muted-foreground',
      loading,
    },
    {
      title: '运行中',
      value: stats.running,
      icon: <Activity className="size-3.5" />,
      iconBg: 'bg-info/10',
      iconColor: 'text-info',
      loading,
    },
    {
      title: '同步中',
      value: stats.syncing,
      icon: <RotateCw className="size-3.5" />,
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
      loading,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Stats Grid */}
      <MobileStatsScroller stats={statsConfig} className="px-0" />

      {/* Action Bar - Search + Filter + Refresh + Add */}
      <div className="flex items-center gap-2">
        {/* Search Bar */}
        <div
          className={cn(
            'flex-1 flex items-center gap-2',
            'h-11 min-h-[44px] px-3',
            'bg-foreground/5 rounded-xl',
            'border border-border/50',
            'focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30',
            'transition-colors'
          )}
        >
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索规则..."
            className={cn(
              'flex-1 min-w-0',
              'bg-transparent',
              'text-sm text-foreground placeholder:text-muted-foreground',
              'focus:outline-none'
            )}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="size-8 min-h-[44px] rounded-full flex items-center justify-center hover:bg-foreground/10"
            >
              <X className="size-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Combined Filter Button */}
        <button
          onClick={() => setFilterPanelOpen(!filterPanelOpen)}
          className={cn(
            'h-11 min-h-[44px] px-3 rounded-xl shrink-0',
            'flex items-center gap-1.5',
            'bg-foreground/5 hover:bg-foreground/10',
            'border border-border/50',
            'text-sm font-medium',
            'transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
            hasFilter ? 'text-primary border-primary/50' : 'text-muted-foreground'
          )}
        >
          <Filter className="size-4" />
          {activeFilterCount > 0 && (
            <span className="size-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown className={cn('size-4 transition-transform', filterPanelOpen && 'rotate-180')} />
        </button>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className={cn(
            'size-11 min-h-[44px] min-w-[44px] rounded-xl shrink-0',
            'flex items-center justify-center',
            'bg-foreground/5 hover:bg-foreground/10',
            'border border-border/50',
            'transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'
          )}
        >
          <RefreshCw
            className={cn('size-4 text-muted-foreground', refreshing && 'animate-spin')}
          />
        </button>

        {/* Add Button */}
        <button
          onClick={onCreate}
          className={cn(
            'size-11 min-h-[44px] min-w-[44px] rounded-xl shrink-0',
            'flex items-center justify-center',
            'bg-primary text-primary-foreground',
            'motion-safe:active:scale-[0.97]',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'
          )}
        >
          <Plus className="size-5" />
        </button>
      </div>

      {/* Filter Panel (Collapsible) */}
      {filterPanelOpen && (
        <div className="bg-foreground/5 rounded-xl border border-border/50 p-3 space-y-3">
          {/* Status Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">状态</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    statusFilter === filter.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-foreground/5 text-muted-foreground hover:bg-foreground/10'
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Protocol Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">协议</label>
            <div className="flex flex-wrap gap-2">
              {PROTOCOL_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setProtocolFilter(filter.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    protocolFilter === filter.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-foreground/5 text-muted-foreground hover:bg-foreground/10'
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rule Type Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">类型</label>
            <div className="flex flex-wrap gap-2">
              {RULE_TYPE_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setRuleTypeFilter(filter.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    ruleTypeFilter === filter.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-foreground/5 text-muted-foreground hover:bg-foreground/10'
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasFilter && (
            <button
              onClick={clearFilters}
              className="w-full py-2 text-xs font-medium text-primary hover:underline"
            >
              清除所有筛选
            </button>
          )}
        </div>
      )}

      {/* Active Filter Badge */}
      {hasFilter && (
        <div className="flex items-center justify-between">
          <AdminBadge variant="info" className="text-xs">
            显示 {filteredRules.length} 条结果
          </AdminBadge>
          <button
            onClick={clearFilters}
            className="text-xs text-primary hover:underline"
          >
            清除筛选
          </button>
        </div>
      )}

      {/* Rule List */}
      {loading ? (
        <LoadingSkeleton />
      ) : filteredRules.length === 0 ? (
        <EmptyState hasFilter={hasFilter} onClearFilter={clearFilters} />
      ) : (
        <div className="space-y-2.5">
          {filteredRules.map((rule) => (
            <MobileForwardRuleCard
              key={rule.id}
              rule={rule}
              agentsMap={agentsMap}
              nodes={nodes}
              polledStatus={polledStatusMap[rule.id]}
              isPolling={pollingRuleIds.includes(rule.id)}
              onEdit={onEdit}
              onEnable={onEnable}
              onDisable={onDisable}
              onDelete={onDelete}
              onProbe={onProbe}
              isProbingThis={probingRuleId === rule.id}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredRules.length > 0 && (
        <Pagination
          page={page}
          total={total}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

MobileForwardRuleManagement.displayName = 'MobileForwardRuleManagement';
