/**
 * ActionSheet - iOS-style Action Menu
 *
 * A bottom sheet with grouped action buttons, following iOS design patterns.
 *
 * Features:
 * - Grouped action buttons with dividers
 * - Separate cancel button with gap
 * - Per-action loading state
 * - Destructive variant (red text)
 * - Safe area support for notched devices
 * - Spring animation matching iOS
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from 'vaul';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActionSheetProps } from './types';

export const ActionSheet: React.FC<ActionSheetProps> = ({
  open,
  onOpenChange,
  actions,
  title,
  description,
  cancelText,
}) => {
  const { t } = useTranslation();
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const resolvedCancelText = cancelText ?? t('common.actions.cancel');

  const handleAction = async (
    action: ActionSheetProps['actions'][number],
    index: number
  ) => {
    if (action.disabled || loadingIndex !== null) return;

    try {
      setLoadingIndex(index);
      await action.onPress();
      onOpenChange(false);
    } finally {
      setLoadingIndex(null);
    }
  };

  const handleCancel = () => {
    if (loadingIndex !== null) return;
    onOpenChange(false);
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} scrollLockTimeout={500}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50',
            'px-2 pb-[calc(env(safe-area-inset-bottom)+8px)]',
            'outline-none'
          )}
        >
          {/* Action Group Card */}
          <div className="rounded-xl bg-card/95 backdrop-blur-xl overflow-hidden shadow-lg">
            {/* Header - Title & Description */}
            {(title || description) && (
              <div className="px-4 py-3 text-center border-b border-border/30">
                {title && (
                  <p className="text-sm font-medium text-muted-foreground">
                    {title}
                  </p>
                )}
                {description && (
                  <p className="text-xs text-muted-foreground/70 mt-0.5">
                    {description}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {actions.map((action, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleAction(action, index)}
                disabled={action.disabled || loadingIndex !== null}
                className={cn(
                  'w-full px-4 py-4',
                  'text-center text-[17px] font-normal',
                  'border-b border-border/30 last:border-b-0',
                  'transition-colors duration-150',
                  'active:bg-muted/50',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'flex items-center justify-center gap-2',
                  action.variant === 'destructive'
                    ? 'text-destructive'
                    : 'text-primary'
                )}
              >
                {loadingIndex === index ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    {action.icon && (
                      <span className="flex-shrink-0">{action.icon}</span>
                    )}
                    <span>{action.label}</span>
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Cancel Button - Separate with gap */}
          <button
            type="button"
            onClick={handleCancel}
            disabled={loadingIndex !== null}
            className={cn(
              'w-full mt-2 py-4 rounded-xl',
              'bg-card/95 backdrop-blur-xl shadow-lg',
              'text-[17px] font-semibold text-primary',
              'transition-colors duration-150',
              'active:bg-muted/50',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {resolvedCancelText}
          </button>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

ActionSheet.displayName = 'ActionSheet';
