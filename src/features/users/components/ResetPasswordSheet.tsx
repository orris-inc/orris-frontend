/**
 * Reset Password Sheet Component
 * Mobile-optimized bottom sheet for resetting user password
 */

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyRound, Check } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  type BaseSheetProps,
} from '@/components/common/sheet';
import { Button } from '@/components/common/Button';
import {
  MobilePasswordInput,
  PasswordStrengthIndicator,
  useDefaultPasswordRules,
} from '@/components/common/mobile-form';
import { useResetPasswordForm } from '../hooks/useResetPasswordForm';
import type { UserResponse } from '@/api/user';

interface ResetPasswordSheetProps extends BaseSheetProps {
  user: UserResponse | null;
  isLoading?: boolean;
  onSubmit: (id: string, password: string) => void;
}

export const ResetPasswordSheet: React.FC<ResetPasswordSheetProps> = ({
  open,
  onOpenChange,
  user,
  isLoading = false,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const passwordRules = useDefaultPasswordRules();
  const form = useResetPasswordForm({ open });

  const handleSubmit = useCallback(() => {
    if (user && form.validate()) {
      onSubmit(user.id, form.password);
    }
  }, [user, form, onSubmit]);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!isLoading) {
      onOpenChange(open);
    }
  }, [isLoading, onOpenChange]);

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="size-10 rounded-full bg-warning/10 flex items-center justify-center">
              <KeyRound className="size-5 text-warning" />
            </div>
            <span>{t('user.detail.resetPassword')}</span>
          </SheetTitle>
          <SheetDescription>
            {t('admin.users.resetPassword.description', { email: user.email })}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-5 py-3">
          {/* New Password */}
          <div className="space-y-1.5">
            <label htmlFor="reset-password" className="text-sm font-medium px-1">
              {t('admin.users.resetPassword.newPassword')} <span className="text-destructive">*</span>
            </label>
            <MobilePasswordInput
              id="reset-password"
              value={form.password}
              onChange={form.handlePasswordChange}
              onBlur={() => form.handleBlur('password')}
              placeholder={t('admin.users.resetPassword.newPasswordPlaceholder')}
              error={form.touched.password ? form.errors.password : undefined}
              disabled={isLoading}
              showPassword={form.showPassword}
              onToggleShow={() => form.setShowPassword((p) => !p)}
            />

            {/* Password Requirements */}
            {!form.password && !form.touched.password && (
              <p className="text-xs text-muted-foreground px-1">
                {t('admin.users.resetPassword.passwordHint', { min: form.PASSWORD_MIN_LENGTH, max: form.PASSWORD_MAX_LENGTH })}
              </p>
            )}

            {/* Password Strength Indicator */}
            <PasswordStrengthIndicator password={form.password} rules={passwordRules} />
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label htmlFor="reset-confirm" className="text-sm font-medium px-1">
              {t('admin.users.resetPassword.confirmPassword')} <span className="text-destructive">*</span>
            </label>
            <MobilePasswordInput
              id="reset-confirm"
              value={form.confirmPassword}
              onChange={form.handleConfirmChange}
              onBlur={() => form.handleBlur('confirmPassword')}
              placeholder={t('admin.users.resetPassword.confirmPlaceholder')}
              error={form.touched.confirmPassword ? form.errors.confirmPassword : undefined}
              disabled={isLoading}
              showPassword={form.showConfirmPassword}
              onToggleShow={() => form.setShowConfirmPassword((p) => !p)}
            />

            {/* Match indicator */}
            {form.confirmPassword && !form.errors.confirmPassword && form.password === form.confirmPassword && (
              <div className="flex items-center gap-1.5 text-success text-sm px-1">
                <Check className="size-4" />
                <span>{t('admin.users.resetPassword.passwordMatch')}</span>
              </div>
            )}
          </div>
        </SheetBody>

        <SheetFooter>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !form.isFormValid}
            className="w-full min-h-[48px]"
          >
            {isLoading ? t('admin.users.resetPassword.resetting') : t('admin.users.resetPassword.confirmReset')}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full min-h-[44px]"
          >
            {t('common.actions.cancel')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
