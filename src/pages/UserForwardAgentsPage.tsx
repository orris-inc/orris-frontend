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
      <div className="space-y-6">
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t('userForwardAgents.title')}</h1>
          <p className="text-muted-foreground">{t('userForwardAgents.description')}</p>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-4">
          <Input
            placeholder={t('userForwardAgents.searchPlaceholder')}
            value={searchName}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="max-w-xs"
          />
          <p className="text-sm text-muted-foreground">
            {t('userForwardAgents.totalNodes', { count: pagination.total })}
          </p>
        </div>

        {/* Node list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : forwardAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Server className="h-12 w-12 mb-4 opacity-50" />
            <p>{t('userForwardAgents.noAgents')}</p>
            <p className="text-sm mt-1">{t('userForwardAgents.noAgentsHint')}</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {forwardAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              {t('common.pagination.previous')}
            </button>
            <span className="text-sm text-muted-foreground">
              {page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
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

const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  const { t } = useTranslation();
  const isEnabled = agent.status === 'enabled';

  return (
    <div className="border rounded-lg p-4 bg-card hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">{agent.name}</h3>
        </div>
        <Badge variant={isEnabled ? 'default' : 'secondary'}>
          {isEnabled ? (
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              {t('userForwardAgents.available')}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              {t('userForwardAgents.unavailable')}
            </span>
          )}
        </Badge>
      </div>

      <div className="space-y-2 text-sm">
        {agent.publicAddress && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span className="font-mono">{agent.publicAddress}</span>
          </div>
        )}
        {agent.groupName && (
          <div className="text-muted-foreground">
            {t('userForwardAgents.resourceGroup')}: {agent.groupName}
          </div>
        )}
      </div>
    </div>
  );
};
