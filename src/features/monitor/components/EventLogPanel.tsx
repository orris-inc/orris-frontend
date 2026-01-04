/**
 * Event Log Panel
 * Displays real-time event log with filtering
 */

import { memo, useState, useMemo } from 'react';
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
const formatEventTime = (timestamp: number): string => {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return `${diff}秒前`;
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  return new Date(timestamp * 1000).toLocaleDateString('zh-CN');
};

// Event item component - compact
const EventItem = memo(({ event }: { event: MonitorEvent }) => (
  <div className="flex items-start gap-2.5 py-2.5 px-3 hover:bg-accent/50 transition-colors border-b border-border/50 last:border-0">
    {/* Icon */}
    <div className="mt-0.5 shrink-0">
      {getEventIcon(event.eventType)}
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-foreground">{event.message}</span>
        <Badge
          variant={getEventBadgeVariant(event.eventType)}
          className="text-[9px] px-1 py-0 h-3.5"
        >
          {event.type === 'node' ? 'Node' : 'Agent'}
        </Badge>
      </div>
      <p className="text-[10px] text-muted-foreground truncate">
        {event.agentId}
      </p>
    </div>

    {/* Time */}
    <div className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
      {formatEventTime(event.timestamp)}
    </div>
  </div>
));
EventItem.displayName = 'EventItem';

export const EventLogPanel = memo(({ events }: EventLogPanelProps) => {
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
    <div className="bg-card rounded-2xl border border-border shadow-sm h-full min-h-[400px] max-h-[520px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-foreground">事件日志</h3>
          <p className="text-[10px] text-muted-foreground">
            实时事件流 ({filteredEvents.length} 条)
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <Filter className="size-3.5" />
              筛选
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="size-4 p-0 text-[10px] flex items-center justify-center">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={() => toggleFilter('all')}
              className="cursor-pointer"
            >
              <Check className={`size-4 mr-2 ${filters.has('all') ? 'opacity-100' : 'opacity-0'}`} />
              全部
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
              转发 Agent
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => toggleFilter('online')}
              className="cursor-pointer"
            >
              <Check className={`size-4 mr-2 ${filters.has('online') ? 'opacity-100' : 'opacity-0'}`} />
              上线事件
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => toggleFilter('offline')}
              className="cursor-pointer"
            >
              <Check className={`size-4 mr-2 ${filters.has('offline') ? 'opacity-100' : 'opacity-0'}`} />
              离线事件
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Event list */}
      <ScrollArea className="flex-1">
        {filteredEvents.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-center">
              <div className="size-10 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                <RefreshCw className="size-4 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">暂无事件</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                事件将实时显示在这里
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredEvents.map((event) => (
              <EventItem key={event.id} event={event} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
});
EventLogPanel.displayName = 'EventLogPanel';
