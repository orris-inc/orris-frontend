/**
 * PlanDetailSheet - Mobile plan details with actions
 *
 * Features:
 * - Full plan details in a bottom sheet
 * - Primary actions in footer
 * - ActionSheet for secondary actions
 * - iOS-style design
 */

import { useState } from 'react';
import {
  Package,
  Globe,
  Lock,
  Calendar,
  Hash,
  FileText,
  Edit,
  Users,
  MoreHorizontal,
  Copy,
  Power,
  Trash2,
  Zap,
  ArrowLeftRight,
  Layers,
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
import { ACTIVE_STATUS_CONFIG, PLAN_TYPE_CONFIG } from '@/shared/constants/status-config';
import type { SubscriptionPlan, PlanStatus, BillingCycle, PlanType } from '@/api/subscription/types';

// ============================================================================
// Types
// ============================================================================

export interface PlanDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: SubscriptionPlan | null;
  onEdit: (plan: SubscriptionPlan) => void;
  onDuplicate: (plan: SubscriptionPlan) => void;
  onToggleStatus: (plan: SubscriptionPlan) => void;
  onViewSubscriptions: (plan: SubscriptionPlan) => void;
  onDelete: (plan: SubscriptionPlan) => void;
}

// ============================================================================
// Constants
// ============================================================================

const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  weekly: '周付',
  monthly: '月付',
  quarterly: '季付',
  semi_annual: '半年付',
  yearly: '年付',
  lifetime: '终身',
};

const PLAN_TYPE_ICONS: Record<PlanType, React.ReactNode> = {
  node: <Zap className="size-4" />,
  forward: <ArrowLeftRight className="size-4" />,
  hybrid: <Layers className="size-4" />,
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

const PricingItem = ({
  cycle,
  price,
  currency,
  isActive,
}: {
  cycle: BillingCycle;
  price: number;
  currency: string;
  isActive: boolean;
}) => {
  const symbol = currency === 'CNY' ? '¥' : '$';
  const formattedPrice = `${symbol}${(price / 100).toFixed(2)}`;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2.5',
        !isActive && 'opacity-50'
      )}
    >
      <div
        className={cn(
          'size-2 rounded-full',
          isActive ? 'bg-success' : 'bg-muted-foreground'
        )}
      />
      <span className="flex-1 text-sm">
        {BILLING_CYCLE_LABELS[cycle]}
      </span>
      <span className="text-sm font-mono font-medium tabular-nums">
        {formattedPrice}
      </span>
      <AdminBadge variant="outline" className="text-[10px] px-1.5 py-0">
        {currency}
      </AdminBadge>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const PlanDetailSheet = ({
  open,
  onOpenChange,
  plan,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onViewSubscriptions,
  onDelete,
}: PlanDetailSheetProps) => {
  const [actionSheetOpen, setActionSheetOpen] = useState(false);

  if (!plan) return null;

  const status = plan.status as PlanStatus;
  const statusConfig = ACTIVE_STATUS_CONFIG[status] || { label: '未知', variant: 'default' as const };
  const planType = plan.planType as PlanType;
  const typeConfig = PLAN_TYPE_CONFIG[planType] || { label: '未知', variant: 'default' as const };

  // Action Sheet actions
  const moreActions = [
    {
      label: '复制计划',
      icon: <Copy className="size-5" />,
      onPress: async () => {
        onDuplicate(plan);
        onOpenChange(false);
      },
    },
    {
      label: plan.status === 'active' ? '停用计划' : '激活计划',
      icon: <Power className="size-5" />,
      onPress: async () => {
        onToggleStatus(plan);
        onOpenChange(false);
      },
    },
    {
      label: '删除计划',
      icon: <Trash2 className="size-5" />,
      onPress: async () => {
        onDelete(plan);
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
                <Package className="size-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <SheetTitle className="truncate">{plan.name}</SheetTitle>
                  <AdminBadge variant={statusConfig.variant} className="text-[10px] px-1.5 py-0 shrink-0">
                    {statusConfig.label}
                  </AdminBadge>
                </div>
                <SheetDescription className="truncate font-mono text-xs">
                  {plan.slug}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <SheetBody className="space-y-4 pb-4">
            {/* Basic Info */}
            <DetailSection title="基本信息">
              <DetailRow
                icon={PLAN_TYPE_ICONS[planType] || <Package className="size-4" />}
                label="计划类型"
                value={
                  <AdminBadge variant={typeConfig.variant} className="text-xs">
                    {typeConfig.label}
                  </AdminBadge>
                }
              />
              <DetailRow
                icon={plan.isPublic ? <Globe className="size-4" /> : <Lock className="size-4" />}
                label="可见性"
                value={
                  <span className={cn(
                    'inline-flex items-center gap-1.5',
                    plan.isPublic ? 'text-success' : 'text-warning'
                  )}>
                    {plan.isPublic ? (
                      <>
                        <Globe className="size-3.5" />
                        公开
                      </>
                    ) : (
                      <>
                        <Lock className="size-3.5" />
                        私有
                      </>
                    )}
                  </span>
                }
              />
              {plan.trialDays != null && plan.trialDays > 0 && (
                <DetailRow
                  icon={<Calendar className="size-4" />}
                  label="试用期"
                  value={`${plan.trialDays} 天`}
                />
              )}
              <DetailRow
                icon={<Hash className="size-4" />}
                label="计划 ID"
                value={<span className="font-mono text-xs">{plan.id}</span>}
              />
            </DetailSection>

            {/* Pricing */}
            {plan.pricings && plan.pricings.length > 0 && (
              <DetailSection title="计费周期">
                {plan.pricings.map((pricing, idx) => (
                  <PricingItem
                    key={idx}
                    cycle={pricing.billingCycle}
                    price={pricing.price}
                    currency={pricing.currency}
                    isActive={pricing.isActive}
                  />
                ))}
              </DetailSection>
            )}

            {/* Description */}
            {plan.description && (
              <DetailSection title="描述">
                <div className="px-3 py-2.5">
                  <div className="flex items-start gap-3">
                    <FileText className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {plan.description}
                    </p>
                  </div>
                </div>
              </DetailSection>
            )}
          </SheetBody>

          <SheetFooter>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onEdit(plan);
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
                onClick={() => {
                  onViewSubscriptions(plan);
                  onOpenChange(false);
                }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2',
                  'h-11 rounded-xl',
                  'bg-muted text-foreground',
                  'text-sm font-medium',
                  'active:scale-[0.97] transition-transform'
                )}
              >
                <Users className="size-4" />
                查看订阅
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

PlanDetailSheet.displayName = 'PlanDetailSheet';
