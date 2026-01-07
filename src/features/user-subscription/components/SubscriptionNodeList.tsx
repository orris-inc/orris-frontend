/**
 * Subscription Node List Component
 * Displays available forward agents for a subscription
 */

import { useState, useEffect } from 'react';
import { Server, Loader2, AlertCircle, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getBadgeClass } from '@/lib/ui-styles';
import { listUserForwardAgents } from '@/api/forward';
import type { UserForwardAgent } from '@/api/forward/types';

interface SubscriptionNodeListProps {
  subscriptionId: string;
}

export const SubscriptionNodeList: React.FC<SubscriptionNodeListProps> = ({
  subscriptionId,
}) => {
  const [agents, setAgents] = useState<UserForwardAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Currently API returns all user-accessible agents
        // Future: may filter by subscription when API supports it
        const result = await listUserForwardAgents({ pageSize: 100 });
        setAgents(result.items);
      } catch (err) {
        console.error('Failed to fetch forward agents:', err);
        setError('Failed to load forward agents');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgents();
  }, [subscriptionId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="p-4 rounded-full bg-destructive/10 mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-medium mb-2">加载失败</h3>
        <p className="text-muted-foreground text-center max-w-md">{error}</p>
      </div>
    );
  }

  // Empty state
  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="p-4 rounded-full bg-muted mb-4">
          <Server className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">暂无可用节点</h3>
        <p className="text-muted-foreground text-center max-w-md">
          当前订阅计划没有可用的转发节点。如需使用转发服务，请联系管理员。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">共 {agents.length} 个可用节点</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={cn(
              'p-4 rounded-xl border transition-all',
              agent.status === 'enabled'
                ? 'bg-card hover:shadow-md'
                : 'bg-muted/30 opacity-60'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Server className="size-4 text-muted-foreground" />
                <h4 className="font-medium truncate">{agent.name}</h4>
              </div>
              <span
                className={getBadgeClass(
                  agent.status === 'enabled' ? 'success' : 'secondary'
                )}
              >
                {agent.status === 'enabled' ? '可用' : '不可用'}
              </span>
            </div>

            {/* Address */}
            {agent.publicAddress && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <MapPin className="size-3.5 shrink-0" />
                <span className="truncate font-mono text-xs">{agent.publicAddress}</span>
              </div>
            )}

            {/* Group */}
            {agent.groupName && (
              <div className="text-xs text-muted-foreground">
                分组: {agent.groupName}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
