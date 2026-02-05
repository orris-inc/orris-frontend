/**
 * User Filters Component
 * Desktop filtering toolbar for user management
 * Design pattern follows PlanFilters component
 */

import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import type { UserFilters as UserFiltersType, UserStatus, UserRole } from '../types/users.types';

// ============================================================================
// Types
// ============================================================================

export interface UserFiltersProps {
  filters: UserFiltersType;
  onFiltersChange: (filters: Partial<UserFiltersType>) => void;
  hasFilters: boolean;
  onClearFilters: () => void;
  className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export const UserFilters = ({
  filters,
  onFiltersChange,
  hasFilters,
  onClearFilters,
  className,
}: UserFiltersProps) => {
  const { t } = useTranslation();

  // Handle status change
  const handleStatusChange = (value: string) => {
    onFiltersChange({
      status: value === 'all' ? undefined : (value as UserStatus),
    });
  };

  // Handle role change
  const handleRoleChange = (value: string) => {
    onFiltersChange({
      role: value === 'all' ? undefined : (value as UserRole),
    });
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {/* Status filter */}
      <Select
        value={filters.status ?? 'all'}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-[120px] h-9">
          <SelectValue placeholder={t('common.status.label')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('filter.all')}</SelectItem>
          <SelectItem value="active">{t('common.status.enabled')}</SelectItem>
          <SelectItem value="inactive">{t('common.status.disabled')}</SelectItem>
          <SelectItem value="pending">{t('common.status.pending')}</SelectItem>
          <SelectItem value="suspended">{t('common.status.suspended')}</SelectItem>
        </SelectContent>
      </Select>

      {/* Role filter */}
      <Select
        value={filters.role ?? 'all'}
        onValueChange={handleRoleChange}
      >
        <SelectTrigger className="w-[120px] h-9">
          <SelectValue placeholder={t('filter.role')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('filter.allRoles')}</SelectItem>
          <SelectItem value="user">{t('common.role.user')}</SelectItem>
          <SelectItem value="admin">{t('common.role.admin')}</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear filters button */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-muted-foreground h-9"
        >
          <X className="size-4 mr-1" />
          {t('filter.clearAdvanced')}
        </Button>
      )}
    </div>
  );
};

UserFilters.displayName = 'UserFilters';
