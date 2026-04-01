/**
 * User Mobile List Component
 * Mobile-friendly card list with Accordion for expanded details
 */

import { useTranslation } from 'react-i18next';
import { SmartTruncate } from '@/components/common/SmartTruncate';
import {
  Edit,
  Trash2,
  MoreHorizontal,
  CreditCard,
  KeyRound,
  Mail,
} from 'lucide-react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/common/Accordion';
import { AdminBadge } from '@/components/admin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { Skeleton } from '@/components/common/Skeleton';
import { formatDate } from '@/shared/utils/date-utils';
import { ACTIVE_STATUS_CONFIG, ROLE_CONFIG } from '@/shared/constants/status-config';
import type { UserResponse } from '@/api/user';

interface UserMobileListProps {
  users: UserResponse[];
  loading?: boolean;
  onEdit: (user: UserResponse) => void;
  onDelete: (user: UserResponse) => void;
  onAssignSubscription: (user: UserResponse) => void;
  onResetPassword: (user: UserResponse) => void;
}


// Loading skeleton for mobile cards
const MobileCardSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-32" />
      </div>
    ))}
  </div>
);

export const UserMobileList: React.FC<UserMobileListProps> = ({
  users,
  loading = false,
  onEdit,
  onDelete,
  onAssignSubscription,
  onResetPassword,
}) => {
  const { t } = useTranslation();
  // Render dropdown menu
  const renderDropdownMenu = (user: UserResponse) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent align="end" collisionPadding={16}>
            <DropdownMenuItem onSelect={() => onAssignSubscription(user)}>
              <CreditCard className="mr-2 size-4" />
              {t('admin.users.actions.assignSubscription')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onEdit(user)}>
              <Edit className="mr-2 size-4" />
              {t('common.actions.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onResetPassword(user)}>
              <KeyRound className="mr-2 size-4" />
              {t('admin.users.actions.resetPassword')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onDelete(user)} className="text-destructive">
              <Trash2 className="mr-2 size-4" />
              {t('common.actions.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>
    );
  };

  if (loading) {
    return <MobileCardSkeleton />;
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t('admin.users.noData')}
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="space-y-1.5">
      {users.map((user) => {
        const statusConfig = ACTIVE_STATUS_CONFIG[user.status] || { labelKey: 'common.status.unknown', variant: 'default' as const };
        const roleConfig = ROLE_CONFIG[user.role || 'user'] || { labelKey: 'common.role.user', variant: 'default' as const };

        return (
          <AccordionItem
            key={user.id}
            value={user.id}
            className="border rounded-lg bg-card overflow-hidden"
          >
            {/* Card Header - Always visible */}
            <div className="px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {/* User name/email and status */}
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <SmartTruncate text={user.name || user.email} className="font-medium text-sm text-foreground" />
                    <AdminBadge variant={statusConfig.variant} className="text-[10px] px-1.5 py-0 flex-shrink-0">
                      {t(statusConfig.labelKey)}
                    </AdminBadge>
                  </div>

                  {/* Email (if name exists) and role */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {user.name && (
                      <>
                        <Mail className="size-3 text-muted-foreground flex-shrink-0" />
                        <SmartTruncate text={user.email} />
                        <span className="text-border">·</span>
                      </>
                    )}
                    <AdminBadge variant={roleConfig.variant} className="text-[10px] px-1.5 py-0">
                      {t(roleConfig.labelKey)}
                    </AdminBadge>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onEdit(user)}
                        className="p-1.5 rounded hover:bg-accent transition-colors"
                      >
                        <Edit className="size-3.5 text-muted-foreground hover:text-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{t('common.actions.edit')}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onAssignSubscription(user)}
                        className="p-1.5 rounded hover:bg-accent transition-colors"
                      >
                        <CreditCard className="size-3.5 text-muted-foreground hover:text-info" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{t('admin.users.actions.assignSubscription')}</TooltipContent>
                  </Tooltip>
                  {renderDropdownMenu(user)}
                </div>
              </div>
            </div>

            {/* Accordion Trigger */}
            <AccordionTrigger className="px-3 py-1.5 border-t border-border/50 hover:no-underline hover:bg-muted/30">
              <span className="text-xs text-muted-foreground">{t('admin.users.actions.details')}</span>
            </AccordionTrigger>

            {/* Accordion Content - Expanded details */}
            <AccordionContent>
              <div className="px-3 pb-2 space-y-2 border-t border-border/50 pt-2">
                {/* ID */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide w-10 flex-shrink-0">ID</span>
                  <SmartTruncate text={user.id} className="text-xs text-muted-foreground" mono font="12px 'SF Mono', ui-monospace, monospace" lineHeight={16} />
                </div>

                {/* Email (always show in details) */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide w-10 flex-shrink-0">{t('admin.users.fields.emailShort')}</span>
                  <SmartTruncate text={user.email} className="text-xs text-muted-foreground" />
                </div>

                {/* Name */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide w-10 flex-shrink-0">{t('common.fields.name')}</span>
                  <span className="text-xs text-muted-foreground">{user.name || '-'}</span>
                </div>

                {/* Created at */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide w-10 flex-shrink-0">{t('admin.users.fields.createdAt')}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(user.createdAt)}</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};
