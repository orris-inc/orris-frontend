/**
 * Resource Group Mobile List Component
 * Mobile-friendly card list with Accordion for expanded details
 */

import { useTranslation } from 'react-i18next';
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
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { Skeleton } from '@/components/common/Skeleton';
import { ACTIVE_STATUS_CONFIG } from '@/shared/constants/status-config';
import type { ResourceGroup } from '@/api/resource/types';
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


import { formatDate } from '@/shared/utils/date-utils';

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
  const { t } = useTranslation();
  // Render dropdown menu
  const renderDropdownMenu = (resourceGroup: ResourceGroup) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
            onClick={(e) => e.stopPropagation()}
            aria-label={t('common.actions.more')}
          >
            <MoreHorizontal className="size-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent align="end" collisionPadding={16}>
            {onViewDetail && (
              <DropdownMenuItem onSelect={() => onViewDetail(resourceGroup)}>
                <Eye className="mr-2 size-4" />
                {t('common.actions.viewDetail')}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => onEdit(resourceGroup)}>
              <Edit className="mr-2 size-4" />
              {t('common.actions.edit')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onToggleStatus(resourceGroup)}>
              <Power className="mr-2 size-4" />
              {resourceGroup.status === 'active' ? t('common.actions.disable') : t('common.actions.enable')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(resourceGroup)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              {t('common.actions.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>
    );
  };

  if (loading) {
    return <MobileCardSkeleton />;
  }

  if (resourceGroups.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t('admin.resourceGroups.emptyState')}
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="space-y-1.5">
      {resourceGroups.map((resourceGroup) => {
        const status = resourceGroup.status;
        const statusConfig = ACTIVE_STATUS_CONFIG[status] || { labelKey: 'common.status.unknown', variant: 'default' as const };
        const plan = plansMap[resourceGroup.planId];

        return (
          <AccordionItem
            key={resourceGroup.sid}
            value={resourceGroup.sid}
            className="border rounded-lg bg-card overflow-hidden"
          >
            {/* Card Header - Always visible */}
            <div className="px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {/* Name and status */}
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-medium text-sm text-foreground truncate">
                      {resourceGroup.name}
                    </span>
                    <AdminBadge variant={statusConfig.variant} className="text-[10px] px-1.5 py-0 flex-shrink-0">
                      {t(statusConfig.labelKey)}
                    </AdminBadge>
                  </div>

                  {/* Plan name */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <FileText className="size-3 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{plan?.name || `${t('admin.resourceGroups.detail.plan')} #${resourceGroup.planId}`}</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onEdit(resourceGroup)}
                        className="p-1.5 rounded hover:bg-muted hover:bg-accent transition-colors"
                        aria-label={t('common.actions.edit')}
                      >
                        <Edit className="size-3.5 text-muted-foreground hover:text-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{t('common.actions.edit')}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onToggleStatus(resourceGroup)}
                        className={`p-1.5 rounded transition-colors ${
                          resourceGroup.status === 'active'
                            ? 'hover:bg-destructive/10'
                            : 'hover:bg-success/10'
                        }`}
                        aria-label={resourceGroup.status === 'active' ? t('common.actions.disable') : t('common.actions.enable')}
                      >
                        <Power className={`size-3.5 ${
                          resourceGroup.status === 'active'
                            ? 'text-muted-foreground hover:text-destructive'
                            : 'text-muted-foreground hover:text-success'
                        }`} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{resourceGroup.status === 'active' ? t('common.actions.disable') : t('common.actions.enable')}</TooltipContent>
                  </Tooltip>
                  {renderDropdownMenu(resourceGroup)}
                </div>
              </div>
            </div>

            {/* Accordion Trigger */}
            <AccordionTrigger className="px-3 py-1.5 border-t border-border hover:no-underline hover:bg-accent hover:bg-accent/50">
              <span className="text-xs text-muted-foreground dark:text-muted-foreground">{t('common.detail')}</span>
            </AccordionTrigger>

            {/* Accordion Content - Expanded details */}
            <AccordionContent>
              <div className="px-3 pb-2 space-y-2 border-t border-border pt-2">
                {/* SID */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground dark:text-muted-foreground uppercase tracking-wide w-10 flex-shrink-0">SID</span>
                  <span className="text-xs font-mono text-muted-foreground text-muted-foreground">{resourceGroup.sid}</span>
                </div>

                {/* Plan */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground dark:text-muted-foreground uppercase tracking-wide w-10 flex-shrink-0">{t('admin.resourceGroups.detail.plan')}</span>
                  <div className="text-xs text-muted-foreground text-muted-foreground">
                    {plan ? (
                      <span>
                        {plan.name}
                        <span className="ml-1 font-mono text-muted-foreground">({plan.slug})</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{t('admin.resourceGroups.detail.plan')} #{resourceGroup.planId}</span>
                    )}
                  </div>
                </div>

                {/* Description */}
                {resourceGroup.description && (
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-muted-foreground dark:text-muted-foreground uppercase tracking-wide w-10 pt-0.5 flex-shrink-0">{t('common.fields.description')}</span>
                    <span className="text-xs text-muted-foreground text-muted-foreground flex-1">{resourceGroup.description}</span>
                  </div>
                )}

                {/* Created at */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground dark:text-muted-foreground uppercase tracking-wide w-10 flex-shrink-0">{t('admin.resourceGroups.detail.created')}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(resourceGroup.createdAt)}</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};
