/**
 * Shared form logic for ResetPasswordDialog and ResetPasswordSheet
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface UseResetPasswordFormParams {
  open: boolean;
}

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 72;

export function useResetPasswordForm({ open }: UseResetPasswordFormParams) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Reset form when dialog/sheet opens
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
    if (!/[A-Z]/.test(value)) return t('admin.users.resetPassword.passwordNeedsUppercase');
    if (!/[a-z]/.test(value)) return t('admin.users.resetPassword.passwordNeedsLowercase');
    if (!/\d/.test(value)) return t('admin.users.resetPassword.passwordNeedsNumber');
    if (!/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(value)) return t('admin.users.resetPassword.passwordNeedsSpecial');
    return undefined;
  }, [t]);

  const validateConfirm = useCallback((value: string): string | undefined => {
    if (!value) return t('admin.users.resetPassword.confirmRequired');
    if (value !== password) return t('admin.users.resetPassword.passwordMismatch');
    return undefined;
  }, [t, password]);

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
    if (touched.password) {
      setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
    }
    // Also update confirm validation if already touched
    if (touched.confirmPassword && confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: value !== confirmPassword
          ? t('admin.users.resetPassword.passwordMismatch')
          : undefined,
      }));
    }
  }, [touched.password, touched.confirmPassword, confirmPassword, validatePassword, t]);

  const handleConfirmChange = useCallback((value: string) => {
    setConfirmPassword(value);
    if (touched.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: validateConfirm(value) }));
    }
  }, [touched.confirmPassword, validateConfirm]);

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

  // Form validity
  const isFormValid = !!(password && confirmPassword && !validatePassword(password) && password === confirmPassword);

  return {
    // State
    password,
    confirmPassword,
    showPassword,
    showConfirmPassword,
    errors,
    touched,

    // Setters
    setShowPassword,
    setShowConfirmPassword,

    // Handlers
    handlePasswordChange,
    handleConfirmChange,
    handleBlur,

    // Validation
    validate,
    isFormValid,

    // Constants
    PASSWORD_MIN_LENGTH,
    PASSWORD_MAX_LENGTH,
  };
}
