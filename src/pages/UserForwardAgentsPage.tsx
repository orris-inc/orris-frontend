/**
 * 用户端转发节点列表页面
 * 展示用户通过订阅计划可访问的转发节点
 */

import { useState } from 'react';
import { Server, Globe, CheckCircle, XCircle } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import { usePageTitle } from '@/shared/hooks';
import { useUserForwardAgents } from '@/features/user-forward-rules';
import type { UserForwardAgent } from '@/api/forward';

export const UserForwardAgentsPage = () => {
  usePageTitle('转发节点');

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
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">转发节点</h1>
          <p className="text-muted-foreground">查看您可使用的转发节点</p>
        </div>

        {/* 搜索栏 */}
        <div className="flex items-center gap-4">
          <Input
            placeholder="搜索节点名称..."
            value={searchName}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="max-w-xs"
          />
          <p className="text-sm text-muted-foreground">
            共 {pagination.total} 个节点
          </p>
        </div>

        {/* 节点列表 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : forwardAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Server className="h-12 w-12 mb-4 opacity-50" />
            <p>暂无可用的转发节点</p>
            <p className="text-sm mt-1">请联系管理员或升级您的订阅计划</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {forwardAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}

        {/* 分页 */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              上一页
            </button>
            <span className="text-sm text-muted-foreground">
              {page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              下一页
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
              可用
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              不可用
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
            资源组：{agent.groupName}
          </div>
        )}
      </div>
    </div>
  );
};
