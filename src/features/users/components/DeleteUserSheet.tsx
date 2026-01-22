/**
 * Delete User Confirmation Sheet
 * Mobile-optimized bottom sheet for confirming user deletion
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  ConfirmActionSheet,
  type DeleteSheetProps,
} from '@/components/common/sheet';
import { Button } from '@/components/common/Button';
import type { UserResponse } from '@/api/user';

type DeleteUserSheetProps = DeleteSheetProps<UserResponse>;

export const DeleteUserSheet: React.FC<DeleteUserSheetProps> = ({
  open,
  onOpenChange,
  entity: user,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirm = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await onConfirm(user);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <div className="size-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="size-5 text-destructive" />
              </div>
              <span>{t('admin.users.delete.title')}</span>
            </SheetTitle>
            <SheetDescription>
              {t('admin.users.delete.description')}
            </SheetDescription>
          </SheetHeader>

          <SheetBody className="py-4">
            {/* Warning Card */}
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-destructive">{t('admin.users.delete.confirmQuestion')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('admin.users.delete.warningMessage')}
                  </p>
                </div>
              </div>

              {/* User Info */}
              <div className="rounded-lg bg-background p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('admin.users.delete.username')}</span>
                  <span className="font-medium">{user.name || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('admin.users.fields.emailShort')}</span>
                  <span className="font-medium text-sm">{user.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('admin.users.fields.status')}</span>
                  <span className="font-medium">{t(`admin.users.status.${user.status}`)}</span>
                </div>
              </div>
            </div>
          </SheetBody>

          <SheetFooter>
            {/* Destructive action first on mobile */}
            <Button
              variant="destructive"
              onClick={() => setConfirmOpen(true)}
              disabled={loading}
              className="w-full min-h-[52px] text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-5 animate-spin" />
                  {t('admin.users.delete.deleting')}
                </>
              ) : (
                t('admin.users.delete.confirmDelete')
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full min-h-[44px]"
            >
              {t('admin.users.actions.cancel')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmActionSheet
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        variant="destructive"
        title={t('admin.users.delete.confirmDeleteQuestion')}
        description={t('admin.users.delete.cannotRecover')}
        confirmText={t('admin.users.delete.confirmDelete')}
        onConfirm={handleConfirm}
      />
    </>
  );
};
