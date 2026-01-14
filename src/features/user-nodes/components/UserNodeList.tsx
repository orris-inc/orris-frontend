/**
 * User node list component
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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

const STATUS_LABEL_KEYS: Record<string, string> = {
  active: 'common.status.active',
  inactive: 'common.status.inactive',
  maintenance: 'common.status.maintenance',
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
  const { t } = useTranslation();
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
          <div key={i} className="p-4 rounded-xl glass">
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
      <div className="p-8 sm:p-12 text-center rounded-xl glass">
        <p className="text-muted-foreground">{t('nodeList.noNodes')}</p>
        <p className="text-sm text-muted-foreground mt-1">{t('nodeList.createFirstNode')}</p>
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
                  {t(STATUS_LABEL_KEYS[node.status]) || node.status}
                </Badge>
              </div>

              {/* Address row - compact */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <span className="truncate">{node.serverAddress}:{node.agentPort}</span>
                {node.subscriptionPort && node.subscriptionPort !== node.agentPort && (
                  <>
                    <span className="text-border">|</span>
                    <span className="whitespace-nowrap">{t('nodeList.subscriptionShort')}: {node.subscriptionPort}</span>
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
                  {t('nodeList.details')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(node)}
                  className="flex-1 h-9 touch-target glass-interactive text-xs"
                >
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  {t('common.actions.edit')}
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
                      {t('nodeList.installScript')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleTokenClick(node)} className="touch-target">
                      <Key className="mr-2 h-4 w-4" />
                      {t('nodeList.regenerateToken')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive touch-target"
                      onClick={() => handleDeleteClick(node)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('nodeList.deleteNode')}
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
                  {t('nodeList.columns.nodeName')}
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-sm">
                  {t('nodeList.columns.address')}
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-sm">
                  {t('nodeList.columns.protocol')}
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-sm">
                  {t('nodeList.columns.onlineStatus')}
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-sm">
                  {t('tableColumns.status')}
                </th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground text-sm">
                  {t('tableColumns.actions')}
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
                        {t('nodeList.subscriptionPort')}: {node.subscriptionPort}
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
                          <span className="text-green-600 text-sm">{t('common.status.online')}</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground text-sm">{t('common.status.offline')}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANTS[node.status]} className="text-xs">
                      {t(STATUS_LABEL_KEYS[node.status]) || node.status}
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
                        <TooltipContent>{t('subscription.viewDetails')}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => onEdit(node)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('common.actions.edit')}</TooltipContent>
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
                            {t('nodeList.installScript')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTokenClick(node)}>
                            <Key className="mr-2 h-4 w-4" />
                            {t('nodeList.regenerateToken')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteClick(node)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('nodeList.deleteNode')}
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
        title={t('nodeList.confirmDeleteTitle')}
        description={t('nodeList.confirmDeleteDesc', { name: deleteConfirm.node?.name })}
        confirmText={t('common.actions.delete')}
        cancelText={t('common.actions.cancel')}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />

      {/* Regenerate token confirmation dialog */}
      <ConfirmDialog
        open={tokenConfirm.open}
        onOpenChange={(open) => setTokenConfirm({ open, node: null })}
        title={t('nodeList.regenerateTokenTitle')}
        description={t('nodeList.regenerateTokenDesc', { name: tokenConfirm.node?.name })}
        confirmText={t('common.actions.confirm')}
        cancelText={t('common.actions.cancel')}
        onConfirm={handleTokenConfirm}
      />
    </>
  );
};
