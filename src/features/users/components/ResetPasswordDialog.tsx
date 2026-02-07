/**
 * Reset User Password Dialog Component
 */

import { useTranslation } from 'react-i18next';
import * as Dialog from '@radix-ui/react-dialog';
import * as LabelPrimitive from '@radix-ui/react-label';
import { X, Eye, EyeOff } from 'lucide-react';
import { getButtonClass, inputStyles, labelStyles } from '@/lib/ui-styles';
import { cn } from '@/lib/utils';
import { useResetPasswordForm } from '../hooks/useResetPasswordForm';
import type { UserResponse } from '@/api/user';

interface ResetPasswordDialogProps {
  open: boolean;
  user: UserResponse | null;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (id: string, password: string) => void;
}

export const ResetPasswordDialog: React.FC<ResetPasswordDialogProps> = ({
  open,
  user,
  isLoading = false,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const form = useResetPasswordForm({ open });

  const handleSubmit = () => {
    if (user && form.validate()) {
      onSubmit(user.id, form.password);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isLoading) {
      onClose();
    }
  };

  if (!user) return null;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="@container fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold leading-none tracking-tight">
              {t('admin.users.resetPassword.title')}
            </Dialog.Title>
            <Dialog.Close
              disabled={isLoading}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">{t('common.actions.close')}</span>
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-sm text-muted-foreground mt-2">
            {t('admin.users.resetPassword.description', { email: user.email })}
          </Dialog.Description>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <LabelPrimitive.Root htmlFor="password" className={labelStyles}>
                {t('admin.users.resetPassword.newPassword')}
              </LabelPrimitive.Root>
              <div className="relative">
                <input
                  id="password"
                  type={form.showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => form.handlePasswordChange(e.target.value)}
                  disabled={isLoading}
                  className={cn(inputStyles, 'pr-10', form.errors.password && 'border-destructive')}
                  placeholder={t('admin.users.resetPassword.newPasswordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => form.setShowPassword(!form.showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {form.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.errors.password ? (
                <span className="text-sm text-destructive">{form.errors.password}</span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {t('admin.users.resetPassword.passwordHint', { min: form.PASSWORD_MIN_LENGTH, max: form.PASSWORD_MAX_LENGTH })}
                </span>
              )}
            </div>

            <div className="grid gap-2">
              <LabelPrimitive.Root htmlFor="confirmPassword" className={labelStyles}>
                {t('admin.users.resetPassword.confirmPassword')}
              </LabelPrimitive.Root>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={form.showConfirmPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => form.handleConfirmChange(e.target.value)}
                  disabled={isLoading}
                  className={cn(inputStyles, 'pr-10', form.errors.confirmPassword && 'border-destructive')}
                  placeholder={t('admin.users.resetPassword.confirmPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => form.setShowConfirmPassword(!form.showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {form.showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.errors.confirmPassword && (
                <span className="text-sm text-destructive">{form.errors.confirmPassword}</span>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className={getButtonClass('outline', 'default')}
            >
              {t('common.actions.cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !form.isFormValid}
              className={getButtonClass('default', 'default')}
            >
              {isLoading ? t('admin.users.resetPassword.resetting') : t('admin.users.resetPassword.confirmReset')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
