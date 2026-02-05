/**
 * Edit User Dialog Component
 */

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '@/shared/utils/date-utils';
import * as Dialog from '@radix-ui/react-dialog';
import * as LabelPrimitive from '@radix-ui/react-label';
import * as Separator from '@radix-ui/react-separator';
import { X } from 'lucide-react';
import { SimpleSelect } from '@/lib/SimpleSelect';
import { getButtonClass, inputStyles, labelStyles } from '@/lib/ui-styles';
import { cn } from '@/lib/utils';
import { TruncatedId } from '@/components/admin';
import type { UserResponse, UpdateUserRequest } from '@/api/user';
import type { UserStatus, UserRole } from '../types/users.types';

interface EditUserDialogProps {
  open: boolean;
  user: UserResponse | null;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateUserRequest) => void;
}

export const EditUserDialog: React.FC<EditUserDialogProps> = ({
  open,
  user,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<UserStatus>('active');
  const [role, setRole] = useState<UserRole>('user');
  const [errors, setErrors] = useState<{ email?: string; name?: string }>({});

  // Build status options with translations
  const statusOptions = useMemo(() => [
    { value: 'active' as UserStatus, label: t('common.status.enabled') },
    { value: 'inactive' as UserStatus, label: t('common.status.disabled') },
    { value: 'pending' as UserStatus, label: t('common.status.pending') },
    { value: 'suspended' as UserStatus, label: t('common.status.suspended') },
  ], [t]);

  // Build role options with translations
  const roleOptions = useMemo(() => [
    { value: 'user' as UserRole, label: t('common.role.user') },
    { value: 'admin' as UserRole, label: t('common.role.admin') },
  ], [t]);

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setName(user.name || '');
      setStatus((user.status as UserStatus) || 'active');
      setRole((user.role as UserRole) || 'user');
      setErrors({});
    }
  }, [user]);

  const validate = () => {
    const newErrors: { email?: string; name?: string } = {};

    // Email validation (if provided)
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('admin.users.validation.emailInvalid');
    }

    // Name validation (if provided)
    if (name.trim() && (name.trim().length < 2 || name.trim().length > 100)) {
      newErrors.name = t('admin.users.validation.nameLengthError');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (user && validate()) {
      // Only submit changed fields
      const updates: UpdateUserRequest = {};
      if (email !== user.email) updates.email = email;
      if (name !== user.name) updates.name = name;
      if (status !== user.status) updates.status = status as UpdateUserRequest['status'];
      if (role !== user.role) updates.role = role as UpdateUserRequest['role'];

      // If any changes, submit update
      if (Object.keys(updates).length > 0) {
        onSubmit(user.id, updates);
      }
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  // Check for changes
  const hasChanges = user && (
    email !== user.email ||
    name !== user.name ||
    status !== user.status ||
    role !== user.role
  );

  if (!user) return null;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="@container fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold leading-none tracking-tight">
              {t('admin.users.edit.title')}
            </Dialog.Title>
            <Dialog.Close className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>

          <div className="grid gap-6 py-4">
            {/* Read-only basic info */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">{t('common.sections.basicInfo')}</h4>
              </div>
              <Separator.Root className="shrink-0 bg-border h-[1px] w-full" />
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <LabelPrimitive.Root className={labelStyles}>{t('admin.users.edit.userId')}</LabelPrimitive.Root>
                  <div className={cn(inputStyles, "bg-muted flex items-center")}>
                    <TruncatedId id={user.id} fullWidth />
                  </div>
                </div>
                <div className="grid gap-2">
                  <LabelPrimitive.Root className={labelStyles}>{t('common.fields.createdAt')}</LabelPrimitive.Root>
                  <input
                    value={formatDateTime(user.createdAt)}
                    disabled
                    className={cn(inputStyles, "bg-muted")}
                  />
                </div>
              </div>
            </div>

            {/* Editable fields */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">{t('common.sections.editableInfo')}</h4>
              </div>
              <Separator.Root className="shrink-0 bg-border h-[1px] w-full" />
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <LabelPrimitive.Root htmlFor="email" className={labelStyles}>
                    {t('admin.users.fields.emailShort')}
                  </LabelPrimitive.Root>
                  <input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(inputStyles, errors.email && "border-destructive")}
                  />
                  {errors.email && (
                    <span className="text-sm text-destructive">{errors.email}</span>
                  )}
                </div>

                <div className="grid gap-2">
                  <LabelPrimitive.Root htmlFor="name" className={labelStyles}>
                    {t('common.fields.name')}
                  </LabelPrimitive.Root>
                  <input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={cn(inputStyles, errors.name && "border-destructive")}
                  />
                  {errors.name ? (
                    <span className="text-sm text-destructive">{errors.name}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">{t('admin.users.fields.nameLengthHint')}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2">
                  <div className="grid gap-2">
                    <LabelPrimitive.Root className={labelStyles}>{t('common.status.label')}</LabelPrimitive.Root>
                    <SimpleSelect
                      value={status}
                      onValueChange={(value) => setStatus(value as UserStatus)}
                      options={statusOptions}
                    />
                  </div>

                  <div className="grid gap-2">
                    <LabelPrimitive.Root className={labelStyles}>{t('admin.users.fields.role')}</LabelPrimitive.Root>
                    <SimpleSelect
                      value={role}
                      onValueChange={(value) => setRole(value as UserRole)}
                      options={roleOptions}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className={getButtonClass('outline', 'default')}
            >
              {t('common.actions.cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!hasChanges}
              className={getButtonClass('default', 'default')}
            >
              {t('common.actions.save')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
