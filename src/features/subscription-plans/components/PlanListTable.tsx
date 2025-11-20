/**
 * 订阅计划列表表格组件（管理端）
 */

import { Edit, Power, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
}

const STATUS_LABELS: Record<PlanStatus, string> = {
  active: '激活',
  inactive: '未激活',
  archived: '已归档',
};

const STATUS_VARIANTS: Record<PlanStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  inactive: 'secondary',
  archived: 'destructive',
};

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
}) => {
  // 计算分页信息
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>计划名称</TableHead>
              <TableHead>价格</TableHead>
              <TableHead>计费周期</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>公开</TableHead>
              <TableHead>试用天数</TableHead>
              <TableHead>排序</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-64 text-center">
                  <div className="flex items-center justify-center">
                    <Loader2 className="size-8 animate-spin text-muted-foreground" />
                  </div>
                </TableCell>
              </TableRow>
            ) : plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-64 text-center">
                  <p className="text-muted-foreground">暂无订阅计划</p>
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan.ID}>
                  <TableCell>
                    <div>
                      <div className="text-sm font-medium">{plan.Name}</div>
                      <div className="text-xs text-muted-foreground">{plan.Slug}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const priceRange = getPriceRange(plan);
                      if (priceRange.details) {
                        // 多定价：显示价格范围 + Tooltip
                        return (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help border-b border-dotted text-sm">
                                {priceRange.display}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div>
                                <p className="mb-1 text-xs font-bold">所有定价选项：</p>
                                {priceRange.details.map((detail, idx) => (
                                  <p key={idx} className="text-xs">
                                    {detail.cycle}: {detail.price}
                                  </p>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      }
                      // 单一价格
                      return <span className="text-sm">{priceRange.display}</span>;
                    })()}
                  </TableCell>
                  <TableCell>
                    <BillingCycleBadge billingCycle={plan.BillingCycle} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[plan.Status]}>
                      {STATUS_LABELS[plan.Status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={plan.IsPublic ? 'default' : 'outline'}>
                      {plan.IsPublic ? '是' : '否'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {plan.TrialDays ? `${plan.TrialDays} 天` : '-'}
                  </TableCell>
                  <TableCell>{plan.SortOrder || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(plan)}
                          >
                            <Edit className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>编辑</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={plan.Status === 'active' ? 'ghost' : 'default'}
                            size="icon"
                            onClick={() => onToggleStatus(plan)}
                          >
                            <Power className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {plan.Status === 'active' ? '停用' : '激活'}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* 分页控制 */}
        {total > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>每页显示</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => onPageSizeChange(parseInt(value, 10))}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>共 {total} 条</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {startIndex}-{endIndex} / {total}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page === 1 || loading}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages || loading}
                >
                  下一页
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
