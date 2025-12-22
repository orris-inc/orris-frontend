/**
 * 通用 Token 显示对话框组件
 * 用于显示生成的 Token，要求用户复制后才能关闭
 */

import { useState, useEffect } from 'react';
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
  title = 'Token',
  description = 'Token已生成，请妥善保存。此Token仅显示一次，丢失后需要重新生成。',
  onClose,
}) => {
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
    if (hasCopied) {
      setHasCopied(false);
      onClose();
    }
  };

  if (!token) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && hasCopied) {
          handleClose();
        }
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <textarea
            value={token}
            readOnly
            rows={3}
            className={`${textareaStyles} font-mono text-sm break-all`}
          />
          {hasCopied ? (
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
              <span>✓</span> Token已复制到剪贴板
            </p>
          ) : (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              请先复制Token后再关闭此对话框
            </p>
          )}
        </div>
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={!hasCopied}
            className="w-full sm:w-auto"
          >
            关闭
          </Button>
          <Button onClick={handleCopy} className="w-full sm:w-auto">
            {hasCopied ? '再次复制' : '复制Token'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
