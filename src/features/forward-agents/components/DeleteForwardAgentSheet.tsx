/**
 * Delete Forward Agent Confirmation Sheet
 * Mobile-optimized bottom sheet for confirming forward agent deletion
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, AlertTriangle, Loader2, Cpu, Activity } from 'lucide-react';
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
import type { ForwardAgent } from '@/api/forward';

type DeleteForwardAgentSheetProps = DeleteSheetProps<ForwardAgent>;

export const DeleteForwardAgentSheet: React.FC<DeleteForwardAgentSheetProps> = ({
  open,
  onOpenChange,
  entity: agent,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirm = async () => {
    if (!agent) return;

    setLoading(true);
    try {
      await onConfirm(agent);
      setConfirmOpen(false);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  if (!agent) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="size-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Trash2 className="size-5 text-destructive" />
            </div>
            <span>{t('admin.forwardAgents.delete.title')}</span>
          </SheetTitle>
          <SheetDescription>
            {t('admin.forwardAgents.delete.description')}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="py-6">
          {/* Warning Card */}
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-destructive">{t('admin.forwardAgents.delete.confirmTitle')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('admin.forwardAgents.delete.confirmMessage')}
                </p>
              </div>
            </div>

            {/* Agent Info */}
            <div className="rounded-lg bg-background p-4 space-y-3">
              {/* Agent Name */}
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-muted flex items-center justify-center">
                  <Cpu className="size-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{agent.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {agent.publicAddress || t('admin.forwardAgents.delete.noPublicAddress')}
                  </p>
                </div>
              </div>

              {/* Agent Details */}
              <div className="flex flex-wrap gap-2">
                {/* Status */}
                <Badge
                  variant={agent.status === 'enabled' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {agent.status === 'enabled' ? t('common.status.enabled') : t('common.status.disabled')}
                </Badge>

                {/* Online Status */}
                <Badge
                  variant={agent.systemStatus ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  <Activity className="size-3 mr-1" />
                  {agent.systemStatus ? t('common.status.online') : t('common.status.offline')}
                </Badge>

                {/* Version */}
                {agent.agentVersion && (
                  <Badge variant="outline" className="text-xs font-mono">
                    v{agent.agentVersion}
                  </Badge>
                )}
              </div>

              {/* Remark */}
              {agent.remark && (
                <div className="text-xs text-muted-foreground pt-1 border-t">
                  {agent.remark}
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
            className="w-full min-h-[52px] text-base"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" />
                {t('common.loading.deleting')}
              </>
            ) : (
              t('common.actions.delete')
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-full min-h-[44px]"
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
      title={t('admin.forwardAgents.delete.finalConfirmTitle')}
      description={t('admin.forwardAgents.delete.finalConfirmDescription')}
      confirmText={t('common.actions.delete')}
      onConfirm={handleConfirm}
    />
  </>
  );
};
