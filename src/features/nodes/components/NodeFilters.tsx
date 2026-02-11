/**
 * Node Filters Component
 * Search-first desktop toolbar: search input + status/protocol/online dropdowns + toggles + action slot
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
import { Switch, SwitchThumb } from '@/components/common/Switch';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import type { NodeStatus, NodeProtocol } from '@/api/node';
import type { NodeFiltersExtended } from '../hooks/useNodes';

// ============================================================================
// Types
// ============================================================================

export interface NodeFiltersProps {
  filters: NodeFiltersExtended;
  onFiltersChange: (filters: Partial<NodeFiltersExtended>) => void;
  hasFilters: boolean;
  onClearFilters: () => void;
  /** Include user-created nodes toggle */
  includeUserNodes: boolean;
  onIncludeUserNodesChange: (include: boolean) => void;
  /** Drag sort toggle */
  dragSortEnabled: boolean;
  onDragSortEnabledChange: (enabled: boolean) => void;
  /** Disable drag sort toggle (e.g., during reordering) */
  dragSortDisabled?: boolean;
  /** Action slot rendered at the right end (e.g. create + refresh buttons) */
  action?: ReactNode;
  className?: string;
}

// Protocol options
const PROTOCOL_OPTIONS: { value: NodeProtocol; label: string }[] = [
  { value: 'shadowsocks', label: 'Shadowsocks' },
  { value: 'vmess', label: 'VMess' },
  { value: 'vless', label: 'VLESS' },
  { value: 'trojan', label: 'Trojan' },
  { value: 'hysteria2', label: 'Hysteria2' },
  { value: 'tuic', label: 'TUIC' },
];

// ============================================================================
// Main Component
// ============================================================================

export const NodeFilters = ({
  filters,
  onFiltersChange,
  hasFilters,
  onClearFilters,
  includeUserNodes,
  onIncludeUserNodesChange,
  dragSortEnabled,
  onDragSortEnabledChange,
  dragSortDisabled,
  action,
  className,
}: NodeFiltersProps) => {
  const { t } = useTranslation();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ search: e.target.value || undefined });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      status: value === 'all' ? undefined : (value as NodeStatus),
    });
  };

  const handleProtocolChange = (value: string) => {
    onFiltersChange({
      protocol: value === 'all' ? undefined : (value as NodeProtocol),
    });
  };

  const handleOnlineStatusChange = (value: string) => {
    if (value === 'all') {
      onFiltersChange({ isOnline: undefined });
    } else {
      onFiltersChange({ isOnline: value === 'online' });
    }
  };

  const onlineStatusValue = filters.isOnline === undefined
    ? 'all'
    : filters.isOnline
      ? 'online'
      : 'offline';

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {/* Search input */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={filters.search ?? ''}
          onChange={handleSearchChange}
          placeholder={t('admin.nodes.searchPlaceholder')}
          className="h-9 w-[240px] rounded-lg ring-1 ring-border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        </SelectContent>
      </Select>

      {/* Protocol filter */}
      <Select
        value={filters.protocol ?? 'all'}
        onValueChange={handleProtocolChange}
      >
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder={t('common.protocol')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('filter.allTypes')}</SelectItem>
          {PROTOCOL_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Online status filter */}
      <Select
        value={onlineStatusValue}
        onValueChange={handleOnlineStatusChange}
      >
        <SelectTrigger className="w-[130px] h-9">
          <SelectValue placeholder={t('filter.onlineStatus')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('filter.all')}</SelectItem>
          <SelectItem value="online">{t('common.status.online')}</SelectItem>
          <SelectItem value="offline">{t('common.status.offline')}</SelectItem>
        </SelectContent>
      </Select>

      {/* Divider */}
      <div className="h-6 w-px bg-border" />

      {/* Include user nodes toggle */}
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <Switch checked={includeUserNodes} onCheckedChange={onIncludeUserNodesChange}>
          <SwitchThumb />
        </Switch>
        <span className="text-muted-foreground">{t('admin.nodes.userNodes')}</span>
      </label>

      {/* Drag sort toggle */}
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <Switch
          checked={dragSortEnabled}
          onCheckedChange={onDragSortEnabledChange}
          disabled={dragSortDisabled}
        >
          <SwitchThumb />
        </Switch>
        <span className="text-muted-foreground">{t('common.table.sort')}</span>
      </label>

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

NodeFilters.displayName = 'NodeFilters';
