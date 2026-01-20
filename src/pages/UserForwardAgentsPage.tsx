/**
 * 用户端转发Agent列表页面
 * 展示用户通过订阅计划可访问的转发Agent
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Server, Globe, CheckCircle, XCircle } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import { usePageTitle } from '@/shared/hooks';
import { useUserForwardAgents } from '@/features/user-forward-rules';
import type { UserForwardAgent } from '@/api/forward';

export const UserForwardAgentsPage = () => {
  const { t } = useTranslation();
  usePageTitle(t('userForwardAgents.title'));

  const [searchName, setSearchName] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { forwardAgents, pagination, isLoading } = useUserForwardAgents({
    page,
    pageSize,
    filters: { name: searchName || undefined },
  });

  const handleSearchChange = (value: string) => {
    setSearchName(value);
    setPage(1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 pb-safe">
        {/* Page title */}
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">{t('userForwardAgents.title')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t('userForwardAgents.description')}</p>
        </div>

        {/* Search bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Input
            placeholder={t('userForwardAgents.searchPlaceholder')}
            value={searchName}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full sm:max-w-xs"
          />
          <p className="text-sm text-muted-foreground">
            {t('userForwardAgents.totalNodes', { count: pagination.total })}
          </p>
        </div>

        {/* Node list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12 sm:py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : forwardAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-muted-foreground glass-elevated rounded-2xl">
            <Server className="h-10 w-10 sm:h-12 sm:w-12 mb-4 opacity-50" />
            <p className="text-center">{t('userForwardAgents.noAgents')}</p>
            <p className="text-sm mt-1 text-center">{t('userForwardAgents.noAgentsHint')}</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {forwardAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm border border-border rounded-lg disabled:opacity-50 touch-target transition-colors hover:bg-muted/50 active:bg-muted"
            >
              {t('common.pagination.previous')}
            </button>
            <span className="text-sm text-muted-foreground min-w-[60px] text-center">
              {page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-4 py-2 text-sm border border-border rounded-lg disabled:opacity-50 touch-target transition-colors hover:bg-muted/50 active:bg-muted"
            >
              {t('common.pagination.next')}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

interface AgentCardProps {
  agent: UserForwardAgent;
}

function AgentCard({ agent }: AgentCardProps) {
  const { t } = useTranslation();
  const isEnabled = agent.status === 'enabled';

  return (
    <div className="border border-border/50 rounded-xl p-4 bg-card/60 backdrop-blur-sm hover:shadow-sm transition-all active:scale-[0.98]">
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Server className="h-5 w-5 text-muted-foreground shrink-0" />
          <h3 className="font-medium truncate">{agent.name}</h3>
        </div>
        <Badge variant={isEnabled ? 'default' : 'secondary'} className="shrink-0">
          {isEnabled ? (
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span className="hidden sm:inline">{t('userForwardAgents.available')}</span>
              <span className="sm:hidden">{t('common.status.online')}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              <span className="hidden sm:inline">{t('userForwardAgents.unavailable')}</span>
              <span className="sm:hidden">{t('common.status.offline')}</span>
            </span>
          )}
        </Badge>
      </div>

      <div className="space-y-2 text-sm">
        {agent.publicAddress && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe className="h-4 w-4 shrink-0" />
            <span className="font-mono text-xs sm:text-sm truncate">{agent.publicAddress}</span>
          </div>
        )}
        {agent.groupName && (
          <div className="text-muted-foreground truncate">
            {t('userForwardAgents.resourceGroup')}: {agent.groupName}
          </div>
        )}
      </div>
    </div>
  );
};
