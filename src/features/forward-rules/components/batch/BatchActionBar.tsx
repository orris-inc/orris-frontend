/**
 * BatchActionBar - Desktop batch action toolbar
 *
 * Displays a floating toolbar when multiple items are selected.
 * Positioned above the data table with glass morphism effect.
 */

import { Power, PowerOff, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';

interface BatchActionBarProps {
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

export const BatchActionBar: React.FC<BatchActionBarProps> = ({
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

  return (
    <div className="@container flex items-center justify-between gap-3 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Left: Selected count */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">已选择</span>
        <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold tabular-nums">
          {selectedCount}
        </span>
        <span className="text-muted-foreground hidden @sm:inline">条规则</span>
      </div>

      {/* Center: Action buttons */}
      <div className="flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onBatchEnable}
              disabled={isLoading}
              className="h-8 px-2.5 gap-1.5 border-green-500/30 hover:border-green-500/50 hover:bg-green-500/10"
            >
              {isTogglingStatus ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Power className="size-3.5 text-green-500" />
              )}
              <span className="hidden @lg:inline text-green-600 dark:text-green-400">启用</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>启用选中的规则</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onBatchDisable}
              disabled={isLoading}
              className="h-8 px-2.5 gap-1.5 border-orange-500/30 hover:border-orange-500/50 hover:bg-orange-500/10"
            >
              {isTogglingStatus ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <PowerOff className="size-3.5 text-orange-500" />
              )}
              <span className="hidden @lg:inline text-orange-600 dark:text-orange-400">禁用</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>禁用选中的规则</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onBatchUpdate}
              disabled={isLoading}
              className="h-8 px-2.5 gap-1.5 border-blue-500/30 hover:border-blue-500/50 hover:bg-blue-500/10"
            >
              {isUpdating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Pencil className="size-3.5 text-blue-500" />
              )}
              <span className="hidden @lg:inline text-blue-600 dark:text-blue-400">更新</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>批量更新名称、备注或排序</TooltipContent>
        </Tooltip>

        <div className="w-px h-5 bg-border mx-1 hidden @sm:block" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onBatchDelete}
              disabled={isLoading}
              className="h-8 px-2.5 gap-1.5 border-destructive/30 hover:border-destructive/50 hover:bg-destructive/10"
            >
              {isDeleting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5 text-destructive" />
              )}
              <span className="hidden @lg:inline text-destructive">删除</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>删除选中的规则</TooltipContent>
        </Tooltip>
      </div>

      {/* Right: Clear selection button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isLoading}
            className="h-8 px-2.5 gap-1.5"
          >
            <X className="size-3.5" />
            <span className="hidden @sm:inline">取消</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>取消选择</TooltipContent>
      </Tooltip>
    </div>
  );
};
