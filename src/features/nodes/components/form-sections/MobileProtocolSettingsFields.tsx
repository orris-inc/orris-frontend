/**
 * Mobile Protocol Settings Fields
 * Extracted from EditNodeSheet - protocol-specific configuration fields for mobile forms
 */

import { useTranslation } from 'react-i18next';
import { MobileFormInput, MobileSelect, type MobileSelectOption } from '@/components/common/mobile-form';
import { useMemo } from 'react';
import type { NodeProtocol } from '@/api/node';
import { TLS_FINGERPRINT_TYPES } from '@/shared/constants/protocol-options';

// Form Field Label - compact style (shared with EditNodeSheet)
const FormFieldLabel: React.FC<{
  label: string;
  hint?: string;
  showHint?: boolean;
}> = ({ label, hint, showHint = true }) => (
  <div className="space-y-0.5">
    <label className="text-sm font-medium text-foreground">{label}</label>
    {hint && showHint && (
      <p className="text-[11px] text-muted-foreground leading-tight">{hint}</p>
    )}
  </div>
);

interface MobileProtocolSettingsFieldsProps {
  protocol: NodeProtocol;
  formData: Record<string, unknown>;
  onFieldChange: (field: string, value: string | number | boolean | undefined) => void;
  pluginOptsStr: string;
  onPluginOptsChange: (value: string) => void;
  showWsFields: boolean;
  showGrpcFields: boolean;
  showVlessWsFields: boolean;
  showVlessGrpcFields: boolean;
  showVlessRealityFields: boolean;
  showVmessWsFields: boolean;
  showVmessGrpcFields: boolean;
}

export const MobileProtocolSettingsFields: React.FC<MobileProtocolSettingsFieldsProps> = ({
  protocol,
  formData,
  onFieldChange,
  pluginOptsStr,
  onPluginOptsChange,
  showWsFields,
  showGrpcFields,
  showVlessWsFields,
  showVlessGrpcFields,
  showVlessRealityFields,
  showVmessWsFields,
  showVmessGrpcFields,
}) => {
  const { t } = useTranslation();

  const isShadowsocks = protocol === 'shadowsocks';
  const isTrojan = protocol === 'trojan';
  const isVless = protocol === 'vless';
  const isVmess = protocol === 'vmess';
  const isHysteria2 = protocol === 'hysteria2';
  const isTuic = protocol === 'tuic';
  const isAnytls = protocol === 'anytls';

  const tlsSecurityOptions: MobileSelectOption[] = useMemo(() => [
    { value: 'false', label: t('admin.nodes.form.verifyCert') },
    { value: 'true', label: t('admin.nodes.form.skipVerify') },
  ], [t]);

  const fingerprintOptions: MobileSelectOption[] = useMemo(() => [
    { value: '__none__', label: t('admin.nodes.form.disableTls') },
    ...TLS_FINGERPRINT_TYPES.map((value) => ({
      value,
      label: value === 'random' ? t('admin.nodes.form.randomFingerprint') : value.charAt(0).toUpperCase() + value.slice(1),
    })),
  ], [t]);

  return (
    <div className="space-y-4">
      {/* Shadowsocks Protocol Settings */}
      {isShadowsocks && (
        <>
          <div className="space-y-1.5">
            <FormFieldLabel label={t('admin.nodes.form.plugin')} hint={t('admin.nodes.form.pluginHint')} />
            <MobileFormInput
              placeholder="obfs-local"
              value={(formData.plugin as string) || ''}
              onChange={(value) => onFieldChange('plugin', value)}
              className="font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <FormFieldLabel label={t('admin.nodes.form.pluginOptions')} hint={t('admin.nodes.form.pluginOptionsHint')} />
            <MobileFormInput
              placeholder="obfs=http;obfs-host=www.bing.com"
              value={pluginOptsStr}
              onChange={onPluginOptsChange}
              className="font-mono"
            />
          </div>
        </>
      )}

      {/* Trojan Protocol Settings */}
      {isTrojan && (
        <>
          <div className="space-y-1.5">
            <FormFieldLabel label={t('admin.nodes.form.fields.sni')} hint={t('admin.nodes.form.sniHint')} />
            <MobileFormInput
              placeholder="example.com"
              value={(formData.sni as string) || ''}
              onChange={(value) => onFieldChange('sni', value)}
              className="font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <FormFieldLabel label={t('admin.nodes.form.tlsSecurity')} hint={t('admin.nodes.form.tlsSecurityHint')} />
            <MobileSelect
              value={formData.allowInsecure ? 'true' : 'false'}
              onChange={(value) => onFieldChange('allowInsecure', value === 'true')}
              options={tlsSecurityOptions}
            />
          </div>

          {showWsFields && (
            <>
              <div className="space-y-1.5">
                <FormFieldLabel label={t('admin.nodes.form.fields.host')} hint={t('admin.nodes.form.hints.wsHostHeader')} />
                <MobileFormInput
                  placeholder="example.com"
                  value={(formData.host as string) || ''}
                  onChange={(value) => onFieldChange('host', value)}
                  className="font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <FormFieldLabel label={t('admin.nodes.form.fields.path')} hint={t('admin.nodes.form.wsPathHint')} />
                <MobileFormInput
                  placeholder="/path"
                  value={(formData.path as string) || ''}
                  onChange={(value) => onFieldChange('path', value)}
                  className="font-mono"
                />
              </div>
            </>
          )}

          {showGrpcFields && (
            <div className="space-y-1.5">
              <FormFieldLabel label={t('admin.nodes.form.fields.serviceName')} hint={t('admin.nodes.form.grpcServiceNameHint')} />
              <MobileFormInput
                placeholder="grpc-service"
                value={(formData.host as string) || ''}
                onChange={(value) => onFieldChange('host', value)}
                className="font-mono"
              />
            </div>
          )}
        </>
      )}

      {/* VLESS Protocol Settings */}
      {isVless && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FormFieldLabel label={t('admin.nodes.form.fields.sni')} hint={t('admin.nodes.form.sniHint')} />
              <MobileFormInput
                placeholder="example.com"
                value={(formData.vlessSni as string) || ''}
                onChange={(value) => onFieldChange('vlessSni', value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <FormFieldLabel label={t('admin.nodes.form.tlsVerify')} />
              <MobileSelect
                value={formData.vlessAllowInsecure ? 'true' : 'false'}
                onChange={(value) => onFieldChange('vlessAllowInsecure', value === 'true')}
                options={tlsSecurityOptions}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FormFieldLabel label={t('admin.nodes.form.fields.flow')} hint={t('admin.nodes.form.flowHint')} />
              <MobileFormInput
                placeholder="xtls-rprx-vision"
                value={(formData.vlessFlow as string) || ''}
                onChange={(value) => onFieldChange('vlessFlow', value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <FormFieldLabel label={t('admin.nodes.form.fingerprintHint')} />
              <MobileSelect
                value={(formData.vlessFingerprint as string) || '__none__'}
                onChange={(value) => onFieldChange('vlessFingerprint', value === '__none__' ? '' : value)}
                options={fingerprintOptions}
              />
            </div>
          </div>

          {showVlessWsFields && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <FormFieldLabel label={t('admin.nodes.form.fields.host')} hint={t('admin.nodes.form.hints.wsH2Host')} />
                <MobileFormInput
                  placeholder="example.com"
                  value={(formData.vlessHost as string) || ''}
                  onChange={(value) => onFieldChange('vlessHost', value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <FormFieldLabel label={t('admin.nodes.form.fields.path')} hint={t('admin.nodes.form.wsH2PathHint')} />
                <MobileFormInput
                  placeholder="/ws"
                  value={(formData.vlessPath as string) || ''}
                  onChange={(value) => onFieldChange('vlessPath', value)}
                  className="font-mono"
                />
              </div>
            </div>
          )}

          {showVlessGrpcFields && (
            <div className="space-y-1.5">
              <FormFieldLabel label={t('admin.nodes.form.fields.serviceName')} hint={t('admin.nodes.form.grpcServiceNameHint')} />
              <MobileFormInput
                placeholder="grpc-service"
                value={(formData.vlessServiceName as string) || ''}
                onChange={(value) => onFieldChange('vlessServiceName', value)}
                className="font-mono"
              />
            </div>
          )}

          {showVlessRealityFields && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <FormFieldLabel label={t('admin.nodes.form.fields.publicKey')} hint={t('admin.nodes.form.realityPublicKeyHint')} />
                  <MobileFormInput
                    placeholder={t('admin.nodes.form.publicKeyPlaceholder')}
                    value={(formData.vlessRealityPublicKey as string) || ''}
                    onChange={(value) => onFieldChange('vlessRealityPublicKey', value)}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <FormFieldLabel label={t('admin.nodes.form.fields.shortId')} />
                  <MobileFormInput
                    placeholder={t('admin.nodes.form.shortIdPlaceholder')}
                    value={(formData.vlessRealityShortId as string) || ''}
                    onChange={(value) => onFieldChange('vlessRealityShortId', value)}
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <FormFieldLabel label={t('admin.nodes.form.fields.spiderX')} hint={t('common.optional')} />
                <MobileFormInput
                  placeholder="/"
                  value={(formData.vlessRealitySpiderX as string) || ''}
                  onChange={(value) => onFieldChange('vlessRealitySpiderX', value)}
                  className="font-mono"
                />
              </div>
            </>
          )}
        </>
      )}

      {/* VMess Protocol Settings */}
      {isVmess && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FormFieldLabel label={t('admin.nodes.form.fields.alterId')} hint={t('admin.nodes.form.alterIdHint')} />
              <MobileFormInput
                type="number"
                inputMode="numeric"
                value={String(formData.vmessAlterId ?? 0)}
                onChange={(value) => onFieldChange('vmessAlterId', parseInt(value, 10) || 0)}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <FormFieldLabel label={t('admin.nodes.form.fields.tls')} />
              <MobileSelect
                value={formData.vmessTls ? 'true' : 'false'}
                onChange={(value) => onFieldChange('vmessTls', value === 'true')}
                options={[
                  { value: 'true', label: t('admin.nodes.form.enableTls') },
                  { value: 'false', label: t('admin.nodes.form.disableTls') },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FormFieldLabel label={t('admin.nodes.form.fields.sni')} hint={t('admin.nodes.form.sniHint')} />
              <MobileFormInput
                placeholder="example.com"
                value={(formData.vmessSni as string) || ''}
                onChange={(value) => onFieldChange('vmessSni', value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <FormFieldLabel label={t('admin.nodes.form.tlsVerify')} />
              <MobileSelect
                value={formData.vmessAllowInsecure ? 'true' : 'false'}
                onChange={(value) => onFieldChange('vmessAllowInsecure', value === 'true')}
                options={tlsSecurityOptions}
              />
            </div>
          </div>

          {showVmessWsFields && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <FormFieldLabel label={t('admin.nodes.form.fields.host')} hint={t('admin.nodes.form.hints.wsHttpHost')} />
                <MobileFormInput
                  placeholder="example.com"
                  value={(formData.vmessHost as string) || ''}
                  onChange={(value) => onFieldChange('vmessHost', value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <FormFieldLabel label={t('admin.nodes.form.fields.path')} hint={t('admin.nodes.form.wsHttpPathHint')} />
                <MobileFormInput
                  placeholder="/ws"
                  value={(formData.vmessPath as string) || ''}
                  onChange={(value) => onFieldChange('vmessPath', value)}
                  className="font-mono"
                />
              </div>
            </div>
          )}

          {showVmessGrpcFields && (
            <div className="space-y-1.5">
              <FormFieldLabel label={t('admin.nodes.form.fields.serviceName')} hint={t('admin.nodes.form.grpcServiceNameHint')} />
              <MobileFormInput
                placeholder="grpc-service"
                value={(formData.vmessServiceName as string) || ''}
                onChange={(value) => onFieldChange('vmessServiceName', value)}
                className="font-mono"
              />
            </div>
          )}
        </>
      )}

      {/* Hysteria2 Protocol Settings */}
      {isHysteria2 && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FormFieldLabel label={t('admin.nodes.form.fields.sni')} hint={t('admin.nodes.form.sniHint')} />
              <MobileFormInput
                placeholder="example.com"
                value={(formData.hysteria2Sni as string) || ''}
                onChange={(value) => onFieldChange('hysteria2Sni', value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <FormFieldLabel label={t('admin.nodes.form.tlsVerify')} />
              <MobileSelect
                value={formData.hysteria2AllowInsecure ? 'true' : 'false'}
                onChange={(value) => onFieldChange('hysteria2AllowInsecure', value === 'true')}
                options={tlsSecurityOptions}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FormFieldLabel label={t('admin.nodes.form.obfsType')} hint={t('admin.nodes.form.obfsTypeHint')} />
              <MobileFormInput
                placeholder="salamander"
                value={(formData.hysteria2Obfs as string) || ''}
                onChange={(value) => onFieldChange('hysteria2Obfs', value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <FormFieldLabel label={t('admin.nodes.form.obfsPassword')} />
              <MobileFormInput
                placeholder={t('common.placeholders.password')}
                value={(formData.hysteria2ObfsPassword as string) || ''}
                onChange={(value) => onFieldChange('hysteria2ObfsPassword', value)}
                className="font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FormFieldLabel label={t('admin.nodes.form.upBandwidth')} />
              <MobileFormInput
                type="number"
                inputMode="numeric"
                placeholder="100"
                value={formData.hysteria2UpMbps !== undefined ? String(formData.hysteria2UpMbps) : ''}
                onChange={(value) => onFieldChange('hysteria2UpMbps', value ? parseInt(value, 10) : undefined)}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <FormFieldLabel label={t('admin.nodes.form.downBandwidth')} />
              <MobileFormInput
                type="number"
                inputMode="numeric"
                placeholder="100"
                value={formData.hysteria2DownMbps !== undefined ? String(formData.hysteria2DownMbps) : ''}
                onChange={(value) => onFieldChange('hysteria2DownMbps', value ? parseInt(value, 10) : undefined)}
                className="font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <FormFieldLabel label={t('admin.nodes.form.fingerprintHint')} />
            <MobileSelect
              value={(formData.hysteria2Fingerprint as string) || '__none__'}
              onChange={(value) => onFieldChange('hysteria2Fingerprint', value === '__none__' ? '' : value)}
              options={fingerprintOptions}
            />
          </div>
        </>
      )}

      {/* TUIC Protocol Settings */}
      {isTuic && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FormFieldLabel label={t('admin.nodes.form.fields.sni')} hint={t('admin.nodes.form.sniHint')} />
              <MobileFormInput
                placeholder="example.com"
                value={(formData.tuicSni as string) || ''}
                onChange={(value) => onFieldChange('tuicSni', value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <FormFieldLabel label={t('admin.nodes.form.tlsVerify')} />
              <MobileSelect
                value={formData.tuicAllowInsecure ? 'true' : 'false'}
                onChange={(value) => onFieldChange('tuicAllowInsecure', value === 'true')}
                options={tlsSecurityOptions}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FormFieldLabel label={t('admin.nodes.form.fields.alpn')} hint={t('admin.nodes.form.alpnHint')} />
              <MobileFormInput
                placeholder="h3"
                value={(formData.tuicAlpn as string) || ''}
                onChange={(value) => onFieldChange('tuicAlpn', value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <FormFieldLabel label={t('admin.nodes.form.disableSni')} />
              <MobileSelect
                value={formData.tuicDisableSni ? 'true' : 'false'}
                onChange={(value) => onFieldChange('tuicDisableSni', value === 'true')}
                options={[
                  { value: 'false', label: t('admin.nodes.form.notDisabled') },
                  { value: 'true', label: t('admin.nodes.form.disableSniOption') },
                ]}
              />
            </div>
          </div>
        </>
      )}

      {/* AnyTLS Protocol Settings */}
      {isAnytls && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FormFieldLabel label={t('admin.nodes.form.fields.sni')} hint={t('admin.nodes.form.sniHint')} />
              <MobileFormInput
                placeholder="example.com"
                value={(formData.anytlsSni as string) || ''}
                onChange={(value) => onFieldChange('anytlsSni', value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <FormFieldLabel label={t('admin.nodes.form.tlsVerify')} />
              <MobileSelect
                value={formData.anytlsAllowInsecure ? 'true' : 'false'}
                onChange={(value) => onFieldChange('anytlsAllowInsecure', value === 'true')}
                options={tlsSecurityOptions}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <FormFieldLabel label={t('admin.nodes.form.anytls.fingerprint')} hint={t('admin.nodes.form.anytls.fingerprintHint')} />
            <MobileSelect
              value={(formData.anytlsFingerprint as string) || '__none__'}
              onChange={(value) => onFieldChange('anytlsFingerprint', value === '__none__' ? '' : value)}
              options={fingerprintOptions}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FormFieldLabel label={t('admin.nodes.form.anytls.idleCheckInterval')} />
              <MobileFormInput
                placeholder="30s"
                value={(formData.anytlsIdleSessionCheckInterval as string) || ''}
                onChange={(value) => onFieldChange('anytlsIdleSessionCheckInterval', value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <FormFieldLabel label={t('admin.nodes.form.anytls.idleTimeout')} />
              <MobileFormInput
                placeholder="30s"
                value={(formData.anytlsIdleSessionTimeout as string) || ''}
                onChange={(value) => onFieldChange('anytlsIdleSessionTimeout', value)}
                className="font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <FormFieldLabel label={t('admin.nodes.form.anytls.minIdleSession')} hint={t('admin.nodes.form.anytls.minIdleSessionHint')} />
            <MobileFormInput
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={formData.anytlsMinIdleSession !== undefined ? String(formData.anytlsMinIdleSession) : ''}
              onChange={(value) => onFieldChange('anytlsMinIdleSession', value ? parseInt(value, 10) : undefined)}
              className="font-mono"
            />
          </div>
        </>
      )}
    </div>
  );
};
