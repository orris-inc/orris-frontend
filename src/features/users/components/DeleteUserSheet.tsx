/**
 * Delete User Confirmation Sheet
 * Mobile-optimized bottom sheet for confirming user deletion
 */

import { useState } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
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
import type { UserResponse } from '@/api/user';

interface DeleteUserSheetProps extends DeleteSheetProps<UserResponse> {}

export const DeleteUserSheet: React.FC<DeleteUserSheetProps> = ({
  open,
  onOpenChange,
  entity: user,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirm = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await onConfirm(user);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <div className="size-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="size-5 text-destructive" />
              </div>
              <span>删除用户</span>
            </SheetTitle>
            <SheetDescription>
              此操作不可恢复，请确认是否继续
            </SheetDescription>
          </SheetHeader>

          <SheetBody className="py-4">
            {/* Warning Card */}
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-destructive">确认删除以下用户？</p>
                  <p className="text-sm text-muted-foreground">
                    删除后，该用户的所有数据将被永久移除，无法恢复。
                  </p>
                </div>
              </div>

              {/* User Info */}
              <div className="rounded-lg bg-background p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">用户名</span>
                  <span className="font-medium">{user.name || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">邮箱</span>
                  <span className="font-medium text-sm">{user.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">状态</span>
                  <span className="font-medium">{user.status}</span>
                </div>
              </div>
            </div>
          </SheetBody>

          <SheetFooter>
            {/* Destructive action first on mobile */}
            <Button
              variant="destructive"
              onClick={() => setConfirmOpen(true)}
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
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full min-h-[44px]"
            >
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
        description="删除后无法恢复"
        confirmText="确认删除"
        onConfirm={handleConfirm}
      />
    </>
  );
};
