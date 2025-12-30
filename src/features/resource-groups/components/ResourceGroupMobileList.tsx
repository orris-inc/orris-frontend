/**
 * Resource Group Mobile List Component
 * Mobile-friendly card list with Accordion for expanded details
 */

import {
  Edit,
  MoreHorizontal,
  Power,
  Trash2,
  Eye,
  FileText,
} from 'lucide-react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/common/Accordion';
import { AdminBadge } from '@/components/admin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { Skeleton } from '@/components/common/Skeleton';
import type { ResourceGroup, ResourceGroupStatus } from '@/api/resource/types';
import type { SubscriptionPlan } from '@/api/subscription/types';

interface ResourceGroupMobileListProps {
  resourceGroups: ResourceGroup[];
  plansMap: Record<string, SubscriptionPlan>;
  loading?: boolean;
  onViewDetail?: (resourceGroup: ResourceGroup) => void;
  onEdit: (resourceGroup: ResourceGroup) => void;
  onDelete: (resourceGroup: ResourceGroup) => void;
  onToggleStatus: (resourceGroup: ResourceGroup) => void;
}

// Status configuration
const STATUS_CONFIG: Record<ResourceGroupStatus, { label: string; variant: 'success' | 'default' }> = {
  active: { label: '激活', variant: 'success' },
  inactive: { label: '未激活', variant: 'default' },
};

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// Loading skeleton for mobile cards
const MobileCardSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-24" />
      </div>
    ))}
  </div>
);

export const ResourceGroupMobileList: React.FC<ResourceGroupMobileListProps> = ({
  resourceGroups,
  plansMap,
  loading = false,
  onViewDetail,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  // Render dropdown menu
  const renderDropdownMenu = (resourceGroup: ResourceGroup) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4 text-slate-500" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onViewDetail && (
            <DropdownMenuItem onClick={() => onViewDetail(resourceGroup)}>
              <Eye className="mr-2 size-4" />
              查看详情
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => onEdit(resourceGroup)}>
            <Edit className="mr-2 size-4" />
            编辑
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onToggleStatus(resourceGroup)}>
            <Power className="mr-2 size-4" />
            {resourceGroup.status === 'active' ? '停用' : '激活'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDelete(resourceGroup)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 size-4" />
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  if (loading) {
    return <MobileCardSkeleton />;
  }

  if (resourceGroups.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        暂无资源组
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="space-y-1.5">
      {resourceGroups.map((resourceGroup) => {
        const status = resourceGroup.status;
        const statusConfig = STATUS_CONFIG[status] || { label: '未知', variant: 'default' as const };
        const plan = plansMap[resourceGroup.planId];

        return (
          <AccordionItem
            key={resourceGroup.sid}
            value={resourceGroup.sid}
            className="border rounded-lg bg-white dark:bg-slate-800 overflow-hidden"
          >
            {/* Card Header - Always visible */}
            <div className="px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {/* Name and status */}
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-medium text-sm text-slate-900 dark:text-white truncate">
                      {resourceGroup.name}
                    </span>
                    <AdminBadge variant={statusConfig.variant} className="text-[10px] px-1.5 py-0 flex-shrink-0">
                      {statusConfig.label}
                    </AdminBadge>
                  </div>

                  {/* Plan name */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <FileText className="size-3 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{plan?.name || `计划 #${resourceGroup.planId}`}</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onEdit(resourceGroup)}
                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Edit className="size-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>编辑</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onToggleStatus(resourceGroup)}
                        className={`p-1.5 rounded transition-colors ${
                          resourceGroup.status === 'active'
                            ? 'hover:bg-red-50 dark:hover:bg-red-900/20'
                            : 'hover:bg-green-50 dark:hover:bg-green-900/20'
                        }`}
                      >
                        <Power className={`size-3.5 ${
                          resourceGroup.status === 'active'
                            ? 'text-slate-400 hover:text-red-500'
                            : 'text-slate-400 hover:text-green-500'
                        }`} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{resourceGroup.status === 'active' ? '停用' : '激活'}</TooltipContent>
                  </Tooltip>
                  {renderDropdownMenu(resourceGroup)}
                </div>
              </div>
            </div>

            {/* Accordion Trigger */}
            <AccordionTrigger className="px-3 py-1.5 border-t border-slate-100 dark:border-slate-700 hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <span className="text-xs text-slate-400 dark:text-slate-500">详情</span>
            </AccordionTrigger>

            {/* Accordion Content - Expanded details */}
            <AccordionContent>
              <div className="px-3 pb-2 space-y-2 border-t border-slate-100 dark:border-slate-700 pt-2">
                {/* SID */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-10 flex-shrink-0">SID</span>
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-300">{resourceGroup.sid}</span>
                </div>

                {/* Plan */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-10 flex-shrink-0">计划</span>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    {plan ? (
                      <span>
                        {plan.name}
                        <span className="ml-1 font-mono text-slate-400">({plan.slug})</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">计划 #{resourceGroup.planId}</span>
                    )}
                  </div>
                </div>

                {/* Description */}
                {resourceGroup.description && (
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-10 pt-0.5 flex-shrink-0">描述</span>
                    <span className="text-xs text-slate-600 dark:text-slate-300 flex-1">{resourceGroup.description}</span>
                  </div>
                )}

                {/* Created at */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-10 flex-shrink-0">创建</span>
                  <span className="text-xs text-slate-500">{formatDate(resourceGroup.createdAt)}</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};
