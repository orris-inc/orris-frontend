/**
 * Delete Subscription Confirmation Sheet
 * Mobile-optimized bottom sheet for confirming subscription deletion
 */

import { useState } from 'react';
import { Trash2, AlertTriangle, User, CreditCard, Calendar } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  ConfirmActionSheet,
  type DeleteSheetProps,
} from '@/components/common/sheet';
import { Button } from '@/components/common/Button';
import { TruncatedId } from '@/components/admin';
import { formatDate } from '@/shared/utils/date-utils';
import { cn } from '@/lib/utils';
import type { Subscription, SubscriptionStatus } from '@/api/subscription/types';
import type { UserResponse } from '@/api/user/types';

interface DeleteSubscriptionSheetProps extends DeleteSheetProps<Subscription> {
  user?: UserResponse;
}

// Status configuration
const STATUS_CONFIG: Record<SubscriptionStatus, { label: string; color: string }> = {
  active: { label: '激活', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  renewed: { label: '已续费', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  expired: { label: '已过期', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

export const DeleteSubscriptionSheet: React.FC<DeleteSubscriptionSheetProps> = ({
  open,
  onOpenChange,
  entity: subscription,
  user,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirm = async () => {
    if (!subscription) return;
    setLoading(true);
    try {
      await onConfirm(subscription);
      setConfirmOpen(false);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  if (!subscription) return null;

  const statusConfig = STATUS_CONFIG[subscription.status] || { label: subscription.status, color: 'bg-gray-100 text-gray-600' };

  return (
    <>
    <Sheet open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <SheetContent className="max-h-[95vh]">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-destructive/10 flex items-center justify-center">
              <Trash2 className="size-4 text-destructive" />
            </div>
            <span>删除订阅</span>
          </SheetTitle>
          <SheetDescription className="text-xs">此操作不可恢复，请确认是否继续</SheetDescription>
        </SheetHeader>

        <SheetBody className="py-4">
          {/* Warning Card */}
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-destructive">确认删除以下订阅？</p>
                <p className="text-xs text-muted-foreground">
                  删除后，该订阅将被永久移除，用户将无法再使用此订阅。
                </p>
              </div>
            </div>

            {/* Subscription Info */}
            <div className="rounded-lg bg-background p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">订阅 ID</span>
                <TruncatedId id={subscription.id} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">状态</span>
                <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium', statusConfig.color)}>
                  {statusConfig.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">用户</span>
                <div className="flex items-center gap-1.5 text-sm">
                  <User className="size-3.5 text-muted-foreground" />
                  <span className="truncate max-w-[150px]">
                    {user ? (user.name || user.email) : `ID: ${subscription.userId}`}
                  </span>
                </div>
              </div>
              {subscription.plan && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">计划</span>
                  <div className="flex items-center gap-1.5 text-sm">
                    <CreditCard className="size-3.5 text-muted-foreground" />
                    <span className="truncate max-w-[150px]">{subscription.plan.name}</span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">创建时间</span>
                <div className="flex items-center gap-1.5 text-sm">
                  <Calendar className="size-3.5 text-muted-foreground" />
                  <span>{formatDate(subscription.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </SheetBody>

        <SheetFooter className="pt-3 pb-1">
          <Button
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
            disabled={loading}
            className="w-full min-h-[48px]"
          >
            确认删除
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading} className="w-full min-h-[44px]">
            取消
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>

    <ConfirmActionSheet
      open={confirmOpen}
      onOpenChange={setConfirmOpen}
      variant="destructive"
      title="确认删除？"
      description="删除后将无法恢复"
      confirmText="确认删除"
      onConfirm={handleConfirm}
    />
    </>
  );
};
