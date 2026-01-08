/**
 * Create User Sheet Component
 * Mobile-optimized bottom sheet for creating new users
 * Features: Large touch targets, password visibility toggle, strength indicator
 */

import { useState, useCallback } from 'react';
import { UserPlus, Mail, User } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from '@/components/common/Sheet';
import { Button } from '@/components/common/Button';
import {
  MobileFormInput,
  MobilePasswordInput,
  PasswordStrengthIndicator,
  DEFAULT_PASSWORD_RULES,
} from '@/components/common/mobile-form';
import type { CreateUserRequest } from '@/api/user';

interface CreateUserSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserRequest) => Promise<void>;
}

interface FormErrors {
  email?: string;
  name?: string;
  password?: string;
}

export const CreateUserSheet: React.FC<CreateUserSheetProps> = ({
  open,
  onClose,
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
      onClose();
    }
  }, [loading, resetForm, onClose]);

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
      onClose();
    } finally {
      setLoading(false);
    }
  }, [validateAll, email, name, password, onSubmit, resetForm, onClose]);

  // Form validity check
  const trimmedPassword = password.trim();
  const isFormValid =
    email.trim() &&
    name.trim() &&
    trimmedPassword.length >= 8 &&
    trimmedPassword.length <= 72 &&
    /[a-zA-Z]/.test(trimmedPassword) &&
    /\d/.test(trimmedPassword);

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserPlus className="size-5 text-primary" />
            </div>
            <span>新增用户</span>
          </SheetTitle>
          <SheetDescription>
            创建新用户账户，用户将使用此密码首次登录
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-6 py-4">
          {/* Email Field */}
          <div className="space-y-1.5">
            <label htmlFor="mobile-email" className="text-sm font-medium px-1">
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
              icon={<Mail className="size-5" />}
              error={touched.email ? errors.email : undefined}
              disabled={loading}
              autoComplete="email"
              autoFocus
            />
          </div>

          {/* Name Field */}
          <div className="space-y-1.5">
            <label htmlFor="mobile-name" className="text-sm font-medium px-1">
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
              placeholder="请输入用户姓名"
              icon={<User className="size-5" />}
              error={touched.name ? errors.name : undefined}
              disabled={loading}
              autoComplete="name"
            />
            {!touched.name && (
              <p className="text-xs text-muted-foreground px-1">2-100 个字符</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label htmlFor="mobile-password" className="text-sm font-medium px-1">
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
              placeholder="设置初始密码"
              error={touched.password ? errors.password : undefined}
              disabled={loading}
              showPassword={showPassword}
              onToggleShow={() => setShowPassword((prev) => !prev)}
            />

            {/* Password Requirements */}
            {!password && !touched.password && (
              <p className="text-xs text-muted-foreground px-1">
                8-72 个字符，必须包含字母和数字
              </p>
            )}

            {/* Password Strength Indicator */}
            <PasswordStrengthIndicator password={password} rules={DEFAULT_PASSWORD_RULES} />
          </div>
        </SheetBody>

        <SheetFooter>
          {/* Primary action - full width on mobile */}
          <Button
            onClick={handleSubmit}
            disabled={loading || !isFormValid}
            className="w-full min-h-[52px] text-base"
          >
            {loading ? '创建中...' : '创建用户'}
          </Button>

          {/* Secondary action */}
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
