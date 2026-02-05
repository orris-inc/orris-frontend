/**
 * TUIC protocol configuration form component
 * Handles congestion control, UDP relay mode, SNI, TLS security, ALPN, and DisableSNI settings
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { AlertCircle, Shield } from 'lucide-react';
import { CONGESTION_CONTROL_OPTIONS, TUIC_UDP_RELAY_OPTIONS } from '@/shared/constants/protocol-options';
import type { CongestionControl, TUICUDPRelayMode } from '@/api/node';

export interface TuicConfigFormProps {
  congestionControl?: CongestionControl;
  udpRelayMode?: TUICUDPRelayMode;
  sni?: string;
  allowInsecure?: boolean;
  alpn?: string;
  disableSni?: boolean;
  onFieldChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

interface FormFieldProps {
  label: React.ReactNode;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = memo(({
  label,
  required,
  error,
  hint,
  className = '',
  children,
}) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <Label className="text-sm font-medium text-foreground flex items-center gap-1">
      {label}
      {required && <span className="text-destructive">*</span>}
    </Label>
    {children}
    {(error || hint) && (
      <p className={`text-xs flex items-center gap-1 ${error ? 'text-destructive' : 'text-muted-foreground'}`}>
        {error && <AlertCircle className="size-3" />}
        {error || hint}
      </p>
    )}
  </div>
));

const TuicConfigFormBase: React.FC<TuicConfigFormProps> = ({
  congestionControl = 'bbr',
  udpRelayMode = 'native',
  sni,
  allowInsecure = false,
  alpn,
  disableSni = false,
  onFieldChange,
  errors = {},
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* Congestion Control and UDP Relay Mode */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label={t('admin.nodes.form.congestionControl')}
          hint={t('admin.nodes.form.congestionControlHint')}
          error={errors.congestionControl}
        >
          <Select
            value={congestionControl}
            onValueChange={(value) => onFieldChange('tuicCongestionControl', value as CongestionControl)}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONGESTION_CONTROL_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                  {option.recommended && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({t('common.recommended')})
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          label={t('admin.nodes.form.udpRelayMode')}
          hint={t('admin.nodes.form.udpRelayModeHint')}
          error={errors.udpRelayMode}
        >
          <Select
            value={udpRelayMode}
            onValueChange={(value) => onFieldChange('tuicUdpRelayMode', value as TUICUDPRelayMode)}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TUIC_UDP_RELAY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      {/* SNI and TLS Security */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label={t('admin.nodes.form.fields.sni')}
          hint={t('admin.nodes.form.sniHint')}
          error={errors.sni}
        >
          <Input
            id="tuicSni"
            placeholder="example.com"
            value={sni || ''}
            onChange={(e) => onFieldChange('tuicSni', e.target.value)}
            className="h-10 font-mono"
          />
        </FormField>

        <FormField
          label={t('admin.nodes.form.tlsSecurity')}
          hint={t('admin.nodes.form.tlsSecurityHint')}
          error={errors.allowInsecure}
        >
          <Select
            value={allowInsecure ? 'true' : 'false'}
            onValueChange={(value) => onFieldChange('tuicAllowInsecure', value === 'true')}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">
                <div className="flex items-center gap-2">
                  <Shield className="size-3.5 text-success" />
                  {t('admin.nodes.form.verifyCert')}
                </div>
              </SelectItem>
              <SelectItem value="true">
                <div className="flex items-center gap-2">
                  <AlertCircle className="size-3.5 text-warning" />
                  {t('admin.nodes.form.skipVerify')}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>

      {/* ALPN and DisableSNI */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label={t('admin.nodes.form.fields.alpn')}
          hint={t('admin.nodes.form.alpnHint')}
          error={errors.alpn}
        >
          <Input
            id="tuicAlpn"
            placeholder="h3"
            value={alpn || ''}
            onChange={(e) => onFieldChange('tuicAlpn', e.target.value)}
            className="h-10 font-mono"
          />
        </FormField>

        <FormField
          label={t('admin.nodes.form.disableSni')}
          hint={t('admin.nodes.form.disableSniHint')}
          error={errors.disableSni}
        >
          <Select
            value={disableSni ? 'true' : 'false'}
            onValueChange={(value) => onFieldChange('tuicDisableSni', value === 'true')}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">{t('admin.nodes.form.notDisabled')}</SelectItem>
              <SelectItem value="true">{t('admin.nodes.form.disableSniOption')}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>
    </div>
  );
};

export const TuicConfigForm = memo(TuicConfigFormBase);
