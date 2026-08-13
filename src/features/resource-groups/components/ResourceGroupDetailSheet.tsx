import { SmartTruncate } from '@/components/common/SmartTruncate';

/**
 * ResourceGroupDetailSheet - Mobile resource group details with member management
 *
 * Design: Tailwind Application UI style
 * - Stacked layout with description lists
 * - Card sections with dividers
 * - Hero header with status indicator
 * - Interactive member lists with add/remove actions
 *
 * Features:
 * - Full resource group details in a bottom sheet
 * - Associated plan information
 * - Member management (nodes, forward agents, forward rules)
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
  Plus,
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
  useGroupMemberManagement,
} from '../hooks/useResourceGroups';
import { AddMembersDialog } from './AddMembersDialog';
import { SubscriptionOrderList } from './SubscriptionOrderList';
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
 * Member section - header with count + add button, member list, empty state
 */
interface MemberItem {
  id: string;
  name: string;
  status: string;
}

interface MemberSectionProps<T extends MemberItem> {
  icon: React.ReactNode;
  label: string;
  total: number;
  isLoading: boolean;
  colorClass: string;
  iconColorClass: string;
  items: T[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  isRemoving: boolean;
  emptyText: string;
  addText: string;
  renderSubline?: (item: T) => string;
  statusBadge: (status: string) => { label: string; active: boolean };
}

const MemberSection = <T extends MemberItem>({
  icon,
  label,
  total,
  isLoading,
  colorClass,
  iconColorClass,
  items,
  onAdd,
  onRemove,
  isRemoving,
  emptyText,
  addText,
  renderSubline,
  statusBadge,
}: MemberSectionProps<T>) => {
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    try {
      await onRemove(id);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <div className={cn('size-6 rounded-md flex items-center justify-center shrink-0', colorClass)}>
            {icon}
          </div>
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </span>
          {!isLoading && (
            <span className="text-[11px] text-muted-foreground/60 tabular-nums">
              ({total})
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onAdd}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1 rounded-md',
            'text-xs font-medium',
            iconColorClass,
            colorClass,
            'active:opacity-80 transition-opacity',
            'min-h-[32px]'
          )}
        >
          <Plus className="size-3.5" />
          {addText}
        </button>
      </div>

      {/* Content */}
      <div className="overflow-hidden rounded-lg bg-card border border-border">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
            <div className={cn('size-10 rounded-xl flex items-center justify-center mb-2', colorClass)}>
              {icon}
            </div>
            <p className="text-xs">{emptyText}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => {
              const badge = statusBadge(item.status);
              return (
                <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 min-h-[44px]">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <SmartTruncate text={item.name} className="text-sm font-medium" />
                      <span className={cn(
                        'shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium',
                        badge.active
                          ? 'bg-success/10 text-success'
                          : 'bg-muted text-muted-foreground'
                      )}>
                        {badge.label}
                      </span>
                    </div>
                    <SmartTruncate text={renderSubline ? renderSubline(item) : item.id} mono className="text-xs text-muted-foreground mt-0.5" font="12px 'SF Mono', ui-monospace, monospace" lineHeight={16} />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    disabled={isRemoving}
                    className={cn(
                      'shrink-0 p-2 -mr-1 rounded-md',
                      'text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10',
                      'active:opacity-80 transition-colors',
                      'disabled:opacity-50',
                      'min-h-[36px] min-w-[36px] flex items-center justify-center'
                    )}
                  >
                    {removingId === item.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

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
  const [addNodesOpen, setAddNodesOpen] = useState(false);
  const [addAgentsOpen, setAddAgentsOpen] = useState(false);
  const [addRulesOpen, setAddRulesOpen] = useState(false);

  // Fetch member lists
  const { nodes, pagination: nodesPagination, isLoading: isLoadingNodes, refetch: refetchNodes } = useGroupNodes({
    groupId: open && group ? group.sid : null,
    pageSize: 50,
    enabled: open && !!group,
  });

  const { forwardAgents, pagination: agentsPagination, isLoading: isLoadingAgents, refetch: refetchAgents } = useGroupForwardAgents({
    groupId: open && group ? group.sid : null,
    pageSize: 50,
    enabled: open && !!group,
  });

  const { forwardRules, pagination: rulesPagination, isLoading: isLoadingRules, refetch: refetchRules } = useGroupForwardRules({
    groupId: open && group ? group.sid : null,
    pageSize: 50,
    enabled: open && !!group,
  });

  // Member management
  const {
    addNodes,
    removeNodes,
    addAgents,
    removeAgents,
    addRules,
    removeRules,
    isAddingNodes,
    isRemovingNodes,
    isAddingAgents,
    isRemovingAgents,
    isAddingRules,
    isRemovingRules,
  } = useGroupMemberManagement(group?.sid ?? null);

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

  // Add member handlers
  const handleAddNodes = async (nodeIds: string[]) => {
    await addNodes(nodeIds);
    setAddNodesOpen(false);
    refetchNodes();
  };

  const handleAddAgents = async (agentIds: string[]) => {
    await addAgents(agentIds);
    setAddAgentsOpen(false);
    refetchAgents();
  };

  const handleAddRules = async (ruleIds: string[]) => {
    await addRules(ruleIds);
    setAddRulesOpen(false);
    refetchRules();
  };

  // Remove member handlers
  const handleRemoveNode = async (id: string) => {
    await removeNodes([id]);
    refetchNodes();
  };

  const handleRemoveAgent = async (id: string) => {
    await removeAgents([id]);
    refetchAgents();
  };

  const handleRemoveRule = async (id: string) => {
    await removeRules([id]);
    refetchRules();
  };

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

  // Determine which member sections to render
  const showNodes = canBindNodes || !planType;
  const showAgents = canBindAgents || !planType;
  const showRules = canBindRules || !planType;

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
                <SheetTitle><SmartTruncate text={group.name} /></SheetTitle>
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
                      <SmartTruncate text={plan.name} className="text-sm font-medium" />
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

            {/* Members */}
            {showNodes && (
              <MemberSection
                icon={<Server className="size-3.5 text-primary" />}
                label={t('resourceGroups.labels.nodeCount')}
                total={nodesPagination.total}
                isLoading={isLoadingNodes}
                colorClass="bg-primary/10"
                iconColorClass="text-primary"
                items={nodes}
                onAdd={() => setAddNodesOpen(true)}
                onRemove={handleRemoveNode}
                isRemoving={isRemovingNodes}
                emptyText={t('resourceGroups.empty.noNodes')}
                addText={t('resourceGroups.actions.addNode')}
                statusBadge={(status) => ({
                  label: status === 'active' ? t('common.status.enabled') : t('common.status.disabled'),
                  active: status === 'active',
                })}
              />
            )}

            {showAgents && (
              <MemberSection
                icon={<Cpu className="size-3.5 text-success" />}
                label={t('resourceGroups.labels.forwardAgentCount')}
                total={agentsPagination.total}
                isLoading={isLoadingAgents}
                colorClass="bg-success/10"
                iconColorClass="text-success"
                items={forwardAgents}
                onAdd={() => setAddAgentsOpen(true)}
                onRemove={handleRemoveAgent}
                isRemoving={isRemovingAgents}
                emptyText={t('resourceGroups.empty.noAgents')}
                addText={t('resourceGroups.actions.addForwardAgent')}
                statusBadge={(status) => ({
                  label: status === 'enabled' ? t('common.status.enabled') : t('common.status.disabled'),
                  active: status === 'enabled',
                })}
              />
            )}

            {showRules && (
              <MemberSection
                icon={<ArrowRightLeft className="size-3.5 text-warning" />}
                label={t('resourceGroups.labels.forwardRuleCount')}
                total={rulesPagination.total}
                isLoading={isLoadingRules}
                colorClass="bg-warning/10"
                iconColorClass="text-warning"
                items={forwardRules}
                onAdd={() => setAddRulesOpen(true)}
                onRemove={handleRemoveRule}
                isRemoving={isRemovingRules}
                emptyText={t('resourceGroups.empty.noRules')}
                addText={t('resourceGroups.actions.addForwardRule')}
                renderSubline={(item) =>
                  item.protocol && item.listenPort
                    ? `${item.protocol.toUpperCase()}:${item.listenPort} · ${item.id}`
                    : item.id
                }
                statusBadge={(status) => ({
                  label: status === 'enabled' ? t('common.status.enabled') : t('common.status.stopped'),
                  active: status === 'enabled',
                })}
              />
            )}

            {/* Subscription order - direct nodes and forward rules share one sequence */}
            {showNodes && showRules && (
              <div>
                <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1">
                  {t('resourceGroups.tabs.subscriptionOrder')}
                </h3>
                <div className="rounded-lg bg-card border border-border p-3">
                  <SubscriptionOrderList groupId={group.sid} enabled={open} />
                </div>
              </div>
            )}

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

      {/* Add members dialogs */}
      {showNodes && (
        <AddMembersDialog
          open={addNodesOpen}
          type="nodes"
          groupName={group.name}
          existingMemberIds={nodes.map((n) => n.id)}
          onClose={() => setAddNodesOpen(false)}
          onSubmit={handleAddNodes}
          isSubmitting={isAddingNodes}
        />
      )}

      {showAgents && (
        <AddMembersDialog
          open={addAgentsOpen}
          type="agents"
          groupName={group.name}
          existingMemberIds={forwardAgents.map((a) => a.id)}
          onClose={() => setAddAgentsOpen(false)}
          onSubmit={handleAddAgents}
          isSubmitting={isAddingAgents}
        />
      )}

      {showRules && (
        <AddMembersDialog
          open={addRulesOpen}
          type="rules"
          groupName={group.name}
          existingMemberIds={forwardRules.map((r) => r.id)}
          onClose={() => setAddRulesOpen(false)}
          onSubmit={handleAddRules}
          isSubmitting={isAddingRules}
        />
      )}
    </>
  );
};

ResourceGroupDetailSheet.displayName = 'ResourceGroupDetailSheet';
