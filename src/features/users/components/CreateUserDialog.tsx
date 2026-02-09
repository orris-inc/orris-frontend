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
import { useCreateUserForm } from '../hooks/useCreateUserForm';
import type { CreateUserRequest } from '@/api/user';

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserRequest) => Promise<void>;
}

export const CreateUserDialog: React.FC<CreateUserDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const form = useCreateUserForm({ open });

  const handleClose = useCallback(() => {
    if (!loading) {
      form.reset();
      onClose();
    }
  }, [loading, form, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!form.validate()) return;

    setLoading(true);
    try {
      await onSubmit(form.buildSubmitData());
      form.reset();
      onClose();
    } finally {
      setLoading(false);
    }
  }, [form, onSubmit, onClose]);

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
                  value={form.email}
                  onChange={(e) => form.handleEmailChange(e.target.value)}
                  onBlur={() => form.handleBlur('email')}
                  placeholder="user@example.com"
                  className="pl-10"
                  error={form.touched.email && !!form.errors.email}
                  disabled={loading}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {form.touched.email && form.errors.email && (
                <span className="text-sm text-destructive" role="alert">
                  {form.errors.email}
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
                  value={form.name}
                  onChange={(e) => form.handleNameChange(e.target.value)}
                  onBlur={() => form.handleBlur('name')}
                  placeholder={t('admin.users.form.namePlaceholder')}
                  className="pl-10"
                  error={form.touched.name && !!form.errors.name}
                  disabled={loading}
                  autoComplete="name"
                />
              </div>
              {form.touched.name && form.errors.name ? (
                <span className="text-sm text-destructive" role="alert">
                  {form.errors.name}
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
                  type={form.showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => form.handlePasswordChange(e.target.value)}
                  onBlur={() => form.handleBlur('password')}
                  placeholder={t('admin.users.form.passwordPlaceholder')}
                  className="pl-10 pr-10"
                  error={form.touched.password && !!form.errors.password}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => form.setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={form.showPassword ? 'Hide password' : 'Show password'}
                >
                  {form.showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {form.touched.password && form.errors.password ? (
                <span className="text-sm text-destructive" role="alert">
                  {form.errors.password}
                </span>
              ) : !form.password && (
                <span className="text-xs text-muted-foreground">
                  {t('admin.users.form.passwordHint')}
                </span>
              )}

              {/* Password Strength Indicator */}
              {form.password && (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((index) => (
                      <div
                        key={index}
                        className={cn(
                          'h-1 flex-1 rounded-full transition-colors',
                          index < form.passwordStrength.length
                            ? form.strengthPercent === 100
                              ? 'bg-success'
                              : form.strengthPercent >= 66
                                ? 'bg-warning'
                                : 'bg-destructive'
                            : 'bg-muted'
                        )}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {form.passwordRules.map((rule) => {
                      const passed = rule.test(form.password);
                      return (
                        <div
                          key={rule.key}
                          className={cn(
                            'flex items-center gap-1 text-xs transition-colors',
                            passed ? 'text-success' : 'text-muted-foreground'
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
          <Button onClick={handleSubmit} disabled={loading || !form.isFormValid}>
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
