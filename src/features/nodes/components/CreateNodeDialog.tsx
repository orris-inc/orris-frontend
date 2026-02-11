/**
 * Create node dialog component
 * Redesigned with improved UI/UX - clean visual hierarchy, icons, and better form layout
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Badge } from '@/components/common/Badge';
import { Separator } from '@/components/common/Separator';
import { RouteConfigEditor } from './RouteConfigEditor';
import type { OutboundNodeOption } from '../utils/route-rule-utils';
import type {
  CreateNodeRequest,
  TransportProtocol,
  NodeProtocol,
  VLESSSecurity,
  VMessSecurity,
  CongestionControl,
  TUICUDPRelayMode,
} from '@/api/node';
import {
  ShadowsocksConfigForm,
  TrojanConfigForm,
  VlessConfigForm,
  VmessConfigForm,
  Hysteria2ConfigForm,
  TuicConfigForm,
  AnyTLSConfigForm,
} from './protocol-forms';
import { NodeOtherSettingsFields } from './form-sections';
import {
  Server,
  Network,
  Shield,
  Settings,
  Route,
  Zap,
  Lock,
  ChevronDown,
  AlertCircle,
  Radio,
  Layers,
  Gauge,
  Workflow,
  ShieldCheck,
} from 'lucide-react';
import { useResourceGroups } from '@/features/resource-groups/hooks/useResourceGroups';
import { useCreateNodeForm } from '../hooks/useCreateNodeForm';

interface CreateNodeDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateNodeRequest) => void;
  /** Initial data for prefilling form when copying a node */
  initialData?: Partial<CreateNodeRequest>;
  /** Available nodes for route outbound selection */
  nodes?: OutboundNodeOption[];
}

// Protocol option constants
const SS_ENCRYPTION_METHODS = [
  'aes-128-gcm', 'aes-256-gcm', 'chacha20-ietf-poly1305', 'xchacha20-ietf-poly1305',
  '2022-blake3-aes-128-gcm', '2022-blake3-aes-256-gcm', '2022-blake3-chacha20-poly1305',
] as const;
const TRANSPORT_PROTOCOLS: TransportProtocol[] = ['tcp', 'ws', 'grpc'];
const VLESS_TRANSPORT_PROTOCOLS: TransportProtocol[] = ['tcp', 'ws', 'grpc', 'h2'];
const VLESS_SECURITY_OPTIONS: VLESSSecurity[] = ['none', 'tls', 'reality'];
const VMESS_SECURITY_OPTIONS: VMessSecurity[] = ['auto', 'aes-128-gcm', 'chacha20-poly1305', 'none', 'zero'];
const VMESS_TRANSPORT_PROTOCOLS: TransportProtocol[] = ['tcp', 'ws', 'grpc', 'http', 'quic'];
const CONGESTION_CONTROL_OPTIONS: CongestionControl[] = ['cubic', 'bbr', 'new_reno'];
const TUIC_UDP_RELAY_MODES: TUICUDPRelayMode[] = ['native', 'quic'];

// Section configuration
interface SectionConfig {
  id: string;
  title: string;
  icon: React.ElementType;
  required?: boolean;
  getBadge?: () => string | null;
}

// Collapsible Section Component
interface CollapsibleSectionProps {
  config: SectionConfig;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  getBadgeText?: () => string | null;
  requiredLabel: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  config,
  isOpen,
  onToggle,
  children,
  getBadgeText,
  requiredLabel,
}) => {
  const Icon = config.icon;
  const badgeText = getBadgeText?.();

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card transition-all duration-200 hover:border-border/80">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/30 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isOpen ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'} transition-colors`}>
            <Icon className="size-4" strokeWidth={1.5} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{config.title}</span>
            {config.required && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                {requiredLabel}
              </Badge>
            )}
            {badgeText && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {badgeText}
              </Badge>
            )}
          </div>
        </div>
        <div className={`text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="size-4" />
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-4 pt-0">
          <Separator className="mb-4" />
          {children}
        </div>
      </div>
    </div>
  );
};

// Form Field Component for consistent styling
interface FormFieldProps {
  label: React.ReactNode;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({
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
);

// Protocol configuration - labels will be translated at render time
const PROTOCOL_CONFIG: Record<NodeProtocol, { name: string; descKey: string; icon: React.ElementType }> = {
  shadowsocks: { name: 'Shadowsocks', descKey: 'admin.nodes.form.protocolDesc.shadowsocks', icon: Zap },
  trojan: { name: 'Trojan', descKey: 'admin.nodes.form.protocolDesc.trojan', icon: Lock },
  vless: { name: 'VLESS', descKey: 'admin.nodes.form.protocolDesc.vless', icon: Radio },
  vmess: { name: 'VMess', descKey: 'admin.nodes.form.protocolDesc.vmess', icon: Layers },
  hysteria2: { name: 'Hysteria2', descKey: 'admin.nodes.form.protocolDesc.hysteria2', icon: Gauge },
  tuic: { name: 'TUIC', descKey: 'admin.nodes.form.protocolDesc.tuic', icon: Workflow },
  anytls: { name: 'AnyTLS', descKey: 'admin.nodes.form.protocolDesc.anytls', icon: ShieldCheck },
};

// Protocol Card Component - Compact version
interface ProtocolCardProps {
  protocol: NodeProtocol;
  selected: boolean;
  onSelect: () => void;
}

const ProtocolCard: React.FC<ProtocolCardProps & { t: (key: string) => string }> = ({ protocol, selected, onSelect, t }) => {
  const config = PROTOCOL_CONFIG[protocol];
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-all duration-200 cursor-pointer ${
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border hover:border-primary/30 hover:bg-accent/30'
      }`}
    >
      <div className={`p-1.5 rounded-md ${selected ? 'bg-primary/10' : 'bg-muted'} transition-colors`}>
        <Icon className={`size-4 ${selected ? 'text-primary' : 'text-muted-foreground'}`} strokeWidth={1.5} />
      </div>
      <div className="text-left">
        <p className={`text-sm font-medium leading-none ${selected ? 'text-foreground' : 'text-muted-foreground'}`}>
          {config.name}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {t(config.descKey)}
        </p>
      </div>
    </button>
  );
};

export const CreateNodeDialog: React.FC<CreateNodeDialogProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  nodes = [],
}) => {
  const { t } = useTranslation();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['basic', 'network']));
  // Track previous state for form reset - React recommended pattern for derived state
  const [prevOpenState, setPrevOpenState] = useState<{ open: boolean; initialDataKey?: string } | null>(null);

  const form = useCreateNodeForm();

  // Get resource groups for selection
  const { resourceGroups } = useResourceGroups({
    pageSize: 100,
    filters: { status: 'active' },
    enabled: open,
  });

  // Sync form data when dialog opens or initialData changes
  // See: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const initialDataKey = initialData ? initialData.name : undefined;
  const currentState = { open, initialDataKey };
  if (prevOpenState?.open !== currentState.open || prevOpenState?.initialDataKey !== currentState.initialDataKey) {
    setPrevOpenState(currentState);
    if (open && initialData) {
      form.initializeForm(initialData);
      // Open all sections when copying
      setOpenSections(new Set(['basic', 'network', 'protocol', 'other', 'route']));
    } else if (open && !initialData) {
      form.initializeForm();
      setOpenSections(new Set(['basic', 'network']));
    }
  }

  const handleClose = useCallback(() => {
    form.reset();
    setOpenSections(new Set(['basic', 'network']));
    onClose();
  }, [onClose, form]);

  const toggleSection = useCallback((sectionId: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const handleSubmit = () => {
    if (form.validate()) {
      const submitData = form.buildSubmitData();
      onSubmit(submitData);
      handleClose();
    }
  };

  const {
    formData, errors, pluginOptsString,
    isShadowsocks, isTrojan, isVless, isVmess, isHysteria2, isTuic, isAnytls,
    handleChange, handleRouteChange, handleCostLabelChange, handleGroupToggle,
    isFormValid, hasProtocolSettings, hasOtherSettings,
  } = form;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-3xl flex flex-col max-h-[90vh] p-0">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Server className="size-5 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                {initialData ? t('admin.nodes.form.copyNode') : t('admin.nodes.form.createNode')}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t('admin.nodes.form.description')}
              </p>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
          <div className="space-y-3">
            {/* Basic Info Section */}
            <CollapsibleSection
              config={{ id: 'basic', title: t('common.sections.basicInfo'), icon: Server, required: true }}
              isOpen={openSections.has('basic')}
              onToggle={() => toggleSection('basic')}
              requiredLabel={t('admin.nodes.form.required')}
            >
              <div className="space-y-5">
                {/* Node Name */}
                <FormField label={t('admin.nodes.form.nodeName')} required error={errors.name} hint={t('admin.nodes.form.nodeNameHint')}>
                  <Input
                    id="name"
                    placeholder={t('admin.nodes.form.nodeNamePlaceholder')}
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    error={!!errors.name}
                    autoFocus
                    className="h-10"
                  />
                </FormField>

                {/* Protocol Selection */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    {t('admin.nodes.form.protocolType')} <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(PROTOCOL_CONFIG) as NodeProtocol[]).map((proto) => (
                      <ProtocolCard
                        key={proto}
                        protocol={proto}
                        selected={formData.protocol === proto}
                        onSelect={() => handleChange('protocol', proto)}
                        t={t}
                      />
                    ))}
                  </div>
                </div>

                {/* Encryption Method (Shadowsocks) */}
                {isShadowsocks && (
                  <FormField label={t('admin.nodes.form.encryptionMethod')} required error={errors.encryptionMethod}>
                    <Select
                      value={formData.encryptionMethod}
                      onValueChange={(value) => handleChange('encryptionMethod', value)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SS_ENCRYPTION_METHODS.map((method) => (
                          <SelectItem key={method} value={method}>
                            <span className="font-mono text-sm">{method}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                )}

                {/* Transport Protocol (Trojan) */}
                {isTrojan && (
                  <FormField label={t('admin.nodes.form.transportProtocol')} hint={t('admin.nodes.form.transportProtocolHint')}>
                    <Select
                      value={formData.transportProtocol}
                      onValueChange={(value) => handleChange('transportProtocol', value)}
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
                )}

                {/* VLESS Basic Config */}
                {isVless && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label={t('admin.nodes.form.transportProtocol')} hint={t('admin.nodes.form.transportProtocolHint')}>
                        <Select
                          value={formData.vlessTransportType}
                          onValueChange={(value) => handleChange('vlessTransportType', value as TransportProtocol)}
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

                      <FormField label={t('admin.nodes.form.securityType')} hint={t('admin.nodes.form.securityTypeHint')}>
                        <Select
                          value={formData.vlessSecurity}
                          onValueChange={(value) => handleChange('vlessSecurity', value as VLESSSecurity)}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VLESS_SECURITY_OPTIONS.map((security) => (
                              <SelectItem key={security} value={security}>
                                {security.toUpperCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>
                    </div>
                  </>
                )}

                {/* VMess Basic Config */}
                {isVmess && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label={t('admin.nodes.form.transportProtocol')} hint={t('admin.nodes.form.transportProtocolHint')}>
                        <Select
                          value={formData.vmessTransportType}
                          onValueChange={(value) => handleChange('vmessTransportType', value as TransportProtocol)}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VMESS_TRANSPORT_PROTOCOLS.map((protocol) => (
                              <SelectItem key={protocol} value={protocol}>
                                {protocol.toUpperCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>

                      <FormField label={t('admin.nodes.form.encryptionMethod')} hint={t('admin.nodes.form.vmessSecurityHint')}>
                        <Select
                          value={formData.vmessSecurity}
                          onValueChange={(value) => handleChange('vmessSecurity', value as VMessSecurity)}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VMESS_SECURITY_OPTIONS.map((security) => (
                              <SelectItem key={security} value={security}>
                                {security}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>
                    </div>
                  </>
                )}

                {/* Hysteria2 Basic Config */}
                {isHysteria2 && (
                  <FormField label={t('admin.nodes.form.congestionControl')} hint={t('admin.nodes.form.congestionControlHint')}>
                    <Select
                      value={formData.hysteria2CongestionControl}
                      onValueChange={(value) => handleChange('hysteria2CongestionControl', value as CongestionControl)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONGESTION_CONTROL_OPTIONS.map((cc) => (
                          <SelectItem key={cc} value={cc}>
                            {cc.toUpperCase().replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                )}

                {/* TUIC Basic Config */}
                {isTuic && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label={t('admin.nodes.form.congestionControl')} hint={t('admin.nodes.form.congestionControlHint')}>
                      <Select
                        value={formData.tuicCongestionControl}
                        onValueChange={(value) => handleChange('tuicCongestionControl', value as CongestionControl)}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONGESTION_CONTROL_OPTIONS.map((cc) => (
                            <SelectItem key={cc} value={cc}>
                              {cc.toUpperCase().replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField label={t('admin.nodes.form.udpRelayMode')} hint={t('admin.nodes.form.udpRelayModeHint')}>
                      <Select
                        value={formData.tuicUdpRelayMode}
                        onValueChange={(value) => handleChange('tuicUdpRelayMode', value as TUICUDPRelayMode)}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TUIC_UDP_RELAY_MODES.map((mode) => (
                            <SelectItem key={mode} value={mode}>
                              {mode.toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                  </div>
                )}
              </div>
            </CollapsibleSection>

            {/* Network Section */}
            <CollapsibleSection
              config={{ id: 'network', title: t('common.sections.networkConfig'), icon: Network, required: true }}
              isOpen={openSections.has('network')}
              onToggle={() => toggleSection('network')}
              requiredLabel={t('admin.nodes.form.required')}
            >
              <div className="space-y-4">
                {/* Server Address */}
                <FormField label={t('admin.nodes.form.serverAddress')} hint={t('admin.nodes.form.serverAddressHint')}>
                  <Input
                    id="serverAddress"
                    placeholder={t('admin.nodes.form.serverAddressPlaceholder')}
                    value={formData.serverAddress}
                    onChange={(e) => handleChange('serverAddress', e.target.value)}
                    className="h-10 font-mono"
                  />
                </FormField>

                {/* Ports */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField label={t('admin.nodes.form.agentPort')} required error={errors.agentPort} hint={t('admin.nodes.form.hints.portRange')}>
                    <Input
                      id="agentPort"
                      type="number"
                      min={1}
                      max={65535}
                      value={formData.agentPort}
                      onChange={(e) => handleChange('agentPort', parseInt(e.target.value, 10))}
                      error={!!errors.agentPort}
                      className="h-10 font-mono"
                    />
                  </FormField>

                  <FormField label={t('admin.nodes.form.subscriptionPort')} error={errors.subscriptionPort} hint={t('admin.nodes.form.subscriptionPortHint')}>
                    <Input
                      id="subscriptionPort"
                      type="number"
                      min={1}
                      max={65535}
                      placeholder={t('admin.nodes.form.sameAsAgentPort')}
                      value={formData.subscriptionPort ?? ''}
                      onChange={(e) => handleChange('subscriptionPort', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                      error={!!errors.subscriptionPort}
                      className="h-10 font-mono"
                    />
                  </FormField>
                </div>
              </div>
            </CollapsibleSection>

            {/* Protocol Settings Section */}
            <CollapsibleSection
              config={{ id: 'protocol', title: `${PROTOCOL_CONFIG[formData.protocol].name} ${t('admin.nodes.form.config')}`, icon: Shield }}
              isOpen={openSections.has('protocol')}
              onToggle={() => toggleSection('protocol')}
              getBadgeText={() => hasProtocolSettings ? t('admin.nodes.form.configured') : null}
              requiredLabel={t('admin.nodes.form.required')}
            >
              <div className="space-y-4">
                {isShadowsocks && (
                  <ShadowsocksConfigForm
                    plugin={formData.plugin}
                    pluginOptsString={pluginOptsString}
                    onPluginChange={(value) => handleChange('plugin', value)}
                    onPluginOptsChange={(value) => form.handlePluginOptsChange(value)}
                    errors={errors}
                  />
                )}

                {isTrojan && (
                  <TrojanConfigForm
                    sni={formData.sni}
                    allowInsecure={formData.allowInsecure}
                    transportProtocol={formData.transportProtocol}
                    host={formData.host}
                    path={formData.path}
                    onFieldChange={handleChange}
                    errors={errors}
                  />
                )}

                {/* VLESS Protocol Settings */}
                {isVless && (
                  <VlessConfigForm
                    transportType={formData.vlessTransportType}
                    security={formData.vlessSecurity}
                    sni={formData.vlessSni}
                    allowInsecure={formData.vlessAllowInsecure}
                    flow={formData.vlessFlow}
                    fingerprint={formData.vlessFingerprint}
                    host={formData.vlessHost}
                    path={formData.vlessPath}
                    serviceName={formData.vlessServiceName}
                    realityPublicKey={formData.vlessRealityPublicKey}
                    realityShortId={formData.vlessRealityShortId}
                    realitySpiderX={formData.vlessRealitySpiderX}
                    onFieldChange={handleChange}
                    errors={errors}
                  />
                )}

                {/* VMess Protocol Settings */}
                {isVmess && (
                  <VmessConfigForm
                    transportType={formData.vmessTransportType}
                    security={formData.vmessSecurity}
                    alterId={formData.vmessAlterId}
                    tls={formData.vmessTls}
                    sni={formData.vmessSni}
                    allowInsecure={formData.vmessAllowInsecure}
                    host={formData.vmessHost}
                    path={formData.vmessPath}
                    serviceName={formData.vmessServiceName}
                    onFieldChange={handleChange}
                    errors={errors}
                  />
                )}

                {/* Hysteria2 Protocol Settings */}
                {isHysteria2 && (
                  <Hysteria2ConfigForm
                    congestionControl={formData.hysteria2CongestionControl}
                    sni={formData.hysteria2Sni}
                    allowInsecure={formData.hysteria2AllowInsecure}
                    obfs={formData.hysteria2Obfs}
                    obfsPassword={formData.hysteria2ObfsPassword}
                    upMbps={formData.hysteria2UpMbps}
                    downMbps={formData.hysteria2DownMbps}
                    fingerprint={formData.hysteria2Fingerprint}
                    onFieldChange={handleChange}
                    errors={errors}
                  />
                )}

                {/* TUIC Protocol Settings */}
                {isTuic && (
                  <TuicConfigForm
                    congestionControl={formData.tuicCongestionControl}
                    udpRelayMode={formData.tuicUdpRelayMode}
                    sni={formData.tuicSni}
                    allowInsecure={formData.tuicAllowInsecure}
                    alpn={formData.tuicAlpn}
                    disableSni={formData.tuicDisableSni}
                    onFieldChange={handleChange}
                    errors={errors}
                  />
                )}

                {/* AnyTLS Protocol Settings */}
                {isAnytls && (
                  <AnyTLSConfigForm
                    sni={formData.anytlsSni}
                    allowInsecure={formData.anytlsAllowInsecure}
                    fingerprint={formData.anytlsFingerprint}
                    idleSessionCheckInterval={formData.anytlsIdleSessionCheckInterval}
                    idleSessionTimeout={formData.anytlsIdleSessionTimeout}
                    minIdleSession={formData.anytlsMinIdleSession}
                    onFieldChange={handleChange}
                    errors={errors}
                  />
                )}
              </div>
            </CollapsibleSection>

            {/* Other Settings Section */}
            <CollapsibleSection
              config={{ id: 'other', title: t('admin.nodes.form.section.otherSettings'), icon: Settings }}
              isOpen={openSections.has('other')}
              onToggle={() => toggleSection('other')}
              getBadgeText={() => hasOtherSettings ? t('admin.nodes.form.configured') : null}
              requiredLabel={t('admin.nodes.form.required')}
            >
              <NodeOtherSettingsFields
                variant="desktop"
                mode="create"
                formData={{
                  region: formData.region,
                  sortOrder: formData.sortOrder,
                  tagsInput: formData.tagsInput,
                  groupSids: formData.groupSids || [],
                  expiresAt: formData.expiresAt,
                  costLabel: formData.costLabel,
                }}
                onFieldChange={handleChange}
                onCostLabelChange={handleCostLabelChange}
                onGroupToggle={(sid, _checked) => handleGroupToggle(sid)}
                onGroupRemove={(sid) => handleGroupToggle(sid)}
                filteredResourceGroups={resourceGroups}
                isLoading={false}
              />
            </CollapsibleSection>

            {/* Route Config Section */}
            <CollapsibleSection
              config={{ id: 'route', title: t('admin.nodes.form.section.routeConfig'), icon: Route }}
              isOpen={openSections.has('route')}
              onToggle={() => toggleSection('route')}
              getBadgeText={() => formData.route ? t('admin.nodes.form.configured') : null}
              requiredLabel={t('admin.nodes.form.required')}
            >
              <RouteConfigEditor
                value={formData.route}
                onChange={handleRouteChange}
                idPrefix="create-node-route"
                nodes={nodes}
              />
            </CollapsibleSection>
          </div>
        </div>

        <Separator />

        {/* Footer */}
        <DialogFooter className="flex-shrink-0 px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <p className="text-xs text-muted-foreground">
              <span className="text-destructive">*</span> {t('admin.nodes.form.requiredFieldsNote')}
            </p>
            <div className="flex items-center gap-2">
              <Button onClick={handleSubmit} disabled={!isFormValid} className="h-9 px-6">
                {initialData ? t('admin.nodes.form.createCopy') : t('admin.nodes.form.createNode')}
              </Button>
              <Button variant="outline" onClick={handleClose} className="h-9 px-4">
                {t('common.actions.cancel')}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
