/**
 * Entity Table View
 * Table display for monitoring entities using Radix UI primitives
 * Compact, sortable, and responsive design
 */

import { memo, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Server, Cpu, ChevronUp, ChevronDown, ChevronsUpDown, ArrowDown, ArrowUp } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/lib/utils';
import { formatBitRate } from '@/shared/utils/format-utils';
import { getResourceBgClass, getResourceMutedTextClass } from '../utils';
import type { EntityStatus } from '../hooks/useMonitorData';
import type { NodeSystemStatus } from '@/api/node';
import type { AgentSystemStatus } from '@/api/forward';

interface EntityTableViewProps {
  entities: EntityStatus[];
  onRowClick?: (entity: EntityStatus) => void;
  /** Enable virtualization when entity count exceeds this threshold */
  virtualizeThreshold?: number;
  /** Maximum height of the table container when virtualized */
  maxHeight?: number;
}

const columnHelper = createColumnHelper<EntityStatus>();

// Resource progress cell component
const ResourceProgress = memo(({ value, showValue = true }: { value: number; showValue?: boolean }) => (
  <div className="flex items-center gap-2 min-w-[80px]">
    <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all', getResourceBgClass(value))}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
    {showValue && (
      <span className={cn('text-[11px] font-medium tabular-nums w-9 text-right', getResourceMutedTextClass(value))}>
        {value.toFixed(0)}%
      </span>
    )}
  </div>
));
ResourceProgress.displayName = 'ResourceProgress';

// Network rate cell component
const NetworkRate = memo(({ rxRate, txRate }: { rxRate: number; txRate: number }) => (
  <div className="flex items-center gap-2 text-[11px]">
    <div className="flex items-center gap-0.5">
      <ArrowDown className="size-3 text-success" />
      <span className="tabular-nums text-muted-foreground">{formatBitRate(rxRate)}</span>
    </div>
    <span className="text-border">/</span>
    <div className="flex items-center gap-0.5">
      <ArrowUp className="size-3 text-info" />
      <span className="tabular-nums text-muted-foreground">{formatBitRate(txRate)}</span>
    </div>
  </div>
));
NetworkRate.displayName = 'NetworkRate';

// Format uptime helper
const formatUptime = (seconds?: number): string => {
  if (!seconds) return '-';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;
  return `<1h`;
};

// Row height constant for virtualization
const ROW_HEIGHT = 52;

export const EntityTableView = memo(({
  entities,
  onRowClick,
  virtualizeThreshold = 50,
  maxHeight = 600,
}: EntityTableViewProps) => {
  const { t } = useTranslation();
  const [sorting, setSorting] = useState<SortingState>([]);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Determine if virtualization should be enabled
  const shouldVirtualize = entities.length > virtualizeThreshold;

  const columns = useMemo(() => [
    columnHelper.accessor('type', {
      header: t('monitor.table.columns.type'),
      size: 60,
      cell: ({ row }) => {
        const isNode = row.original.type === 'node';
        const isOnline = row.original.isOnline;
        return (
          <div className={cn(
            'inline-flex items-center justify-center size-7 rounded-md',
            isNode
              ? isOnline ? 'bg-info-muted text-info' : 'bg-muted text-muted-foreground'
              : isOnline ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          )}>
            {isNode
              ? <Server className="size-3.5" strokeWidth={1.5} />
              : <Cpu className="size-3.5" strokeWidth={1.5} />
            }
          </div>
        );
      },
    }),
    columnHelper.accessor('name', {
      header: t('monitor.table.columns.name'),
      size: 180,
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {row.original.name || row.original.id}
          </p>
          {row.original.name && (
            <p className="text-[10px] text-muted-foreground truncate font-mono">
              {row.original.id}
            </p>
          )}
        </div>
      ),
    }),
    columnHelper.accessor('isOnline', {
      header: t('monitor.table.columns.status'),
      size: 70,
      cell: ({ row }) => (
        <Badge
          variant={row.original.isOnline ? 'default' : 'secondary'}
          className={cn(
            'text-[10px]',
            row.original.isOnline ? 'bg-success text-success-foreground' : ''
          )}
        >
          {row.original.isOnline ? t('monitor.table.status.online') : t('monitor.table.status.offline')}
        </Badge>
      ),
    }),
    columnHelper.accessor(
      row => (row.status as NodeSystemStatus | AgentSystemStatus)?.cpuPercent ?? 0,
      {
        id: 'cpu',
        header: 'CPU',
        size: 120,
        cell: ({ row }) => {
          const status = row.original.status as NodeSystemStatus | AgentSystemStatus | null;
          if (!row.original.isOnline || !status) {
            return <span className="text-[11px] text-muted-foreground">-</span>;
          }
          return <ResourceProgress value={status.cpuPercent ?? 0} />;
        },
      }
    ),
    columnHelper.accessor(
      row => (row.status as NodeSystemStatus | AgentSystemStatus)?.memoryPercent ?? 0,
      {
        id: 'memory',
        header: t('monitor.table.columns.memory'),
        size: 120,
        cell: ({ row }) => {
          const status = row.original.status as NodeSystemStatus | AgentSystemStatus | null;
          if (!row.original.isOnline || !status) {
            return <span className="text-[11px] text-muted-foreground">-</span>;
          }
          return <ResourceProgress value={status.memoryPercent ?? 0} />;
        },
      }
    ),
    columnHelper.accessor(
      row => (row.status as NodeSystemStatus | AgentSystemStatus)?.diskPercent ?? 0,
      {
        id: 'disk',
        header: t('monitor.table.columns.disk'),
        size: 120,
        cell: ({ row }) => {
          const status = row.original.status as NodeSystemStatus | AgentSystemStatus | null;
          if (!row.original.isOnline || !status) {
            return <span className="text-[11px] text-muted-foreground">-</span>;
          }
          return <ResourceProgress value={status.diskPercent ?? 0} />;
        },
      }
    ),
    columnHelper.accessor(
      row => (row.status as NodeSystemStatus | AgentSystemStatus)?.networkRxRate ?? 0,
      {
        id: 'network',
        header: t('monitor.table.columns.network'),
        size: 150,
        cell: ({ row }) => {
          const status = row.original.status as NodeSystemStatus | AgentSystemStatus | null;
          if (!row.original.isOnline || !status) {
            return <span className="text-[11px] text-muted-foreground">-</span>;
          }
          return (
            <NetworkRate
              rxRate={status.networkRxRate ?? 0}
              txRate={status.networkTxRate ?? 0}
            />
          );
        },
      }
    ),
    columnHelper.accessor(
      row => (row.status as NodeSystemStatus | AgentSystemStatus)?.uptimeSeconds ?? 0,
      {
        id: 'uptime',
        header: t('monitor.table.columns.uptime'),
        size: 90,
        cell: ({ row }) => {
          const status = row.original.status as NodeSystemStatus | AgentSystemStatus | null;
          if (!row.original.isOnline || !status) {
            return <span className="text-[11px] text-muted-foreground">-</span>;
          }
          return (
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {formatUptime(status.uptimeSeconds)}
            </span>
          );
        },
      }
    ),
    columnHelper.accessor(
      row => (row.status as NodeSystemStatus)?.publicIpv4 ?? '',
      {
        id: 'ip',
        header: t('monitor.table.columns.publicIp'),
        size: 130,
        cell: ({ row }) => {
          const status = row.original.status as NodeSystemStatus | null;
          const ip = status?.publicIpv4;
          if (!row.original.isOnline || !ip) {
            return <span className="text-[11px] text-muted-foreground">-</span>;
          }
          return (
            <span className="text-[11px] tabular-nums text-muted-foreground font-mono">
              {ip}
            </span>
          );
        },
      }
    ),
  ], [t]);

  const table = useReactTable({
    data: entities,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  const { rows } = table.getRowModel();

  // Initialize virtualizer for large datasets
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
    enabled: shouldVirtualize,
  });

  // Render table header (shared between virtualized and non-virtualized)
  const renderHeader = () => (
    <thead className="sticky top-0 z-10">
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id} className="bg-muted/50">
          {headerGroup.headers.map((header) => {
            const canSort = header.column.getCanSort();
            const sorted = header.column.getIsSorted();

            return (
              <th
                key={header.id}
                style={{ width: header.column.columnDef.size }}
                className={cn(
                  'px-3 py-2.5 font-medium',
                  'text-xs text-muted-foreground',
                  'whitespace-nowrap text-left',
                  'border-b border-border/60',
                  'first:rounded-tl-xl last:rounded-tr-xl',
                  canSort && 'cursor-pointer select-none hover:text-foreground hover:bg-muted/80 transition-colors'
                )}
                onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
              >
                <div className="flex items-center gap-1">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                  {canSort && (
                    <span className={cn(
                      'transition-colors',
                      sorted ? 'text-primary' : 'text-muted-foreground/40'
                    )}>
                      {sorted === 'asc' ? (
                        <ChevronUp className="size-3.5" />
                      ) : sorted === 'desc' ? (
                        <ChevronDown className="size-3.5" />
                      ) : (
                        <ChevronsUpDown className="size-3 opacity-60" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            );
          })}
        </tr>
      ))}
    </thead>
  );

  // Render row content
  const renderRow = (row: typeof rows[number]) => (
    <tr
      key={row.id}
      onClick={() => onRowClick?.(row.original)}
      className={cn(
        'group transition-colors',
        'hover:bg-accent/50',
        onRowClick && 'cursor-pointer'
      )}
    >
      {row.getVisibleCells().map((cell) => (
        <td
          key={cell.id}
          className="px-3 py-2.5 align-middle"
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  );

  // Virtualized table body
  if (shouldVirtualize) {
    const virtualRows = rowVirtualizer.getVirtualItems();
    const totalSize = rowVirtualizer.getTotalSize();

    return (
      <div
        ref={tableContainerRef}
        className="overflow-auto bg-card rounded-xl border border-border"
        style={{ maxHeight }}
      >
        <table className="w-full text-sm border-separate border-spacing-0">
          {renderHeader()}
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <p className="text-sm text-muted-foreground">{t('monitor.table.empty')}</p>
                </td>
              </tr>
            ) : (
              <>
                {/* Spacer for virtual scroll offset */}
                {virtualRows.length > 0 && virtualRows[0].start > 0 && (
                  <tr>
                    <td colSpan={columns.length} style={{ height: virtualRows[0].start, padding: 0 }} />
                  </tr>
                )}
                {/* Render virtual rows */}
                {virtualRows.map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  return renderRow(row);
                })}
                {/* Spacer for remaining virtual space */}
                {virtualRows.length > 0 && (
                  <tr>
                    <td colSpan={columns.length} style={{ height: totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0), padding: 0 }} />
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  // Non-virtualized table (for small datasets)
  return (
    <div className="overflow-x-auto bg-card rounded-xl border border-border">
      <table className="w-full text-sm border-separate border-spacing-0">
        {renderHeader()}
        <tbody className="divide-y divide-border/40">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center">
                <p className="text-sm text-muted-foreground">{t('monitor.table.empty')}</p>
              </td>
            </tr>
          ) : (
            rows.map(renderRow)
          )}
        </tbody>
      </table>
    </div>
  );
});
EntityTableView.displayName = 'EntityTableView';
