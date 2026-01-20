/**
 * Create User Sheet Component
 * Mobile-optimized bottom sheet for creating new users
 * Compact layout matching other create sheets
 */

import { useState, useCallback } from 'react';
import { UserPlus, Mail, User, Lock } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  type CreateSheetProps,
} from '@/components/common/sheet';
import { Button } from '@/components/common/Button';
import { MobileFormInput, MobilePasswordInput } from '@/components/common/mobile-form';
import { cn } from '@/lib/utils';
import type { CreateUserRequest } from '@/api/user';

type CreateUserSheetProps = CreateSheetProps<CreateUserRequest>;

interface FormErrors {
  email?: string;
  name?: string;
  password?: string;
}

// Compact input styles matching other create sheets
// Use text-base (16px) to prevent iOS Safari viewport zoom on focus
const compactInputStyles = 'min-h-[44px] py-2 rounded-lg';

export const CreateUserSheet: React.FC<CreateUserSheetProps> = ({
  open,
  onOpenChange,
  onSubmit,
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  // Validation functions
  const validateEmail = useCallback((value: string): string | undefined => {
    if (!value.trim()) return '请输入邮箱地址';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return '邮箱格式不正确';
    return undefined;
  }, []);

  const validateName = useCallback((value: string): string | undefined => {
    if (!value.trim()) return '请输入用户姓名';
    if (value.trim().length < 2 || value.trim().length > 100) return '姓名需 2-100 个字符';
    return undefined;
  }, []);

  const validatePassword = useCallback((value: string): string | undefined => {
    const trimmed = value.trim();
    if (!trimmed) return '请设置初始密码';
    if (trimmed.length < 8) return '密码至少 8 个字符';
    if (trimmed.length > 72) return '密码不能超过 72 个字符';
    if (!/[a-zA-Z]/.test(trimmed)) return '密码需包含字母';
    if (!/\d/.test(trimmed)) return '密码需包含数字';
    return undefined;
  }, []);

  // Handle blur for inline validation
  const handleBlur = useCallback((field: keyof FormErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const validators = { email: validateEmail, name: validateName, password: validatePassword };
    const values = { email, name, password };
    setErrors((prev) => ({ ...prev, [field]: validators[field](values[field]) }));
  }, [email, name, password, validateEmail, validateName, validatePassword]);

  // Validate all fields
  const validateAll = useCallback((): boolean => {
    const newErrors: FormErrors = {
      email: validateEmail(email),
      name: validateName(name),
      password: validatePassword(password),
    };
    setErrors(newErrors);
    setTouched({ email: true, name: true, password: true });
    return !newErrors.email && !newErrors.name && !newErrors.password;
  }, [email, name, password, validateEmail, validateName, validatePassword]);

  // Reset form
  const resetForm = useCallback(() => {
    setEmail('');
    setName('');
    setPassword('');
    setShowPassword(false);
    setErrors({});
    setTouched({});
  }, []);

  const handleClose = useCallback(() => {
    if (!loading) {
      resetForm();
      onOpenChange(false);
    }
  }, [loading, resetForm, onOpenChange]);

  const handleSubmit = useCallback(async () => {
    if (!validateAll()) return;

    setLoading(true);
    try {
      await onSubmit({
        email: email.trim(),
        name: name.trim(),
        password: password.trim(),
      });
      resetForm();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }, [validateAll, email, name, password, onSubmit, resetForm, onOpenChange]);

  // Form validity check
  const trimmedPassword = password.trim();
  const isFormValid =
    email.trim() &&
    name.trim() &&
    trimmedPassword.length >= 8 &&
    trimmedPassword.length <= 72 &&
    /[a-zA-Z]/.test(trimmedPassword) &&
    /\d/.test(trimmedPassword);

  // Password strength indicator
  const getPasswordStrength = () => {
    if (!trimmedPassword) return null;
    const checks = [
      trimmedPassword.length >= 8 && trimmedPassword.length <= 72,
      /[a-zA-Z]/.test(trimmedPassword),
      /\d/.test(trimmedPassword),
    ];
    const passed = checks.filter(Boolean).length;
    return { passed, total: checks.length };
  };
  const strength = getPasswordStrength();

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <SheetContent>
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
              <UserPlus className="size-4 text-primary" />
            </div>
            <span>新增用户</span>
          </SheetTitle>
          <SheetDescription className="text-xs">
            创建新用户账户，用户将使用此密码首次登录
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-4 py-3">
          {/* Section Header */}
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            账户信息
          </h4>

          {/* Email & Name - 2 column grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label htmlFor="mobile-email" className="text-xs font-medium">
                邮箱地址 <span className="text-destructive">*</span>
              </label>
              <MobileFormInput
                id="mobile-email"
                type="email"
                value={email}
                onChange={(v) => {
                  setEmail(v);
                  if (touched.email) setErrors((prev) => ({ ...prev, email: validateEmail(v) }));
                }}
                onBlur={() => handleBlur('email')}
                placeholder="user@example.com"
                icon={<Mail className="size-4" />}
                error={touched.email ? errors.email : undefined}
                disabled={loading}
                autoComplete="email"
                className={compactInputStyles}
                containerClassName="space-y-1"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="mobile-name" className="text-xs font-medium">
                用户姓名 <span className="text-destructive">*</span>
              </label>
              <MobileFormInput
                id="mobile-name"
                value={name}
                onChange={(v) => {
                  setName(v);
                  if (touched.name) setErrors((prev) => ({ ...prev, name: validateName(v) }));
                }}
                onBlur={() => handleBlur('name')}
                placeholder="姓名"
                icon={<User className="size-4" />}
                error={touched.name ? errors.name : undefined}
                disabled={loading}
                autoComplete="name"
                className={compactInputStyles}
                containerClassName="space-y-1"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label htmlFor="mobile-password" className="text-xs font-medium">
              初始密码 <span className="text-destructive">*</span>
            </label>
            <MobilePasswordInput
              id="mobile-password"
              value={password}
              onChange={(v) => {
                setPassword(v);
                if (touched.password) setErrors((prev) => ({ ...prev, password: validatePassword(v) }));
              }}
              onBlur={() => handleBlur('password')}
              placeholder="8-72字符，含字母和数字"
              error={touched.password ? errors.password : undefined}
              disabled={loading}
              showPassword={showPassword}
              onToggleShow={() => setShowPassword((prev) => !prev)}
              className={compactInputStyles}
              containerClassName="space-y-1"
            />

            {/* Compact password strength indicator */}
            {strength && (
              <div className="flex items-center gap-2 px-1 pt-1">
                <div className="flex gap-1 flex-1 max-w-20">
                  {[...Array(strength.total)].map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-1 flex-1 rounded-full transition-colors',
                        i < strength.passed
                          ? strength.passed === strength.total
                            ? 'bg-emerald-500'
                            : 'bg-yellow-500'
                          : 'bg-muted'
                      )}
                    />
                  ))}
                </div>
                <span className={cn(
                  'text-xs',
                  strength.passed === strength.total ? 'text-emerald-600' : 'text-muted-foreground'
                )}>
                  {strength.passed === strength.total ? '密码合格' : `${strength.passed}/${strength.total}`}
                </span>
              </div>
            )}
          </div>

          {/* Info hint */}
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-start gap-2">
              <Lock className="size-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                用户首次登录后可自行修改密码。建议设置强密码以保护账户安全。
              </p>
            </div>
          </div>
        </SheetBody>

        <SheetFooter>
          <Button
            onClick={handleSubmit}
            disabled={loading || !isFormValid}
            className="w-full min-h-[48px]"
          >
            {loading ? '创建中...' : '创建用户'}
          </Button>
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
            className="w-full min-h-[44px]"
          >
            取消
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
