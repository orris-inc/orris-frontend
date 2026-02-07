/**
 * Create User Sheet Component
 * Mobile-optimized bottom sheet for creating new users
 * Compact layout matching other create sheets
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useCreateUserForm } from '../hooks/useCreateUserForm';
import type { CreateUserRequest } from '@/api/user';

type CreateUserSheetProps = CreateSheetProps<CreateUserRequest>;

// Compact input styles matching other create sheets
// Use text-base (16px) to prevent iOS Safari viewport zoom on focus
const compactInputStyles = 'min-h-[44px] py-2 rounded-lg';

export const CreateUserSheet: React.FC<CreateUserSheetProps> = ({
  open,
  onOpenChange,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const form = useCreateUserForm({ open });

  const handleClose = useCallback(() => {
    if (!loading) {
      form.reset();
      onOpenChange(false);
    }
  }, [loading, form, onOpenChange]);

  const handleSubmit = useCallback(async () => {
    if (!form.validate()) return;

    setLoading(true);
    try {
      await onSubmit(form.buildSubmitData());
      form.reset();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }, [form, onSubmit, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <SheetContent>
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
              <UserPlus className="size-4 text-primary" />
            </div>
            <span>{t('admin.users.create.title')}</span>
          </SheetTitle>
          <SheetDescription className="text-xs">
            {t('admin.users.create.description')}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-4 py-3">
          {/* Section Header */}
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('admin.users.form.accountInfo')}
          </h4>

          {/* Email & Name - 2 column grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label htmlFor="mobile-email" className="text-xs font-medium">
                {t('admin.users.fields.email')} <span className="text-destructive">*</span>
              </label>
              <MobileFormInput
                id="mobile-email"
                type="email"
                value={form.email}
                onChange={form.handleEmailChange}
                onBlur={() => form.handleBlur('email')}
                placeholder="user@example.com"
                icon={<Mail className="size-4" />}
                error={form.touched.email ? form.errors.email : undefined}
                disabled={loading}
                autoComplete="email"
                className={compactInputStyles}
                containerClassName="space-y-1"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="mobile-name" className="text-xs font-medium">
                {t('common.fields.name')} <span className="text-destructive">*</span>
              </label>
              <MobileFormInput
                id="mobile-name"
                value={form.name}
                onChange={form.handleNameChange}
                onBlur={() => form.handleBlur('name')}
                placeholder={t('admin.users.fields.namePlaceholderShort')}
                icon={<User className="size-4" />}
                error={form.touched.name ? form.errors.name : undefined}
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
              {t('admin.users.form.initialPassword')} <span className="text-destructive">*</span>
            </label>
            <MobilePasswordInput
              id="mobile-password"
              value={form.password}
              onChange={form.handlePasswordChange}
              onBlur={() => form.handleBlur('password')}
              placeholder={t('common.placeholders.password')}
              error={form.touched.password ? form.errors.password : undefined}
              disabled={loading}
              showPassword={form.showPassword}
              onToggleShow={() => form.setShowPassword((prev) => !prev)}
              className={compactInputStyles}
              containerClassName="space-y-1"
            />

            {/* Compact password strength indicator */}
            {form.strengthInfo && (
              <div className="flex items-center gap-2 px-1 pt-1">
                <div className="flex gap-1 flex-1 max-w-20">
                  {[...Array(form.strengthInfo.total)].map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-1 flex-1 rounded-full transition-colors',
                        i < form.strengthInfo!.passed
                          ? form.strengthInfo!.passed === form.strengthInfo!.total
                            ? 'bg-emerald-500'
                            : 'bg-yellow-500'
                          : 'bg-muted'
                      )}
                    />
                  ))}
                </div>
                <span className={cn(
                  'text-xs',
                  form.strengthInfo.passed === form.strengthInfo.total ? 'text-emerald-600' : 'text-muted-foreground'
                )}>
                  {form.strengthInfo.passed === form.strengthInfo.total ? t('admin.users.create.passwordValid') : `${form.strengthInfo.passed}/${form.strengthInfo.total}`}
                </span>
              </div>
            )}
          </div>

          {/* Info hint */}
          <div className="rounded-xl ring-1 ring-border bg-muted/30 p-3">
            <div className="flex items-start gap-2">
              <Lock className="size-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                {t('admin.users.create.passwordSecurityHint')}
              </p>
            </div>
          </div>
        </SheetBody>

        <SheetFooter>
          <Button
            onClick={handleSubmit}
            disabled={loading || !form.isFormValid}
            className="w-full min-h-[48px]"
          >
            {loading ? t('common.loading.creating') : t('admin.users.create.createUser')}
          </Button>
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
            className="w-full min-h-[44px]"
          >
            {t('common.actions.cancel')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
