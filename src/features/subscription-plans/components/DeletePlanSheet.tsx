/**
 * Delete Subscription Plan Confirmation Sheet
 * Mobile-optimized bottom sheet for confirming plan deletion
 */

import { useState } from 'react';
import { Trash2, AlertTriangle, Loader2, CreditCard, Globe, Lock, CheckCircle2, XCircle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from '@/components/common/Sheet';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import type { SubscriptionPlan } from '@/api/subscription/types';

interface DeletePlanSheetProps {
  open: boolean;
  plan: SubscriptionPlan | null;
  onClose: () => void;
  onConfirm: (plan: SubscriptionPlan) => Promise<void>;
}

const PLAN_TYPE_LABELS: Record<string, string> = {
  node: '节点订阅',
  forward: '端口转发',
  hybrid: '混合订阅',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active: {
    label: '已激活',
    color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
    icon: <CheckCircle2 className="size-3.5" />,
  },
  inactive: {
    label: '已停用',
    color: 'text-gray-600 bg-gray-100 dark:bg-gray-800',
    icon: <XCircle className="size-3.5" />,
  },
};

export const DeletePlanSheet: React.FC<DeletePlanSheetProps> = ({
  open,
  plan,
  onClose,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!plan) return;

    setLoading(true);
    try {
      await onConfirm(plan);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!plan) return null;

  const statusConfig = STATUS_CONFIG[plan.status] || STATUS_CONFIG.inactive;

  // Format price range for display
  const formatPriceRange = () => {
    if (!plan.pricings || plan.pricings.length === 0) return '暂无定价';
    const prices = plan.pricings.filter((p) => p.isActive).map((p) => p.price / 100);
    if (prices.length === 0) return '暂无定价';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return `¥${min}`;
    return `¥${min} - ¥${max}`;
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="size-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Trash2 className="size-5 text-destructive" />
            </div>
            <span>删除订阅计划</span>
          </SheetTitle>
          <SheetDescription>此操作不可恢复，请确认是否继续</SheetDescription>
        </SheetHeader>

        <SheetBody className="py-6">
          {/* Warning Card */}
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-destructive">确认删除以下订阅计划？</p>
                <p className="text-sm text-muted-foreground">
                  删除后，该计划将被永久移除。注意：只有无活跃订阅的计划才能删除。
                </p>
              </div>
            </div>

            {/* Plan Info */}
            <div className="rounded-lg bg-background p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">计划名称</span>
                <span className="font-medium">{plan.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Slug</span>
                <span className="font-mono text-sm">{plan.slug}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">计划类型</span>
                <div className="flex items-center gap-1.5">
                  <CreditCard className="size-4 text-muted-foreground" />
                  <span className="text-sm">{PLAN_TYPE_LABELS[plan.planType] || plan.planType}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">可见性</span>
                <div className="flex items-center gap-1.5">
                  {plan.isPublic ? (
                    <>
                      <Globe className="size-4 text-blue-500" />
                      <span className="text-sm">公开</span>
                    </>
                  ) : (
                    <>
                      <Lock className="size-4 text-yellow-500" />
                      <span className="text-sm">私有</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">状态</span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                    statusConfig.color
                  )}
                >
                  {statusConfig.icon}
                  {statusConfig.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">价格范围</span>
                <span className="font-medium">{formatPriceRange()}</span>
              </div>
            </div>
          </div>
        </SheetBody>

        <SheetFooter>
          {/* Destructive action first on mobile */}
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
            className="w-full min-h-[52px] text-base"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" />
                删除中...
              </>
            ) : (
              '确认删除'
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
            className="w-full min-h-[44px]"
          >
            取消
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
