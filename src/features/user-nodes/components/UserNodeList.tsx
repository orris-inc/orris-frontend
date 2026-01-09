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
  vless: 'outline',
  vmess: 'default',
  hysteria2: 'secondary',
  tuic: 'outline',
};

/**
 * Protocol display names
 */
const PROTOCOL_NAMES: Record<string, { short: string; full: string }> = {
  shadowsocks: { short: 'SS', full: 'Shadowsocks' },
  trojan: { short: 'Trojan', full: 'Trojan' },
  vless: { short: 'VLESS', full: 'VLESS' },
  vmess: { short: 'VMess', full: 'VMess' },
  hysteria2: { short: 'Hy2', full: 'Hysteria2' },
  tuic: { short: 'TUIC', full: 'TUIC' },
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
      <div className="space-y-3 px-1 sm:px-0">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-xl sm:rounded-lg glass">
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
      <div className="p-8 sm:p-12 text-center rounded-xl sm:rounded-lg glass mx-1 sm:mx-0">
        <p className="text-muted-foreground">暂无节点</p>
        <p className="text-sm text-muted-foreground mt-1">点击上方「新增节点」按钮创建您的第一个节点</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile and small screens: card layout with glass effect */}
      <div className="space-y-2 md:hidden px-1">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="p-3 rounded-xl glass-elevated transition-transform duration-[var(--duration-fast)] ease-[var(--spring-bounce)] active:scale-[0.98]"
          >
            <div className="space-y-2">
              {/* Title row - compact with inline status */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* Online indicator dot */}
                  <div className={`w-2 h-2 rounded-full shrink-0 ${node.isOnline ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                  <span className="font-medium text-sm truncate">{node.name}</span>
                  <Badge variant={PROTOCOL_COLORS[node.protocol]} className="text-[10px] px-1.5 h-5 shrink-0">
                    {PROTOCOL_NAMES[node.protocol]?.short || node.protocol}
                  </Badge>
                </div>
                <Badge variant={STATUS_VARIANTS[node.status]} className="text-[10px] px-1.5 h-5 shrink-0">
                  {STATUS_LABELS[node.status] || node.status}
                </Badge>
              </div>

              {/* Address row - compact */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <span className="truncate">{node.serverAddress}:{node.agentPort}</span>
                {node.subscriptionPort && node.subscriptionPort !== node.agentPort && (
                  <>
                    <span className="text-border">|</span>
                    <span className="whitespace-nowrap">订阅: {node.subscriptionPort}</span>
                  </>
                )}
              </div>

              {/* Action buttons - compact row */}
              <div className="flex gap-1.5 pt-2 border-t border-[var(--glass-border-subtle)]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetail(node)}
                  className="flex-1 h-9 touch-target glass-interactive text-xs"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  详情
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(node)}
                  className="flex-1 h-9 touch-target glass-interactive text-xs"
                >
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  编辑
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 touch-target glass-interactive p-0"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass-elevated">
                    <DropdownMenuItem onClick={() => onInstallScript(node)} className="touch-target">
                      <Terminal className="mr-2 h-4 w-4" />
                      安装脚本
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleTokenClick(node)} className="touch-target">
                      <Key className="mr-2 h-4 w-4" />
                      重新生成 Token
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive touch-target"
                      onClick={() => handleDeleteClick(node)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      删除节点
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                      {PROTOCOL_NAMES[node.protocol]?.full || node.protocol}
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
