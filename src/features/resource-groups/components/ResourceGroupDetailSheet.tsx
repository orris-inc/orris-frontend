/**
 * ResourceGroupDetailSheet - Mobile resource group details with actions
 *
 * Features:
 * - Full resource group details in a bottom sheet
 * - Associated plan information
 * - Member statistics (nodes, forward agents, forward rules)
 * - Primary actions in footer
 * - ActionSheet for secondary actions
 * - iOS-style design
 */

import { useState } from 'react';
import {
  Layers,
  Hash,
  FileText,
  CreditCard,
  Calendar,
  Activity,
  Edit,
  MoreHorizontal,
  Power,
  PowerOff,
  Trash2,
  Server,
  Cpu,
  ArrowRightLeft,
  Loader2,
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
import { AdminBadge } from '@/components/admin';
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
  { label: string; variant: 'success' | 'default' }
> = {
  active: { label: '激活', variant: 'success' },
  inactive: { label: '未激活', variant: 'default' },
};

const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  node: '节点计划',
  forward: '转发计划',
  hybrid: '混合计划',
};

// ============================================================================
// Helper Components
// ============================================================================

const DetailSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
      {title}
    </h4>
    <div className="rounded-xl bg-muted/30 border border-border/50 divide-y divide-border/30">
      {children}
    </div>
  </div>
);

const DetailRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-center gap-3 px-3 py-2.5">
    <div className="text-muted-foreground">{icon}</div>
    <div className="flex-1 min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  </div>
);

/**
 * Statistics card for member counts
 */
const StatCard = ({
  icon,
  label,
  value,
  isLoading,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  isLoading: boolean;
  colorClass: string;
}) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
    <div className={cn('size-8 rounded-lg flex items-center justify-center', colorClass)}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          `${value} 个`
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

  const statusConfig = STATUS_CONFIG[group.status] || { label: '未知', variant: 'default' as const };
  const plan = plansMap[group.planId];
  const planType = plan?.planType;

  // Business logic: determine which resources can be bound based on plan type
  const canBindNodes = planType !== 'forward';
  const canBindAgents = planType === 'forward';
  const canBindRules = planType !== 'forward';

  // Action Sheet actions
  const moreActions = [
    {
      label: group.status === 'active' ? '停用资源组' : '启用资源组',
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
      label: '删除资源组',
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
          <SheetHeader>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'size-12 rounded-xl flex items-center justify-center',
                  'bg-primary/10 text-primary'
                )}
              >
                <Layers className="size-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <SheetTitle className="truncate">{group.name}</SheetTitle>
                  <AdminBadge variant={statusConfig.variant} className="text-[10px] px-1.5 py-0 shrink-0">
                    {statusConfig.label}
                  </AdminBadge>
                </div>
                <SheetDescription>
                  <span className="font-mono text-xs">{group.sid}</span>
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <SheetBody className="space-y-4 pb-4">
            {/* Basic Info */}
            <DetailSection title="基本信息">
              <DetailRow
                icon={<Hash className="size-4" />}
                label="SID"
                value={<span className="font-mono text-xs">{group.sid}</span>}
              />
              <DetailRow
                icon={<Layers className="size-4" />}
                label="名称"
                value={group.name}
              />
              {group.description && (
                <DetailRow
                  icon={<FileText className="size-4" />}
                  label="描述"
                  value={group.description}
                />
              )}
            </DetailSection>

            {/* Associated Plan */}
            <DetailSection title="关联套餐">
              {plan ? (
                <div className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-info/10 flex items-center justify-center">
                      <CreditCard className="size-5 text-info" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{plan.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-xs text-muted-foreground">{plan.slug}</span>
                        {planType && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {PLAN_TYPE_LABELS[planType]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <DetailRow
                  icon={<CreditCard className="size-4" />}
                  label="套餐 ID"
                  value={<span className="font-mono text-xs">{group.planId}</span>}
                />
              )}
            </DetailSection>

            {/* Member Statistics */}
            <DetailSection title="成员统计">
              <div className="p-3 space-y-2">
                {canBindNodes && (
                  <StatCard
                    icon={<Server className="size-4 text-primary" />}
                    label="节点数量"
                    value={nodesPagination.total}
                    isLoading={isLoadingNodes}
                    colorClass="bg-primary/10"
                  />
                )}
                {canBindAgents && (
                  <StatCard
                    icon={<Cpu className="size-4 text-success" />}
                    label="转发代理数量"
                    value={agentsPagination.total}
                    isLoading={isLoadingAgents}
                    colorClass="bg-success/10"
                  />
                )}
                {canBindRules && (
                  <StatCard
                    icon={<ArrowRightLeft className="size-4 text-warning" />}
                    label="转发规则数量"
                    value={rulesPagination.total}
                    isLoading={isLoadingRules}
                    colorClass="bg-warning/10"
                  />
                )}
                {/* Show all stats if plan type is unknown */}
                {!planType && (
                  <>
                    <StatCard
                      icon={<Server className="size-4 text-primary" />}
                      label="节点数量"
                      value={nodesPagination.total}
                      isLoading={isLoadingNodes}
                      colorClass="bg-primary/10"
                    />
                    <StatCard
                      icon={<Cpu className="size-4 text-success" />}
                      label="转发代理数量"
                      value={agentsPagination.total}
                      isLoading={isLoadingAgents}
                      colorClass="bg-success/10"
                    />
                    <StatCard
                      icon={<ArrowRightLeft className="size-4 text-warning" />}
                      label="转发规则数量"
                      value={rulesPagination.total}
                      isLoading={isLoadingRules}
                      colorClass="bg-warning/10"
                    />
                  </>
                )}
              </div>
            </DetailSection>

            {/* Timestamps */}
            <DetailSection title="时间信息">
              <DetailRow
                icon={<Calendar className="size-4" />}
                label="创建时间"
                value={formatDate(group.createdAt)}
              />
              <DetailRow
                icon={<Activity className="size-4" />}
                label="更新时间"
                value={formatDate(group.updatedAt)}
              />
            </DetailSection>
          </SheetBody>

          <SheetFooter>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onEdit(group);
                  onOpenChange(false);
                }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2',
                  'h-11 rounded-xl',
                  'bg-primary text-primary-foreground',
                  'text-sm font-medium',
                  'active:scale-[0.97] transition-transform'
                )}
              >
                <Edit className="size-4" />
                编辑
              </button>
              <button
                type="button"
                onClick={() => setActionSheetOpen(true)}
                className={cn(
                  'size-11 rounded-xl shrink-0',
                  'flex items-center justify-center',
                  'bg-muted text-foreground',
                  'active:scale-[0.97] transition-transform'
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
        title="更多操作"
      />
    </>
  );
};

ResourceGroupDetailSheet.displayName = 'ResourceGroupDetailSheet';
