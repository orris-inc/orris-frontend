/**
 * Entity Status List
 * Displays all nodes and agents with their real-time status
 */

import { memo, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Server, Cpu, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { ScrollArea } from '@/components/common/ScrollArea';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import { Progress, ProgressIndicator } from '@/components/common/Progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/common/Collapsible';
import { formatBitRate, formatBytes } from '@/shared/utils/format-utils';
import type { EntityStatus } from '../hooks/useMonitorData';
import type { NodeSystemStatus } from '@/api/node';
import type { AgentSystemStatus } from '@/api/forward';

interface EntityStatusListProps {
  entities: EntityStatus[];
}

// Progress bar with color based on value
const StatusProgress = memo(({ value, label }: { value: number; label: string }) => {
  const color = value >= 80 ? 'bg-destructive' : value >= 60 ? 'bg-warning' : 'bg-success';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <span className="text-[10px] font-mono text-foreground">{value.toFixed(1)}%</span>
      </div>
      <Progress value={value} className="h-1">
        <ProgressIndicator
          className={color}
          style={{ transform: `translateX(-${100 - Math.min(value, 100)}%)` }}
        />
      </Progress>
    </div>
  );
});
StatusProgress.displayName = 'StatusProgress';

// Entity card component
const EntityCard = memo(({ entity }: { entity: EntityStatus }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const status = entity.status as (NodeSystemStatus | AgentSystemStatus) | null;

  const cpuPercent = status?.cpuPercent ?? 0;
  const memoryPercent = status?.memoryPercent ?? 0;
  const diskPercent = status?.diskPercent ?? 0;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className={`border border-border rounded-lg overflow-hidden transition-all ${
        entity.isOnline ? 'bg-card' : 'bg-muted/30'
      }`}>
        {/* Header */}
        <CollapsibleTrigger asChild>
          <button className="w-full p-3 flex items-center gap-3 hover:bg-accent/50 transition-colors cursor-pointer">
            {/* Icon */}
            <div className={`p-2 rounded-lg shrink-0 ${
              entity.isOnline
                ? entity.type === 'node' ? 'bg-info-muted' : 'bg-primary/10'
                : 'bg-muted'
            }`}>
              {entity.type === 'node'
                ? <Server className={`size-4 ${entity.isOnline ? 'text-info' : 'text-muted-foreground'}`} />
                : <Cpu className={`size-4 ${entity.isOnline ? 'text-primary' : 'text-muted-foreground'}`} />
              }
            </div>

            {/* Name and status */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground truncate">
                  {entity.name || entity.id}
                </span>
                <Badge
                  variant={entity.isOnline ? 'default' : 'secondary'}
                  className="text-[10px] px-1.5 py-0 h-4 shrink-0"
                >
                  {entity.isOnline ? t('admin.monitor.detail.online') : t('admin.monitor.detail.offline')}
                </Badge>
              </div>
              {entity.isOnline && status && (
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-muted-foreground">
                    {t('admin.monitor.cpu')}: {cpuPercent.toFixed(0)}%
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {t('admin.monitor.memory')}: {memoryPercent.toFixed(0)}%
                  </span>
                  {status.networkRxRate !== undefined && (
                    <span className="text-[10px] text-success">
                      ↓{formatBitRate(status.networkRxRate, true)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Expand icon */}
            {entity.isOnline && status && (
              <div className="shrink-0 text-muted-foreground">
                {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </div>
            )}
          </button>
        </CollapsibleTrigger>

        {/* Expanded content */}
        {entity.isOnline && status && (
          <CollapsibleContent>
            <div className="p-3 pt-0 border-t border-border">
              {/* Resource metrics */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <StatusProgress value={cpuPercent} label={t('admin.monitor.cpu')} />
                <StatusProgress value={memoryPercent} label={t('admin.monitor.memory')} />
                <StatusProgress value={diskPercent} label={t('admin.monitor.disk')} />
              </div>

              {/* Network stats */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('admin.monitor.detail.downloadRate')}</span>
                  <span className="font-mono text-success">
                    {formatBitRate(status.networkRxRate)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('admin.monitor.detail.uploadRate')}</span>
                  <span className="font-mono text-info">
                    {formatBitRate(status.networkTxRate)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('admin.monitor.detail.totalDownload')}</span>
                  <span className="font-mono text-foreground">
                    {formatBytes(status.networkRxBytes)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('admin.monitor.detail.totalUpload')}</span>
                  <span className="font-mono text-foreground">
                    {formatBytes(status.networkTxBytes)}
                  </span>
                </div>
              </div>

              {/* Connections */}
              {(status.tcpConnections !== undefined || status.udpConnections !== undefined) && (
                <div className="mt-3 pt-3 border-t border-border flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">TCP</span>
                    <span className="font-mono text-foreground">{status.tcpConnections ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">UDP</span>
                    <span className="font-mono text-foreground">{status.udpConnections ?? 0}</span>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
});
EntityCard.displayName = 'EntityCard';

export const EntityStatusList = memo(({ entities }: EntityStatusListProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter entities by search
  const filteredEntities = useMemo(() => {
    if (!searchQuery.trim()) return entities;

    const query = searchQuery.toLowerCase();
    return entities.filter(entity =>
      (entity.name || entity.id).toLowerCase().includes(query) ||
      entity.id.toLowerCase().includes(query)
    );
  }, [entities, searchQuery]);

  // Group by type
  const { nodes, agents } = useMemo(() => ({
    nodes: filteredEntities.filter(e => e.type === 'node'),
    agents: filteredEntities.filter(e => e.type === 'agent'),
  }), [filteredEntities]);

  return (
    <div className="bg-card backdrop-blur-xl rounded-xl border border-border shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">{t('admin.monitor.entityStatus')}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('admin.monitor.onlineCount', { online: entities.filter(e => e.isOnline).length, total: entities.length })}
            </p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={t('admin.monitor.searchAgent')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
      </div>

      {/* Entity list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Nodes section */}
          {nodes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Server className="size-4 text-info" />
                <span className="text-sm font-medium text-foreground">Node Agent</span>
                <Badge variant="secondary" className="text-[10px]">
                  {nodes.filter(n => n.isOnline).length}/{nodes.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {nodes.map(entity => (
                  <EntityCard key={entity.id} entity={entity} />
                ))}
              </div>
            </div>
          )}

          {/* Agents section */}
          {agents.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="size-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{t('admin.monitor.filterForwardAgent')}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {agents.filter(a => a.isOnline).length}/{agents.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {agents.map(entity => (
                  <EntityCard key={entity.id} entity={entity} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {filteredEntities.length === 0 && (
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <div className="size-10 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                  <Search className="size-4 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? t('admin.monitor.noMatchingEntities') : t('admin.monitor.noEntities')}
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
});
EntityStatusList.displayName = 'EntityStatusList';
