/**
 * Token dialog component
 * Displays generated token with copy functionality
 *
 * Note: Token can be retrieved later via API, so copying is recommended but not required.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import { textareaStyles } from '@/lib/ui-styles';

interface TokenDialogProps {
  open: boolean;
  token: string | null;
  title?: string;
  description?: string;
  onClose: () => void;
}

export const TokenDialog: React.FC<TokenDialogProps> = ({
  open,
  token,
  title,
  description,
  onClose,
}) => {
  const { t } = useTranslation();
  const [hasCopied, setHasCopied] = useState(false);

  // Reset copy state
  useEffect(() => {
    if (open) {
      setHasCopied(false);
    }
  }, [open]);

  const handleCopy = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setHasCopied(true);
    }
  };

  const handleClose = () => {
    setHasCopied(false);
    onClose();
  };

  if (!token) return null;

  const displayTitle = title ?? 'Token';
  const displayDescription = description ?? t('common.token.defaultDescription');

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{displayTitle}</DialogTitle>
          <DialogDescription>{displayDescription}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <textarea
            value={token}
            readOnly
            rows={3}
            className={`${textareaStyles} font-mono text-sm break-all`}
          />
          {hasCopied ? (
            <p className="text-sm text-success flex items-center gap-1">
              {t('common.token.copied')}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('common.token.copyHint')}
            </p>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button onClick={handleCopy} className="w-full sm:w-auto">
            {hasCopied ? t('common.token.copyAgain') : t('common.token.copy')}
          </Button>
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full sm:w-auto"
          >
            {t('common.actions.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
