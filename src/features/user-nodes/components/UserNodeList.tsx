/**
 * User node list component
 * Modern card-based layout with improved responsive design
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Edit,
  Trash2,
  Key,
  Eye,
  MoreVertical,
  Wifi,
  WifiOff,
  Terminal,
  Server,
  ChevronRight,
} from 'lucide-react';
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
import { cn } from '@/lib/utils';
import type { UserNode } from '@/api/node';

interface UserNodeListProps {
  nodes: UserNode[];
  isLoading: boolean;
  onEdit: (node: UserNode) => void;
  onDelete: (node: UserNode) => void;
  onRegenerateToken: (node: UserNode) => void;
  onViewDetail: (node: UserNode) => void;
  onInstallScript: (node: UserNode) => void;
  /** @deprecated Reserved for future loading state indication */
  onDeleting?: boolean;
  /** @deprecated Reserved for future loading state indication */
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 sm:p-5 rounded-xl bg-card border">
            <div className="flex items-start gap-3 mb-3">
              <Skeleton className="size-10 rounded-lg shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 rounded-2xl bg-card border">
        <div className="size-16 sm:size-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Server className="size-8 sm:size-10 text-muted-foreground/50" />
        </div>
        <h3 className="text-base font-medium text-foreground mb-1 text-center">
          {t('nodeList.noNodes')}
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          {t('nodeList.createFirstNode')}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Card grid layout - responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {nodes.map((node) => (
          <div
            key={node.id}
            onClick={() => onViewDetail(node)}
            className={cn(
              'relative p-4 sm:p-5 rounded-xl cursor-pointer touch-target',
              'transition-all duration-200 group',
              'bg-card border hover:shadow-md',
              node.isOnline
                ? 'border-success/20 hover:border-success/40'
                : 'border-border hover:border-border/80',
              'active:scale-[0.98]'
            )}
          >
            {/* Header: Node name + Status badge */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    'p-2 rounded-lg shrink-0 ring-1',
                    node.isOnline
                      ? 'bg-success/10 ring-success/20'
                      : 'bg-muted ring-border'
                  )}
                >
                  {node.isOnline ? (
                    <Wifi className="size-4 text-success" />
                  ) : (
                    <WifiOff className="size-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {node.name}
                  </h3>
                  <span className="text-xs text-muted-foreground font-mono">
                    {node.serverAddress}:{node.agentPort}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={PROTOCOL_COLORS[node.protocol]} className="text-xs">
                  {PROTOCOL_NAMES[node.protocol]?.short || node.protocol}
                </Badge>
              </div>
            </div>

            {/* Status row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-sm',
                    node.isOnline ? 'text-success' : 'text-muted-foreground'
                  )}
                >
                  {node.isOnline ? t('common.status.online') : t('common.status.offline')}
                </span>
                {node.subscriptionPort && node.subscriptionPort !== node.agentPort && (
                  <span className="text-xs text-muted-foreground">
                    · {t('nodeList.subscriptionShort')}: {node.subscriptionPort}
                  </span>
                )}
              </div>
              <Badge variant={STATUS_VARIANTS[node.status]} className="text-xs">
                {t(STATUS_LABEL_KEYS[node.status]) || node.status}
              </Badge>
            </div>

            {/* Footer: Actions + Navigate arrow */}
            <div
              className="flex items-center justify-between pt-3 border-t border-border/50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(node)}
                      className="size-8 p-0"
                    >
                      <Edit className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('common.actions.edit')}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onInstallScript(node)}
                      className="size-8 p-0"
                    >
                      <Terminal className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('nodeList.installScript')}</TooltipContent>
                </Tooltip>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="size-8 p-0">
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => onViewDetail(node)}>
                      <Eye className="mr-2 size-4" />
                      {t('nodeList.details')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleTokenClick(node)}>
                      <Key className="mr-2 size-4" />
                      {t('nodeList.regenerateToken')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDeleteClick(node)}
                    >
                      <Trash2 className="mr-2 size-4" />
                      {t('nodeList.deleteNode')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        ))}
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
