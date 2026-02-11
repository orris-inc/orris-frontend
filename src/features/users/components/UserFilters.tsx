/**
 * User Filters Component
 * Search-first desktop toolbar: search input + status/role dropdowns + action slot
 */

import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
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
  /** Action slot rendered at the right end (e.g. create + refresh buttons) */
  action?: ReactNode;
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
  action,
  className,
}: UserFiltersProps) => {
  const { t } = useTranslation();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ search: e.target.value || undefined });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      status: value === 'all' ? undefined : (value as UserStatus),
    });
  };

  const handleRoleChange = (value: string) => {
    onFiltersChange({
      role: value === 'all' ? undefined : (value as UserRole),
    });
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {/* Search input */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={filters.search ?? ''}
          onChange={handleSearchChange}
          placeholder={t('admin.users.searchPlaceholder')}
          className="h-9 w-[220px] rounded-lg ring-1 ring-border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

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

      {/* Clear filters */}
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

      {/* Right-aligned action slot */}
      {action && (
        <div className="ml-auto flex items-center gap-2">
          {action}
        </div>
      )}
    </div>
  );
};

UserFilters.displayName = 'UserFilters';
