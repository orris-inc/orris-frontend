/**
 * AnyTLS protocol configuration form component
 * Handles TLS SNI, allow insecure, fingerprint, idle session settings
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
import { TLS_FINGERPRINT_OPTIONS } from '@/shared/constants/protocol-options';

export interface AnyTLSConfigFormProps {
  sni?: string;
  allowInsecure?: boolean;
  fingerprint?: string;
  idleSessionCheckInterval?: string;
  idleSessionTimeout?: string;
  minIdleSession?: number;
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

const AnyTLSConfigFormBase: React.FC<AnyTLSConfigFormProps> = ({
  sni,
  allowInsecure = false,
  fingerprint,
  idleSessionCheckInterval,
  idleSessionTimeout,
  minIdleSession,
  onFieldChange,
  errors = {},
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* SNI and TLS Security */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label={t('admin.nodes.form.fields.sni')}
          hint={t('admin.nodes.form.sniHint')}
          error={errors.anytlsSni}
        >
          <Input
            id="anytlsSni"
            placeholder="example.com"
            value={sni || ''}
            onChange={(e) => onFieldChange('anytlsSni', e.target.value)}
            className="h-10 font-mono"
          />
        </FormField>

        <FormField
          label={t('admin.nodes.form.tlsSecurity')}
          hint={t('admin.nodes.form.tlsSecurityHint')}
          error={errors.anytlsAllowInsecure}
        >
          <Select
            value={allowInsecure ? 'true' : 'false'}
            onValueChange={(value) => onFieldChange('anytlsAllowInsecure', value === 'true')}
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

      {/* Fingerprint */}
      <FormField
        label={t('admin.nodes.form.anytls.fingerprint')}
        hint={t('admin.nodes.form.anytls.fingerprintHint')}
        error={errors.anytlsFingerprint}
      >
        <Select
          value={fingerprint || '__none__'}
          onValueChange={(value) => onFieldChange('anytlsFingerprint', value === '__none__' ? '' : value)}
        >
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">{t('common.none')}</SelectItem>
            {TLS_FINGERPRINT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      {/* Idle Session Settings */}
      <div className="grid grid-cols-3 gap-4">
        <FormField
          label={t('admin.nodes.form.anytls.idleCheckInterval')}
          hint={t('admin.nodes.form.anytls.idleCheckIntervalHint')}
          error={errors.anytlsIdleSessionCheckInterval}
        >
          <Input
            id="anytlsIdleSessionCheckInterval"
            placeholder="30s"
            value={idleSessionCheckInterval || ''}
            onChange={(e) => onFieldChange('anytlsIdleSessionCheckInterval', e.target.value)}
            className="h-10 font-mono"
          />
        </FormField>

        <FormField
          label={t('admin.nodes.form.anytls.idleTimeout')}
          hint={t('admin.nodes.form.anytls.idleTimeoutHint')}
          error={errors.anytlsIdleSessionTimeout}
        >
          <Input
            id="anytlsIdleSessionTimeout"
            placeholder="30s"
            value={idleSessionTimeout || ''}
            onChange={(e) => onFieldChange('anytlsIdleSessionTimeout', e.target.value)}
            className="h-10 font-mono"
          />
        </FormField>

        <FormField
          label={t('admin.nodes.form.anytls.minIdleSession')}
          hint={t('admin.nodes.form.anytls.minIdleSessionHint')}
          error={errors.anytlsMinIdleSession}
        >
          <Input
            id="anytlsMinIdleSession"
            type="number"
            min={0}
            placeholder="0"
            value={minIdleSession !== undefined ? String(minIdleSession) : ''}
            onChange={(e) => onFieldChange('anytlsMinIdleSession', e.target.value ? parseInt(e.target.value, 10) : undefined)}
            className="h-10 font-mono"
          />
        </FormField>
      </div>
    </div>
  );
};

export const AnyTLSConfigForm = memo(AnyTLSConfigFormBase);
