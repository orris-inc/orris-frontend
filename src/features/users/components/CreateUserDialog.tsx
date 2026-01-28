/**
 * Create User Dialog Component
 * Form dialog for creating new users with email, name, and password
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus, Mail, User, Lock, Eye, EyeOff, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Separator } from '@/components/common/Separator';
import { cn } from '@/lib/utils';
import type { CreateUserRequest } from '@/api/user';

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserRequest) => Promise<void>;
}

interface FormErrors {
  email?: string;
  name?: string;
  password?: string;
}

interface FormTouched {
  email?: boolean;
  name?: boolean;
  password?: boolean;
}

// Password strength rules (8-72 chars, must contain letter and number)
const PASSWORD_RULES = [
  { key: 'length', labelKey: 'admin.users.form.passwordLength', test: (p: string) => p.length >= 8 && p.length <= 72 },
  { key: 'letter', labelKey: 'admin.users.form.containsLetter', test: (p: string) => /[a-zA-Z]/.test(p) },
  { key: 'number', labelKey: 'admin.users.form.containsNumber', test: (p: string) => /\d/.test(p) },
];

export const CreateUserDialog: React.FC<CreateUserDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});
  const [loading, setLoading] = useState(false);

  // Validation functions
  const validateEmail = useCallback((value: string): string | undefined => {
    if (!value.trim()) {
      return t('admin.users.form.emailRequired');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return t('admin.users.form.emailInvalid');
    }
    return undefined;
  }, [t]);

  const validateName = useCallback((value: string): string | undefined => {
    if (!value.trim()) {
      return t('admin.users.form.nameRequired');
    }
    if (value.trim().length < 2 || value.trim().length > 100) {
      return t('admin.users.form.nameLengthError');
    }
    return undefined;
  }, [t]);

  const validatePassword = useCallback((value: string): string | undefined => {
    const trimmed = value.trim();
    if (!trimmed) {
      return t('admin.users.form.passwordRequired');
    }
    if (trimmed.length < 8) {
      return t('admin.users.form.passwordMinLength');
    }
    if (trimmed.length > 72) {
      return t('admin.users.form.passwordMaxLength');
    }
    if (!/[a-zA-Z]/.test(trimmed)) {
      return t('admin.users.form.passwordNeedsLetter');
    }
    if (!/\d/.test(trimmed)) {
      return t('admin.users.form.passwordNeedsNumber');
    }
    return undefined;
  }, [t]);

  // Handle blur events for inline validation
  const handleBlur = useCallback(
    (field: keyof FormErrors) => {
      setTouched((prev) => ({ ...prev, [field]: true }));

      let error: string | undefined;
      switch (field) {
        case 'email':
          error = validateEmail(email);
          break;
        case 'name':
          error = validateName(name);
          break;
        case 'password':
          error = validatePassword(password);
          break;
      }

      setErrors((prev) => ({ ...prev, [field]: error }));
    },
    [email, name, password, validateEmail, validateName, validatePassword]
  );

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

  // Reset form state
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
    if (!validateAll()) {
      return;
    }

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

  // Calculate password strength
  const passwordStrength = PASSWORD_RULES.filter((rule) => rule.test(password));
  const strengthPercent = (passwordStrength.length / PASSWORD_RULES.length) * 100;

  // Check if form is valid for submit button
  const trimmedPassword = password.trim();
  const isFormValid =
    email.trim() &&
    name.trim() &&
    trimmedPassword.length >= 8 &&
    trimmedPassword.length <= 72 &&
    /[a-zA-Z]/.test(trimmedPassword) &&
    /\d/.test(trimmedPassword);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-primary" />
            {t('admin.users.createUser')}
          </DialogTitle>
          <DialogDescription>
            {t('admin.users.form.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Account Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">{t('admin.users.form.accountInfo')}</h3>
            </div>
            <Separator />

            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="create-user-email">
                {t('admin.users.form.email')} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="create-user-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (touched.email) {
                      setErrors((prev) => ({
                        ...prev,
                        email: validateEmail(e.target.value),
                      }));
                    }
                  }}
                  onBlur={() => handleBlur('email')}
                  placeholder="user@example.com"
                  className="pl-10"
                  error={touched.email && !!errors.email}
                  disabled={loading}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {touched.email && errors.email && (
                <span className="text-sm text-destructive" role="alert">
                  {errors.email}
                </span>
              )}
            </div>

            {/* Name Field */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="create-user-name">
                {t('admin.users.form.name')} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="create-user-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (touched.name) {
                      setErrors((prev) => ({
                        ...prev,
                        name: validateName(e.target.value),
                      }));
                    }
                  }}
                  onBlur={() => handleBlur('name')}
                  placeholder={t('admin.users.form.namePlaceholder')}
                  className="pl-10"
                  error={touched.name && !!errors.name}
                  disabled={loading}
                  autoComplete="name"
                />
              </div>
              {touched.name && errors.name ? (
                <span className="text-sm text-destructive" role="alert">
                  {errors.name}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {t('admin.users.form.nameLengthHint')}
                </span>
              )}
            </div>
          </div>

          {/* Password Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">{t('admin.users.form.securitySettings')}</h3>
            </div>
            <Separator />

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="create-user-password">
                {t('admin.users.form.initialPassword')} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="create-user-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (touched.password) {
                      setErrors((prev) => ({
                        ...prev,
                        password: validatePassword(e.target.value),
                      }));
                    }
                  }}
                  onBlur={() => handleBlur('password')}
                  placeholder={t('admin.users.form.passwordPlaceholder')}
                  className="pl-10 pr-10"
                  error={touched.password && !!errors.password}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {touched.password && errors.password ? (
                <span className="text-sm text-destructive" role="alert">
                  {errors.password}
                </span>
              ) : !password && (
                <span className="text-xs text-muted-foreground">
                  {t('admin.users.form.passwordHint')}
                </span>
              )}

              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((index) => (
                      <div
                        key={index}
                        className={cn(
                          'h-1 flex-1 rounded-full transition-colors',
                          index < passwordStrength.length
                            ? strengthPercent === 100
                              ? 'bg-emerald-500'
                              : strengthPercent >= 66
                                ? 'bg-yellow-500'
                                : 'bg-destructive'
                            : 'bg-muted'
                        )}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {PASSWORD_RULES.map((rule) => {
                      const passed = rule.test(password);
                      return (
                        <div
                          key={rule.key}
                          className={cn(
                            'flex items-center gap-1 text-xs transition-colors',
                            passed ? 'text-emerald-600' : 'text-muted-foreground'
                          )}
                        >
                          {passed ? (
                            <Check className="size-3" />
                          ) : (
                            <X className="size-3" />
                          )}
                          {t(rule.labelKey)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading || !isFormValid}>
            {loading ? t('common.loading.creating') : t('admin.users.form.createUser')}
          </Button>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.actions.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
