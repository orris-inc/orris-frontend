/**
 * ResourceGroupDetailSheet - Mobile resource group details with actions
 *
 * Design: Tailwind Application UI style
 * - Stacked layout with description lists
 * - Card sections with dividers
 * - Hero header with status indicator
 * - Stats cards for member counts
 *
 * Features:
 * - Full resource group details in a bottom sheet
 * - Associated plan information
 * - Member statistics (nodes, forward agents, forward rules)
 * - Primary actions in footer
 * - ActionSheet for secondary actions
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Layers,
  Hash,
  FileText,
  CreditCard,
  Edit,
  MoreHorizontal,
  Power,
  PowerOff,
  Trash2,
  Server,
  Cpu,
  ArrowRightLeft,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from '@/components/common/sheet/Sheet';
import { ActionSheet } from '@/components/common/sheet/ActionSheet';
import { cn } from '@/lib/utils';
import { formatDate } from '@/shared/utils/date-utils';
import {
  useGroupNodes,
  useGroupForwardAgents,
  useGroupForwardRules,
} from '../hooks/useResourceGroups';
import type { ResourceGroup, ResourceGroupStatus } from '@/api/resource/types';
import type { SubscriptionPlan, PlanType } from '@/api/subscription/types';

// ============================================================================
// Types
// ============================================================================

export interface ResourceGroupDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: ResourceGroup | null;
  plansMap?: Record<string, SubscriptionPlan>;
  onEdit: (group: ResourceGroup) => void;
  onDelete: (group: ResourceGroup) => void;
  onToggleStatus: (group: ResourceGroup) => void;
}

// ============================================================================
// Constants
// ============================================================================

const STATUS_CONFIG: Record<
  ResourceGroupStatus,
  { labelKey: string; colorClass: string }
> = {
  active: { labelKey: 'resourceGroups.status.active', colorClass: 'text-success' },
  inactive: { labelKey: 'resourceGroups.status.inactive', colorClass: 'text-muted-foreground' },
};

const PLAN_TYPE_LABEL_KEYS: Record<PlanType, string> = {
  node: 'resourceGroups.planTypes.node',
  forward: 'resourceGroups.planTypes.forward',
  hybrid: 'resourceGroups.planTypes.hybrid',
};

// ============================================================================
// Helper Components - Tailwind Application UI Style
// ============================================================================

/**
 * Section container - minimal spacing with dl structure
 */
const DetailSection = ({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn('', className)}>
    <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1">
      {title}
    </h3>
    <div className="overflow-hidden rounded-lg bg-card border border-border">
      <dl className="divide-y divide-border">{children}</dl>
    </div>
  </div>
);

/**
 * Compact row - inline label and value with optional copy
 */
const DetailRow = ({
  icon,
  label,
  value,
  mono = false,
  copyable = false,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  copyable?: boolean;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof value === 'string') {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 min-h-[44px]">
      <dt className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
        {icon && <span className="text-muted-foreground/60">{icon}</span>}
        {label}
      </dt>
      <dd className="flex items-center gap-1.5 text-sm text-foreground min-w-0">
        <span className={cn('truncate', mono && 'font-mono text-xs')}>
          {value}
        </span>
        {copyable && typeof value === 'string' && (
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 p-1 -mr-1 rounded hover:bg-muted transition-colors touch-target"
          >
            {copied ? (
              <Check className="size-3.5 text-success" />
            ) : (
              <Copy className="size-3.5 text-muted-foreground/50" />
            )}
          </button>
        )}
      </dd>
    </div>
  );
};

/**
 * Statistics card for member counts - compact inline style
 */
const StatCard = ({
  icon,
  label,
  value,
  isLoading,
  colorClass,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  isLoading: boolean;
  colorClass: string;
  unit: string;
}) => (
  <div className="flex items-center gap-3 px-3 py-2.5 min-h-[44px]">
    <div className={cn('size-8 rounded-lg flex items-center justify-center shrink-0', colorClass)}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium tabular-nums">
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          `${value} ${unit}`
        )}
      </div>
    </div>
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

export const ResourceGroupDetailSheet = ({
  open,
  onOpenChange,
  group,
  plansMap = {},
  onEdit,
  onDelete,
  onToggleStatus,
}: ResourceGroupDetailSheetProps) => {
  const { t } = useTranslation();
  const [actionSheetOpen, setActionSheetOpen] = useState(false);

  // Fetch member counts
  const { pagination: nodesPagination, isLoading: isLoadingNodes } = useGroupNodes({
    groupId: open && group ? group.sid : null,
    pageSize: 1,
    enabled: open && !!group,
  });

  const { pagination: agentsPagination, isLoading: isLoadingAgents } = useGroupForwardAgents({
    groupId: open && group ? group.sid : null,
    pageSize: 1,
    enabled: open && !!group,
  });

  const { pagination: rulesPagination, isLoading: isLoadingRules } = useGroupForwardRules({
    groupId: open && group ? group.sid : null,
    pageSize: 1,
    enabled: open && !!group,
  });

  if (!group) return null;

  const statusConfig = STATUS_CONFIG[group.status] || {
    labelKey: 'resourceGroups.status.inactive',
    colorClass: 'text-muted-foreground',
  };
  const plan = plansMap[group.planId];
  const planType = plan?.planType;

  // Business logic: determine which resources can be bound based on plan type
  const canBindNodes = planType !== 'forward';
  const canBindAgents = planType === 'forward';
  const canBindRules = planType !== 'forward';

  // Action Sheet actions
  const moreActions = [
    {
      label: group.status === 'active'
        ? t('resourceGroups.actions.disableGroup')
        : t('resourceGroups.actions.enableGroup'),
      icon: group.status === 'active' ? (
        <PowerOff className="size-5" />
      ) : (
        <Power className="size-5" />
      ),
      onPress: async () => {
        onToggleStatus(group);
        onOpenChange(false);
      },
      variant: 'default' as const,
    },
    {
      label: t('resourceGroups.actions.deleteGroup'),
      icon: <Trash2 className="size-5" />,
      onPress: async () => {
        onDelete(group);
        onOpenChange(false);
      },
      variant: 'destructive' as const,
    },
  ];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent showClose>
          {/* Compact Header - Core status only */}
          <SheetHeader>
            <div className="flex items-center gap-3">
              {/* Icon with status indicator */}
              <div className="relative shrink-0">
                <div className="size-11 rounded-xl flex items-center justify-center bg-primary/10">
                  <Layers className="size-5 text-primary" />
                </div>
                {/* Status dot */}
                <span
                  className={cn(
                    'absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-background',
                    group.status === 'active' ? 'bg-success' : 'bg-muted-foreground/30'
                  )}
                />
              </div>

              {/* Title and status */}
              <div className="flex-1 min-w-0">
                <SheetTitle className="truncate">{group.name}</SheetTitle>
                <SheetDescription className="flex items-center gap-2 mt-0.5">
                  <span className={cn('text-xs', statusConfig.colorClass)}>
                    {t(statusConfig.labelKey)}
                  </span>
                  <span className="text-border">·</span>
                  <span className="font-mono text-xs text-muted-foreground">{group.sid}</span>
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <SheetBody className="space-y-4 pb-4">
            {/* Basic Info */}
            <DetailSection title={t('resourceGroups.tabs.basicInfo')}>
              <DetailRow
                icon={<Hash className="size-3.5" />}
                label={t('common.labels.sid')}
                value={group.sid}
                mono
                copyable
              />
              <DetailRow
                icon={<Layers className="size-3.5" />}
                label={t('common.fields.name')}
                value={group.name}
              />
              {group.description && (
                <DetailRow
                  icon={<FileText className="size-3.5" />}
                  label={t('common.fields.description')}
                  value={group.description}
                />
              )}
            </DetailSection>

            {/* Associated Plan */}
            <DetailSection title={t('resourceGroups.sections.associatedPlan')}>
              {plan ? (
                <div className="px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-info/10 flex items-center justify-center shrink-0">
                      <CreditCard className="size-4 text-info" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{plan.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-xs text-muted-foreground">{plan.slug}</span>
                        {planType && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                            {t(PLAN_TYPE_LABEL_KEYS[planType])}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <DetailRow
                  icon={<CreditCard className="size-3.5" />}
                  label={t('resourceGroups.labels.planId')}
                  value={group.planId}
                  mono
                  copyable
                />
              )}
            </DetailSection>

            {/* Member Statistics */}
            <DetailSection title={t('resourceGroups.sections.memberStats')}>
              {canBindNodes && (
                <StatCard
                  icon={<Server className="size-4 text-primary" />}
                  label={t('resourceGroups.labels.nodeCount')}
                  value={nodesPagination.total}
                  isLoading={isLoadingNodes}
                  colorClass="bg-primary/10"
                  unit={t('resourceGroups.unit')}
                />
              )}
              {canBindAgents && (
                <StatCard
                  icon={<Cpu className="size-4 text-success" />}
                  label={t('resourceGroups.labels.forwardAgentCount')}
                  value={agentsPagination.total}
                  isLoading={isLoadingAgents}
                  colorClass="bg-success/10"
                  unit={t('resourceGroups.unit')}
                />
              )}
              {canBindRules && (
                <StatCard
                  icon={<ArrowRightLeft className="size-4 text-warning" />}
                  label={t('resourceGroups.labels.forwardRuleCount')}
                  value={rulesPagination.total}
                  isLoading={isLoadingRules}
                  colorClass="bg-warning/10"
                  unit={t('resourceGroups.unit')}
                />
              )}
              {/* Show all stats if plan type is unknown */}
              {!planType && (
                <>
                  <StatCard
                    icon={<Server className="size-4 text-primary" />}
                    label={t('resourceGroups.labels.nodeCount')}
                    value={nodesPagination.total}
                    isLoading={isLoadingNodes}
                    colorClass="bg-primary/10"
                    unit={t('resourceGroups.unit')}
                  />
                  <StatCard
                    icon={<Cpu className="size-4 text-success" />}
                    label={t('resourceGroups.labels.forwardAgentCount')}
                    value={agentsPagination.total}
                    isLoading={isLoadingAgents}
                    colorClass="bg-success/10"
                    unit={t('resourceGroups.unit')}
                  />
                  <StatCard
                    icon={<ArrowRightLeft className="size-4 text-warning" />}
                    label={t('resourceGroups.labels.forwardRuleCount')}
                    value={rulesPagination.total}
                    isLoading={isLoadingRules}
                    colorClass="bg-warning/10"
                    unit={t('resourceGroups.unit')}
                  />
                </>
              )}
            </DetailSection>

            {/* Timestamps - compact row */}
            <DetailSection title={t('resourceGroups.sections.timeInfo')}>
              <div className="px-3 py-2.5 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <span className="text-muted-foreground">{t('common.fields.createdAt')}</span>
                  <p className="text-foreground font-medium">{formatDate(group.createdAt)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('common.fields.updatedAt')}</span>
                  <p className="text-foreground font-medium">{formatDate(group.updatedAt)}</p>
                </div>
              </div>
            </DetailSection>
          </SheetBody>

          {/* Footer Actions - Compact button group */}
          <SheetFooter>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onEdit(group);
                  onOpenChange(false);
                }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5',
                  'h-11 rounded-lg',
                  'bg-primary text-primary-foreground',
                  'text-sm font-medium',
                  'active:opacity-80 transition-opacity'
                )}
              >
                <Edit className="size-4" />
                {t('common.actions.edit')}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (group.status === 'active') {
                    onToggleStatus(group);
                  } else {
                    onToggleStatus(group);
                  }
                  onOpenChange(false);
                }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5',
                  'h-11 rounded-lg',
                  'text-sm font-medium',
                  'border',
                  'active:opacity-80 transition-opacity',
                  group.status === 'active'
                    ? 'border-warning/50 bg-warning/10 text-warning'
                    : 'border-success/50 bg-success/10 text-success'
                )}
              >
                {group.status === 'active' ? (
                  <>
                    <PowerOff className="size-4" />
                    {t('common.actions.disable')}
                  </>
                ) : (
                  <>
                    <Power className="size-4" />
                    {t('common.actions.enable')}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActionSheetOpen(true)}
                className={cn(
                  'size-11 rounded-lg shrink-0',
                  'flex items-center justify-center',
                  'bg-muted text-muted-foreground',
                  'active:opacity-80 transition-opacity'
                )}
              >
                <MoreHorizontal className="size-5" />
              </button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* More Actions ActionSheet */}
      <ActionSheet
        open={actionSheetOpen}
        onOpenChange={setActionSheetOpen}
        actions={moreActions}
        title={t('common.moreActions')}
      />
    </>
  );
};

ResourceGroupDetailSheet.displayName = 'ResourceGroupDetailSheet';
