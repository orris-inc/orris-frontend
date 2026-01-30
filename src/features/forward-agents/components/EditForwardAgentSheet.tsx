/**
 * Edit Forward Agent Sheet Component
 * Mobile-optimized bottom sheet - Tailwind Application UI style
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
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
import { MobileFormInput, MobileSelect } from '@/components/common/mobile-form';
import { useResourceGroups } from '@/features/resource-groups/hooks/useResourceGroups';
import { cn } from '@/lib/utils';
import type { ForwardAgent, UpdateForwardAgentRequest, BlockedProtocol } from '@/api/forward';

// Protocol definitions
const PROXY_PROTOCOLS: { value: BlockedProtocol; label: string }[] = [
  { value: 'http_connect', label: 'HTTP CONNECT' },
  { value: 'socks4', label: 'SOCKS4' },
  { value: 'socks5', label: 'SOCKS5' },
];

const APP_PROTOCOLS: { value: BlockedProtocol; label: string }[] = [
  { value: 'http', label: 'HTTP' },
  { value: 'tls', label: 'TLS' },
  { value: 'ssh', label: 'SSH' },
  { value: 'ftp', label: 'FTP' },
];

type EditForwardAgentSheetProps = EditSheetProps<ForwardAgent, UpdateForwardAgentRequest>;

export const EditForwardAgentSheet: React.FC<EditForwardAgentSheetProps> = ({
  open,
  onOpenChange,
  entity: agent,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<UpdateForwardAgentRequest>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const { resourceGroups, isLoading: isLoadingGroups } = useResourceGroups({
    pageSize: 100,
    filters: { status: 'active' },
    enabled: open,
  });

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name,
        publicAddress: agent.publicAddress,
        tunnelAddress: agent.tunnelAddress,
        remark: agent.remark,
        allowedPortRange: agent.allowedPortRange,
        sortOrder: agent.sortOrder,
        blockedProtocols: agent.blockedProtocols || [],
        muteNotification: agent.muteNotification,
      });
      setErrors({});
    }
  }, [agent]);

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  const handleChange = (field: keyof UpdateForwardAgentRequest, value: string | number | boolean | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleProtocolToggle = (protocol: BlockedProtocol, checked: boolean) => {
    const current = formData.blockedProtocols || [];
    const updated = checked
      ? [...current, protocol]
      : current.filter((p) => p !== protocol);
    setFormData((prev) => ({ ...prev, blockedProtocols: updated }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (formData.name !== undefined && !formData.name.trim()) {
      newErrors.name = t('common.validation.required');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!agent || !validate()) return;

    setLoading(true);
    try {
      const updates: UpdateForwardAgentRequest = {};

      if (formData.name !== agent.name) updates.name = formData.name;
      if (formData.publicAddress !== agent.publicAddress) updates.publicAddress = formData.publicAddress;
      if (formData.tunnelAddress !== agent.tunnelAddress) updates.tunnelAddress = formData.tunnelAddress;
      if (formData.remark !== agent.remark) updates.remark = formData.remark;
      if (formData.allowedPortRange !== agent.allowedPortRange) updates.allowedPortRange = formData.allowedPortRange;
      if (formData.sortOrder !== agent.sortOrder) updates.sortOrder = formData.sortOrder;

      // Compare blocked protocols
      const currentProtocols = agent.blockedProtocols || [];
      const newProtocols = formData.blockedProtocols || [];
      const protocolsChanged =
        currentProtocols.length !== newProtocols.length ||
        currentProtocols.some((p) => !newProtocols.includes(p)) ||
        newProtocols.some((p) => !currentProtocols.includes(p));
      if (protocolsChanged) {
        updates.blockedProtocols = newProtocols;
      }

      if (formData.groupSid !== undefined) {
        updates.groupSid = formData.groupSid;
      }

      if (formData.muteNotification !== agent.muteNotification) {
        updates.muteNotification = formData.muteNotification;
      }

      if (Object.keys(updates).length > 0) {
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
              value={formData.name || ''}
              onChange={(value) => handleChange('name', value)}
              error={errors.name}
            />
          </div>

          {/* Public Address */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('admin.forwardAgents.detail.publicAddress')}</label>
            <MobileFormInput
              placeholder={t('admin.forwardAgents.form.publicAddressPlaceholder')}
              value={formData.publicAddress || ''}
              onChange={(value) => handleChange('publicAddress', value)}
              className="font-mono"
            />
          </div>

          {/* Tunnel Address */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('admin.forwardAgents.detail.tunnelAddress')}</label>
            <MobileFormInput
              placeholder="10.0.0.1"
              value={formData.tunnelAddress || ''}
              onChange={(value) => handleChange('tunnelAddress', value)}
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
              value={formData.allowedPortRange || ''}
              onChange={(value) => handleChange('allowedPortRange', value)}
              className="font-mono"
            />
          </div>

          {/* Sort Order */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('common.fields.sortOrder')}</label>
            <MobileFormInput
              type="number"
              inputMode="numeric"
              value={formData.sortOrder !== undefined ? String(formData.sortOrder) : ''}
              onChange={(value) => handleChange('sortOrder', value ? parseInt(value, 10) : undefined)}
              className="font-mono"
            />
          </div>

          {/* Blocked Protocols */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('admin.forwardAgents.detail.blockedProtocols')}</label>
            <div className="space-y-3">
              {/* Proxy Protocols */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">{t('admin.forwardAgents.form.protocolGroupProxy')}</p>
                <div className="flex flex-wrap gap-2">
                  {PROXY_PROTOCOLS.map((protocol) => {
                    const isSelected = formData.blockedProtocols?.includes(protocol.value) || false;
                    return (
                      <button
                        key={protocol.value}
                        type="button"
                        onClick={() => handleProtocolToggle(protocol.value, !isSelected)}
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
              {/* App Protocols */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">{t('admin.forwardAgents.form.protocolGroupApp')}</p>
                <div className="flex flex-wrap gap-2">
                  {APP_PROTOCOLS.map((protocol) => {
                    const isSelected = formData.blockedProtocols?.includes(protocol.value) || false;
                    return (
                      <button
                        key={protocol.value}
                        type="button"
                        onClick={() => handleProtocolToggle(protocol.value, !isSelected)}
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
            </div>
          </div>

          {/* Remark */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('common.fields.remark')}</label>
            <MobileFormInput
              placeholder={t('admin.forwardAgents.form.remarkPlaceholder')}
              value={formData.remark || ''}
              onChange={(value) => handleChange('remark', value)}
            />
          </div>

          {/* Resource Group */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('admin.forwardAgents.table.columns.resourceGroup')}</label>
            <MobileSelect
              value={formData.groupSid ?? '__none__'}
              onChange={(value) => handleChange('groupSid', value === '__none__' ? '' : value)}
              disabled={isLoadingGroups}
              options={[
                { value: '__none__', label: t('common.none') },
                ...resourceGroups.map((group) => ({
                  value: group.sid,
                  label: group.name,
                })),
              ]}
              placeholder={isLoadingGroups ? t('common.table.loading') : t('common.placeholders.select')}
            />
          </div>

          {/* Mute Notification */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('admin.forwardAgents.detail.notificationStatus')}</label>
            <div className="flex items-center justify-between min-h-[52px] px-4 rounded-xl border bg-background">
              <span className="text-sm text-muted-foreground">
                {formData.muteNotification ? t('admin.forwardAgents.detail.muted') : t('admin.forwardAgents.detail.normalNotification')}
              </span>
              <Switch
                checked={formData.muteNotification ?? false}
                onCheckedChange={(checked) => handleChange('muteNotification', checked)}
              >
                <SwitchThumb />
              </Switch>
            </div>
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
