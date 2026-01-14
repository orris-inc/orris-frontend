/**
 * Event Log Panel
 * Displays real-time event log with filtering
 */

import { memo, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Server, Cpu, ArrowUpCircle, ArrowDownCircle, RefreshCw, Filter, Check } from 'lucide-react';
import { ScrollArea } from '@/components/common/ScrollArea';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import type { MonitorEvent } from '../hooks/useMonitorData';
import type { TFunction } from 'i18next';

interface EventLogPanelProps {
  events: MonitorEvent[];
}

type EventFilter = 'all' | 'node' | 'agent' | 'online' | 'offline';

// Event icon based on type
const getEventIcon = (eventType: string) => {
  if (eventType.includes('online')) {
    return <ArrowUpCircle className="size-3.5 text-success" />;
  }
  if (eventType.includes('offline')) {
    return <ArrowDownCircle className="size-3.5 text-destructive" />;
  }
  if (eventType.includes('updated')) {
    return <RefreshCw className="size-3.5 text-info" />;
  }
  if (eventType.includes('node')) {
    return <Server className="size-3.5 text-info" />;
  }
  return <Cpu className="size-3.5 text-primary" />;
};

// Event badge variant
const getEventBadgeVariant = (eventType: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (eventType.includes('online')) return 'default';
  if (eventType.includes('offline')) return 'destructive';
  return 'secondary';
};

// Format relative time
const formatEventTime = (timestamp: number, t: TFunction): string => {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return t('admin.monitor.secondsAgo', { count: diff });
  if (diff < 3600) return t('admin.monitor.minutesAgo', { count: Math.floor(diff / 60) });
  if (diff < 86400) return t('admin.monitor.hoursAgo', { count: Math.floor(diff / 3600) });
  return new Date(timestamp * 1000).toLocaleDateString();
};

// Event item component - ultra compact
const EventItem = memo(({ event, t }: { event: MonitorEvent; t: TFunction }) => (
  <div className="flex items-center gap-2 py-1.5 px-2 hover:bg-accent/50 transition-colors">
    {/* Icon */}
    <div className="shrink-0">
      {getEventIcon(event.eventType)}
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1">
        <span className="text-[11px] text-foreground truncate">{event.message}</span>
        <Badge
          variant={getEventBadgeVariant(event.eventType)}
          className="text-[8px] px-0.5 py-0 h-3 shrink-0"
        >
          {event.type === 'node' ? 'N' : 'A'}
        </Badge>
      </div>
    </div>

    {/* Time */}
    <div className="text-[9px] text-muted-foreground shrink-0 tabular-nums">
      {formatEventTime(event.timestamp, t)}
    </div>
  </div>
));
EventItem.displayName = 'EventItem';

export const EventLogPanel = memo(({ events }: EventLogPanelProps) => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<Set<EventFilter>>(new Set(['all']));

  // Filter events
  const filteredEvents = useMemo(() => {
    if (filters.has('all') || filters.size === 0) return events;

    return events.filter(event => {
      if (filters.has('node') && event.type === 'node') return true;
      if (filters.has('agent') && event.type === 'agent') return true;
      if (filters.has('online') && event.eventType.includes('online')) return true;
      if (filters.has('offline') && event.eventType.includes('offline')) return true;
      return false;
    });
  }, [events, filters]);

  // Toggle filter
  const toggleFilter = (filter: EventFilter) => {
    setFilters(prev => {
      const next = new Set(prev);
      if (filter === 'all') {
        return new Set(['all']);
      }
      next.delete('all');
      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
      }
      return next.size === 0 ? new Set(['all']) : next;
    });
  };

  const activeFilterCount = filters.has('all') ? 0 : filters.size;

  return (
    <div className="bg-card rounded-lg border border-border h-full min-h-[320px] max-h-[380px] flex flex-col">
      {/* Compact Header */}
      <div className="flex items-center justify-between px-2.5 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">{t('admin.monitor.events')}</span>
          <Badge variant="secondary" className="text-[9px] h-4 px-1">
            {filteredEvents.length}
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Filter className="size-3" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-primary" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={() => toggleFilter('all')}
              className="cursor-pointer"
            >
              <Check className={`size-4 mr-2 ${filters.has('all') ? 'opacity-100' : 'opacity-0'}`} />
              {t('admin.monitor.filterAll')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => toggleFilter('node')}
              className="cursor-pointer"
            >
              <Check className={`size-4 mr-2 ${filters.has('node') ? 'opacity-100' : 'opacity-0'}`} />
              Node Agent
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => toggleFilter('agent')}
              className="cursor-pointer"
            >
              <Check className={`size-4 mr-2 ${filters.has('agent') ? 'opacity-100' : 'opacity-0'}`} />
              {t('admin.monitor.filterForwardAgent')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => toggleFilter('online')}
              className="cursor-pointer"
            >
              <Check className={`size-4 mr-2 ${filters.has('online') ? 'opacity-100' : 'opacity-0'}`} />
              {t('admin.monitor.filterOnlineEvent')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => toggleFilter('offline')}
              className="cursor-pointer"
            >
              <Check className={`size-4 mr-2 ${filters.has('offline') ? 'opacity-100' : 'opacity-0'}`} />
              {t('admin.monitor.filterOfflineEvent')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Event list */}
      <ScrollArea className="flex-1">
        {filteredEvents.length === 0 ? (
          <div className="flex items-center justify-center h-24">
            <div className="text-center">
              <RefreshCw className="size-5 text-muted-foreground/30 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">{t('admin.monitor.noEvents')}</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filteredEvents.map((event) => (
              <EventItem key={event.id} event={event} t={t} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
});
EventLogPanel.displayName = 'EventLogPanel';
