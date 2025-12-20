/**
 * User node list component
 */

import { useState } from 'react';
import { Edit, Trash2, Key, Eye, MoreVertical, Wifi, WifiOff, Terminal } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/common/Tooltip';
import { Skeleton } from '@/components/common/Skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import type { UserNode } from '@/api/node';

interface UserNodeListProps {
  nodes: UserNode[];
  isLoading: boolean;
  onEdit: (node: UserNode) => void;
  onDelete: (node: UserNode) => void;
  onRegenerateToken: (node: UserNode) => void;
  onViewDetail: (node: UserNode) => void;
  onInstallScript: (node: UserNode) => void;
  onDeleting?: boolean;
  onRegeneratingToken?: boolean;
}

/**
 * Protocol badge variant mapping
 */
const PROTOCOL_COLORS: Record<string, 'default' | 'secondary' | 'outline'> = {
  shadowsocks: 'default',
  trojan: 'secondary',
};

/**
 * Status badge variant mapping
 */
const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  inactive: 'secondary',
  maintenance: 'outline',
};

const STATUS_LABELS: Record<string, string> = {
  active: '活跃',
  inactive: '停用',
  maintenance: '维护中',
};

export const UserNodeList: React.FC<UserNodeListProps> = ({
  nodes,
  isLoading,
  onEdit,
  onDelete,
  onRegenerateToken,
  onViewDetail,
  onInstallScript,
}) => {
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    node: UserNode | null;
  }>({ open: false, node: null });

  const [tokenConfirm, setTokenConfirm] = useState<{
    open: boolean;
    node: UserNode | null;
  }>({ open: false, node: null });

  const handleDeleteClick = (node: UserNode) => {
    setDeleteConfirm({ open: true, node });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm.node) {
      onDelete(deleteConfirm.node);
      setDeleteConfirm({ open: false, node: null });
    }
  };

  const handleTokenClick = (node: UserNode) => {
    setTokenConfirm({ open: true, node });
  };

  const handleTokenConfirm = () => {
    if (tokenConfirm.node) {
      onRegenerateToken(tokenConfirm.node);
      setTokenConfirm({ open: false, node: null });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-lg bg-card border">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="p-12 text-center rounded-lg bg-card border">
        <p className="text-muted-foreground">暂无节点</p>
        <p className="text-sm text-muted-foreground mt-1">点击上方「新增节点」按钮创建您的第一个节点</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile and small screens: card layout */}
      <div className="space-y-3 md:hidden">
        {nodes.map((node) => (
          <div key={node.id} className="p-4 rounded-lg bg-card border">
            <div className="space-y-3">
              {/* Title and status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{node.name}</div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5 font-mono">
                    {node.serverAddress}:{node.agentPort}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {node.isOnline ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Badge variant={STATUS_VARIANTS[node.status]} className="text-xs">
                    {STATUS_LABELS[node.status] || node.status}
                  </Badge>
                </div>
              </div>

              {/* Node info */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">协议：</span>
                  <Badge variant={PROTOCOL_COLORS[node.protocol]} className="text-xs ml-1">
                    {node.protocol === 'shadowsocks' ? 'SS' : 'Trojan'}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">在线状态：</span>
                  <span className={node.isOnline ? 'text-green-600' : 'text-muted-foreground'}>
                    {node.isOnline ? '在线' : '离线'}
                  </span>
                </div>
                {node.subscriptionPort && node.subscriptionPort !== node.agentPort && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground text-xs">订阅端口：</span>
                    <span className="font-mono text-xs ml-1">{node.subscriptionPort}</span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetail(node)}
                  className="flex-1"
                >
                  详情
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(node)}
                  className="flex-1"
                >
                  编辑
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteClick(node)}
                  className="shrink-0"
                >
                  删除
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table layout */}
      <div className="hidden md:block rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-sm">
                  节点名称
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-sm">
                  地址
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-sm">
                  协议
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-sm">
                  在线状态
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-sm">
                  状态
                </th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground text-sm">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((node) => (
                <tr key={node.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{node.name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm">
                      {node.serverAddress}:{node.agentPort}
                    </span>
                    {node.subscriptionPort && node.subscriptionPort !== node.agentPort && (
                      <div className="text-xs text-muted-foreground">
                        订阅端口: {node.subscriptionPort}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={PROTOCOL_COLORS[node.protocol]} className="text-xs">
                      {node.protocol === 'shadowsocks' ? 'Shadowsocks' : 'Trojan'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {node.isOnline ? (
                        <>
                          <Wifi className="h-4 w-4 text-green-500" />
                          <span className="text-green-600 text-sm">在线</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground text-sm">离线</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANTS[node.status]} className="text-xs">
                      {STATUS_LABELS[node.status] || node.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => onViewDetail(node)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>查看详情</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => onEdit(node)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>编辑</TooltipContent>
                      </Tooltip>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onInstallScript(node)}>
                            <Terminal className="mr-2 h-4 w-4" />
                            安装脚本
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTokenClick(node)}>
                            <Key className="mr-2 h-4 w-4" />
                            重新生成 Token
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteClick(node)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            删除节点
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, node: null })}
        title="确认删除"
        description={`确认删除节点「${deleteConfirm.node?.name}」吗？此操作不可恢复。`}
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />

      {/* Regenerate token confirmation dialog */}
      <ConfirmDialog
        open={tokenConfirm.open}
        onOpenChange={(open) => setTokenConfirm({ open, node: null })}
        title="重新生成 Token"
        description={`确认重新生成节点「${tokenConfirm.node?.name}」的 Token 吗？旧的 Token 将立即失效。`}
        confirmText="确认"
        cancelText="取消"
        onConfirm={handleTokenConfirm}
      />
    </>
  );
};
