/**
 * UserDetailSheet - Mobile user details with actions
 *
 * Features:
 * - Full user details in a bottom sheet
 * - Primary actions in footer
 * - ActionSheet for secondary actions
 * - iOS-style design
 */

import { useState } from 'react';
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

const DetailSection = ({
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
    <div className="rounded-xl bg-muted/30 border border-border/50 divide-y divide-border/30">
      {children}
    </div>
  </div>
);

const DetailRow = ({
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
);

const UserAvatar = ({ name, email, role }: { name?: string; email: string; role?: string }) => {
  const initial = (name || email).charAt(0).toUpperCase();
  const isAdmin = role === 'admin';

  return (
    <div
      className={cn(
        'relative size-12 rounded-xl flex items-center justify-center',
        'text-lg font-semibold',
        isAdmin
          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
          : 'bg-primary/10 text-primary'
      )}
    >
      {initial}
      {isAdmin && (
        <div className="absolute -bottom-0.5 -right-0.5 size-5 rounded-full bg-amber-500 flex items-center justify-center">
          <Crown className="size-3 text-white" />
        </div>
      )}
    </div>
  );
};

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
  const [actionSheetOpen, setActionSheetOpen] = useState(false);

  if (!user) return null;

  const statusConfig = ACTIVE_STATUS_CONFIG[user.status] || { label: user.status, variant: 'default' as const };
  const roleConfig = ROLE_CONFIG[user.role || 'user'] || { label: '用户', variant: 'default' as const };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Action Sheet actions
  const moreActions = [
    {
      label: '重置密码',
      icon: <KeyRound className="size-5" />,
      onPress: async () => {
        onResetPassword(user);
        onOpenChange(false);
      },
    },
    {
      label: '删除用户',
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
                    {statusConfig.label}
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
            <DetailSection title="基本信息">
              <DetailRow
                icon={<Mail className="size-4" />}
                label="邮箱"
                value={<span className="break-all">{user.email}</span>}
              />
              <DetailRow
                icon={<Shield className="size-4" />}
                label="角色"
                value={
                  <div className="flex items-center gap-1.5">
                    {user.role === 'admin' && <Crown className="size-3.5 text-amber-500" />}
                    <AdminBadge variant={roleConfig.variant} className="text-xs">
                      {roleConfig.label}
                    </AdminBadge>
                  </div>
                }
              />
              <DetailRow
                icon={<UserCheck className="size-4" />}
                label="状态"
                value={
                  <AdminBadge variant={statusConfig.variant} className="text-xs">
                    {statusConfig.label}
                  </AdminBadge>
                }
              />
              <DetailRow
                icon={<Hash className="size-4" />}
                label="用户 ID"
                value={<span className="font-mono text-xs">{user.id}</span>}
              />
            </DetailSection>

            {/* Time Info */}
            <DetailSection title="时间信息">
              <DetailRow
                icon={<Calendar className="size-4" />}
                label="注册时间"
                value={formatDate(user.createdAt)}
              />
              <DetailRow
                icon={<Clock className="size-4" />}
                label="最后更新"
                value={formatDate(user.updatedAt)}
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
                  'active:scale-[0.97] transition-transform'
                )}
              >
                <Edit className="size-4" />
                编辑
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
                  'active:scale-[0.97] transition-transform'
                )}
              >
                <CreditCard className="size-4" />
                订阅
              </button>
              <button
                type="button"
                onClick={() => setActionSheetOpen(true)}
                className={cn(
                  'size-11 rounded-xl shrink-0',
                  'flex items-center justify-center',
                  'bg-muted text-foreground',
                  'active:scale-[0.97] transition-transform'
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
        title="更多操作"
      />
    </>
  );
};

UserDetailSheet.displayName = 'UserDetailSheet';
