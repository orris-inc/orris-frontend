/**
 * Edit User Sheet Component
 * Mobile-optimized bottom sheet for editing user information
 */

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
import { useEditUserForm } from '../hooks/useEditUserForm';
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

// Mobile status options with colors
const MOBILE_STATUS_COLORS: Record<string, string> = {
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
  const form = useEditUserForm({ user });

  // Build mobile-specific status options with colors
  const mobileStatusOptions: MobileSelectOption[] = form.statusOptions.map((opt) => ({
    ...opt,
    color: MOBILE_STATUS_COLORS[opt.value],
  }));

  // Build mobile role options
  const mobileRoleOptions: MobileSelectOption[] = form.roleOptions;

  const handleSubmit = () => {
    if (!form.validate()) return;
    const result = form.buildSubmitData();
    if (result) {
      onSubmit(result.id, result.data);
    }
  };

  if (!user) return null;

  const currentStatusColor = STATUS_COLOR_MAP[form.status];

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
            <h4 className="text-sm font-medium text-muted-foreground px-1">{t('common.sections.basicInfo')}</h4>
            <div className="rounded-xl ring-1 ring-border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('admin.users.edit.userId')}</span>
                <TruncatedId id={user.id} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('common.fields.createdAt')}</span>
                <span className="text-sm">{formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground px-1">{t('common.sections.editableInfo')}</h4>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="edit-email" className="text-sm font-medium px-1">{t('admin.users.fields.email')}</label>
              <MobileFormInput
                id="edit-email"
                type="email"
                value={form.email}
                onChange={form.handleEmailChange}
                onBlur={() => form.handleBlur('email')}
                icon={<Mail className="size-5" />}
                error={form.touched.email ? form.errors.email : undefined}
              />
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="edit-name" className="text-sm font-medium px-1">{t('common.fields.name')}</label>
              <MobileFormInput
                id="edit-name"
                value={form.name}
                onChange={form.handleNameChange}
                onBlur={() => form.handleBlur('name')}
                placeholder={t('admin.users.fields.namePlaceholder')}
                icon={<User className="size-5" />}
                error={form.touched.name ? form.errors.name : undefined}
              />
              {!form.touched.name && !form.errors.name && (
                <p className="text-xs text-muted-foreground px-1">{t('admin.users.fields.nameLengthHint')}</p>
              )}
            </div>

            {/* Status & Role */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium px-1 flex items-center gap-2">
                  {t('common.status.label')}
                  {currentStatusColor && (
                    <span className={`size-2 rounded-full ${currentStatusColor}`} />
                  )}
                </label>
                <MobileSelect
                  value={form.status}
                  onChange={(v) => form.setStatus(v as UserStatus)}
                  options={mobileStatusOptions}
                  icon={<Activity className="size-5" />}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium px-1">{t('admin.users.fields.role')}</label>
                <MobileSelect
                  value={form.role}
                  onChange={(v) => form.setRole(v as UserRole)}
                  options={mobileRoleOptions}
                  icon={<Shield className="size-5" />}
                />
              </div>
            </div>
          </div>
        </SheetBody>

        <SheetFooter>
          <Button
            onClick={handleSubmit}
            disabled={!form.hasChanges}
            className="w-full min-h-[48px]"
          >
            {t('admin.users.edit.saveChanges')}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full min-h-[44px]"
          >
            {t('common.actions.cancel')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
