/**
 * Reset Password Sheet Component
 * Mobile-optimized bottom sheet for resetting user password
 */

import { useState, useEffect, useCallback } from 'react';
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
  DEFAULT_PASSWORD_RULES,
} from '@/components/common/mobile-form';
import type { UserResponse } from '@/api/user';

interface ResetPasswordSheetProps extends BaseSheetProps {
  user: UserResponse | null;
  isLoading?: boolean;
  onSubmit: (id: string, password: string) => void;
}

// Password validation constants
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72;

export const ResetPasswordSheet: React.FC<ResetPasswordSheetProps> = ({
  open,
  onOpenChange,
  user,
  isLoading = false,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Reset form when sheet opens
  useEffect(() => {
    if (open) {
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setErrors({});
      setTouched({});
    }
  }, [open]);

  // Validation
  const validatePassword = useCallback((value: string): string | undefined => {
    if (!value) return t('admin.users.resetPassword.passwordRequired');
    if (value.length < PASSWORD_MIN_LENGTH) return t('admin.users.resetPassword.passwordMinLength', { min: PASSWORD_MIN_LENGTH });
    if (value.length > PASSWORD_MAX_LENGTH) return t('admin.users.resetPassword.passwordMaxLength', { max: PASSWORD_MAX_LENGTH });
    if (!/[a-zA-Z]/.test(value)) return t('admin.users.resetPassword.passwordNeedsLetter');
    if (!/\d/.test(value)) return t('admin.users.resetPassword.passwordNeedsNumber');
    return undefined;
  }, [t]);

  const validateConfirm = useCallback((value: string): string | undefined => {
    if (!value) return t('admin.users.resetPassword.confirmRequired');
    if (value !== password) return t('admin.users.resetPassword.passwordMismatch');
    return undefined;
  }, [t, password]);

  const handleBlur = useCallback((field: 'password' | 'confirmPassword') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'password') {
      setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
    } else {
      setErrors((prev) => ({ ...prev, confirmPassword: validateConfirm(confirmPassword) }));
    }
  }, [password, confirmPassword, validatePassword, validateConfirm]);

  const validate = useCallback((): boolean => {
    const newErrors = {
      password: validatePassword(password),
      confirmPassword: validateConfirm(confirmPassword),
    };
    setErrors(newErrors);
    setTouched({ password: true, confirmPassword: true });
    return !newErrors.password && !newErrors.confirmPassword;
  }, [password, confirmPassword, validatePassword, validateConfirm]);

  const handleSubmit = useCallback(() => {
    if (user && validate()) {
      onSubmit(user.id, password);
    }
  }, [user, validate, password, onSubmit]);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!isLoading) {
      onOpenChange(open);
    }
  }, [isLoading, onOpenChange]);

  // Form validity
  const isFormValid = password && confirmPassword && !validatePassword(password) && password === confirmPassword;

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
              value={password}
              onChange={(v) => {
                setPassword(v);
                if (touched.password) setErrors((prev) => ({ ...prev, password: validatePassword(v) }));
                // Also update confirm validation if already touched
                if (touched.confirmPassword && confirmPassword) {
                  setErrors((prev) => ({ ...prev, confirmPassword: v !== confirmPassword ? t('admin.users.resetPassword.passwordMismatch') : undefined }));
                }
              }}
              onBlur={() => handleBlur('password')}
              placeholder={t('admin.users.resetPassword.newPasswordPlaceholder')}
              error={touched.password ? errors.password : undefined}
              disabled={isLoading}
              showPassword={showPassword}
              onToggleShow={() => setShowPassword((p) => !p)}
            />

            {/* Password Requirements */}
            {!password && !touched.password && (
              <p className="text-xs text-muted-foreground px-1">
                {t('admin.users.resetPassword.passwordHint', { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH })}
              </p>
            )}

            {/* Password Strength Indicator */}
            <PasswordStrengthIndicator password={password} rules={DEFAULT_PASSWORD_RULES} />
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label htmlFor="reset-confirm" className="text-sm font-medium px-1">
              {t('admin.users.resetPassword.confirmPassword')} <span className="text-destructive">*</span>
            </label>
            <MobilePasswordInput
              id="reset-confirm"
              value={confirmPassword}
              onChange={(v) => {
                setConfirmPassword(v);
                if (touched.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: validateConfirm(v) }));
              }}
              onBlur={() => handleBlur('confirmPassword')}
              placeholder={t('admin.users.resetPassword.confirmPlaceholder')}
              error={touched.confirmPassword ? errors.confirmPassword : undefined}
              disabled={isLoading}
              showPassword={showConfirmPassword}
              onToggleShow={() => setShowConfirmPassword((p) => !p)}
            />

            {/* Match indicator */}
            {confirmPassword && !errors.confirmPassword && password === confirmPassword && (
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
            disabled={isLoading || !isFormValid}
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
