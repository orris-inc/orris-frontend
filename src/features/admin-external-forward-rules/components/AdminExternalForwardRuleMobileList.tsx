/**
 * Admin External Forward Rule Mobile List Component
 * Mobile-friendly card list with touch-optimized interactions
 */

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Edit,
  Trash2,
  Power,
  PowerOff,
  MoreHorizontal,
  Globe,
  User,
  FileText,
  Layers,
  Server,
} from 'lucide-react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/common/Accordion';
import { Badge } from '@/components/common/Badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { Skeleton } from '@/components/common/Skeleton';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { CopyableAddress } from '@/components/common/CopyableAddress';
import type { AdminExternalForwardRule } from '@/api/admin/types';

interface AdminExternalForwardRuleMobileListProps {
  rules: AdminExternalForwardRule[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onEdit: (rule: AdminExternalForwardRule) => void;
  onDelete: (rule: AdminExternalForwardRule) => void;
  onToggleStatus: (rule: AdminExternalForwardRule) => void;
  /** Hide the built-in pagination (when using external pagination) */
  hidePagination?: boolean;
}

// Loading skeleton for mobile cards
const MobileCardSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="glass rounded-2xl p-4 space-y-3 animate-pulse motion-reduce:animate-none">
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

export const AdminExternalForwardRuleMobileList: React.FC<AdminExternalForwardRuleMobileListProps> = ({
  rules,
  isLoading,
  page,
  pageSize,
  total,
  onPageChange,
  onEdit,
  onDelete,
  onToggleStatus,
  hidePagination = false,
}) => {
  const { t } = useTranslation();
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    rule: AdminExternalForwardRule | null;
  }>({ open: false, rule: null });

  const handleDeleteClick = useCallback((rule: AdminExternalForwardRule) => {
    setDeleteConfirm({ open: true, rule });
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirm.rule) {
      onDelete(deleteConfirm.rule);
      setDeleteConfirm({ open: false, rule: null });
    }
  }, [deleteConfirm.rule, onDelete]);

  // Render dropdown menu
  const renderDropdownMenu = useCallback(
    (rule: AdminExternalForwardRule) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="glass-interactive rounded-full p-2 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => onEdit(rule)} className="min-h-[44px]">
            <Edit className="mr-2 size-4" />
            {t('common.actions.edit')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {rule.status === 'enabled' ? (
            <DropdownMenuItem onClick={() => onToggleStatus(rule)} className="min-h-[44px]">
              <PowerOff className="mr-2 size-4" />
              {t('admin.externalForwardRules.actions.disable')}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => onToggleStatus(rule)} className="min-h-[44px]">
              <Power className="mr-2 size-4" />
              {t('admin.externalForwardRules.actions.enable')}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => handleDeleteClick(rule)}
            className="text-destructive focus:text-destructive min-h-[44px]"
          >
            <Trash2 className="mr-2 size-4" />
            {t('admin.externalForwardRules.actions.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    [onEdit, onToggleStatus, handleDeleteClick, t]
  );

  if (isLoading) {
    return <MobileCardSkeleton />;
  }

  if (rules.length === 0) {
    return (
      <div className="glass rounded-2xl py-16 px-4 text-center">
        <p className="text-muted-foreground">{t('admin.externalForwardRules.empty')}</p>
      </div>
    );
  }

  // Calculate pagination info
  const totalPages = Math.ceil(total / pageSize);
  const hasMore = page < totalPages;

  // Render a single rule card
  const renderRuleCard = (rule: AdminExternalForwardRule) => {
    const address = `${rule.serverAddress}:${rule.listenPort}`;

    return (
      <AccordionItem
        key={rule.id}
        value={rule.id}
        className="glass rounded-2xl overflow-hidden border-0 mb-2 transition-all duration-200"
      >
        {/* Card Header - Always visible */}
        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 space-y-1.5">
              {/* Rule name with status */}
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-sm text-foreground truncate flex-1">
                  {rule.name}
                </span>
                <Badge
                  variant={rule.status === 'enabled' ? 'default' : 'secondary'}
                  className="text-[10px] px-1.5 py-0 h-5 flex-shrink-0 cursor-pointer"
                  onClick={() => onToggleStatus(rule)}
                >
                  {rule.status === 'enabled'
                    ? t('common.status.enabled')
                    : t('common.status.disabled')}
                </Badge>
              </div>

              {/* Server address */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CopyableAddress address={address} className="text-primary" />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={() => onEdit(rule)}
                className="glass-interactive rounded-full p-2 min-h-[40px] min-w-[40px] flex items-center justify-center touch-manipulation"
                title={t('common.actions.edit')}
              >
                <Edit className="size-4 text-muted-foreground" />
              </button>
              {renderDropdownMenu(rule)}
            </div>
          </div>
        </div>

        {/* Accordion Trigger */}
        <AccordionTrigger className="px-3 py-1.5 border-t border-border/50 hover:no-underline hover:bg-muted/30 transition-colors">
          <span className="text-xs text-muted-foreground">{t('common.actions.view')}</span>
        </AccordionTrigger>

        {/* Accordion Content - Expanded details */}
        <AccordionContent>
          <div className="px-3 pb-3 space-y-2.5 border-t border-border/50 pt-2.5">
            {/* Owner info */}
            <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/30">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                {t('admin.externalForwardRules.columns.owner')}
              </span>
              {(rule.subscriptionId != null || rule.userId != null) ? (
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <FileText className="size-3 text-muted-foreground" />
                    <span>{t('admin.externalForwardRules.columns.subscriptionId')}: {rule.subscriptionId ?? '-'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="size-3 text-muted-foreground" />
                    <span>{t('admin.externalForwardRules.columns.userId')}: {rule.userId ?? '-'}</span>
                  </div>
                </div>
              ) : (
                <Badge variant="outline" className="text-xs">
                  {t('admin.externalForwardRules.adminCreated')}
                </Badge>
              )}
            </div>

            {/* External source */}
            <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/30">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                {t('admin.externalForwardRules.columns.externalSource')}
              </span>
              <div className="flex items-center gap-1.5">
                <Globe className="size-3.5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{rule.externalSource}</span>
              </div>
            </div>

            {/* External rule ID if exists */}
            {rule.externalRuleId && (
              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/30">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                  {t('admin.externalForwardRules.columns.externalRuleId')}
                </span>
                <span className="text-xs font-mono text-muted-foreground">{rule.externalRuleId}</span>
              </div>
            )}

            {/* Resource groups */}
            {rule.groupIds && rule.groupIds.length > 0 && (
              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/30">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                  {t('admin.externalForwardRules.columns.resourceGroups')}
                </span>
                <div className="flex items-center gap-1">
                  <Layers className="size-3 text-muted-foreground" />
                  <span className="text-xs">{rule.groupIds.length} {t('admin.externalForwardRules.groupCount')}</span>
                </div>
              </div>
            )}

            {/* Node info if assigned */}
            {rule.nodeSid && (
              <div className="py-1.5 px-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-1.5 mb-1">
                  <Server className="size-3.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                    {t('admin.externalForwardRules.columns.nodeInfo')}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {rule.nodeServerAddress && (
                    <div>
                      {t('admin.externalForwardRules.columns.nodeServerAddress')}: <span className="font-mono">{rule.nodeServerAddress}</span>
                    </div>
                  )}
                  {rule.nodePublicIpv4 && (
                    <div>
                      IPv4: <span className="font-mono">{rule.nodePublicIpv4}</span>
                    </div>
                  )}
                  {rule.nodePublicIpv6 && (
                    <div>
                      IPv6: <span className="font-mono">{rule.nodePublicIpv6}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Remark */}
            {rule.remark && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">{t('externalForwardRules.form.remark')}:</span> {rule.remark}
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <>
      <Accordion type="multiple" className="space-y-0">
        {rules.map((rule) => renderRuleCard(rule))}
      </Accordion>

      {/* Load more button */}
      {!hidePagination && hasMore && (
        <div className="pt-4 pb-safe">
          <button
            onClick={() => onPageChange(page + 1)}
            className="glass-interactive w-full rounded-2xl py-4 text-sm font-medium text-foreground min-h-[44px] touch-manipulation"
          >
            {t('admin.externalForwardRules.loadMore')} ({page * pageSize} / {total})
          </button>
        </div>
      )}

      {/* Delete confirm dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, rule: null })}
        title={t('admin.externalForwardRules.confirmDelete.title')}
        description={t('admin.externalForwardRules.confirmDelete.description', { name: deleteConfirm.rule?.name })}
        confirmText={t('common.actions.delete')}
        cancelText={t('common.actions.cancel')}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};
