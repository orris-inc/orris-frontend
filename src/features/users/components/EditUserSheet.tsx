/**
 * Edit User Sheet Component
 * Mobile-optimized bottom sheet for editing user information
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/shared/utils/date-utils';
import { UserPen, Mail, User, Shield, Activity } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  type EditSheetProps,
} from '@/components/common/sheet';
import { Button } from '@/components/common/Button';
import { Separator } from '@/components/common/Separator';
import { TruncatedId } from '@/components/admin';
import { MobileFormInput, MobileSelect, type MobileSelectOption } from '@/components/common/mobile-form';
import type { UserResponse, UpdateUserRequest } from '@/api/user';
import type { UserStatus, UserRole } from '../types/users.types';

type EditUserSheetProps = EditSheetProps<UserResponse, UpdateUserRequest>;

// Status options with color configuration
const STATUS_COLOR_MAP: Record<string, string> = {
  active: 'bg-success',
  inactive: 'bg-muted-foreground',
  pending: 'bg-warning',
  suspended: 'bg-destructive',
};

export const EditUserSheet: React.FC<EditUserSheetProps> = ({
  open,
  onOpenChange,
  entity: user,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<UserStatus>('active');
  const [role, setRole] = useState<UserRole>('user');
  const [errors, setErrors] = useState<{ email?: string; name?: string }>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Build status options with translations
  const statusOptions: MobileSelectOption[] = useMemo(() => [
    { value: 'active', label: t('admin.users.status.active'), color: 'bg-success' },
    { value: 'inactive', label: t('admin.users.status.inactive'), color: 'bg-muted-foreground' },
    { value: 'pending', label: t('admin.users.status.pending'), color: 'bg-warning' },
    { value: 'suspended', label: t('admin.users.status.suspended'), color: 'bg-destructive' },
  ], [t]);

  // Build role options with translations
  const roleOptions: MobileSelectOption[] = useMemo(() => [
    { value: 'user', label: t('admin.users.role.user') },
    { value: 'admin', label: t('admin.users.role.admin') },
  ], [t]);

  // Initialize form when user changes
  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setName(user.name || '');
      setStatus((user.status as UserStatus) || 'active');
      setRole((user.role as UserRole) || 'user');
      setErrors({});
      setTouched({});
    }
  }, [user]);

  // Validation functions
  const validateEmail = useCallback((value: string): string | undefined => {
    if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return t('admin.users.validation.emailInvalid');
    }
    return undefined;
  }, [t]);

  const validateName = useCallback((value: string): string | undefined => {
    if (value.trim() && (value.trim().length < 2 || value.trim().length > 100)) {
      return t('admin.users.validation.nameLengthError');
    }
    return undefined;
  }, [t]);

  const handleBlur = useCallback((field: 'email' | 'name') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const validators = { email: validateEmail, name: validateName };
    const values = { email, name };
    setErrors((prev) => ({ ...prev, [field]: validators[field](values[field]) }));
  }, [email, name, validateEmail, validateName]);

  const validate = useCallback((): boolean => {
    const newErrors = {
      email: validateEmail(email),
      name: validateName(name),
    };
    setErrors(newErrors);
    return !newErrors.email && !newErrors.name;
  }, [email, name, validateEmail, validateName]);

  const handleSubmit = useCallback(() => {
    if (!user || !validate()) return;

    // Only submit changed fields
    const updates: UpdateUserRequest = {};
    if (email !== user.email) updates.email = email;
    if (name !== user.name) updates.name = name;
    if (status !== user.status) updates.status = status as UpdateUserRequest['status'];
    if (role !== user.role) updates.role = role as UpdateUserRequest['role'];

    if (Object.keys(updates).length > 0) {
      onSubmit(user.id, updates);
    }
  }, [user, email, name, status, role, validate, onSubmit]);

  // Check for changes
  const hasChanges = user && (
    email !== user.email ||
    name !== user.name ||
    status !== user.status ||
    role !== user.role
  );

  if (!user) return null;

  const currentStatusColor = STATUS_COLOR_MAP[status];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="size-10 rounded-full bg-info/10 flex items-center justify-center">
              <UserPen className="size-5 text-info" />
            </div>
            <span>{t('admin.users.edit.title')}</span>
          </SheetTitle>
          <SheetDescription>
            {t('admin.users.edit.description', { name: user.name || user.email })}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-5 py-3">
          {/* Read-only Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground px-1">{t('admin.users.edit.basicInfo')}</h4>
            <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('admin.users.edit.userId')}</span>
                <TruncatedId id={user.id} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('admin.users.edit.createdAt')}</span>
                <span className="text-sm">{formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground px-1">{t('admin.users.edit.editableInfo')}</h4>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="edit-email" className="text-sm font-medium px-1">{t('admin.users.fields.email')}</label>
              <MobileFormInput
                id="edit-email"
                type="email"
                value={email}
                onChange={(v) => {
                  setEmail(v);
                  if (touched.email) setErrors((prev) => ({ ...prev, email: validateEmail(v) }));
                }}
                onBlur={() => handleBlur('email')}
                icon={<Mail className="size-5" />}
                error={touched.email ? errors.email : undefined}
              />
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="edit-name" className="text-sm font-medium px-1">{t('admin.users.fields.name')}</label>
              <MobileFormInput
                id="edit-name"
                value={name}
                onChange={(v) => {
                  setName(v);
                  if (touched.name) setErrors((prev) => ({ ...prev, name: validateName(v) }));
                }}
                onBlur={() => handleBlur('name')}
                placeholder={t('admin.users.fields.namePlaceholder')}
                icon={<User className="size-5" />}
                error={touched.name ? errors.name : undefined}
              />
              {!touched.name && !errors.name && (
                <p className="text-xs text-muted-foreground px-1">{t('admin.users.fields.nameLengthHint')}</p>
              )}
            </div>

            {/* Status & Role */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium px-1 flex items-center gap-2">
                  {t('admin.users.fields.status')}
                  {currentStatusColor && (
                    <span className={`size-2 rounded-full ${currentStatusColor}`} />
                  )}
                </label>
                <MobileSelect
                  value={status}
                  onChange={(v) => setStatus(v as UserStatus)}
                  options={statusOptions}
                  icon={<Activity className="size-5" />}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium px-1">{t('admin.users.fields.role')}</label>
                <MobileSelect
                  value={role}
                  onChange={(v) => setRole(v as UserRole)}
                  options={roleOptions}
                  icon={<Shield className="size-5" />}
                />
              </div>
            </div>
          </div>
        </SheetBody>

        <SheetFooter>
          <Button
            onClick={handleSubmit}
            disabled={!hasChanges}
            className="w-full min-h-[48px]"
          >
            {t('admin.users.edit.saveChanges')}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full min-h-[44px]"
          >
            {t('admin.users.actions.cancel')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
