/**
 * VLESS protocol configuration form component
 * Handles transport protocol, security type, and protocol-specific fields
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
  VLESS_TRANSPORT_PROTOCOLS,
  VLESS_SECURITY_OPTIONS,
  TLS_FINGERPRINT_OPTIONS,
} from '@/shared/constants/protocol-options';
import type { TransportProtocol, VLESSSecurity } from '@/api/node';

export interface VlessConfigFormProps {
  transportType?: TransportProtocol;
  security?: VLESSSecurity;
  sni?: string;
  allowInsecure?: boolean;
  flow?: string;
  fingerprint?: string;
  host?: string;
  path?: string;
  serviceName?: string;
  realityPublicKey?: string;
  realityShortId?: string;
  realitySpiderX?: string;
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

const VlessConfigFormBase: React.FC<VlessConfigFormProps> = ({
  transportType = 'tcp',
  security = 'tls',
  sni = '',
  allowInsecure = false,
  flow = '',
  fingerprint = '',
  host = '',
  path = '',
  serviceName = '',
  realityPublicKey = '',
  realityShortId = '',
  realitySpiderX = '',
  onFieldChange,
  errors = {},
}) => {
  const { t } = useTranslation();

  // Conditional field visibility logic
  const showTlsRealityFields = security === 'tls' || security === 'reality';
  const showFlowField = transportType === 'tcp' && (security === 'tls' || security === 'reality');
  const showWsH2Fields = transportType === 'ws' || transportType === 'h2';
  const showGrpcFields = transportType === 'grpc';
  const showRealityFields = security === 'reality';

  return (
    <div className="space-y-4">
      {/* Transport Protocol and Security Type */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label={t('admin.nodes.form.transportProtocol')}
          hint={t('admin.nodes.form.transportProtocolHint')}
          error={errors.vlessTransportType}
        >
          <Select
            value={transportType}
            onValueChange={(value) => onFieldChange('vlessTransportType', value as TransportProtocol)}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VLESS_TRANSPORT_PROTOCOLS.map((protocol) => (
                <SelectItem key={protocol} value={protocol}>
                  {protocol.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          label={t('admin.nodes.form.securityType')}
          hint={t('admin.nodes.form.securityTypeHint')}
          error={errors.vlessSecurity}
        >
          <Select
            value={security}
            onValueChange={(value) => onFieldChange('vlessSecurity', value as VLESSSecurity)}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VLESS_SECURITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      {/* SNI and TLS Security - Conditional display (tls/reality) */}
      {showTlsRealityFields && (
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label={t('admin.nodes.form.fields.sni')}
            hint={t('admin.nodes.form.sniHint')}
            error={errors.vlessSni}
          >
            <Input
              id="vlessSni"
              placeholder="example.com"
              value={sni}
              onChange={(e) => onFieldChange('vlessSni', e.target.value)}
              className="h-10 font-mono"
            />
          </FormField>

          <FormField
            label={t('admin.nodes.form.tlsSecurity')}
            hint={t('admin.nodes.form.tlsSecurityHint')}
            error={errors.vlessAllowInsecure}
          >
            <Select
              value={allowInsecure ? 'true' : 'false'}
              onValueChange={(value) => onFieldChange('vlessAllowInsecure', value === 'true')}
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

      {/* Flow and Fingerprint - Flow only for tcp+tls/reality */}
      <div className="grid grid-cols-2 gap-4">
        {showFlowField && (
          <FormField
            label={t('admin.nodes.form.fields.flow')}
            hint={t('admin.nodes.form.flowHint')}
            error={errors.vlessFlow}
          >
            <Input
              id="vlessFlow"
              placeholder="xtls-rprx-vision"
              value={flow}
              onChange={(e) => onFieldChange('vlessFlow', e.target.value)}
              className="h-10 font-mono"
            />
          </FormField>
        )}

        {showTlsRealityFields && (
          <FormField
            label={t('admin.nodes.form.fields.fingerprint')}
            hint={t('admin.nodes.form.fingerprintHint')}
            error={errors.vlessFingerprint}
            className={!showFlowField ? 'col-span-2' : ''}
          >
            <Select
              value={fingerprint}
              onValueChange={(value) => onFieldChange('vlessFingerprint', value)}
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
        )}
      </div>

      {/* WebSocket/H2 fields - Conditional display */}
      {showWsH2Fields && (
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label={t('admin.nodes.form.fields.host')}
            hint={t('admin.nodes.form.hints.wsH2Host')}
            error={errors.vlessHost}
          >
            <Input
              id="vlessHost"
              placeholder="example.com"
              value={host}
              onChange={(e) => onFieldChange('vlessHost', e.target.value)}
              className="h-10 font-mono"
            />
          </FormField>

          <FormField
            label={t('admin.nodes.form.fields.path')}
            hint={t('admin.nodes.form.wsH2PathHint')}
            error={errors.vlessPath}
          >
            <Input
              id="vlessPath"
              placeholder="/ws"
              value={path}
              onChange={(e) => onFieldChange('vlessPath', e.target.value)}
              className="h-10 font-mono"
            />
          </FormField>
        </div>
      )}

      {/* gRPC fields - Conditional display */}
      {showGrpcFields && (
        <FormField
          label={t('admin.nodes.form.fields.serviceName')}
          hint={t('admin.nodes.form.grpcServiceNameHint')}
          error={errors.vlessServiceName}
        >
          <Input
            id="vlessServiceName"
            placeholder="grpc-service"
            value={serviceName}
            onChange={(e) => onFieldChange('vlessServiceName', e.target.value)}
            className="h-10 font-mono"
          />
        </FormField>
      )}

      {/* Reality fields - Conditional display (reality) */}
      {showRealityFields && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label={t('admin.nodes.form.fields.realityPublicKey')}
              hint={t('admin.nodes.form.realityPublicKeyHint')}
              error={errors.vlessRealityPublicKey}
            >
              <Input
                id="vlessRealityPublicKey"
                placeholder={t('admin.nodes.form.publicKeyPlaceholder')}
                value={realityPublicKey}
                onChange={(e) => onFieldChange('vlessRealityPublicKey', e.target.value)}
                className="h-10 font-mono"
              />
            </FormField>

            <FormField
              label={t('admin.nodes.form.fields.realityShortId')}
              hint={t('admin.nodes.form.shortIdHint')}
              error={errors.vlessRealityShortId}
            >
              <Input
                id="vlessRealityShortId"
                placeholder={t('admin.nodes.form.shortIdPlaceholder')}
                value={realityShortId}
                onChange={(e) => onFieldChange('vlessRealityShortId', e.target.value)}
                className="h-10 font-mono"
              />
            </FormField>
          </div>

          <FormField
            label={t('admin.nodes.form.fields.realitySpiderX')}
            hint={t('common.optional')}
            error={errors.vlessRealitySpiderX}
          >
            <Input
              id="vlessRealitySpiderX"
              placeholder="/"
              value={realitySpiderX}
              onChange={(e) => onFieldChange('vlessRealitySpiderX', e.target.value)}
              className="h-10 font-mono"
            />
          </FormField>
        </>
      )}
    </div>
  );
};

export const VlessConfigForm = memo(VlessConfigFormBase);
