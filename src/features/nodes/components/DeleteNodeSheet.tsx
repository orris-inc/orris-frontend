/**
 * Delete Node Confirmation Sheet
 * Mobile-optimized bottom sheet for confirming node deletion
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, AlertTriangle, Loader2, Server, MapPin, Activity } from 'lucide-react';
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
import type { Node } from '@/api/node';

type DeleteNodeSheetProps = DeleteSheetProps<Node>;

export const DeleteNodeSheet: React.FC<DeleteNodeSheetProps> = ({
  open,
  onOpenChange,
  entity: node,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirm = async () => {
    if (!node) return;

    setLoading(true);
    try {
      await onConfirm(node);
      setConfirmOpen(false);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  if (!node) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <div className="size-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="size-5 text-destructive" />
              </div>
              <span>{t('admin.nodes.deleteSheet.title')}</span>
            </SheetTitle>
            <SheetDescription>
              {t('admin.nodes.deleteSheet.description')}
            </SheetDescription>
          </SheetHeader>

          <SheetBody className="py-4">
            {/* Warning Card */}
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-destructive">{t('admin.nodes.deleteSheet.confirmQuestion')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('admin.nodes.deleteSheet.warningText')}
                  </p>
                </div>
              </div>

              {/* Node Info */}
              <div className="rounded-lg bg-background p-4 space-y-3">
                {/* Node Name */}
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-muted flex items-center justify-center">
                    <Server className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{node.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {node.serverAddress || 'auto'}:{node.agentPort}
                    </p>
                  </div>
                </div>

                {/* Node Details */}
                <div className="flex flex-wrap gap-2">
                  {/* Protocol */}
                  <Badge variant="outline" className="text-xs">
                    {node.protocol === 'shadowsocks' ? 'SS' : 'Trojan'}
                  </Badge>

                  {/* Status */}
                  <Badge
                    variant={node.status === 'active' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {t(`admin.nodes.statusLabel.${node.status}`)}
                  </Badge>

                  {/* Online Status */}
                  <Badge
                    variant={node.isOnline ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    <Activity className="size-3 mr-1" />
                    {node.isOnline ? t('common.status.online') : t('common.status.offline')}
                  </Badge>

                  {/* Region */}
                  {node.region && (
                    <Badge variant="secondary" className="text-xs">
                      <MapPin className="size-3 mr-1" />
                      {node.region}
                    </Badge>
                  )}
                </div>

                {/* Tags */}
                {node.tags && node.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {node.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </SheetBody>

          <SheetFooter>
            {/* Destructive action first on mobile */}
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
                t('admin.nodes.deleteSheet.confirmButton')
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
        title={t('admin.nodes.deleteSheet.confirmTitle')}
        description={t('admin.nodes.deleteSheet.confirmDesc')}
        confirmText={t('admin.nodes.deleteSheet.confirmButton')}
        onConfirm={handleConfirm}
      />
    </>
  );
};
