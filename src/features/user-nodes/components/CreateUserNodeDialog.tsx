/**
 * Create user node dialog component
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { Checkbox } from '@/components/common/Checkbox';
import { Separator } from '@/components/common/Separator';
import type {
  CreateUserNodeRequest,
  CreateUserNodeResponse,
  NodeProtocol,
  TransportProtocol,
  VLESSSecurity,
  VMessSecurity,
  CongestionControl,
  TUICUDPRelayMode,
} from '@/api/node';

interface CreateUserNodeDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserNodeRequest) => Promise<CreateUserNodeResponse>;
  onTokenReceived: (response: CreateUserNodeResponse) => void;
}

// Shadowsocks encryption methods
const SS_METHODS = [
  'aes-128-gcm',
  'aes-256-gcm',
  'chacha20-ietf-poly1305',
  'xchacha20-ietf-poly1305',
  '2022-blake3-aes-128-gcm',
  '2022-blake3-aes-256-gcm',
  '2022-blake3-chacha20-poly1305',
] as const;

// Transport protocols for Trojan
const TRANSPORT_PROTOCOLS: { value: TransportProtocol; label: string }[] = [
  { value: 'tcp', label: 'TCP' },
  { value: 'ws', label: 'WebSocket' },
  { value: 'grpc', label: 'gRPC' },
];

// VLESS transport protocols
const VLESS_TRANSPORT_PROTOCOLS: { value: TransportProtocol; label: string }[] = [
  { value: 'tcp', label: 'TCP' },
  { value: 'ws', label: 'WebSocket' },
  { value: 'grpc', label: 'gRPC' },
  { value: 'h2', label: 'HTTP/2' },
];

// VLESS security types
const VLESS_SECURITY_OPTIONS: { value: VLESSSecurity; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'tls', label: 'TLS' },
  { value: 'reality', label: 'Reality' },
];

// VMess security types
const VMESS_SECURITY_OPTIONS: { value: VMessSecurity; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'aes-128-gcm', label: 'AES-128-GCM' },
  { value: 'chacha20-poly1305', label: 'ChaCha20-Poly1305' },
  { value: 'none', label: 'None' },
  { value: 'zero', label: 'Zero' },
];

// VMess transport protocols
const VMESS_TRANSPORT_PROTOCOLS: { value: TransportProtocol; label: string }[] = [
  { value: 'tcp', label: 'TCP' },
  { value: 'ws', label: 'WebSocket' },
  { value: 'grpc', label: 'gRPC' },
  { value: 'http', label: 'HTTP' },
  { value: 'quic', label: 'QUIC' },
];

// Congestion control algorithms
const CONGESTION_CONTROL_OPTIONS: { value: CongestionControl; label: string }[] = [
  { value: 'cubic', label: 'Cubic' },
  { value: 'bbr', label: 'BBR' },
  { value: 'new_reno', label: 'New Reno' },
];

// TUIC UDP relay modes
const TUIC_UDP_RELAY_MODES: { value: TUICUDPRelayMode; label: string }[] = [
  { value: 'native', label: 'Native' },
  { value: 'quic', label: 'QUIC' },
];

// TLS fingerprint options
const TLS_FINGERPRINT_OPTIONS = [
  { value: 'chrome', label: 'Chrome' },
  { value: 'firefox', label: 'Firefox' },
  { value: 'safari', label: 'Safari' },
  { value: 'edge', label: 'Edge' },
  { value: 'random', label: 'Random' },
];

interface FormData {
  name: string;
  serverAddress: string;
  agentPort: string;
  subscriptionPort: string;
  protocol: NodeProtocol;
  // Shadowsocks
  method: string;
  plugin: string;
  pluginOpts: string;
  // Trojan
  transportProtocol: TransportProtocol;
  host: string;
  path: string;
  sni: string;
  allowInsecure: boolean;
  // VLESS
  vlessTransportType: TransportProtocol;
  vlessFlow: string;
  vlessSecurity: VLESSSecurity;
  vlessSni: string;
  vlessFingerprint: string;
  vlessAllowInsecure: boolean;
  vlessHost: string;
  vlessPath: string;
  vlessServiceName: string;
  vlessRealityPublicKey: string;
  vlessRealityShortId: string;
  vlessRealitySpiderX: string;
  // VMess
  vmessAlterId: string;
  vmessSecurity: VMessSecurity;
  vmessTransportType: TransportProtocol;
  vmessHost: string;
  vmessPath: string;
  vmessServiceName: string;
  vmessTls: boolean;
  vmessSni: string;
  vmessAllowInsecure: boolean;
  // Hysteria2
  hysteria2CongestionControl: CongestionControl;
  hysteria2Obfs: string;
  hysteria2ObfsPassword: string;
  hysteria2UpMbps: string;
  hysteria2DownMbps: string;
  hysteria2Sni: string;
  hysteria2AllowInsecure: boolean;
  hysteria2Fingerprint: string;
  // TUIC
  tuicCongestionControl: CongestionControl;
  tuicUdpRelayMode: TUICUDPRelayMode;
  tuicAlpn: string;
  tuicSni: string;
  tuicAllowInsecure: boolean;
  tuicDisableSni: boolean;
}

const getDefaultFormData = (): FormData => ({
  name: '',
  serverAddress: '',
  agentPort: '',
  subscriptionPort: '',
  protocol: 'shadowsocks',
  // Shadowsocks
  method: 'aes-256-gcm',
  plugin: '',
  pluginOpts: '',
  // Trojan
  transportProtocol: 'tcp',
  host: '',
  path: '',
  sni: '',
  allowInsecure: false,
  // VLESS
  vlessTransportType: 'tcp',
  vlessFlow: '',
  vlessSecurity: 'tls',
  vlessSni: '',
  vlessFingerprint: '',
  vlessAllowInsecure: false,
  vlessHost: '',
  vlessPath: '',
  vlessServiceName: '',
  vlessRealityPublicKey: '',
  vlessRealityShortId: '',
  vlessRealitySpiderX: '',
  // VMess
  vmessAlterId: '0',
  vmessSecurity: 'auto',
  vmessTransportType: 'tcp',
  vmessHost: '',
  vmessPath: '',
  vmessServiceName: '',
  vmessTls: true,
  vmessSni: '',
  vmessAllowInsecure: false,
  // Hysteria2
  hysteria2CongestionControl: 'bbr',
  hysteria2Obfs: '',
  hysteria2ObfsPassword: '',
  hysteria2UpMbps: '',
  hysteria2DownMbps: '',
  hysteria2Sni: '',
  hysteria2AllowInsecure: false,
  hysteria2Fingerprint: '',
  // TUIC
  tuicCongestionControl: 'bbr',
  tuicUdpRelayMode: 'native',
  tuicAlpn: '',
  tuicSni: '',
  tuicAllowInsecure: false,
  tuicDisableSni: false,
});

export const CreateUserNodeDialog: React.FC<CreateUserNodeDialogProps> = ({
  open,
  onClose,
  onSubmit,
  onTokenReceived,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>(getDefaultFormData());
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData(getDefaultFormData());
      setErrors({});
    }
  }, [open]);

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field changes
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('userNodes.create.validation.nameRequired');
    }
    if (!formData.agentPort || isNaN(Number(formData.agentPort)) || Number(formData.agentPort) <= 0) {
      newErrors.agentPort = t('userNodes.create.validation.portInvalid');
    }
    if (formData.subscriptionPort && (isNaN(Number(formData.subscriptionPort)) || Number(formData.subscriptionPort) <= 0)) {
      newErrors.subscriptionPort = t('userNodes.create.validation.portInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      // Use Record type for request to allow protocol-specific fields
      // Note: CreateUserNodeRequest type may need update when backend SDK is updated
      const request: CreateUserNodeRequest & Record<string, unknown> = {
        name: formData.name.trim(),
        serverAddress: formData.serverAddress.trim() || undefined,
        agentPort: Number(formData.agentPort),
        subscriptionPort: formData.subscriptionPort ? Number(formData.subscriptionPort) : undefined,
        protocol: formData.protocol,
      };

      // Add protocol-specific fields
      if (formData.protocol === 'shadowsocks') {
        request.method = formData.method;
        if (formData.plugin.trim()) {
          request.plugin = formData.plugin.trim();
        }
        if (formData.pluginOpts.trim()) {
          try {
            request.pluginOpts = JSON.parse(formData.pluginOpts);
          } catch {
            // If not valid JSON, treat as key=value pairs
            const opts: Record<string, string> = {};
            formData.pluginOpts.split(';').forEach((pair) => {
              const [key, value] = pair.split('=');
              if (key && value) {
                opts[key.trim()] = value.trim();
              }
            });
            if (Object.keys(opts).length > 0) {
              request.pluginOpts = opts;
            }
          }
        }
      } else if (formData.protocol === 'trojan') {
        request.transportProtocol = formData.transportProtocol;
        if (formData.host.trim()) {
          request.host = formData.host.trim();
        }
        if (formData.path.trim()) {
          request.path = formData.path.trim();
        }
        if (formData.sni.trim()) {
          request.sni = formData.sni.trim();
        }
        request.allowInsecure = formData.allowInsecure;
      } else if (formData.protocol === 'vless') {
        // VLESS protocol fields
        request.vlessTransportType = formData.vlessTransportType;
        request.vlessSecurity = formData.vlessSecurity;
        if (formData.vlessFlow.trim()) {
          request.vlessFlow = formData.vlessFlow.trim();
        }
        if (formData.vlessSni.trim()) {
          request.vlessSni = formData.vlessSni.trim();
        }
        if (formData.vlessFingerprint) {
          request.vlessFingerprint = formData.vlessFingerprint;
        }
        if (formData.vlessAllowInsecure) {
          request.vlessAllowInsecure = formData.vlessAllowInsecure;
        }
        // WS/H2 fields
        if (formData.vlessTransportType === 'ws' || formData.vlessTransportType === 'h2') {
          if (formData.vlessHost.trim()) {
            request.vlessHost = formData.vlessHost.trim();
          }
          if (formData.vlessPath.trim()) {
            request.vlessPath = formData.vlessPath.trim();
          }
        }
        // gRPC fields
        if (formData.vlessTransportType === 'grpc' && formData.vlessServiceName.trim()) {
          request.vlessServiceName = formData.vlessServiceName.trim();
        }
        // Reality fields
        if (formData.vlessSecurity === 'reality') {
          if (formData.vlessRealityPublicKey.trim()) {
            request.vlessRealityPublicKey = formData.vlessRealityPublicKey.trim();
          }
          if (formData.vlessRealityShortId.trim()) {
            request.vlessRealityShortId = formData.vlessRealityShortId.trim();
          }
          if (formData.vlessRealitySpiderX.trim()) {
            request.vlessRealitySpiderX = formData.vlessRealitySpiderX.trim();
          }
        }
      } else if (formData.protocol === 'vmess') {
        // VMess protocol fields
        request.vmessTransportType = formData.vmessTransportType;
        request.vmessSecurity = formData.vmessSecurity;
        request.vmessAlterId = Number(formData.vmessAlterId) || 0;
        request.vmessTls = formData.vmessTls;
        if (formData.vmessSni.trim()) {
          request.vmessSni = formData.vmessSni.trim();
        }
        if (formData.vmessAllowInsecure) {
          request.vmessAllowInsecure = formData.vmessAllowInsecure;
        }
        // WS/HTTP fields
        if (formData.vmessTransportType === 'ws' || formData.vmessTransportType === 'http') {
          if (formData.vmessHost.trim()) {
            request.vmessHost = formData.vmessHost.trim();
          }
          if (formData.vmessPath.trim()) {
            request.vmessPath = formData.vmessPath.trim();
          }
        }
        // gRPC fields
        if (formData.vmessTransportType === 'grpc' && formData.vmessServiceName.trim()) {
          request.vmessServiceName = formData.vmessServiceName.trim();
        }
      } else if (formData.protocol === 'hysteria2') {
        // Hysteria2 protocol fields
        request.hysteria2CongestionControl = formData.hysteria2CongestionControl;
        if (formData.hysteria2Obfs.trim()) {
          request.hysteria2Obfs = formData.hysteria2Obfs.trim();
        }
        if (formData.hysteria2ObfsPassword.trim()) {
          request.hysteria2ObfsPassword = formData.hysteria2ObfsPassword.trim();
        }
        if (formData.hysteria2UpMbps) {
          request.hysteria2UpMbps = Number(formData.hysteria2UpMbps);
        }
        if (formData.hysteria2DownMbps) {
          request.hysteria2DownMbps = Number(formData.hysteria2DownMbps);
        }
        if (formData.hysteria2Sni.trim()) {
          request.hysteria2Sni = formData.hysteria2Sni.trim();
        }
        if (formData.hysteria2AllowInsecure) {
          request.hysteria2AllowInsecure = formData.hysteria2AllowInsecure;
        }
        if (formData.hysteria2Fingerprint) {
          request.hysteria2Fingerprint = formData.hysteria2Fingerprint;
        }
      } else if (formData.protocol === 'tuic') {
        // TUIC protocol fields
        request.tuicCongestionControl = formData.tuicCongestionControl;
        request.tuicUdpRelayMode = formData.tuicUdpRelayMode;
        if (formData.tuicSni.trim()) {
          request.tuicSni = formData.tuicSni.trim();
        }
        if (formData.tuicAlpn.trim()) {
          request.tuicAlpn = formData.tuicAlpn.trim();
        }
        if (formData.tuicAllowInsecure) {
          request.tuicAllowInsecure = formData.tuicAllowInsecure;
        }
        if (formData.tuicDisableSni) {
          request.tuicDisableSni = formData.tuicDisableSni;
        }
      }

      const response = await onSubmit(request as CreateUserNodeRequest);
      onTokenReceived(response);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{t('userNodes.create.title')}</DialogTitle>
          <DialogDescription>
            {t('userNodes.create.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
        <div className="space-y-6 py-4">
          {/* Basic info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t('userNodes.create.basicInfo')}</h3>
            <Separator />

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">
                  {t('userNodes.create.nodeName')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder={t('userNodes.create.placeholders.nodeName')}
                  disabled={loading}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="serverAddress">{t('userNodes.create.serverAddress')}</Label>
                  <Input
                    id="serverAddress"
                    value={formData.serverAddress}
                    onChange={(e) => handleChange('serverAddress', e.target.value)}
                    placeholder={t('userNodes.create.placeholders.serverAddress')}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">{t('userNodes.create.hints.serverAddress')}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="agentPort">
                    {t('userNodes.create.agentPort')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="agentPort"
                    type="number"
                    min="1"
                    max="65535"
                    value={formData.agentPort}
                    onChange={(e) => handleChange('agentPort', e.target.value)}
                    placeholder={t('userNodes.create.placeholders.agentPort')}
                    disabled={loading}
                  />
                  {errors.agentPort && <p className="text-xs text-destructive">{errors.agentPort}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="subscriptionPort">{t('userNodes.create.subscriptionPort')}</Label>
                  <Input
                    id="subscriptionPort"
                    type="number"
                    min="1"
                    max="65535"
                    value={formData.subscriptionPort}
                    onChange={(e) => handleChange('subscriptionPort', e.target.value)}
                    placeholder={t('userNodes.create.placeholders.subscriptionPort')}
                    disabled={loading}
                  />
                  {errors.subscriptionPort && <p className="text-xs text-destructive">{errors.subscriptionPort}</p>}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="protocol">
                    {t('userNodes.create.protocol')} <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.protocol}
                    onValueChange={(value) => handleChange('protocol', value as NodeProtocol)}
                    disabled={loading}
                  >
                    <SelectTrigger id="protocol">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shadowsocks">Shadowsocks</SelectItem>
                      <SelectItem value="trojan">Trojan</SelectItem>
                      <SelectItem value="vless">VLESS</SelectItem>
                      <SelectItem value="vmess">VMess</SelectItem>
                      <SelectItem value="hysteria2">Hysteria2</SelectItem>
                      <SelectItem value="tuic">TUIC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Shadowsocks config */}
          {formData.protocol === 'shadowsocks' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">{t('userNodes.create.shadowsocks.title')}</h3>
              <Separator />

              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="method">{t('userNodes.create.shadowsocks.method')}</Label>
                  <Select
                    value={formData.method}
                    onValueChange={(value) => handleChange('method', value)}
                    disabled={loading}
                  >
                    <SelectTrigger id="method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SS_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="plugin">{t('userNodes.create.shadowsocks.plugin')}</Label>
                  <Input
                    id="plugin"
                    value={formData.plugin}
                    onChange={(e) => handleChange('plugin', e.target.value)}
                    placeholder={t('userNodes.create.placeholders.plugin')}
                    disabled={loading}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="pluginOpts">{t('userNodes.create.shadowsocks.pluginOpts')}</Label>
                  <Input
                    id="pluginOpts"
                    value={formData.pluginOpts}
                    onChange={(e) => handleChange('pluginOpts', e.target.value)}
                    placeholder="key1=value1;key2=value2"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">{t('userNodes.create.hints.pluginOpts')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Trojan config */}
          {formData.protocol === 'trojan' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">{t('userNodes.create.trojan.title')}</h3>
              <Separator />

              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="transportProtocol">{t('userNodes.create.transportProtocol')}</Label>
                  <Select
                    value={formData.transportProtocol}
                    onValueChange={(value) => handleChange('transportProtocol', value as TransportProtocol)}
                    disabled={loading}
                  >
                    <SelectTrigger id="transportProtocol">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSPORT_PROTOCOLS.map((tp) => (
                        <SelectItem key={tp.value} value={tp.value}>
                          {tp.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(formData.transportProtocol === 'ws' || formData.transportProtocol === 'grpc') && (
                  <>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="host">
                        {formData.transportProtocol === 'ws' ? t('userNodes.create.hostHeader') : 'Service Name'}
                      </Label>
                      <Input
                        id="host"
                        value={formData.host}
                        onChange={(e) => handleChange('host', e.target.value)}
                        placeholder={formData.transportProtocol === 'ws' ? 'example.com' : 'grpc-service'}
                        disabled={loading}
                      />
                    </div>

                    {formData.transportProtocol === 'ws' && (
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="path">{t('userNodes.create.wsPath')}</Label>
                        <Input
                          id="path"
                          value={formData.path}
                          onChange={(e) => handleChange('path', e.target.value)}
                          placeholder="/ws"
                          disabled={loading}
                        />
                      </div>
                    )}
                  </>
                )}

                <div className="flex flex-col gap-2">
                  <Label htmlFor="sni">{t('userNodes.create.tlsSni')}</Label>
                  <Input
                    id="sni"
                    value={formData.sni}
                    onChange={(e) => handleChange('sni', e.target.value)}
                    placeholder="example.com"
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="allowInsecure"
                    checked={formData.allowInsecure}
                    onCheckedChange={(checked) => handleChange('allowInsecure', checked as boolean)}
                    disabled={loading}
                  />
                  <Label htmlFor="allowInsecure" className="cursor-pointer">
                    {t('userNodes.create.allowInsecure')}
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* VLESS config */}
          {formData.protocol === 'vless' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">{t('userNodes.create.vless.title')}</h3>
              <Separator />

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="vlessTransportType">{t('userNodes.create.transportProtocol')}</Label>
                    <Select
                      value={formData.vlessTransportType}
                      onValueChange={(value) => handleChange('vlessTransportType', value as TransportProtocol)}
                      disabled={loading}
                    >
                      <SelectTrigger id="vlessTransportType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VLESS_TRANSPORT_PROTOCOLS.map((tp) => (
                          <SelectItem key={tp.value} value={tp.value}>
                            {tp.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="vlessSecurity">{t('userNodes.create.vless.securityType')}</Label>
                    <Select
                      value={formData.vlessSecurity}
                      onValueChange={(value) => handleChange('vlessSecurity', value as VLESSSecurity)}
                      disabled={loading}
                    >
                      <SelectTrigger id="vlessSecurity">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VLESS_SECURITY_OPTIONS.map((sec) => (
                          <SelectItem key={sec.value} value={sec.value}>
                            {sec.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="vlessFlow">{t('userNodes.create.vless.flow')}</Label>
                  <Input
                    id="vlessFlow"
                    value={formData.vlessFlow}
                    onChange={(e) => handleChange('vlessFlow', e.target.value)}
                    placeholder={t('userNodes.create.placeholders.vlessFlow')}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">{t('userNodes.create.hints.vlessFlow')}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="vlessSni">{t('userNodes.create.tlsSni')}</Label>
                    <Input
                      id="vlessSni"
                      value={formData.vlessSni}
                      onChange={(e) => handleChange('vlessSni', e.target.value)}
                      placeholder="example.com"
                      disabled={loading}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="vlessFingerprint">{t('userNodes.create.tlsFingerprint')}</Label>
                    <Select
                      value={formData.vlessFingerprint}
                      onValueChange={(value) => handleChange('vlessFingerprint', value)}
                      disabled={loading}
                    >
                      <SelectTrigger id="vlessFingerprint">
                        <SelectValue placeholder={t('userNodes.create.placeholders.selectFingerprint')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">{t('userNodes.create.notSpecified')}</SelectItem>
                        {TLS_FINGERPRINT_OPTIONS.map((fp) => (
                          <SelectItem key={fp.value} value={fp.value}>
                            {fp.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* WS/H2 settings */}
                {(formData.vlessTransportType === 'ws' || formData.vlessTransportType === 'h2') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="vlessHost">{t('userNodes.create.hostHeader')}</Label>
                      <Input
                        id="vlessHost"
                        value={formData.vlessHost}
                        onChange={(e) => handleChange('vlessHost', e.target.value)}
                        placeholder="example.com"
                        disabled={loading}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="vlessPath">{t('userNodes.create.path')}</Label>
                      <Input
                        id="vlessPath"
                        value={formData.vlessPath}
                        onChange={(e) => handleChange('vlessPath', e.target.value)}
                        placeholder="/ws"
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                {/* gRPC settings */}
                {formData.vlessTransportType === 'grpc' && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="vlessServiceName">Service Name</Label>
                    <Input
                      id="vlessServiceName"
                      value={formData.vlessServiceName}
                      onChange={(e) => handleChange('vlessServiceName', e.target.value)}
                      placeholder="grpc-service"
                      disabled={loading}
                    />
                  </div>
                )}

                {/* Reality settings */}
                {formData.vlessSecurity === 'reality' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="vlessRealityPublicKey">{t('userNodes.create.vless.realityPublicKey')}</Label>
                        <Input
                          id="vlessRealityPublicKey"
                          value={formData.vlessRealityPublicKey}
                          onChange={(e) => handleChange('vlessRealityPublicKey', e.target.value)}
                          placeholder={t('userNodes.create.placeholders.realityPublicKey')}
                          disabled={loading}
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="vlessRealityShortId">{t('userNodes.create.vless.realityShortId')}</Label>
                        <Input
                          id="vlessRealityShortId"
                          value={formData.vlessRealityShortId}
                          onChange={(e) => handleChange('vlessRealityShortId', e.target.value)}
                          placeholder={t('userNodes.create.placeholders.realityShortId')}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="vlessRealitySpiderX">{t('userNodes.create.vless.realitySpiderX')}</Label>
                      <Input
                        id="vlessRealitySpiderX"
                        value={formData.vlessRealitySpiderX}
                        onChange={(e) => handleChange('vlessRealitySpiderX', e.target.value)}
                        placeholder="/"
                        disabled={loading}
                      />
                      <p className="text-xs text-muted-foreground">{t('userNodes.create.hints.optional')}</p>
                    </div>
                  </>
                )}

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="vlessAllowInsecure"
                    checked={formData.vlessAllowInsecure}
                    onCheckedChange={(checked) => handleChange('vlessAllowInsecure', checked as boolean)}
                    disabled={loading}
                  />
                  <Label htmlFor="vlessAllowInsecure" className="cursor-pointer">
                    {t('userNodes.create.allowInsecure')}
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* VMess config */}
          {formData.protocol === 'vmess' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">{t('userNodes.create.vmess.title')}</h3>
              <Separator />

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="vmessTransportType">{t('userNodes.create.transportProtocol')}</Label>
                    <Select
                      value={formData.vmessTransportType}
                      onValueChange={(value) => handleChange('vmessTransportType', value as TransportProtocol)}
                      disabled={loading}
                    >
                      <SelectTrigger id="vmessTransportType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VMESS_TRANSPORT_PROTOCOLS.map((tp) => (
                          <SelectItem key={tp.value} value={tp.value}>
                            {tp.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="vmessSecurity">{t('userNodes.create.vmess.encryption')}</Label>
                    <Select
                      value={formData.vmessSecurity}
                      onValueChange={(value) => handleChange('vmessSecurity', value as VMessSecurity)}
                      disabled={loading}
                    >
                      <SelectTrigger id="vmessSecurity">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VMESS_SECURITY_OPTIONS.map((sec) => (
                          <SelectItem key={sec.value} value={sec.value}>
                            {sec.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="vmessAlterId">{t('userNodes.create.vmess.alterId')}</Label>
                  <Input
                    id="vmessAlterId"
                    type="number"
                    min="0"
                    value={formData.vmessAlterId}
                    onChange={(e) => handleChange('vmessAlterId', e.target.value)}
                    placeholder="0"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">{t('userNodes.create.hints.alterId')}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="vmessSni">{t('userNodes.create.tlsSni')}</Label>
                    <Input
                      id="vmessSni"
                      value={formData.vmessSni}
                      onChange={(e) => handleChange('vmessSni', e.target.value)}
                      placeholder="example.com"
                      disabled={loading}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>{t('userNodes.create.vmess.tlsSettings')}</Label>
                    <div className="flex items-center gap-4 h-10">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="vmessTls"
                          checked={formData.vmessTls}
                          onCheckedChange={(checked) => handleChange('vmessTls', checked as boolean)}
                          disabled={loading}
                        />
                        <Label htmlFor="vmessTls" className="cursor-pointer text-sm">
                          {t('userNodes.create.vmess.enableTls')}
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* WS/HTTP settings */}
                {(formData.vmessTransportType === 'ws' || formData.vmessTransportType === 'http') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="vmessHost">{t('userNodes.create.hostHeader')}</Label>
                      <Input
                        id="vmessHost"
                        value={formData.vmessHost}
                        onChange={(e) => handleChange('vmessHost', e.target.value)}
                        placeholder="example.com"
                        disabled={loading}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="vmessPath">{t('userNodes.create.path')}</Label>
                      <Input
                        id="vmessPath"
                        value={formData.vmessPath}
                        onChange={(e) => handleChange('vmessPath', e.target.value)}
                        placeholder="/ws"
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                {/* gRPC settings */}
                {formData.vmessTransportType === 'grpc' && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="vmessServiceName">Service Name</Label>
                    <Input
                      id="vmessServiceName"
                      value={formData.vmessServiceName}
                      onChange={(e) => handleChange('vmessServiceName', e.target.value)}
                      placeholder="grpc-service"
                      disabled={loading}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="vmessAllowInsecure"
                    checked={formData.vmessAllowInsecure}
                    onCheckedChange={(checked) => handleChange('vmessAllowInsecure', checked as boolean)}
                    disabled={loading}
                  />
                  <Label htmlFor="vmessAllowInsecure" className="cursor-pointer">
                    {t('userNodes.create.allowInsecure')}
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Hysteria2 config */}
          {formData.protocol === 'hysteria2' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">{t('userNodes.create.hysteria2.title')}</h3>
              <Separator />

              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="hysteria2CongestionControl">{t('userNodes.create.congestionControl')}</Label>
                  <Select
                    value={formData.hysteria2CongestionControl}
                    onValueChange={(value) => handleChange('hysteria2CongestionControl', value as CongestionControl)}
                    disabled={loading}
                  >
                    <SelectTrigger id="hysteria2CongestionControl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONGESTION_CONTROL_OPTIONS.map((cc) => (
                        <SelectItem key={cc.value} value={cc.value}>
                          {cc.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{t('userNodes.create.hints.recommendBbr')}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="hysteria2Obfs">{t('userNodes.create.hysteria2.obfsType')}</Label>
                    <Input
                      id="hysteria2Obfs"
                      value={formData.hysteria2Obfs}
                      onChange={(e) => handleChange('hysteria2Obfs', e.target.value)}
                      placeholder="salamander"
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">{t('userNodes.create.hints.obfsType')}</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="hysteria2ObfsPassword">{t('userNodes.create.hysteria2.obfsPassword')}</Label>
                    <Input
                      id="hysteria2ObfsPassword"
                      value={formData.hysteria2ObfsPassword}
                      onChange={(e) => handleChange('hysteria2ObfsPassword', e.target.value)}
                      placeholder={t('userNodes.create.placeholders.obfsPassword')}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="hysteria2UpMbps">{t('userNodes.create.hysteria2.upMbps')}</Label>
                    <Input
                      id="hysteria2UpMbps"
                      type="number"
                      min="0"
                      value={formData.hysteria2UpMbps}
                      onChange={(e) => handleChange('hysteria2UpMbps', e.target.value)}
                      placeholder="100"
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">{t('userNodes.create.hints.optional')}</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="hysteria2DownMbps">{t('userNodes.create.hysteria2.downMbps')}</Label>
                    <Input
                      id="hysteria2DownMbps"
                      type="number"
                      min="0"
                      value={formData.hysteria2DownMbps}
                      onChange={(e) => handleChange('hysteria2DownMbps', e.target.value)}
                      placeholder="100"
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">{t('userNodes.create.hints.optional')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="hysteria2Sni">{t('userNodes.create.tlsSni')}</Label>
                    <Input
                      id="hysteria2Sni"
                      value={formData.hysteria2Sni}
                      onChange={(e) => handleChange('hysteria2Sni', e.target.value)}
                      placeholder="example.com"
                      disabled={loading}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="hysteria2Fingerprint">{t('userNodes.create.tlsFingerprint')}</Label>
                    <Select
                      value={formData.hysteria2Fingerprint}
                      onValueChange={(value) => handleChange('hysteria2Fingerprint', value)}
                      disabled={loading}
                    >
                      <SelectTrigger id="hysteria2Fingerprint">
                        <SelectValue placeholder={t('userNodes.create.placeholders.selectFingerprint')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">{t('userNodes.create.notSpecified')}</SelectItem>
                        {TLS_FINGERPRINT_OPTIONS.map((fp) => (
                          <SelectItem key={fp.value} value={fp.value}>
                            {fp.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="hysteria2AllowInsecure"
                    checked={formData.hysteria2AllowInsecure}
                    onCheckedChange={(checked) => handleChange('hysteria2AllowInsecure', checked as boolean)}
                    disabled={loading}
                  />
                  <Label htmlFor="hysteria2AllowInsecure" className="cursor-pointer">
                    {t('userNodes.create.allowInsecure')}
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* TUIC config */}
          {formData.protocol === 'tuic' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">{t('userNodes.create.tuic.title')}</h3>
              <Separator />

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="tuicCongestionControl">{t('userNodes.create.congestionControl')}</Label>
                    <Select
                      value={formData.tuicCongestionControl}
                      onValueChange={(value) => handleChange('tuicCongestionControl', value as CongestionControl)}
                      disabled={loading}
                    >
                      <SelectTrigger id="tuicCongestionControl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONGESTION_CONTROL_OPTIONS.map((cc) => (
                          <SelectItem key={cc.value} value={cc.value}>
                            {cc.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">{t('userNodes.create.hints.recommendBbr')}</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="tuicUdpRelayMode">{t('userNodes.create.tuic.udpRelayMode')}</Label>
                    <Select
                      value={formData.tuicUdpRelayMode}
                      onValueChange={(value) => handleChange('tuicUdpRelayMode', value as TUICUDPRelayMode)}
                      disabled={loading}
                    >
                      <SelectTrigger id="tuicUdpRelayMode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TUIC_UDP_RELAY_MODES.map((mode) => (
                          <SelectItem key={mode.value} value={mode.value}>
                            {mode.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="tuicSni">{t('userNodes.create.tlsSni')}</Label>
                    <Input
                      id="tuicSni"
                      value={formData.tuicSni}
                      onChange={(e) => handleChange('tuicSni', e.target.value)}
                      placeholder="example.com"
                      disabled={loading}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="tuicAlpn">{t('userNodes.create.tuic.alpn')}</Label>
                    <Input
                      id="tuicAlpn"
                      value={formData.tuicAlpn}
                      onChange={(e) => handleChange('tuicAlpn', e.target.value)}
                      placeholder="h3"
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">{t('userNodes.create.hints.alpn')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="tuicAllowInsecure"
                      checked={formData.tuicAllowInsecure}
                      onCheckedChange={(checked) => handleChange('tuicAllowInsecure', checked as boolean)}
                      disabled={loading}
                    />
                    <Label htmlFor="tuicAllowInsecure" className="cursor-pointer">
                      {t('userNodes.create.allowInsecure')}
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="tuicDisableSni"
                      checked={formData.tuicDisableSni}
                      onCheckedChange={(checked) => handleChange('tuicDisableSni', checked as boolean)}
                      disabled={loading}
                    />
                    <Label htmlFor="tuicDisableSni" className="cursor-pointer">
                      {t('userNodes.create.tuic.disableSni')}
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.actions.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !formData.name || !formData.agentPort}>
            {loading ? t('userNodes.create.creating') : t('common.actions.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
