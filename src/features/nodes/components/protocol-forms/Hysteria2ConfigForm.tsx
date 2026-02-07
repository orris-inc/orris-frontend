/**
 * Hysteria2 protocol configuration form component
 * Handles congestion control, SNI, TLS security, obfuscation, bandwidth, and fingerprint settings
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
import {
  CONGESTION_CONTROL_OPTIONS,
  TLS_FINGERPRINT_OPTIONS,
} from '@/shared/constants/protocol-options';
import type { CongestionControl } from '@/api/node';

export interface Hysteria2ConfigFormProps {
  congestionControl?: CongestionControl;
  sni?: string;
  allowInsecure?: boolean;
  obfs?: string;
  obfsPassword?: string;
  upMbps?: number;
  downMbps?: number;
  fingerprint?: string;
  onFieldChange: (field: string, value: string | number | boolean | undefined) => void;
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

const Hysteria2ConfigFormBase: React.FC<Hysteria2ConfigFormProps> = ({
  congestionControl = 'bbr',
  sni,
  allowInsecure = false,
  obfs,
  obfsPassword,
  upMbps,
  downMbps,
  fingerprint,
  onFieldChange,
  errors = {},
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* Congestion Control */}
      <FormField
        label={t('admin.nodes.form.congestionControl')}
        hint={t('admin.nodes.form.congestionControlHint')}
        error={errors.hysteria2CongestionControl}
      >
        <Select
          value={congestionControl}
          onValueChange={(value) => onFieldChange('hysteria2CongestionControl', value as CongestionControl)}
        >
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONGESTION_CONTROL_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      {/* SNI and TLS Security */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label={t('admin.nodes.form.fields.sni')}
          hint={t('admin.nodes.form.sniHint')}
          error={errors.hysteria2Sni}
        >
          <Input
            id="hysteria2Sni"
            placeholder="example.com"
            value={sni || ''}
            onChange={(e) => onFieldChange('hysteria2Sni', e.target.value)}
            className="h-10 font-mono"
          />
        </FormField>

        <FormField
          label={t('admin.nodes.form.tlsSecurity')}
          hint={t('admin.nodes.form.tlsSecurityHint')}
          error={errors.hysteria2AllowInsecure}
        >
          <Select
            value={allowInsecure ? 'true' : 'false'}
            onValueChange={(value) => onFieldChange('hysteria2AllowInsecure', value === 'true')}
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

      {/* Obfs Type and Password */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label={t('admin.nodes.form.obfsType')}
          hint={t('admin.nodes.form.obfsTypeHint')}
          error={errors.hysteria2Obfs}
        >
          <Input
            id="hysteria2Obfs"
            placeholder="salamander"
            value={obfs || ''}
            onChange={(e) => onFieldChange('hysteria2Obfs', e.target.value)}
            className="h-10 font-mono"
          />
        </FormField>

        {/* Show obfs password field only when obfs is set */}
        {obfs && (
          <FormField
            label={t('admin.nodes.form.obfsPassword')}
            hint={t('admin.nodes.form.obfsPasswordHint')}
            error={errors.hysteria2ObfsPassword}
          >
            <Input
              id="hysteria2ObfsPassword"
              placeholder={t('common.placeholders.password')}
              value={obfsPassword || ''}
              onChange={(e) => onFieldChange('hysteria2ObfsPassword', e.target.value)}
              className="h-10 font-mono"
            />
          </FormField>
        )}
      </div>

      {/* Upload and Download Bandwidth */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label={t('admin.nodes.form.upBandwidth')}
          hint={t('common.optional')}
          error={errors.hysteria2UpMbps}
        >
          <Input
            id="hysteria2UpMbps"
            type="number"
            min={0}
            placeholder="100"
            value={upMbps ?? ''}
            onChange={(e) => onFieldChange('hysteria2UpMbps', e.target.value ? parseInt(e.target.value, 10) : undefined)}
            className="h-10 font-mono"
          />
        </FormField>

        <FormField
          label={t('admin.nodes.form.downBandwidth')}
          hint={t('common.optional')}
          error={errors.hysteria2DownMbps}
        >
          <Input
            id="hysteria2DownMbps"
            type="number"
            min={0}
            placeholder="100"
            value={downMbps ?? ''}
            onChange={(e) => onFieldChange('hysteria2DownMbps', e.target.value ? parseInt(e.target.value, 10) : undefined)}
            className="h-10 font-mono"
          />
        </FormField>
      </div>

      {/* TLS Fingerprint */}
      <FormField
        label={t('admin.nodes.form.fields.fingerprint')}
        hint={t('admin.nodes.form.fingerprintHint')}
        error={errors.hysteria2Fingerprint}
      >
        <Select
          value={fingerprint || ''}
          onValueChange={(value) => onFieldChange('hysteria2Fingerprint', value)}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder={t('admin.nodes.form.selectFingerprint')} />
          </SelectTrigger>
          <SelectContent>
            {TLS_FINGERPRINT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
    </div>
  );
};

export const Hysteria2ConfigForm = memo(Hysteria2ConfigFormBase);
