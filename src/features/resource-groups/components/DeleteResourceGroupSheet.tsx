/**
 * Delete Resource Group Confirmation Sheet
 * Mobile-optimized bottom sheet for confirming resource group deletion
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
} from '@/components/common/Sheet';
import { Button } from '@/components/common/Button';
import type { ResourceGroup } from '@/api/resource/types';

interface DeleteResourceGroupSheetProps {
  open: boolean;
  resourceGroup: ResourceGroup | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export const DeleteResourceGroupSheet: React.FC<DeleteResourceGroupSheetProps> = ({
  open,
  resourceGroup,
  onClose,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!resourceGroup) return;

    setLoading(true);
    try {
      await onConfirm(resourceGroup.sid);
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

  if (!resourceGroup) return null;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="size-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Trash2 className="size-5 text-destructive" />
            </div>
            <span>删除资源组</span>
          </SheetTitle>
          <SheetDescription>
            此操作不可撤销，请确认是否删除此资源组
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="py-6">
          {/* Warning Card */}
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-destructive">确认删除以下资源组？</p>
                <p className="text-sm text-muted-foreground">
                  删除后，该资源组的所有配置将被永久移除，无法恢复。
                </p>
              </div>
            </div>

            {/* Resource Group Info */}
            <div className="rounded-lg bg-background p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">资源组名称</span>
                <span className="font-medium">{resourceGroup.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">SID</span>
                <span className="font-mono text-xs">{resourceGroup.sid}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">状态</span>
                <span className="font-medium">
                  {resourceGroup.status === 'active' ? '已激活' : '已停用'}
                </span>
              </div>
            </div>

            {/* Additional Warning */}
            <p className="text-xs text-muted-foreground">
              如果此资源组已关联资源，删除操作将失败。
            </p>
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
