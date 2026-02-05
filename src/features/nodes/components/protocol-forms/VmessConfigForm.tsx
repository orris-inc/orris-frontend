/**
 * VMess protocol configuration form component
 * Handles transport protocol, security, TLS settings, and transport-specific configurations
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
import { VMESS_TRANSPORT_OPTIONS, VMESS_SECURITY_OPTIONS } from '@/shared/constants/protocol-options';
import type { TransportProtocol, VMessSecurity } from '@/api/node';

export interface VmessConfigFormProps {
  transportType?: TransportProtocol;
  security?: VMessSecurity;
  alterId?: number;
  tls?: boolean;
  sni?: string;
  allowInsecure?: boolean;
  host?: string;
  path?: string;
  serviceName?: string;
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

const VmessConfigFormBase: React.FC<VmessConfigFormProps> = ({
  transportType = 'tcp',
  security = 'auto',
  alterId = 0,
  tls = true,
  sni = '',
  allowInsecure = false,
  host = '',
  path = '',
  serviceName = '',
  onFieldChange,
  errors = {},
}) => {
  const { t } = useTranslation();

  // Conditional display logic
  const showWsHttpFields = transportType === 'ws' || transportType === 'http';
  const showGrpcFields = transportType === 'grpc';

  return (
    <div className="space-y-4">
      {/* Transport Protocol & Security */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label={t('admin.nodes.form.transportProtocol')}
          hint={t('admin.nodes.form.transportProtocolHint')}
          error={errors.transportType}
        >
          <Select
            value={transportType}
            onValueChange={(value) => onFieldChange('vmessTransportType', value as TransportProtocol)}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VMESS_TRANSPORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          label={t('admin.nodes.form.encryptionMethod')}
          hint={t('admin.nodes.form.vmessSecurityHint')}
          error={errors.security}
        >
          <Select
            value={security}
            onValueChange={(value) => onFieldChange('vmessSecurity', value as VMessSecurity)}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VMESS_SECURITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                  {option.recommended && (
                    <span className="ml-1.5 text-xs text-success">(Recommended)</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      {/* AlterId & TLS */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label={t('admin.nodes.form.fields.alterId')}
          hint={t('admin.nodes.form.alterIdHint')}
          error={errors.alterId}
        >
          <Input
            id="vmessAlterId"
            type="number"
            min={0}
            value={alterId}
            onChange={(e) => onFieldChange('vmessAlterId', parseInt(e.target.value, 10) || 0)}
            className="h-10 font-mono"
          />
        </FormField>

        <FormField
          label={t('admin.nodes.form.fields.tls')}
          hint={t('admin.nodes.form.enableTlsHint')}
          error={errors.tls}
        >
          <Select
            value={tls ? 'true' : 'false'}
            onValueChange={(value) => onFieldChange('vmessTls', value === 'true')}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">{t('admin.nodes.form.enableTls')}</SelectItem>
              <SelectItem value="false">{t('admin.nodes.form.disableTls')}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>

      {/* SNI & TLS Security - Show when TLS is enabled */}
      {tls && (
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label={t('admin.nodes.form.fields.sni')}
            hint={t('admin.nodes.form.sniHint')}
            error={errors.sni}
          >
            <Input
              id="vmessSni"
              placeholder="example.com"
              value={sni}
              onChange={(e) => onFieldChange('vmessSni', e.target.value)}
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
              onValueChange={(value) => onFieldChange('vmessAllowInsecure', value === 'true')}
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
      )}

      {/* WebSocket/HTTP fields - Show for ws and http transport */}
      {showWsHttpFields && (
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label={t('admin.nodes.form.fields.host')}
            hint={t('admin.nodes.form.hints.wsHttpHost')}
            error={errors.host}
          >
            <Input
              id="vmessHost"
              placeholder="example.com"
              value={host}
              onChange={(e) => onFieldChange('vmessHost', e.target.value)}
              className="h-10 font-mono"
            />
          </FormField>

          <FormField
            label={t('admin.nodes.form.fields.path')}
            hint={t('admin.nodes.form.wsHttpPathHint')}
            error={errors.path}
          >
            <Input
              id="vmessPath"
              placeholder="/ws"
              value={path}
              onChange={(e) => onFieldChange('vmessPath', e.target.value)}
              className="h-10 font-mono"
            />
          </FormField>
        </div>
      )}

      {/* gRPC fields - Show for grpc transport */}
      {showGrpcFields && (
        <FormField
          label={t('admin.nodes.form.fields.serviceName')}
          hint={t('admin.nodes.form.grpcServiceNameHint')}
          error={errors.serviceName}
        >
          <Input
            id="vmessServiceName"
            placeholder="grpc-service"
            value={serviceName}
            onChange={(e) => onFieldChange('vmessServiceName', e.target.value)}
            className="h-10 font-mono"
          />
        </FormField>
      )}
    </div>
  );
};

export const VmessConfigForm = memo(VmessConfigFormBase);
