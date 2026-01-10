/**
 * ConfirmActionSheet - Confirmation Variant of ActionSheet
 *
 * A simplified ActionSheet for confirmation dialogs.
 * Used as secondary sheet inside a primary Sheet for delete/cancel confirmations.
 *
 * Maximum nesting: 2 levels (Primary Sheet + ConfirmActionSheet)
 */

import { ActionSheet } from './ActionSheet';
import type { ConfirmActionSheetProps } from './types';

export const ConfirmActionSheet: React.FC<ConfirmActionSheetProps> = ({
  open,
  onOpenChange,
  variant = 'default',
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
}) => {
  return (
    <ActionSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      cancelText={cancelText}
      actions={[
        {
          label: confirmText,
          variant,
          onPress: onConfirm,
        },
      ]}
    />
  );
};

ConfirmActionSheet.displayName = 'ConfirmActionSheet';
