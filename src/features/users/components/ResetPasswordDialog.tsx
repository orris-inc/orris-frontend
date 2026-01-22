/**
 * Reset User Password Dialog Component
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as Dialog from '@radix-ui/react-dialog';
import * as LabelPrimitive from '@radix-ui/react-label';
import { X, Eye, EyeOff } from 'lucide-react';
import { getButtonClass, inputStyles, labelStyles } from '@/lib/ui-styles';
import { cn } from '@/lib/utils';
import type { UserResponse } from '@/api/user';

interface ResetPasswordDialogProps {
  open: boolean;
  user: UserResponse | null;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (id: string, password: string) => void;
}

// Password validation rules (consistent with backend)
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72;

export const ResetPasswordDialog: React.FC<ResetPasswordDialogProps> = ({
  open,
  user,
  isLoading = false,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  useEffect(() => {
    if (open) {
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setErrors({});
    }
  }, [open]);

  const validate = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      newErrors.password = t('admin.users.resetPassword.passwordRequired');
    } else if (password.length < PASSWORD_MIN_LENGTH) {
      newErrors.password = t('admin.users.resetPassword.passwordMinLength', { min: PASSWORD_MIN_LENGTH });
    } else if (password.length > PASSWORD_MAX_LENGTH) {
      newErrors.password = t('admin.users.resetPassword.passwordMaxLength', { max: PASSWORD_MAX_LENGTH });
    } else if (!/[a-zA-Z]/.test(password)) {
      newErrors.password = t('admin.users.resetPassword.passwordNeedsLetter');
    } else if (!/\d/.test(password)) {
      newErrors.password = t('admin.users.resetPassword.passwordNeedsNumber');
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = t('admin.users.resetPassword.confirmRequired');
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t('admin.users.resetPassword.passwordMismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (user && validate()) {
      onSubmit(user.id, password);
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
              <span className="sr-only">Close</span>
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
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className={cn(inputStyles, 'pr-10', errors.password && 'border-destructive')}
                  placeholder={t('admin.users.resetPassword.newPasswordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password ? (
                <span className="text-sm text-destructive">{errors.password}</span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {t('admin.users.resetPassword.passwordHint', { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH })}
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
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className={cn(inputStyles, 'pr-10', errors.confirmPassword && 'border-destructive')}
                  placeholder={t('admin.users.resetPassword.confirmPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="text-sm text-destructive">{errors.confirmPassword}</span>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className={getButtonClass('outline', 'default')}
            >
              {t('admin.users.actions.cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !password || !confirmPassword}
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
