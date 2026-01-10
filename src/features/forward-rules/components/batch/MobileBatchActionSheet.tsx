/**
 * MobileBatchActionSheet - Mobile batch action bottom sheet
 *
 * A Vaul-powered bottom sheet for batch operations on mobile devices.
 * Features:
 * - iOS-style action list
 * - Touch-friendly buttons (min 44px)
 * - Loading states for each action
 * - Safe area support
 */

import { Power, PowerOff, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
} from '@/components/common/sheet';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';

interface MobileBatchActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onBatchDelete: () => void;
  onBatchEnable: () => void;
  onBatchDisable: () => void;
  onBatchUpdate: () => void;
  onClearSelection: () => void;
  isDeleting?: boolean;
  isTogglingStatus?: boolean;
  isUpdating?: boolean;
}

export const MobileBatchActionSheet: React.FC<MobileBatchActionSheetProps> = ({
  open,
  onOpenChange,
  selectedCount,
  onBatchDelete,
  onBatchEnable,
  onBatchDisable,
  onBatchUpdate,
  onClearSelection,
  isDeleting = false,
  isTogglingStatus = false,
  isUpdating = false,
}) => {
  const isLoading = isDeleting || isTogglingStatus || isUpdating;

  const handleClearSelection = () => {
    onClearSelection();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !isLoading && onOpenChange(o)}>
      <SheetContent showClose={false} keyboardAware={false}>
        <SheetHeader>
          <SheetTitle className="text-center">
            <span className="text-muted-foreground">已选择 </span>
            <span className="text-primary font-semibold">{selectedCount}</span>
            <span className="text-muted-foreground"> 条规则</span>
          </SheetTitle>
        </SheetHeader>

        <SheetBody className="py-4">
          <div className="space-y-2">
            {/* Enable action */}
            <button
              type="button"
              onClick={onBatchEnable}
              disabled={isLoading}
              className={cn(
                'w-full min-h-[44px] px-4 py-3',
                'flex items-center gap-3',
                'rounded-lg border border-border',
                'bg-background hover:bg-accent',
                'text-foreground text-left',
                'transition-colors duration-150',
                'touch-manipulation',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isTogglingStatus ? (
                <Loader2 className="size-5 text-primary animate-spin" />
              ) : (
                <Power className="size-5 text-primary" />
              )}
              <span className="flex-1 font-medium">启用所选规则</span>
            </button>

            {/* Disable action */}
            <button
              type="button"
              onClick={onBatchDisable}
              disabled={isLoading}
              className={cn(
                'w-full min-h-[44px] px-4 py-3',
                'flex items-center gap-3',
                'rounded-lg border border-border',
                'bg-background hover:bg-accent',
                'text-foreground text-left',
                'transition-colors duration-150',
                'touch-manipulation',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isTogglingStatus ? (
                <Loader2 className="size-5 text-muted-foreground animate-spin" />
              ) : (
                <PowerOff className="size-5 text-muted-foreground" />
              )}
              <span className="flex-1 font-medium">禁用所选规则</span>
            </button>

            {/* Update action */}
            <button
              type="button"
              onClick={onBatchUpdate}
              disabled={isLoading}
              className={cn(
                'w-full min-h-[44px] px-4 py-3',
                'flex items-center gap-3',
                'rounded-lg border border-border',
                'bg-background hover:bg-accent',
                'text-foreground text-left',
                'transition-colors duration-150',
                'touch-manipulation',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isUpdating ? (
                <Loader2 className="size-5 text-primary animate-spin" />
              ) : (
                <Pencil className="size-5 text-primary" />
              )}
              <span className="flex-1 font-medium">批量更新</span>
            </button>

            {/* Delete action */}
            <button
              type="button"
              onClick={onBatchDelete}
              disabled={isLoading}
              className={cn(
                'w-full min-h-[44px] px-4 py-3',
                'flex items-center gap-3',
                'rounded-lg border border-destructive/30',
                'bg-destructive/5 hover:bg-destructive/10',
                'text-destructive text-left',
                'transition-colors duration-150',
                'touch-manipulation',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isDeleting ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Trash2 className="size-5" />
              )}
              <span className="flex-1 font-medium">删除所选规则</span>
            </button>
          </div>
        </SheetBody>

        <SheetFooter>
          <Button
            variant="ghost"
            onClick={handleClearSelection}
            disabled={isLoading}
            className="w-full min-h-[44px] gap-2"
          >
            <X className="size-4" />
            取消选择
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

MobileBatchActionSheet.displayName = 'MobileBatchActionSheet';
