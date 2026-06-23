/**
 * BatchActionBar - Desktop batch action toolbar
 *
 * Displays a floating toolbar when multiple items are selected.
 * Positioned above the data table with a Stripe-style solid elevated surface.
 */

import { useTranslation } from 'react-i18next';
import { Power, PowerOff, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { FloatingActionBar } from '@/components/admin';

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
  const { t } = useTranslation();
  const isLoading = isDeleting || isTogglingStatus || isUpdating;

  return (
    <FloatingActionBar>
      {/* Left: Selected count */}
      <div className="flex items-center gap-2 text-[13px] pl-1">
        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-foreground/10 text-foreground text-xs font-medium tabular-nums">
          {selectedCount}
        </span>
        <span className="text-muted-foreground">{t('admin.forwardRules.batch.rules')}</span>
      </div>

      <div className="w-px h-5 bg-border/60" />

      {/* Center: Action buttons */}
      <div className="flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onBatchEnable}
              disabled={isLoading}
              className="h-8 px-2.5 gap-1.5 text-[13px] border-border/60 hover:border-success/50 hover:bg-success/10"
            >
              {isTogglingStatus ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Power className="size-3.5 text-success" />
              )}
              <span className="text-success">{t('common.actions.enable')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('admin.forwardRules.batch.enableTooltip')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onBatchDisable}
              disabled={isLoading}
              className="h-8 px-2.5 gap-1.5 text-[13px] border-border/60 hover:border-warning/50 hover:bg-warning/10"
            >
              {isTogglingStatus ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <PowerOff className="size-3.5 text-warning" />
              )}
              <span className="text-warning">{t('common.actions.disable')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('admin.forwardRules.batch.disableTooltip')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onBatchUpdate}
              disabled={isLoading}
              className="h-8 px-2.5 gap-1.5 text-[13px] border-border/60 hover:border-info/50 hover:bg-info/10"
            >
              {isUpdating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Pencil className="size-3.5 text-info" />
              )}
              <span className="text-info">{t('admin.forwardRules.batch.update')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('admin.forwardRules.batch.updateTooltip')}</TooltipContent>
        </Tooltip>

        <div className="w-px h-5 bg-border/60 mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onBatchDelete}
              disabled={isLoading}
              className="h-8 px-2.5 gap-1.5 text-[13px] border-border/60 hover:border-destructive/50 hover:bg-destructive/10"
            >
              {isDeleting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5 text-destructive" />
              )}
              <span className="text-destructive">{t('common.actions.delete')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('admin.forwardRules.batch.deleteTooltip')}</TooltipContent>
        </Tooltip>
      </div>

      <div className="w-px h-5 bg-border/60" />

      {/* Right: Clear selection button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClearSelection}
            disabled={isLoading}
            className="size-8 text-muted-foreground/70 hover:text-foreground"
          >
            <X className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('admin.forwardRules.batch.cancelSelection')}</TooltipContent>
      </Tooltip>
    </FloatingActionBar>
  );
};
