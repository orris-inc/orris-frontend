/**
 * User Mobile List Component
 * Mobile-friendly card list with Accordion for expanded details
 */

import { useTranslation } from 'react-i18next';
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
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4 text-slate-500" />
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
            <DropdownMenuItem onSelect={() => onDelete(user)} className="text-red-600 dark:text-red-400">
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
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
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
                    <span className="font-medium text-sm text-slate-900 dark:text-white truncate">
                      {user.name || user.email}
                    </span>
                    <AdminBadge variant={statusConfig.variant} className="text-[10px] px-1.5 py-0 flex-shrink-0">
                      {t(statusConfig.labelKey)}
                    </AdminBadge>
                  </div>

                  {/* Email (if name exists) and role */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    {user.name && (
                      <>
                        <Mail className="size-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{user.email}</span>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
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
                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Edit className="size-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{t('common.actions.edit')}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onAssignSubscription(user)}
                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <CreditCard className="size-3.5 text-slate-400 hover:text-blue-500" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{t('admin.users.actions.assignSubscription')}</TooltipContent>
                  </Tooltip>
                  {renderDropdownMenu(user)}
                </div>
              </div>
            </div>

            {/* Accordion Trigger */}
            <AccordionTrigger className="px-3 py-1.5 border-t border-slate-100 dark:border-slate-700 hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <span className="text-xs text-slate-400 dark:text-slate-500">{t('admin.users.actions.details')}</span>
            </AccordionTrigger>

            {/* Accordion Content - Expanded details */}
            <AccordionContent>
              <div className="px-3 pb-2 space-y-2 border-t border-slate-100 dark:border-slate-700 pt-2">
                {/* ID */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-10 flex-shrink-0">ID</span>
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate">{user.id}</span>
                </div>

                {/* Email (always show in details) */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-10 flex-shrink-0">{t('admin.users.fields.emailShort')}</span>
                  <span className="text-xs text-slate-600 dark:text-slate-300 truncate">{user.email}</span>
                </div>

                {/* Name */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-10 flex-shrink-0">{t('common.fields.name')}</span>
                  <span className="text-xs text-slate-600 dark:text-slate-300">{user.name || '-'}</span>
                </div>

                {/* Created at */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-10 flex-shrink-0">{t('admin.users.fields.createdAt')}</span>
                  <span className="text-xs text-slate-500">{formatDate(user.createdAt)}</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};
