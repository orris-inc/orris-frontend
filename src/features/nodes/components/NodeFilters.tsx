/**
 * Node Filters Component (Redesigned)
 *
 * Layout: [Search] [Protocol chips with identity colors] [Status▼] [Online▼] | [Toggles] [Clear] {Actions→}
 * Protocol chips are the primary filter — colored pills matching table protocol identity.
 */

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
  className?: string;
}

// Protocol chip config — colors match table protocol identity
const PROTOCOL_CHIPS: { value: NodeProtocol; label: string; activeColor: string }[] = [
  { value: 'shadowsocks' as NodeProtocol, label: 'SS', activeColor: 'bg-info/15 text-info ring-info/25' },
  { value: 'trojan' as NodeProtocol, label: 'Trojan', activeColor: 'bg-destructive/15 text-destructive ring-destructive/25' },
  { value: 'vless' as NodeProtocol, label: 'VLESS', activeColor: 'bg-relay/15 text-relay ring-relay/25' },
  { value: 'vmess' as NodeProtocol, label: 'VMess', activeColor: 'bg-primary/15 text-primary ring-primary/25' },
  { value: 'hysteria2' as NodeProtocol, label: 'Hy2', activeColor: 'bg-warning/15 text-warning ring-warning/25' },
  { value: 'tuic' as NodeProtocol, label: 'TUIC', activeColor: 'bg-chart-3/15 text-chart-3 ring-chart-3/25' },
  { value: 'anytls' as NodeProtocol, label: 'AnyTLS', activeColor: 'bg-success/15 text-success ring-success/25' },
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
  className,
}: NodeFiltersProps) => {
  const { t } = useTranslation();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ search: e.target.value || undefined });
  };

  const handleProtocolChange = (value: string) => {
    onFiltersChange({
      protocol: value === 'all' ? undefined : (value as NodeProtocol),
    });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      status: value === 'all' ? undefined : (value as NodeStatus),
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

  const currentProtocol = filters.protocol ?? 'all';

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
          className="h-9 w-[220px] rounded-xl ring-1 ring-border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Protocol chips — identity colored */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => handleProtocolChange('all')}
          className={cn(
            'px-2.5 h-7 rounded-lg text-xs font-medium transition-all cursor-pointer',
            currentProtocol === 'all'
              ? 'bg-foreground/10 text-foreground ring-1 ring-foreground/15'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          )}
        >
          {t('filter.all')}
        </button>
        {PROTOCOL_CHIPS.map((chip) => {
          const isActive = currentProtocol === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => handleProtocolChange(chip.value)}
              className={cn(
                'px-2.5 h-7 rounded-lg text-xs font-medium transition-all cursor-pointer',
                isActive
                  ? `ring-1 ${chip.activeColor}`
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Status filter */}
      <Select value={filters.status ?? 'all'} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-[120px] h-9">
          <SelectValue placeholder={t('common.status.label')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('filter.all')}</SelectItem>
          <SelectItem value="active">{t('common.status.enabled')}</SelectItem>
          <SelectItem value="inactive">{t('common.status.disabled')}</SelectItem>
        </SelectContent>
      </Select>

      {/* Online status filter */}
      <Select value={onlineStatusValue} onValueChange={handleOnlineStatusChange}>
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

    </div>
  );
};

NodeFilters.displayName = 'NodeFilters';
