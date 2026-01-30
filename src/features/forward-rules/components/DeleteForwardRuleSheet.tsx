/**
 * Delete Forward Rule Confirmation Sheet
 * Mobile-optimized bottom sheet for confirming forward rule deletion
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Trash2,
  AlertTriangle,
  Loader2,
  ArrowLeftRight,
  Server,
  Activity,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  ConfirmActionSheet,
  type DeleteSheetProps,
} from '@/components/common/sheet';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import type { ForwardRule, ForwardAgent } from '@/api/forward';

interface DeleteForwardRuleSheetProps extends DeleteSheetProps<ForwardRule> {
  agentsMap?: Record<string, ForwardAgent>;
}

// Rule type label keys
const RULE_TYPE_LABEL_KEYS: Record<string, string> = {
  direct: 'admin.forwardRules.ruleTypeInfo.direct.label',
  entry: 'admin.forwardRules.ruleTypeInfo.entry.label',
  chain: 'admin.forwardRules.ruleTypeInfo.chain.label',
  direct_chain: 'admin.forwardRules.ruleTypeInfo.directChain.label',
};

export const DeleteForwardRuleSheet: React.FC<DeleteForwardRuleSheetProps> = ({
  open,
  onOpenChange,
  entity: rule,
  onConfirm,
  agentsMap = {},
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirm = async () => {
    if (!rule) return;

    setLoading(true);
    try {
      await onConfirm(rule);
      setConfirmOpen(false);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  if (!rule) return null;

  const agent = agentsMap[rule.agentId];

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="size-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Trash2 className="size-5 text-destructive" />
            </div>
            <span>{t('admin.forwardRules.sheet.deleteRule')}</span>
          </SheetTitle>
          <SheetDescription>
            {t('admin.forwardRules.sheet.deleteConfirmDesc')}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="py-6">
          {/* Warning Card */}
          <div className="rounded-xl ring-1 ring-destructive/20 bg-destructive/5 p-4 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-destructive">{t('common.status.warning')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('admin.forwardRules.sheet.deleteWarningDesc')}
                </p>
              </div>
            </div>

            {/* Rule Info */}
            <div className="rounded-xl bg-background p-4 space-y-3">
              {/* Rule Name */}
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-muted flex items-center justify-center">
                  <ArrowLeftRight className="size-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{rule.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {rule.listenPort ? `:${rule.listenPort}` : t('common.auto')} → {rule.targetAddress || rule.targetNodeId}:{rule.targetPort}
                  </p>
                </div>
              </div>

              {/* Rule Details */}
              <div className="flex flex-wrap gap-2">
                {/* Rule Type */}
                <Badge variant="outline" className="text-xs">
                  {t(RULE_TYPE_LABEL_KEYS[rule.ruleType]) || rule.ruleType}
                </Badge>

                {/* Protocol */}
                <Badge variant="secondary" className="text-xs">
                  {rule.protocol.toUpperCase()}
                </Badge>

                {/* Status */}
                <Badge
                  variant={rule.status === 'enabled' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {rule.status === 'enabled' ? t('common.status.enabled') : t('common.status.disabled')}
                </Badge>

                {/* Run Status */}
                {rule.runStatus === 'running' && (
                  <Badge variant="default" className="text-xs">
                    <Activity className="size-3 mr-1" />
                    {t('common.status.running')}
                  </Badge>
                )}
              </div>

              {/* Agent Info */}
              {agent && (
                <div className="flex items-center gap-2 pt-1">
                  <Server className="size-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {t('admin.forwardRules.sheet.forwardAgent')}: {agent.name}
                  </span>
                </div>
              )}

              {/* Traffic Stats */}
              {(rule.uploadBytes > 0 || rule.downloadBytes > 0) && (
                <div className="text-xs text-muted-foreground pt-1">
                  {t('admin.forwardRules.sheet.trafficUsed')}: ↑{formatBytes(rule.uploadBytes)} ↓{formatBytes(rule.downloadBytes)}
                </div>
              )}
            </div>
          </div>
        </SheetBody>

        <SheetFooter>
          <Button
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
            disabled={loading}
            className="w-full min-h-[52px] text-base active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" />
                {t('common.loading.deleting')}
              </>
            ) : (
              t('admin.forwardRules.sheet.confirmDeleteButton')
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-full min-h-[44px] active:scale-[0.98]"
          >
            {t('common.actions.cancel')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>

      <ConfirmActionSheet
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        variant="destructive"
        title={t('admin.forwardRules.sheet.confirmDeleteTitle')}
        description={t('admin.forwardRules.sheet.confirmDeleteDesc')}
        confirmText={t('admin.forwardRules.sheet.confirmDeleteButton')}
        onConfirm={handleConfirm}
      />
    </>
  );
};

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
