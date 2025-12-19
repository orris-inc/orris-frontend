/**
 * 删除资源组确认对话框
 */

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import type { ResourceGroup } from '@/api/resource/types';

interface DeleteResourceGroupDialogProps {
  open: boolean;
  resourceGroup: ResourceGroup | null;
  onClose: () => void;
  onConfirm: (id: number) => Promise<void>;
}

export const DeleteResourceGroupDialog: React.FC<DeleteResourceGroupDialogProps> = ({
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
      await onConfirm(resourceGroup.id);
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            删除资源组
          </DialogTitle>
          <DialogDescription>
            此操作不可撤销，请确认是否删除此资源组。
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
            <p className="text-sm">
              您即将删除资源组：<strong>{resourceGroup?.name}</strong>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              如果此资源组已关联资源，删除操作将失败。
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            取消
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? '删除中...' : '确认删除'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
