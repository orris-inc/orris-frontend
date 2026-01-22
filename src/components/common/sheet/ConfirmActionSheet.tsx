/**
 * ConfirmActionSheet - Confirmation Variant of ActionSheet
 *
 * A simplified ActionSheet for confirmation dialogs.
 * Used as secondary sheet inside a primary Sheet for delete/cancel confirmations.
 *
 * Maximum nesting: 2 levels (Primary Sheet + ConfirmActionSheet)
 */

import { useTranslation } from 'react-i18next';
import { ActionSheet } from './ActionSheet';
import type { ConfirmActionSheetProps } from './types';

export const ConfirmActionSheet: React.FC<ConfirmActionSheetProps> = ({
  open,
  onOpenChange,
  variant = 'default',
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const resolvedConfirmText = confirmText ?? t('common.actions.confirm');
  const resolvedCancelText = cancelText ?? t('common.actions.cancel');

  return (
    <ActionSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      cancelText={resolvedCancelText}
      actions={[
        {
          label: resolvedConfirmText,
          variant,
          onPress: onConfirm,
        },
      ]}
    />
  );
};

ConfirmActionSheet.displayName = 'ConfirmActionSheet';
