/**
 * Edit Forward Agent Sheet Component
 * Mobile-optimized bottom sheet - Tailwind Application UI style
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Check } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  type EditSheetProps,
} from '@/components/common/sheet';
import { Button } from '@/components/common/Button';
import { Switch, SwitchThumb } from '@/components/common/Switch';
import { MobileFormInput } from '@/components/common/mobile-form';
import { ExpirationDatePicker } from '@/components/common/ExpirationDatePicker';
import { useResourceGroups } from '@/features/resource-groups/hooks/useResourceGroups';
import { cn } from '@/lib/utils';
import { SmartTruncate } from '@/components/common/SmartTruncate';
import type { ForwardAgent, UpdateForwardAgentRequest } from '@/api/forward';
import {
  useEditForwardAgentForm,
  PROTOCOL_GROUPS,
} from '../hooks/useEditForwardAgentForm';

type EditForwardAgentSheetProps = EditSheetProps<ForwardAgent, UpdateForwardAgentRequest>;

export const EditForwardAgentSheet: React.FC<EditForwardAgentSheetProps> = ({
  open,
  onOpenChange,
  entity: agent,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const form = useEditForwardAgentForm({ entity: agent });

  const { resourceGroups } = useResourceGroups({
    pageSize: 100,
    filters: { status: 'active' },
    enabled: open,
  });

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  const handleSubmit = async () => {
    if (!agent || !form.validate()) return;

    setLoading(true);
    try {
      const updates = form.buildSubmitData();

      if (updates && Object.keys(updates).length > 0) {
        await onSubmit(String(agent.id), updates);
      }
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  if (!agent) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t('common.actions.edit')}</SheetTitle>
          <SheetDescription>{agent.name}</SheetDescription>
        </SheetHeader>

        <SheetBody className="py-4 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t('admin.forwardAgents.form.nodeName')} <span className="text-destructive">*</span>
            </label>
            <MobileFormInput
              value={form.formData.name || ''}
              onChange={(value) => form.handleChange('name', value)}
              error={form.errors.name}
            />
          </div>

          {/* Public Address */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('admin.forwardAgents.detail.publicAddress')}</label>
            <MobileFormInput
              placeholder={t('admin.forwardAgents.form.publicAddressPlaceholder')}
              value={form.formData.publicAddress || ''}
              onChange={(value) => form.handleChange('publicAddress', value)}
              className="font-mono"
            />
          </div>

          {/* Tunnel Address */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('admin.forwardAgents.detail.tunnelAddress')}</label>
            <MobileFormInput
              placeholder="10.0.0.1"
              value={form.formData.tunnelAddress || ''}
              onChange={(value) => form.handleChange('tunnelAddress', value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              {t('admin.forwardAgents.form.tunnelAddressHint')}
            </p>
          </div>

          {/* Allowed Port Range */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('admin.forwardAgents.detail.portLimit')}</label>
            <MobileFormInput
              placeholder="80,443,8000-9000"
              value={form.formData.allowedPortRange || ''}
              onChange={(value) => form.handleChange('allowedPortRange', value)}
              className="font-mono"
            />
          </div>

          {/* Sort Order */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('common.fields.sortOrder')}</label>
            <MobileFormInput
              type="number"
              inputMode="numeric"
              value={form.formData.sortOrder !== undefined ? String(form.formData.sortOrder) : ''}
              onChange={(value) => form.handleSortOrderChange(value)}
              className="font-mono"
            />
          </div>

          {/* Blocked Protocols */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('admin.forwardAgents.detail.blockedProtocols')}</label>
            <div className="space-y-3">
              {PROTOCOL_GROUPS.map((group) => (
                <div key={group.labelKey}>
                  <p className="text-xs text-muted-foreground mb-2">{t(group.labelKey)}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.protocols.map((protocol) => {
                      const isSelected = form.formData.blockedProtocols?.includes(protocol.value) || false;
                      return (
                        <button
                          key={protocol.value}
                          type="button"
                          onClick={() => form.handleProtocolToggle(protocol.value, !isSelected)}
                          className={cn(
                            'px-3 py-2 text-sm rounded-lg transition-all min-h-[44px] active:scale-[0.98]',
                            isSelected
                              ? 'bg-destructive/10 ring-1 ring-destructive/50 text-destructive'
                              : 'bg-muted/50 ring-1 ring-border text-muted-foreground active:bg-muted'
                          )}
                        >
                          {protocol.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Remark */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('common.fields.remark')}</label>
            <MobileFormInput
              placeholder={t('admin.forwardAgents.form.remarkPlaceholder')}
              value={form.formData.remark || ''}
              onChange={(value) => form.handleChange('remark', value)}
            />
          </div>

          {/* Resource Groups */}
          {resourceGroups.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('admin.forwardAgents.form.bindResourceGroups')}</label>
              <div className="border rounded-lg overflow-hidden divide-y divide-border">
                {resourceGroups.map((group) => {
                  const isSelected = form.formData.groupSids?.includes(group.sid) ?? false;
                  return (
                    <button
                      key={group.sid}
                      type="button"
                      onClick={() => form.handleGroupToggle(group.sid)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 w-full text-left transition-colors min-h-[48px]",
                        isSelected ? "bg-primary/5" : "active:bg-muted/50"
                      )}
                    >
                      <div className={cn(
                        "size-5 rounded border flex items-center justify-center shrink-0 transition-colors",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-border"
                      )}>
                        {isSelected && <Check className="size-3.5" />}
                      </div>
                      <SmartTruncate text={group.name} className="text-sm font-medium flex-1" />
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {form.formData.groupSids && form.formData.groupSids.length > 0
                  ? t("admin.forwardAgents.form.selectedGroupsCount", { count: form.formData.groupSids.length })
                  : t("admin.forwardAgents.form.bindResourceGroupsHint")}
              </p>
            </div>
          )}

          {/* Mute Notification */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('admin.forwardAgents.detail.notificationStatus')}</label>
            <div className="flex items-center justify-between min-h-[52px] px-4 rounded-xl border bg-background">
              <span className="text-sm text-muted-foreground">
                {form.formData.muteNotification ? t('admin.forwardAgents.detail.muted') : t('admin.forwardAgents.detail.normalNotification')}
              </span>
              <Switch
                checked={form.formData.muteNotification ?? false}
                onCheckedChange={(checked) => form.handleChange('muteNotification', checked)}
              >
                <SwitchThumb />
              </Switch>
            </div>
          </div>

          {/* Expiration Time */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('admin.forwardAgents.edit.labels.expiresAt')}</label>
            <ExpirationDatePicker
              value={form.formData.expiresAt}
              onChange={(value) => form.handleChange('expiresAt', value ?? '')}
              emptyValue=""
              id="expiresAt"
              mobile
            />
            <p className="text-xs text-muted-foreground">
              {t('admin.forwardAgents.edit.hints.expiresAt')}
            </p>
          </div>

          {/* Cost Label */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('common.fields.costLabel')}</label>
            <MobileFormInput
              placeholder={t('common.costLabel.placeholder')}
              value={form.formData.costLabel ?? ''}
              onChange={(value) => form.handleCostLabelChange(value)}
            />
            <p className="text-xs text-muted-foreground">
              {t('common.costLabel.hint')}
            </p>
          </div>
        </SheetBody>

        <SheetFooter>
          <div className="flex gap-3 w-full">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 min-h-[44px]"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {t('common.processing')}
                </>
              ) : (
                t('common.actions.save')
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 min-h-[44px]"
            >
              {t('common.actions.cancel')}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
