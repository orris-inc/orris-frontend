/**
 * Forward Agent Mobile List Component
 * Mobile-friendly card list with Accordion for expanded details
 */

import { useState } from 'react';
import {
  Edit,
  Trash2,
  Power,
  PowerOff,
  MoreHorizontal,
  Key,
  Terminal,
  Copy,
  Eye,
  Check,
  Download,
  Loader2,
  ArrowUpCircle,
} from 'lucide-react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/common/Accordion';
import { AdminBadge } from '@/components/admin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { Badge } from '@/components/common/Badge';
import { Skeleton } from '@/components/common/Skeleton';
import { SystemStatusDisplay } from '@/components/common/SystemStatusDisplay';
import type { ForwardAgent } from '@/api/forward';
import type { ResourceGroup } from '@/api/resource/types';

interface ForwardAgentMobileListProps {
  forwardAgents: ForwardAgent[];
  loading?: boolean;
  resourceGroupsMap?: Record<string, ResourceGroup>;
  onEdit: (agent: ForwardAgent) => void;
  onDelete: (agent: ForwardAgent) => void;
  onEnable: (agent: ForwardAgent) => void;
  onDisable: (agent: ForwardAgent) => void;
  onRegenerateToken: (agent: ForwardAgent) => void;
  onGetInstallScript: (agent: ForwardAgent) => void;
  onViewDetail: (agent: ForwardAgent) => void;
  onCopy: (agent: ForwardAgent) => void;
  onCheckUpdate: (agent: ForwardAgent) => void;
  checkingAgentId?: string | number | null;
}

// Format date
const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Loading skeleton for mobile cards
const MobileCardSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-40" />
      </div>
    ))}
  </div>
);

// Copyable address component for mobile
const CopyableAddressMobile: React.FC<{ address: string; className?: string }> = ({ address, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (address && address !== '-') {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!address || address === '-') {
    return <span className="text-slate-400 dark:text-slate-500">-</span>;
  }

  // Truncate long addresses for mobile
  const displayAddress = address.length > 24
    ? `${address.slice(0, 12)}...${address.slice(-8)}`
    : address;

  return (
    <div className={`flex items-center gap-1 min-w-0 ${className}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="font-mono text-xs truncate">{displayAddress}</span>
        </TooltipTrigger>
        <TooltipContent className="font-mono text-xs max-w-xs break-all">
          {address}
        </TooltipContent>
      </Tooltip>
      <button
        onClick={handleCopy}
        className="flex-shrink-0 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        title={copied ? '已复制' : '复制'}
      >
        {copied ? (
          <Check className="size-3 text-green-500" />
        ) : (
          <Copy className="size-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
        )}
      </button>
    </div>
  );
};

export const ForwardAgentMobileList: React.FC<ForwardAgentMobileListProps> = ({
  forwardAgents,
  loading = false,
  resourceGroupsMap = {},
  onEdit,
  onDelete,
  onEnable,
  onDisable,
  onRegenerateToken,
  onGetInstallScript,
  onViewDetail,
  onCopy,
  onCheckUpdate,
  checkingAgentId,
}) => {
  // Render dropdown menu
  const renderDropdownMenu = (agent: ForwardAgent) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4 text-slate-500" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onViewDetail(agent)}>
            <Eye className="mr-2 size-4" />
            查看详情
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(agent)}>
            <Edit className="mr-2 size-4" />
            编辑
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onGetInstallScript(agent)}>
            <Terminal className="mr-2 size-4" />
            安装脚本
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCopy(agent)}>
            <Copy className="mr-2 size-4" />
            复制节点
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onRegenerateToken(agent)}>
            <Key className="mr-2 size-4" />
            重新生成Token
          </DropdownMenuItem>
          {agent.status === 'enabled' && (
            <DropdownMenuItem
              onClick={() => onCheckUpdate(agent)}
              disabled={checkingAgentId === agent.id}
            >
              {checkingAgentId === agent.id ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Download className="mr-2 size-4" />
              )}
              {checkingAgentId === agent.id ? '检查中...' : '检查更新'}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {agent.status === 'enabled' ? (
            <DropdownMenuItem onClick={() => onDisable(agent)}>
              <PowerOff className="mr-2 size-4" />
              禁用
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => onEnable(agent)}>
              <Power className="mr-2 size-4" />
              启用
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => onDelete(agent)} className="text-red-600 dark:text-red-400">
            <Trash2 className="mr-2 size-4" />
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  if (loading) {
    return <MobileCardSkeleton />;
  }

  if (forwardAgents.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        暂无转发节点数据
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="space-y-1.5">
      {forwardAgents.map((agent) => {
        const group = agent.groupId ? resourceGroupsMap[agent.groupId] : null;

        return (
          <AccordionItem
            key={agent.id}
            value={agent.id}
            className="border rounded-lg bg-white dark:bg-slate-800 overflow-hidden"
          >
            {/* Card Header - Always visible */}
            <div className="px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {/* Agent name and status */}
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-medium text-sm text-slate-900 dark:text-white truncate">
                      {agent.name}
                    </span>
                    <AdminBadge
                      variant={agent.status === 'enabled' ? 'success' : 'default'}
                      className="text-[10px] px-1.5 py-0 flex-shrink-0"
                    >
                      {agent.status === 'enabled' ? '启用' : '禁用'}
                    </AdminBadge>
                  </div>

                  {/* Address info */}
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <CopyableAddressMobile
                      address={agent.publicAddress || '-'}
                      className="text-slate-600 dark:text-slate-300"
                    />
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onEdit(agent)}
                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Edit className="size-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>编辑</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onGetInstallScript(agent)}
                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Terminal className="size-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>安装脚本</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => agent.status === 'enabled' ? onDisable(agent) : onEnable(agent)}
                        className={`p-1.5 rounded transition-colors ${
                          agent.status === 'enabled'
                            ? 'hover:bg-red-50 dark:hover:bg-red-900/20'
                            : 'hover:bg-green-50 dark:hover:bg-green-900/20'
                        }`}
                      >
                        {agent.status === 'enabled' ? (
                          <PowerOff className="size-3.5 text-slate-400 hover:text-red-500" />
                        ) : (
                          <Power className="size-3.5 text-slate-400 hover:text-green-500" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{agent.status === 'enabled' ? '禁用' : '启用'}</TooltipContent>
                  </Tooltip>
                  {renderDropdownMenu(agent)}
                </div>
              </div>
            </div>

            {/* Accordion Trigger */}
            <AccordionTrigger className="px-3 py-1.5 border-t border-slate-100 dark:border-slate-700 hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <span className="text-xs text-slate-400 dark:text-slate-500">详情</span>
            </AccordionTrigger>

            {/* Accordion Content - Expanded details */}
            <AccordionContent>
              <div className="px-3 pb-2 space-y-2 border-t border-slate-100 dark:border-slate-700 pt-2">
                {/* System status */}
                {agent.systemStatus && (
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-8 pt-0.5 flex-shrink-0">系统</span>
                    <SystemStatusDisplay
                      status={{
                        cpu: agent.systemStatus.cpuPercent,
                        memory: agent.systemStatus.memoryPercent,
                        disk: agent.systemStatus.diskPercent,
                        uptime: agent.systemStatus.uptimeSeconds,
                      }}
                    />
                  </div>
                )}

                {/* Tunnel address */}
                {agent.tunnelAddress && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-8 flex-shrink-0">隧道</span>
                    <CopyableAddressMobile
                      address={agent.tunnelAddress}
                      className="text-slate-600 dark:text-slate-300"
                    />
                  </div>
                )}

                {/* Resource group */}
                {agent.groupId && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-8 flex-shrink-0">资源</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {group?.name || agent.groupId}
                    </Badge>
                  </div>
                )}

                {/* Version */}
                {(agent.agentVersion || agent.systemStatus?.agentVersion) && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-8 flex-shrink-0">版本</span>
                    <div className="flex items-center gap-1.5">
                      {agent.hasUpdate && (
                        <ArrowUpCircle className="size-3.5 text-amber-500" />
                      )}
                      <span className={`text-xs font-mono ${agent.hasUpdate ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'}`}>
                        v{agent.agentVersion || agent.systemStatus?.agentVersion}
                        {agent.systemStatus?.platform && agent.systemStatus?.arch && (
                          <span className="text-slate-400 ml-1">
                            ({agent.systemStatus.platform}/{agent.systemStatus.arch})
                          </span>
                        )}
                      </span>
                      {agent.hasUpdate && (
                        <span className="text-[10px] text-amber-500">可更新</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Remark */}
                {agent.remark && (
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-8 pt-0.5 flex-shrink-0">备注</span>
                    <span className="text-xs text-slate-600 dark:text-slate-300 flex-1">{agent.remark}</span>
                  </div>
                )}

                {/* Created at */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide w-8 flex-shrink-0">创建</span>
                  <span className="text-xs text-slate-500">{formatDate(agent.createdAt)}</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};
