/**
 * UserDetailSheet - Mobile user details with actions
 *
 * Features:
 * - Full user details in a bottom sheet
 * - Primary actions in footer
 * - ActionSheet for secondary actions
 * - iOS-style design
 */

import { useState, memo } from 'react';
import { formatDateTime } from '@/shared/utils/date-utils';
import { useTranslation } from 'react-i18next';
import {
  Mail,
  Shield,
  Crown,
  Calendar,
  Hash,
  Edit,
  MoreHorizontal,
  CreditCard,
  KeyRound,
  Trash2,
  Clock,
  UserCheck,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from '@/components/common/sheet/Sheet';
import { ActionSheet } from '@/components/common/sheet/ActionSheet';
import { AdminBadge } from '@/components/admin';
import { cn } from '@/lib/utils';
import { ACTIVE_STATUS_CONFIG, ROLE_CONFIG } from '@/shared/constants/status-config';
import type { UserResponse } from '@/api/user';

// ============================================================================
// Types
// ============================================================================

export interface UserDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserResponse | null;
  onEdit: (user: UserResponse) => void;
  onAssignSubscription: (user: UserResponse) => void;
  onResetPassword: (user: UserResponse) => void;
  onDelete: (user: UserResponse) => void;
}

// ============================================================================
// Helper Components
// ============================================================================

const DetailSection = memo(({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
      {title}
    </h4>
    <div className="rounded-xl bg-muted/30 ring-1 ring-border/50 divide-y divide-border/30">
      {children}
    </div>
  </div>
));

DetailSection.displayName = 'DetailSection';

const DetailRow = memo(({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-center gap-3 px-3 py-2.5">
    <div className="text-muted-foreground">{icon}</div>
    <div className="flex-1 min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  </div>
));

DetailRow.displayName = 'DetailRow';

const UserAvatar = memo(({ name, email, role }: { name?: string; email: string; role?: string }) => {
  const initial = (name || email).charAt(0).toUpperCase();
  const isAdmin = role === 'admin';

  return (
    <div
      className={cn(
        'relative size-12 rounded-xl flex items-center justify-center',
        'text-lg font-semibold',
        isAdmin
          ? 'bg-gradient-to-br from-warning to-warning/80 text-warning-foreground'
          : 'bg-primary/10 text-primary'
      )}
    >
      {initial}
      {isAdmin && (
        <div className="absolute -bottom-0.5 -right-0.5 size-5 rounded-full bg-warning flex items-center justify-center">
          <Crown className="size-3 text-warning-foreground" />
        </div>
      )}
    </div>
  );
});

UserAvatar.displayName = 'UserAvatar';

// ============================================================================
// Main Component
// ============================================================================

export const UserDetailSheet = ({
  open,
  onOpenChange,
  user,
  onEdit,
  onAssignSubscription,
  onResetPassword,
  onDelete,
}: UserDetailSheetProps) => {
  const { t } = useTranslation();
  const [actionSheetOpen, setActionSheetOpen] = useState(false);

  if (!user) return null;

  const statusConfig = ACTIVE_STATUS_CONFIG[user.status] || { labelKey: user.status, variant: 'default' as const };
  const roleConfig = ROLE_CONFIG[user.role || 'user'] || { labelKey: 'common.role.user', variant: 'default' as const };

  // Action Sheet actions
  const moreActions = [
    {
      label: t('user.detail.resetPassword'),
      icon: <KeyRound className="size-5" />,
      onPress: async () => {
        onResetPassword(user);
        onOpenChange(false);
      },
    },
    {
      label: t('user.detail.deleteUser'),
      icon: <Trash2 className="size-5" />,
      onPress: async () => {
        onDelete(user);
        onOpenChange(false);
      },
      variant: 'destructive' as const,
    },
  ];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent showClose>
          <SheetHeader>
            <div className="flex items-center gap-3">
              <UserAvatar name={user.name} email={user.email} role={user.role} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <SheetTitle className="truncate">
                    {user.name || user.email.split('@')[0]}
                  </SheetTitle>
                  <AdminBadge variant={statusConfig.variant} className="text-[10px] px-1.5 py-0 shrink-0">
                    {t(statusConfig.labelKey)}
                  </AdminBadge>
                </div>
                <SheetDescription className="truncate text-xs">
                  {user.email}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <SheetBody className="space-y-4 pb-4">
            {/* Basic Info */}
            <DetailSection title={t('user.detail.basicInfo')}>
              <DetailRow
                icon={<Mail className="size-4" />}
                label={t('user.detail.email')}
                value={<span className="break-all">{user.email}</span>}
              />
              <DetailRow
                icon={<Shield className="size-4" />}
                label={t('user.detail.role')}
                value={
                  <div className="flex items-center gap-1.5">
                    {user.role === 'admin' && <Crown className="size-3.5 text-warning" />}
                    <AdminBadge variant={roleConfig.variant} className="text-xs">
                      {t(roleConfig.labelKey)}
                    </AdminBadge>
                  </div>
                }
              />
              <DetailRow
                icon={<UserCheck className="size-4" />}
                label={t('common.status.label')}
                value={
                  <AdminBadge variant={statusConfig.variant} className="text-xs">
                    {t(statusConfig.labelKey)}
                  </AdminBadge>
                }
              />
              <DetailRow
                icon={<Hash className="size-4" />}
                label={t('user.detail.userId')}
                value={<span className="font-mono text-xs">{user.id}</span>}
              />
            </DetailSection>

            {/* Time Info */}
            <DetailSection title={t('user.detail.timeInfo')}>
              <DetailRow
                icon={<Calendar className="size-4" />}
                label={t('user.detail.registrationTime')}
                value={formatDateTime(user.createdAt)}
              />
              <DetailRow
                icon={<Clock className="size-4" />}
                label={t('user.detail.lastUpdated')}
                value={formatDateTime(user.updatedAt)}
              />
            </DetailSection>
          </SheetBody>

          <SheetFooter>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onEdit(user);
                  onOpenChange(false);
                }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2',
                  'h-11 rounded-xl',
                  'bg-primary text-primary-foreground',
                  'text-sm font-medium',
                  'active:scale-[0.98] transition-transform'
                )}
              >
                <Edit className="size-4" />
                {t('common.actions.edit')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onAssignSubscription(user);
                  onOpenChange(false);
                }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2',
                  'h-11 rounded-xl',
                  'bg-muted text-foreground',
                  'text-sm font-medium',
                  'active:scale-[0.98] transition-transform'
                )}
              >
                <CreditCard className="size-4" />
                {t('user.detail.subscription')}
              </button>
              <button
                type="button"
                onClick={() => setActionSheetOpen(true)}
                className={cn(
                  'size-11 rounded-xl shrink-0',
                  'flex items-center justify-center',
                  'bg-muted text-foreground',
                  'active:scale-[0.98] transition-transform'
                )}
              >
                <MoreHorizontal className="size-5" />
              </button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* More Actions ActionSheet */}
      <ActionSheet
        open={actionSheetOpen}
        onOpenChange={setActionSheetOpen}
        actions={moreActions}
        title={t('common.moreActions')}
      />
    </>
  );
};

UserDetailSheet.displayName = 'UserDetailSheet';
