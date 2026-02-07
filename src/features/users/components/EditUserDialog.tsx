/**
 * Edit User Dialog Component
 */

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
import { useEditUserForm } from '../hooks/useEditUserForm';
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
  const form = useEditUserForm({ user });

  const handleSubmit = () => {
    if (!form.validate()) return;
    const result = form.buildSubmitData();
    if (result) {
      onSubmit(result.id, result.data);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

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
              <span className="sr-only">{t('common.actions.close')}</span>
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
                    value={form.email}
                    onChange={(e) => form.handleEmailChange(e.target.value)}
                    className={cn(inputStyles, form.errors.email && "border-destructive")}
                  />
                  {form.errors.email && (
                    <span className="text-sm text-destructive">{form.errors.email}</span>
                  )}
                </div>

                <div className="grid gap-2">
                  <LabelPrimitive.Root htmlFor="name" className={labelStyles}>
                    {t('common.fields.name')}
                  </LabelPrimitive.Root>
                  <input
                    id="name"
                    value={form.name}
                    onChange={(e) => form.handleNameChange(e.target.value)}
                    className={cn(inputStyles, form.errors.name && "border-destructive")}
                  />
                  {form.errors.name ? (
                    <span className="text-sm text-destructive">{form.errors.name}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">{t('admin.users.fields.nameLengthHint')}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2">
                  <div className="grid gap-2">
                    <LabelPrimitive.Root className={labelStyles}>{t('common.status.label')}</LabelPrimitive.Root>
                    <SimpleSelect
                      value={form.status}
                      onValueChange={(value) => form.setStatus(value as UserStatus)}
                      options={form.statusOptions}
                    />
                  </div>

                  <div className="grid gap-2">
                    <LabelPrimitive.Root className={labelStyles}>{t('admin.users.fields.role')}</LabelPrimitive.Root>
                    <SimpleSelect
                      value={form.role}
                      onValueChange={(value) => form.setRole(value as UserRole)}
                      options={form.roleOptions}
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
              disabled={!form.hasChanges}
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
