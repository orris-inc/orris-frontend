/**
 * MobileResourceGroupCard - iOS 26 Liquid Glass styled resource group card for mobile
 *
 * Designed following iOS Human Interface Guidelines:
 * - Minimum 44px touch targets for all interactive elements
 * - Clear visual hierarchy with primary/secondary information
 * - Expandable details section with smooth animation
 * - Quick action buttons for common operations
 * - Respects prefers-reduced-motion
 */

import { useState } from 'react';
import {
  ChevronDown,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Boxes,
  Hash,
  FileText,
  Server,
  ArrowLeftRight,
  Calendar,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/common/Collapsible';
import { AdminBadge } from '@/components/admin';
import { Badge } from '@/components/common/Badge';
import { MobileActionButton } from '@/components/mobile';
import { cn } from '@/lib/utils';
import { formatDate } from '@/shared/utils/date-utils';
import type { ResourceGroup, ResourceGroupStatus } from '@/api/resource/types';
import type { SubscriptionPlan } from '@/api/subscription/types';

// ============================================================================
// Types
// ============================================================================

export interface MobileResourceGroupCardProps {
  resourceGroup: ResourceGroup;
  plansMap?: Record<string, SubscriptionPlan>;
  nodeCount?: number;
  ruleCount?: number;
  onEdit: (resourceGroup: ResourceGroup) => void;
  onDelete: (resourceGroup: ResourceGroup) => void;
  onToggleStatus: (resourceGroup: ResourceGroup) => void;
}

// ============================================================================
// Constants
// ============================================================================

const STATUS_CONFIG: Record<
  ResourceGroupStatus,
  { label: string; variant: 'success' | 'default' }
> = {
  active: { label: '启用', variant: 'success' },
  inactive: { label: '禁用', variant: 'default' },
};

// ============================================================================
// Main Component
// ============================================================================

export const MobileResourceGroupCard = ({
  resourceGroup,
  plansMap = {},
  nodeCount = 0,
  ruleCount = 0,
  onEdit,
  onDelete,
  onToggleStatus,
}: MobileResourceGroupCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusConfig = STATUS_CONFIG[resourceGroup.status] || {
    label: resourceGroup.status,
    variant: 'default' as const,
  };

  // Get associated plan info
  const plan = resourceGroup.planId ? plansMap[resourceGroup.planId] : null;

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={setIsExpanded}
      className={cn(
        'bg-card/60 backdrop-blur-sm',
        'rounded-2xl',
        'border border-border/50',
        'overflow-hidden'
      )}
    >
      {/* Header - Always visible */}
      <CollapsibleTrigger
        className={cn(
          'w-full px-4 py-3 min-h-[60px]',
          'flex items-center justify-between gap-3',
          'text-left cursor-pointer',
          // Active feedback
          'motion-safe:active:bg-foreground/5'
        )}
      >
        {/* Resource Group Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-medium text-foreground truncate">
              {resourceGroup.name}
            </span>
            <AdminBadge
              variant={statusConfig.variant}
              className="text-[10px] px-1.5 py-0 shrink-0"
            >
              {statusConfig.label}
            </AdminBadge>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Server className="size-3 shrink-0" />
            <span>{nodeCount} 节点</span>
            <span className="text-border">·</span>
            <ArrowLeftRight className="size-3 shrink-0" />
            <span>{ruleCount} 规则</span>
            {plan && (
              <>
                <span className="text-border">·</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {plan.name}
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Chevron */}
        <ChevronDown
          className={cn(
            'size-5 text-muted-foreground shrink-0',
            'transition-transform duration-200',
            'motion-reduce:transition-none',
            isExpanded && 'rotate-180'
          )}
        />
      </CollapsibleTrigger>

      {/* Expandable Details */}
      <CollapsibleContent>
        {/* Details Section */}
        <div className="border-t border-border/30 px-4 py-3 space-y-2.5">
          {/* ID */}
          <div className="flex items-center gap-3">
            <Hash className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                ID
              </div>
              <div className="text-xs font-mono text-foreground truncate">
                {resourceGroup.sid}
              </div>
            </div>
          </div>

          {/* Description */}
          {resourceGroup.description && (
            <div className="flex items-start gap-3">
              <FileText className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                  描述
                </div>
                <div className="text-xs text-foreground whitespace-pre-wrap break-words">
                  {resourceGroup.description}
                </div>
              </div>
            </div>
          )}

          {/* Associated Plan */}
          <div className="flex items-center gap-3">
            <Boxes className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                关联套餐
              </div>
              <div className="text-xs text-foreground">
                {plan ? (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {plan.name}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">未关联</span>
                )}
              </div>
            </div>
          </div>

          {/* Resource Stats */}
          <div className="flex items-center gap-3">
            <Server className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                关联资源
              </div>
              <div className="flex items-center gap-2 text-xs text-foreground">
                <span className="flex items-center gap-1">
                  <Server className="size-3" />
                  {nodeCount} 节点
                </span>
                <span className="text-border">·</span>
                <span className="flex items-center gap-1">
                  <ArrowLeftRight className="size-3" />
                  {ruleCount} 规则
                </span>
              </div>
            </div>
          </div>

          {/* Created At */}
          <div className="flex items-center gap-3">
            <Calendar className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                创建时间
              </div>
              <div className="text-xs text-foreground">{formatDate(resourceGroup.createdAt)}</div>
            </div>
          </div>

          {/* Updated At */}
          <div className="flex items-center gap-3">
            <Calendar className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                更新时间
              </div>
              <div className="text-xs text-foreground">{formatDate(resourceGroup.updatedAt)}</div>
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="border-t border-border/30 px-4 py-3">
          <div className="flex gap-1.5 flex-wrap">
            <MobileActionButton
              icon={<Edit className="size-3.5" />}
              label="编辑"
              onClick={() => onEdit(resourceGroup)}
              variant="primary"
            />
            {resourceGroup.status === 'active' ? (
              <MobileActionButton
                icon={<PowerOff className="size-3.5" />}
                label="禁用"
                onClick={() => onToggleStatus(resourceGroup)}
                variant="destructive"
              />
            ) : (
              <MobileActionButton
                icon={<Power className="size-3.5" />}
                label="启用"
                onClick={() => onToggleStatus(resourceGroup)}
                variant="success"
              />
            )}
            <MobileActionButton
              icon={<Trash2 className="size-3.5" />}
              label="删除"
              onClick={() => onDelete(resourceGroup)}
              variant="destructive"
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

MobileResourceGroupCard.displayName = 'MobileResourceGroupCard';
