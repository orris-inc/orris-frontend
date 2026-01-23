/**
 * Create Forward Agent Sheet Component
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
  type CreateSheetProps,
} from '@/components/common/sheet';
import { Button } from '@/components/common/Button';
import { MobileFormInput } from '@/components/common/mobile-form';
import { cn } from '@/lib/utils';
import type { CreateForwardAgentRequest, BlockedProtocol } from '@/api/forward';

// Protocol groups
const PROTOCOL_GROUPS: {
  labelKey: string;
  protocols: { value: BlockedProtocol; label: string }[];
}[] = [
  {
    labelKey: 'admin.forwardAgents.form.protocolGroupProxy',
    protocols: [
      { value: 'http_connect', label: 'HTTP CONNECT' },
      { value: 'socks4', label: 'SOCKS4' },
      { value: 'socks5', label: 'SOCKS5' },
    ],
  },
  {
    labelKey: 'admin.forwardAgents.form.protocolGroupApp',
    protocols: [
      { value: 'http', label: 'HTTP' },
      { value: 'tls', label: 'TLS' },
      { value: 'ssh', label: 'SSH' },
      { value: 'ftp', label: 'FTP' },
    ],
  },
];

interface CreateForwardAgentSheetProps extends CreateSheetProps<CreateForwardAgentRequest> {
  initialData?: Partial<CreateForwardAgentRequest>;
}

const getDefaultFormData = (): CreateForwardAgentRequest => ({
  name: '',
  publicAddress: '',
  tunnelAddress: '',
  remark: '',
  allowedPortRange: '',
  sortOrder: undefined,
  blockedProtocols: [],
});

export const CreateForwardAgentSheet: React.FC<CreateForwardAgentSheetProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CreateForwardAgentRequest>(getDefaultFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && initialData) {
      setFormData({ ...getDefaultFormData(), ...initialData });
    } else if (open && !initialData) {
      setFormData(getDefaultFormData());
    }
  }, [open, initialData]);

  const handleClose = () => {
    if (!loading) {
      setFormData(getDefaultFormData());
      setErrors({});
      onOpenChange(false);
    }
  };

  const handleChange = (field: keyof CreateForwardAgentRequest, value: string | number | undefined) => {
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
    if (!formData.name.trim()) {
      newErrors.name = t('admin.forwardAgents.create.validation.nameRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const submitData: CreateForwardAgentRequest = {
        name: formData.name.trim(),
      };

      if (formData.publicAddress?.trim()) {
        submitData.publicAddress = formData.publicAddress.trim();
      }
      if (formData.tunnelAddress?.trim()) {
        submitData.tunnelAddress = formData.tunnelAddress.trim();
      }
      if (formData.remark?.trim()) {
        submitData.remark = formData.remark.trim();
      }
      if (formData.allowedPortRange?.trim()) {
        submitData.allowedPortRange = formData.allowedPortRange.trim();
      }
      if (formData.sortOrder !== undefined) {
        submitData.sortOrder = formData.sortOrder;
      }
      if (formData.blockedProtocols && formData.blockedProtocols.length > 0) {
        submitData.blockedProtocols = formData.blockedProtocols;
      }

      await onSubmit(submitData);
      setFormData(getDefaultFormData());
      setErrors({});
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name.trim();

  return (
    <Sheet open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {initialData ? t('admin.forwardAgents.create.copyTitle') : t('admin.forwardAgents.create.title')}
          </SheetTitle>
          <SheetDescription>
            {t('admin.forwardAgents.create.description')}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-4 py-4">
          {/* Node Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t('admin.forwardAgents.create.labels.nodeName')} <span className="text-destructive">*</span>
            </label>
            <MobileFormInput
              placeholder={t('admin.forwardAgents.create.placeholders.nodeName')}
              value={formData.name}
              onChange={(value) => handleChange('name', value)}
              error={errors.name}
            />
          </div>

          {/* Public Address */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('admin.forwardAgents.create.labels.publicAddress')}</label>
            <MobileFormInput
              placeholder={t('admin.forwardAgents.create.placeholders.publicAddress')}
              value={formData.publicAddress || ''}
              onChange={(value) => handleChange('publicAddress', value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              {t('admin.forwardAgents.create.hints.publicAddress')}
            </p>
          </div>

          {/* Tunnel Address */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('admin.forwardAgents.create.labels.tunnelAddress')}</label>
            <MobileFormInput
              placeholder={t('admin.forwardAgents.create.placeholders.tunnelAddress')}
              value={formData.tunnelAddress || ''}
              onChange={(value) => handleChange('tunnelAddress', value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              {t('admin.forwardAgents.create.hints.tunnelAddress')}
            </p>
          </div>

          {/* Allowed Port Range */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('admin.forwardAgents.create.labels.portLimit')}</label>
            <MobileFormInput
              placeholder={t('admin.forwardAgents.create.placeholders.portLimit')}
              value={formData.allowedPortRange || ''}
              onChange={(value) => handleChange('allowedPortRange', value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              {t('admin.forwardAgents.create.hints.portLimit')}
            </p>
          </div>

          {/* Sort Order */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('admin.forwardAgents.create.labels.sortOrder')}</label>
            <MobileFormInput
              type="number"
              inputMode="numeric"
              placeholder={t('admin.forwardAgents.create.placeholders.sortOrder')}
              value={formData.sortOrder !== undefined ? String(formData.sortOrder) : ''}
              onChange={(value) => handleChange('sortOrder', value ? parseInt(value, 10) : undefined)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              {t('admin.forwardAgents.create.hints.sortOrder')}
            </p>
          </div>

          {/* Blocked Protocols */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('admin.forwardAgents.create.labels.blockedProtocols')}</label>
            <div className="space-y-3">
              {PROTOCOL_GROUPS.map((group) => (
                <div key={group.labelKey}>
                  <p className="text-xs text-muted-foreground mb-2">{t(group.labelKey)}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.protocols.map((protocol) => {
                      const isSelected = formData.blockedProtocols?.includes(protocol.value) || false;
                      return (
                        <button
                          key={protocol.value}
                          type="button"
                          onClick={() => handleProtocolToggle(protocol.value, !isSelected)}
                          className={cn(
                            'px-3 py-2 text-sm rounded-lg border transition-colors min-h-[44px]',
                            isSelected
                              ? 'bg-destructive/10 border-destructive/50 text-destructive'
                              : 'bg-muted/50 border-border text-muted-foreground active:bg-muted'
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
            <p className="text-xs text-muted-foreground">
              {t('admin.forwardAgents.create.hints.blockedProtocols')}
            </p>
          </div>

          {/* Remark */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('admin.forwardAgents.create.labels.remark')}</label>
            <MobileFormInput
              placeholder={t('admin.forwardAgents.create.placeholders.remark')}
              value={formData.remark || ''}
              onChange={(value) => handleChange('remark', value)}
            />
          </div>
        </SheetBody>

        <SheetFooter>
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 min-h-[44px]"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !isFormValid}
              className="flex-1 min-h-[44px]"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {t('admin.forwardAgents.create.creating')}
                </>
              ) : (
                t('common.create')
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
