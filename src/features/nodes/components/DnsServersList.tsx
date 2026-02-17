/**
 * DNS servers list component
 * Manage a list of DNS servers with add/delete/reorder and inline editing
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import type { DnsServer, DnsStrategy } from '@/api/node';
import type { OutboundNodeOption } from '../utils/route-rule-utils';

interface DnsServersListProps {
  servers: DnsServer[];
  onChange: (servers: DnsServer[]) => void;
  disabled?: boolean;
  idPrefix?: string;
  /** Available nodes for detour selection */
  nodes?: OutboundNodeOption[];
}

const DNS_STRATEGY_OPTIONS: { value: DnsStrategy; labelKey: string }[] = [
  { value: 'prefer_ipv4', labelKey: 'admin.nodes.dns.strategyOptions.prefer_ipv4' },
  { value: 'prefer_ipv6', labelKey: 'admin.nodes.dns.strategyOptions.prefer_ipv6' },
  { value: 'ipv4_only', labelKey: 'admin.nodes.dns.strategyOptions.ipv4_only' },
  { value: 'ipv6_only', labelKey: 'admin.nodes.dns.strategyOptions.ipv6_only' },
];

export const DnsServersList: React.FC<DnsServersListProps> = ({
  servers,
  onChange,
  disabled = false,
  idPrefix = 'dns-servers',
  nodes = [],
}) => {
  const { t } = useTranslation();
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());

  const handleAdd = () => {
    const newServer: DnsServer = {
      tag: `dns_${servers.length + 1}`,
      address: '',
    };
    onChange([...servers, newServer]);
    setExpandedIndices((prev) => new Set([...prev, servers.length]));
  };

  const handleRemove = (index: number) => {
    onChange(servers.filter((_, i) => i !== index));
    setExpandedIndices((prev) => {
      const newSet = new Set<number>();
      prev.forEach((i) => {
        if (i < index) newSet.add(i);
        else if (i > index) newSet.add(i - 1);
      });
      return newSet;
    });
  };

  const handleUpdate = (index: number, server: DnsServer) => {
    onChange(servers.map((s, i) => (i === index ? server : s)));
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newServers = [...servers];
    [newServers[index - 1], newServers[index]] = [newServers[index], newServers[index - 1]];
    onChange(newServers);
    setExpandedIndices((prev) => {
      const newSet = new Set<number>();
      prev.forEach((i) => {
        if (i === index) newSet.add(index - 1);
        else if (i === index - 1) newSet.add(index);
        else newSet.add(i);
      });
      return newSet;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index >= servers.length - 1) return;
    const newServers = [...servers];
    [newServers[index], newServers[index + 1]] = [newServers[index + 1], newServers[index]];
    onChange(newServers);
    setExpandedIndices((prev) => {
      const newSet = new Set<number>();
      prev.forEach((i) => {
        if (i === index) newSet.add(index + 1);
        else if (i === index + 1) newSet.add(index);
        else newSet.add(i);
      });
      return newSet;
    });
  };

  const toggleExpand = (index: number) => {
    setExpandedIndices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) newSet.delete(index);
      else newSet.add(index);
      return newSet;
    });
  };

  // Get other server tags for addressResolver select
  const getOtherServerTags = (currentIndex: number) =>
    servers.filter((_, i) => i !== currentIndex).map((s) => s.tag);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium">{t('admin.nodes.dns.servers.title')}</h4>
        <Button variant="outline" size="sm" onClick={handleAdd} disabled={disabled}>
          <Plus className="h-4 w-4 mr-1" />
          {t('admin.nodes.dns.servers.add')}
        </Button>
      </div>

      {servers.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-4 rounded-xl ring-1 ring-dashed ring-border">
          {t('admin.nodes.dns.display.noServers')}
        </div>
      ) : (
        <div className="space-y-2">
          {servers.map((server, index) => {
            const isExpanded = expandedIndices.has(index);
            return (
              <Card key={index} className="overflow-hidden border-l-[3px] border-l-info">
                {/* Header */}
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => toggleExpand(index)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <ChevronRight
                      className={cn('h-4 w-4 text-muted-foreground transition-transform', isExpanded && 'rotate-90')}
                    />
                    <Badge variant="outline" className="shrink-0 font-mono text-[11px]">
                      {server.tag}
                    </Badge>
                    {!isExpanded && (
                      <span className="text-xs text-muted-foreground truncate">
                        {server.address || '—'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMoveUp(index)} disabled={disabled || index === 0}>
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMoveDown(index)} disabled={disabled || index === servers.length - 1}>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleRemove(index)} disabled={disabled}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                {isExpanded && (
                  <div className="border-t p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor={`${idPrefix}-${index}-tag`} className="text-xs">
                          {t('admin.nodes.dns.servers.tag')}
                        </Label>
                        <Input
                          id={`${idPrefix}-${index}-tag`}
                          value={server.tag}
                          onChange={(e) => handleUpdate(index, { ...server, tag: e.target.value })}
                          disabled={disabled}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`${idPrefix}-${index}-address`} className="text-xs">
                          {t('admin.nodes.dns.servers.address')}
                        </Label>
                        <Input
                          id={`${idPrefix}-${index}-address`}
                          value={server.address}
                          onChange={(e) => handleUpdate(index, { ...server, address: e.target.value })}
                          placeholder="223.5.5.5"
                          disabled={disabled}
                          className="text-sm font-mono"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{t('admin.nodes.dns.servers.addressHint')}</p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor={`${idPrefix}-${index}-resolver`} className="text-xs">
                          {t('admin.nodes.dns.servers.addressResolver')}
                        </Label>
                        <Select
                          value={server.addressResolver || '__none__'}
                          onValueChange={(v) => handleUpdate(index, { ...server, addressResolver: v === '__none__' ? undefined : v })}
                          disabled={disabled}
                        >
                          <SelectTrigger id={`${idPrefix}-${index}-resolver`} className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">—</SelectItem>
                            {getOtherServerTags(index).map((tag) => (
                              <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">{t('admin.nodes.dns.servers.addressResolverHint')}</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`${idPrefix}-${index}-addr-strategy`} className="text-xs">
                          {t('admin.nodes.dns.servers.addressStrategy')}
                        </Label>
                        <Select
                          value={server.addressStrategy || '__none__'}
                          onValueChange={(v) => handleUpdate(index, { ...server, addressStrategy: v === '__none__' ? undefined : v as DnsStrategy })}
                          disabled={disabled}
                        >
                          <SelectTrigger id={`${idPrefix}-${index}-addr-strategy`} className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">—</SelectItem>
                            {DNS_STRATEGY_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor={`${idPrefix}-${index}-strategy`} className="text-xs">
                          {t('admin.nodes.dns.servers.strategy')}
                        </Label>
                        <Select
                          value={server.strategy || '__none__'}
                          onValueChange={(v) => handleUpdate(index, { ...server, strategy: v === '__none__' ? undefined : v as DnsStrategy })}
                          disabled={disabled}
                        >
                          <SelectTrigger id={`${idPrefix}-${index}-strategy`} className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">—</SelectItem>
                            {DNS_STRATEGY_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`${idPrefix}-${index}-detour`} className="text-xs">
                          {t('admin.nodes.dns.servers.detour')}
                        </Label>
                        <Select
                          value={server.detour || '__none__'}
                          onValueChange={(v) => handleUpdate(index, { ...server, detour: v === '__none__' ? undefined : v })}
                          disabled={disabled}
                        >
                          <SelectTrigger id={`${idPrefix}-${index}-detour`} className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">—</SelectItem>
                            <SelectItem value="direct">Direct</SelectItem>
                            <SelectItem value="proxy">Proxy</SelectItem>
                            {nodes.map((node) => (
                              <SelectItem key={node.id} value={node.id}>{node.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">{t('admin.nodes.dns.servers.detourHint')}</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
