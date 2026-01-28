/**
 * Delete Resource Group Confirmation Dialog
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  onConfirm: (id: string) => Promise<void>;
}

export const DeleteResourceGroupDialog: React.FC<DeleteResourceGroupDialogProps> = ({
  open,
  resourceGroup,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            {t('resourceGroups.deleteTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('resourceGroups.deleteDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
            <p className="text-sm">
              {t('resourceGroups.deleteConfirm')} <strong>{resourceGroup?.name}</strong>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {t('resourceGroups.deleteFailWarning')}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? t('common.loading.deleting') : t('resourceGroups.confirmDelete')}
          </Button>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.actions.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
