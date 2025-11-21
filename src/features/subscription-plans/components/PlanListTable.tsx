/**
 * 订阅计划列表表格组件（管理端）
 * Frontend Design 优化：精致商务风格，细节至上
 */

import { Edit, Power, Network, MoreHorizontal } from 'lucide-react';
import {
  AdminTable,
  AdminTableHeader,
  AdminTableBody,
  AdminTableRow,
  AdminTableHead,
  AdminTableCell,
  AdminTableEmpty,
  AdminTableLoading,
  AdminTablePagination,
  AdminBadge,
} from '@/components/admin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { BillingCycleBadge } from './BillingCycleBadge';
import type { SubscriptionPlan, PlanStatus } from '../types/subscription-plans.types';

// 获取计划的价格范围（支持多定价）
const getPriceRange = (plan: SubscriptionPlan) => {
  const currencySymbol = plan.Currency === 'CNY' ? '¥' : '$';

  // 如果有多定价，计算价格范围
  if (plan.pricings && plan.pricings.length > 1) {
    const activePricings = plan.pricings.filter(p => p.is_active);
    if (activePricings.length > 1) {
      const prices = activePricings.map(p => p.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      if (minPrice !== maxPrice) {
        return {
          display: `${currencySymbol}${(minPrice / 100).toFixed(2)} - ${currencySymbol}${(maxPrice / 100).toFixed(2)}`,
          details: activePricings.map(p => ({
            cycle: p.billing_cycle,
            price: `${p.currency === 'CNY' ? '¥' : '$'}${(p.price / 100).toFixed(2)}`,
          })),
        };
      }
    }
  }

  // 单一价格
  return {
    display: `${currencySymbol}${(plan.Price / 100).toFixed(2)}`,
    details: null,
  };
};

interface PlanListTableProps {
  plans: SubscriptionPlan[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (plan: SubscriptionPlan) => void;
  onToggleStatus: (plan: SubscriptionPlan) => void;
  onManageNodeGroups?: (plan: SubscriptionPlan) => void;
}

const STATUS_CONFIG: Record<PlanStatus, { label: string; variant: 'success' | 'default' | 'danger' }> = {
  active: { label: '激活', variant: 'success' },
  inactive: { label: '未激活', variant: 'default' },
  archived: { label: '已归档', variant: 'danger' },
};

const COLUMNS = 8;

export const PlanListTable: React.FC<PlanListTableProps> = ({
  plans,
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onToggleStatus,
  onManageNodeGroups,
}) => {
  return (
    <>
      <AdminTable>
        <AdminTableHeader>
          <AdminTableRow>
            <AdminTableHead width={240} align="center">计划名称</AdminTableHead>
            <AdminTableHead width={130} align="right">价格</AdminTableHead>
            <AdminTableHead width={100} align="center">计费周期</AdminTableHead>
            <AdminTableHead width={80} align="center">状态</AdminTableHead>
            <AdminTableHead width={70} align="center">公开</AdminTableHead>
            <AdminTableHead width={90} align="right">试用天数</AdminTableHead>
            <AdminTableHead width={70} align="center">排序</AdminTableHead>
            <AdminTableHead width={60} align="center">操作</AdminTableHead>
          </AdminTableRow>
        </AdminTableHeader>
        <AdminTableBody>
          {loading && plans.length === 0 ? (
            <AdminTableLoading colSpan={COLUMNS} />
          ) : plans.length === 0 ? (
            <AdminTableEmpty message="暂无订阅计划" colSpan={COLUMNS} />
          ) : (
            plans.map((plan) => {
              const statusConfig = STATUS_CONFIG[plan.Status] || { label: plan.Status, variant: 'default' as const };
              const priceRange = getPriceRange(plan);

              return (
                <AdminTableRow key={plan.ID}>
                  {/* 计划名称 */}
                  <AdminTableCell align="center">
                    <div className="space-y-1">
                      <div className="text-[15px] text-slate-900 dark:text-white leading-tight">
                        {plan.Name}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 leading-tight font-mono">
                        {plan.Slug}
                      </div>
                    </div>
                  </AdminTableCell>

                  {/* 价格 */}
                  <AdminTableCell align="right">
                    {priceRange.details ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 cursor-help group">
                            <span className="font-mono text-[15px] tabular-nums text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {priceRange.display}
                            </span>
                            <svg className="size-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-1">
                            <p className="font-semibold text-white mb-1.5">所有定价选项：</p>
                            {priceRange.details.map((detail, idx) => (
                              <p key={idx} className="font-mono text-indigo-100">{detail.cycle}: {detail.price}</p>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="font-mono text-[15px] tabular-nums text-slate-900 dark:text-white">
                        {priceRange.display}
                      </span>
                    )}
                  </AdminTableCell>

                  {/* 计费周期 */}
                  <AdminTableCell align="center">
                    <BillingCycleBadge billingCycle={plan.BillingCycle} />
                  </AdminTableCell>

                  {/* 状态 */}
                  <AdminTableCell align="center">
                    <AdminBadge variant={statusConfig.variant}>
                      {statusConfig.label}
                    </AdminBadge>
                  </AdminTableCell>

                  {/* 公开 */}
                  <AdminTableCell align="center">
                    <AdminBadge variant={plan.IsPublic ? 'success' : 'outline'}>
                      {plan.IsPublic ? '是' : '否'}
                    </AdminBadge>
                  </AdminTableCell>

                  {/* 试用天数 */}
                  <AdminTableCell align="right" className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {plan.TrialDays ? (
                      <span className="inline-flex items-center gap-1">
                        <span>{plan.TrialDays}</span>
                        <span className="text-xs text-slate-400">天</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </AdminTableCell>

                  {/* 排序 */}
                  <AdminTableCell align="center" className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    {plan.SortOrder || '-'}
                  </AdminTableCell>

                  {/* 操作 - 图标优化 */}
                  <AdminTableCell align="center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="inline-flex items-center justify-center size-8 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 group">
                          <MoreHorizontal className="size-4 group-hover:scale-110 transition-transform" strokeWidth={2} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(plan)}>
                          <Edit className="mr-2 size-4" />
                          编辑
                        </DropdownMenuItem>
                        {onManageNodeGroups && (
                          <DropdownMenuItem onClick={() => onManageNodeGroups(plan)}>
                            <Network className="mr-2 size-4" />
                            管理节点组
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onToggleStatus(plan)}>
                          <Power className="mr-2 size-4" />
                          {plan.Status === 'active' ? '停用' : '激活'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </AdminTableCell>
                </AdminTableRow>
              );
            })
          )}
        </AdminTableBody>
      </AdminTable>
      <AdminTablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        loading={loading}
      />
    </>
  );
};
