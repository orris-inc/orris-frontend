/**
 * Node Network Fields
 * Extracted from Node form components - Server Address, Agent Port, Subscription Port
 */

import { useTranslation } from 'react-i18next';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { MobileFormInput } from '@/components/common/mobile-form';

interface NodeNetworkFieldsProps {
  variant: 'desktop' | 'mobile';
  serverAddress?: string;
  agentPort?: number;
  subscriptionPort?: number;
  onFieldChange: (field: string, value: string | number | boolean | undefined) => void;
  errors?: Record<string, string>;
}

// Desktop form field wrapper
const DesktopField: React.FC<{
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ label, hint, error, className = '', children }) => (
  <div className={`flex flex-col gap-2 ${className}`}>
    <Label>{label}</Label>
    {children}
    {error && <p className="text-xs text-destructive">{error}</p>}
    {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);

// Mobile form field label
const MobileFieldLabel: React.FC<{ label: string }> = ({ label }) => (
  <div className="space-y-0.5">
    <label className="text-sm font-medium text-foreground">{label}</label>
  </div>
);

export const NodeNetworkFields: React.FC<NodeNetworkFieldsProps> = ({
  variant,
  serverAddress,
  agentPort,
  subscriptionPort,
  onFieldChange,
  errors = {},
}) => {
  const { t } = useTranslation();

  if (variant === 'mobile') {
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <MobileFieldLabel label={t('admin.nodes.form.serverAddress')} />
          <MobileFormInput
            value={serverAddress || ''}
            onChange={(value) => onFieldChange('serverAddress', value)}
            error={errors.serverAddress}
            className="font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <MobileFieldLabel label={t('admin.nodes.form.agentPort')} />
            <MobileFormInput
              type="number"
              min={1}
              max={65535}
              value={agentPort ? String(agentPort) : ''}
              onChange={(value) => onFieldChange('agentPort', parseInt(value, 10))}
              error={errors.agentPort}
              className="font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <MobileFieldLabel label={t('admin.nodes.form.subscriptionPort')} />
            <MobileFormInput
              type="number"
              min={1}
              max={65535}
              placeholder={t('admin.nodes.form.subscriptionPortPlaceholder')}
              value={subscriptionPort !== undefined ? String(subscriptionPort) : ''}
              onChange={(value) => onFieldChange('subscriptionPort', value ? parseInt(value, 10) : undefined)}
              error={errors.subscriptionPort}
              className="font-mono"
            />
          </div>
        </div>
      </div>
    );
  }

  // Desktop variant
  return (
    <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
      <DesktopField
        label={t('admin.nodes.form.serverAddress')}
        error={errors.serverAddress}
        className="@md:col-span-2"
      >
        <Input
          id="serverAddress"
          value={serverAddress || ''}
          onChange={(e) => onFieldChange('serverAddress', e.target.value)}
          error={!!errors.serverAddress}
        />
      </DesktopField>

      <DesktopField label={t('admin.nodes.form.agentPort')} error={errors.agentPort}>
        <Input
          id="agentPort"
          type="number"
          min={1}
          max={65535}
          value={agentPort || ''}
          onChange={(e) => onFieldChange('agentPort', parseInt(e.target.value, 10))}
          error={!!errors.agentPort}
        />
      </DesktopField>

      <DesktopField
        label={t('admin.nodes.form.subscriptionPort')}
        error={errors.subscriptionPort}
      >
        <Input
          id="subscriptionPort"
          type="number"
          min={1}
          max={65535}
          placeholder={t('admin.nodes.form.subscriptionPortPlaceholder')}
          value={subscriptionPort ?? ''}
          onChange={(e) => onFieldChange('subscriptionPort', e.target.value ? parseInt(e.target.value, 10) : undefined)}
          error={!!errors.subscriptionPort}
        />
      </DesktopField>
    </div>
  );
};
