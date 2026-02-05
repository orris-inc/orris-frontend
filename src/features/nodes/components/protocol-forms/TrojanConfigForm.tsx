/**
 * Trojan protocol configuration form component
 * Handles SNI, TLS security, transport protocol, and protocol-specific fields
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
import { TRANSPORT_PROTOCOLS } from '@/shared/constants/protocol-options';
import type { TransportProtocol } from '@/api/node';

export interface TrojanConfigFormProps {
  sni?: string;
  allowInsecure?: boolean;
  transportProtocol?: TransportProtocol;
  host?: string;
  path?: string;
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

const TrojanConfigFormBase: React.FC<TrojanConfigFormProps> = ({
  sni,
  allowInsecure = false,
  transportProtocol = 'tcp',
  host,
  path,
  onFieldChange,
  errors = {},
}) => {
  const { t } = useTranslation();

  // Determine which protocol-specific fields to show
  const showWsFields = transportProtocol === 'ws';
  const showGrpcFields = transportProtocol === 'grpc';

  return (
    <div className="space-y-4">
      {/* SNI and TLS Security */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label={t('admin.nodes.form.fields.sni')}
          hint={t('admin.nodes.form.sniHint')}
          error={errors.sni}
        >
          <Input
            id="sni"
            placeholder="example.com"
            value={sni || ''}
            onChange={(e) => onFieldChange('sni', e.target.value)}
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
            onValueChange={(value) => onFieldChange('allowInsecure', value === 'true')}
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

      {/* Transport Protocol */}
      <FormField
        label={t('admin.nodes.form.transportProtocol')}
        hint={t('admin.nodes.form.transportProtocolHint')}
        error={errors.transportProtocol}
      >
        <Select
          value={transportProtocol}
          onValueChange={(value) => onFieldChange('transportProtocol', value)}
        >
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TRANSPORT_PROTOCOLS.map((protocol) => (
              <SelectItem key={protocol} value={protocol}>
                {protocol.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      {/* WebSocket Fields */}
      {showWsFields && (
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label={t('admin.nodes.form.fields.host')}
            hint={t('admin.nodes.form.hints.wsHostHeader')}
            error={errors.host}
          >
            <Input
              id="host"
              placeholder="example.com"
              value={host || ''}
              onChange={(e) => onFieldChange('host', e.target.value)}
              className="h-10 font-mono"
            />
          </FormField>

          <FormField
            label={t('admin.nodes.form.fields.path')}
            hint={t('admin.nodes.form.wsPathHint')}
            error={errors.path}
          >
            <Input
              id="path"
              placeholder="/ws"
              value={path || ''}
              onChange={(e) => onFieldChange('path', e.target.value)}
              className="h-10 font-mono"
            />
          </FormField>
        </div>
      )}

      {/* gRPC Fields */}
      {showGrpcFields && (
        <FormField
          label={t('admin.nodes.form.fields.serviceName')}
          hint={t('admin.nodes.form.grpcServiceNameHint')}
          error={errors.host}
        >
          <Input
            id="grpcHost"
            placeholder="grpc-service"
            value={host || ''}
            onChange={(e) => onFieldChange('host', e.target.value)}
            className="h-10 font-mono"
          />
        </FormField>
      )}
    </div>
  );
};

export const TrojanConfigForm = memo(TrojanConfigFormBase);
