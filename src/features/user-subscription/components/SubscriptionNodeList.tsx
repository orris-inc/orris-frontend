/**
 * Subscription Node List Component
 * Displays available forward agents for a subscription
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Server, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SmartTruncate } from '@/components/common/SmartTruncate';
import { getBadgeClass } from '@/lib/ui-styles';
import { listUserForwardAgents } from '@/api/forward';
import type { UserForwardAgent } from '@/api/forward/types';

interface SubscriptionNodeListProps {
  subscriptionId: string;
}

export const SubscriptionNodeList: React.FC<SubscriptionNodeListProps> = ({
  subscriptionId,
}) => {
  const { t } = useTranslation();
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
      } catch {
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
        <div className="p-4 rounded-xl bg-destructive/10 mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-medium mb-2">{t('userSubscription.loadingFailed')}</h3>
        <p className="text-muted-foreground text-center max-w-md">{error}</p>
      </div>
    );
  }

  // Empty state
  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="p-4 rounded-xl bg-muted mb-4">
          <Server className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">{t('userSubscription.noAvailableNodes')}</h3>
        <p className="text-muted-foreground text-center max-w-md">
          {t('userSubscription.noAvailableNodesDesc')}
        </p>
      </div>
    );
  }

  return (
    <div className="@container space-y-2 @sm:space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs @sm:text-sm text-muted-foreground">{t('userSubscription.availableNodesCount', { count: agents.length })}</p>
      </div>

      <div className="space-y-2 @sm:grid @sm:grid-cols-2 @lg:grid-cols-3 @sm:gap-3 @sm:space-y-0">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={cn(
              'p-2.5 @sm:p-3 rounded-xl ring-1 ring-border transition-all',
              agent.status === 'enabled'
                ? 'bg-card'
                : 'bg-muted/30 opacity-60'
            )}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5 @sm:mb-2">
              <div className="flex items-center gap-1.5 @sm:gap-2 min-w-0">
                <Server className="size-3.5 @sm:size-4 text-muted-foreground shrink-0" />
                <SmartTruncate text={agent.name} className="text-sm @sm:text-base font-medium" />
              </div>
              <span
                className={cn(
                  getBadgeClass(agent.status === 'enabled' ? 'success' : 'secondary'),
                  'text-[10px] @sm:text-xs px-1.5 @sm:px-2 shrink-0'
                )}
              >
                {agent.status === 'enabled' ? t('userSubscription.nodeAvailable') : t('userSubscription.nodeUnavailable')}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {agent.publicAddress && (
                <SmartTruncate text={agent.publicAddress} mono />
              )}
              {agent.publicAddress && agent.groups && agent.groups.length > 0 && (
                <span className="text-border">|</span>
              )}
              {agent.groups && agent.groups.length > 0 && (
                <SmartTruncate text={agent.groups.map((g) => g.name).join(', ')} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
