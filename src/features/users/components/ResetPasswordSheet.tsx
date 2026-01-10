/**
 * Reset Password Sheet Component
 * Mobile-optimized bottom sheet for resetting user password
 */

import { useState, useEffect, useCallback } from 'react';
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
    if (!value) return '请输入新密码';
    if (value.length < PASSWORD_MIN_LENGTH) return `密码至少 ${PASSWORD_MIN_LENGTH} 个字符`;
    if (value.length > PASSWORD_MAX_LENGTH) return `密码不能超过 ${PASSWORD_MAX_LENGTH} 个字符`;
    if (!/[a-zA-Z]/.test(value)) return '密码需包含字母';
    if (!/\d/.test(value)) return '密码需包含数字';
    return undefined;
  }, []);

  const validateConfirm = useCallback((value: string): string | undefined => {
    if (!value) return '请确认新密码';
    if (value !== password) return '两次密码不一致';
    return undefined;
  }, [password]);

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
    <Sheet open={open} onOpenChange={handleOpenChange} repositionInputs>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="size-10 rounded-full bg-warning/10 flex items-center justify-center">
              <KeyRound className="size-5 text-warning" />
            </div>
            <span>重置密码</span>
          </SheetTitle>
          <SheetDescription>
            为用户 <span className="font-medium text-foreground">{user.email}</span> 设置新密码
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-5 py-3">
          {/* New Password */}
          <div className="space-y-1.5">
            <label htmlFor="reset-password" className="text-sm font-medium px-1">
              新密码 <span className="text-destructive">*</span>
            </label>
            <MobilePasswordInput
              id="reset-password"
              value={password}
              onChange={(v) => {
                setPassword(v);
                if (touched.password) setErrors((prev) => ({ ...prev, password: validatePassword(v) }));
                // Also update confirm validation if already touched
                if (touched.confirmPassword && confirmPassword) {
                  setErrors((prev) => ({ ...prev, confirmPassword: v !== confirmPassword ? '两次密码不一致' : undefined }));
                }
              }}
              onBlur={() => handleBlur('password')}
              placeholder="请输入新密码"
              error={touched.password ? errors.password : undefined}
              disabled={isLoading}
              showPassword={showPassword}
              onToggleShow={() => setShowPassword((p) => !p)}
            />

            {/* Password Requirements */}
            {!password && !touched.password && (
              <p className="text-xs text-muted-foreground px-1">
                {PASSWORD_MIN_LENGTH}-{PASSWORD_MAX_LENGTH} 个字符，必须包含字母和数字
              </p>
            )}

            {/* Password Strength Indicator */}
            <PasswordStrengthIndicator password={password} rules={DEFAULT_PASSWORD_RULES} />
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label htmlFor="reset-confirm" className="text-sm font-medium px-1">
              确认密码 <span className="text-destructive">*</span>
            </label>
            <MobilePasswordInput
              id="reset-confirm"
              value={confirmPassword}
              onChange={(v) => {
                setConfirmPassword(v);
                if (touched.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: validateConfirm(v) }));
              }}
              onBlur={() => handleBlur('confirmPassword')}
              placeholder="请再次输入新密码"
              error={touched.confirmPassword ? errors.confirmPassword : undefined}
              disabled={isLoading}
              showPassword={showConfirmPassword}
              onToggleShow={() => setShowConfirmPassword((p) => !p)}
            />

            {/* Match indicator */}
            {confirmPassword && !errors.confirmPassword && password === confirmPassword && (
              <div className="flex items-center gap-1.5 text-success text-sm px-1">
                <Check className="size-4" />
                <span>密码匹配</span>
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
            {isLoading ? '重置中...' : '确认重置'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full min-h-[44px]"
          >
            取消
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
