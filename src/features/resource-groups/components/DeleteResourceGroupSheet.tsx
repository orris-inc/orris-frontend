/**
 * Delete Resource Group Confirmation Sheet
 * Mobile-optimized bottom sheet for confirming resource group deletion
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, AlertTriangle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  ConfirmActionSheet,
} from '@/components/common/sheet';
import type { DeleteSheetProps } from '@/components/common/sheet';
import { Button } from '@/components/common/Button';
import type { ResourceGroup } from '@/api/resource/types';

type DeleteResourceGroupSheetProps = DeleteSheetProps<ResourceGroup>;

export const DeleteResourceGroupSheet: React.FC<DeleteResourceGroupSheetProps> = ({
  open,
  onOpenChange,
  entity: resourceGroup,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirm = async () => {
    if (!resourceGroup) return;

    setLoading(true);
    try {
      await onConfirm(resourceGroup);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  if (!resourceGroup) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <div className="size-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="size-5 text-destructive" />
              </div>
              <span>{t('resourceGroups.deleteTitle')}</span>
            </SheetTitle>
            <SheetDescription>
              {t('resourceGroups.deleteDescription')}
            </SheetDescription>
          </SheetHeader>

          <SheetBody className="py-6">
            {/* Warning Card */}
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-destructive">{t('resourceGroups.deleteConfirm')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('resourceGroups.deleteWarning')}
                  </p>
                </div>
              </div>

              {/* Resource Group Info */}
              <div className="rounded-lg bg-background p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('resourceGroups.name')}</span>
                  <span className="font-medium">{resourceGroup.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">SID</span>
                  <span className="font-mono text-xs">{resourceGroup.sid}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('common.status.label')}</span>
                  <span className="font-medium">
                    {resourceGroup.status === 'active' ? t('resourceGroups.status.activated') : t('resourceGroups.status.deactivated')}
                  </span>
                </div>
              </div>

              {/* Additional Warning */}
              <p className="text-xs text-muted-foreground">
                {t('resourceGroups.deleteFailWarning')}
              </p>
            </div>
          </SheetBody>

          <SheetFooter>
            {/* Destructive action first on mobile */}
            <Button
              variant="destructive"
              onClick={() => setConfirmOpen(true)}
              disabled={loading}
              className="w-full min-h-[48px] text-base"
            >
              {t('resourceGroups.confirmDelete')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full min-h-[44px]"
            >
              {t('resourceGroups.cancel')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmActionSheet
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        variant="destructive"
        title={t('resourceGroups.deleteConfirmTitle')}
        description={t('resourceGroups.deleteConfirmDescription')}
        confirmText={t('resourceGroups.confirmDelete')}
        onConfirm={handleConfirm}
      />
    </>
  );
};
