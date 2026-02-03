/**
 * Edit Node Sheet Component
 * Mobile-optimized bottom sheet for editing nodes
 */

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Server,
  Network,
  Shield,
  Settings,
  Route,
  ChevronDown,
  Zap,
  Lock,
  Radio,
  Layers,
  Gauge,
  Workflow,
  X,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  type EditSheetProps,
} from '@/components/common/sheet';
import { Badge } from '@/components/common/Badge';
import { Switch, SwitchThumb } from '@/components/common/Switch';
import { Checkbox } from '@/components/common/Checkbox';
import { MobileFormInput, MobileSelect, type MobileSelectOption } from '@/components/common/mobile-form';
import { useResourceGroups } from '@/features/resource-groups/hooks/useResourceGroups';
import { useSubscriptionPlans } from '@/features/subscription-plans/hooks/useSubscriptionPlans';
import { RouteConfigEditor } from './RouteConfigEditor';
import { cn } from '@/lib/utils';
import type { OutboundNodeOption } from '../utils/route-rule-utils';
import type {
  Node,
  UpdateNodeRequest,
  TransportProtocol,
  RouteConfig,
  NodeProtocol,
  VLESSSecurity,
  VMessSecurity,
  CongestionControl,
  TUICUDPRelayMode,
} from '@/api/node';

interface EditNodeSheetProps extends EditSheetProps<Node, UpdateNodeRequest> {
  nodes?: OutboundNodeOption[];
}

interface FormData extends Omit<UpdateNodeRequest, 'groupSids'> {
  tagsInput: string;
  groupSids: string[];
}

// Shadowsocks encryption methods
const SS_ENCRYPTION_METHODS = [
  'aes-128-gcm',
  'aes-256-gcm',
  'chacha20-ietf-poly1305',
  'xchacha20-ietf-poly1305',
  '2022-blake3-aes-128-gcm',
  '2022-blake3-aes-256-gcm',
  '2022-blake3-chacha20-poly1305',
] as const;

// Trojan transport protocols
const TRANSPORT_PROTOCOLS: TransportProtocol[] = ['tcp', 'ws', 'grpc'];

// Status options for MobileSelect - labels will be translated in component
const STATUS_OPTIONS_VALUES = ['active', 'inactive', 'maintenance'] as const;
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500',
  inactive: 'bg-gray-400',
  maintenance: 'bg-amber-500',
};

// TLS security options are created dynamically in component with translations

// VLESS transport protocols
const VLESS_TRANSPORT_PROTOCOLS: TransportProtocol[] = ['tcp', 'ws', 'grpc', 'h2'];

// VLESS security types - labels will be translated in component
const VLESS_SECURITY_VALUES: VLESSSecurity[] = ['tls', 'reality', 'none'];

// VMess transport protocols
const VMESS_TRANSPORT_PROTOCOLS: TransportProtocol[] = ['tcp', 'ws', 'grpc', 'http', 'quic'];

// VMess security types - labels will be translated in component
const VMESS_SECURITY_VALUES: VMessSecurity[] = ['auto', 'aes-128-gcm', 'chacha20-poly1305', 'none', 'zero'];

// Congestion control algorithms - labels will be translated in component
const CONGESTION_CONTROL_VALUES: CongestionControl[] = ['bbr', 'cubic', 'new_reno'];

// TUIC UDP relay modes
const TUIC_UDP_RELAY_VALUES: TUICUDPRelayMode[] = ['native', 'quic'];

// TLS fingerprint options - labels will be translated in component
const TLS_FINGERPRINT_VALUES = ['chrome', 'firefox', 'safari', 'edge', 'random'] as const;

// Protocol configuration for display
const PROTOCOL_CONFIG: Record<NodeProtocol, { name: string; icon: React.ElementType }> = {
  shadowsocks: { name: 'Shadowsocks', icon: Zap },
  trojan: { name: 'Trojan', icon: Lock },
  vless: { name: 'VLESS', icon: Radio },
  vmess: { name: 'VMess', icon: Layers },
  hysteria2: { name: 'Hysteria2', icon: Gauge },
  tuic: { name: 'TUIC', icon: Workflow },
};

// Helper function: convert pluginOpts object to string
const pluginOptsToString = (opts?: Record<string, string>): string => {
  if (!opts || Object.keys(opts).length === 0) return '';
  return Object.entries(opts)
    .map(([key, value]) => `${key}=${value}`)
    .join(';');
};

// Helper function: parse string to pluginOpts object
const stringToPluginOpts = (str: string): Record<string, string> | undefined => {
  const trimmed = str.trim();
  if (!trimmed) return undefined;

  const opts: Record<string, string> = {};
  const pairs = trimmed.split(';');

  for (const pair of pairs) {
    const trimmedPair = pair.trim();
    if (!trimmedPair) continue;

    const [key, ...valueParts] = trimmedPair.split('=');
    const trimmedKey = key?.trim();
    const value = valueParts.join('=').trim();

    if (trimmedKey && value) {
      opts[trimmedKey] = value;
    }
  }

  return Object.keys(opts).length > 0 ? opts : undefined;
};

// Helper function: deep comparison of two pluginOpts objects
const arePluginOptsEqual = (
  opts1?: Record<string, string>,
  opts2?: Record<string, string>
): boolean => {
  if ((!opts1 || Object.keys(opts1).length === 0) &&
      (!opts2 || Object.keys(opts2).length === 0)) {
    return true;
  }
  if (!opts1 || !opts2) return false;
  const keys1 = Object.keys(opts1);
  const keys2 = Object.keys(opts2);
  if (keys1.length !== keys2.length) return false;
  return keys1.every(key => opts1[key] === opts2[key]);
};

// Mobile Collapsible Section - Tailwind Application UI style
interface MobileSectionProps {
  title: string;
  icon: React.ElementType;
  badge?: string | null;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const MobileSection: React.FC<MobileSectionProps> = ({
  title,
  icon: Icon,
  badge,
  isOpen,
  onToggle,
  children,
}) => (
  <div className="overflow-hidden rounded-xl bg-card ring-1 ring-border">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3 text-left active:bg-muted/50 active:scale-[0.99] transition-all min-h-[52px]"
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'size-8 rounded-lg flex items-center justify-center transition-colors',
          isOpen ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
        )}>
          <Icon className="size-4" strokeWidth={2} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          {badge && (
            <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-medium">
              {badge}
            </span>
          )}
        </div>
      </div>
      <ChevronDown className={cn(
        'size-4 text-muted-foreground transition-transform duration-200',
        isOpen && 'rotate-180'
      )} />
    </button>
    <div className={cn(
      'overflow-hidden transition-all duration-200',
      isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
    )}>
      <div className="px-4 pb-4 pt-2 border-t border-border">
        {children}
      </div>
    </div>
  </div>
);

// Form Field Label - compact style
interface FormFieldLabelProps {
  label: string;
  hint?: string;
  showHint?: boolean;
}

const FormFieldLabel: React.FC<FormFieldLabelProps> = ({
  label,
  hint,
  showHint = true,
}) => (
  <div className="space-y-0.5">
    <label className="text-sm font-medium text-foreground">{label}</label>
    {hint && showHint && (
      <p className="text-[11px] text-muted-foreground leading-tight">{hint}</p>
    )}
  </div>
);

export const EditNodeSheet: React.FC<EditNodeSheetProps> = ({
  open,
  onOpenChange,
  entity: node,
  onSubmit,
  nodes = [],
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>({ tagsInput: '', groupSids: [] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pluginOptsStr, setPluginOptsStr] = useState<string>('');
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['basic', 'network']));
  const [loading, setLoading] = useState(false);

  const { resourceGroups, isLoading: isLoadingGroups } = useResourceGroups({
    pageSize: 100,
    filters: { status: 'active' },
    enabled: open,
  });

  const { plans, isLoading: isLoadingPlans } = useSubscriptionPlans({
    pageSize: 100,
    enabled: open,
  });

  const filteredResourceGroups = useMemo(() => {
    if (!plans.length) return resourceGroups;
    const planTypeMap = new Map(plans.map((plan) => [plan.id, plan.planType]));
    return resourceGroups.filter((group) => {
      const planType = planTypeMap.get(group.planId);
      return planType === 'node' || planType === 'hybrid';
    });
  }, [resourceGroups, plans]);

  // Translated select options
  const statusOptions: MobileSelectOption[] = useMemo(() =>
    STATUS_OPTIONS_VALUES.map((value) => ({
      value,
      label: t(`admin.nodes.form.status.${value}`),
      color: STATUS_COLORS[value],
    })), [t]);

  const tlsSecurityOptions: MobileSelectOption[] = useMemo(() => [
    { value: 'false', label: t('admin.nodes.form.verifyCert') },
    { value: 'true', label: t('admin.nodes.form.skipVerify') },
  ], [t]);

  const vlessSecurityOptions: MobileSelectOption[] = useMemo(() =>
    VLESS_SECURITY_VALUES.map((value) => ({
      value,
      label: value === 'none' ? t('admin.nodes.form.disableTls') : value.toUpperCase(),
    })), [t]);

  const vmessSecurityOptions: MobileSelectOption[] = useMemo(() =>
    VMESS_SECURITY_VALUES.map((value) => ({
      value,
      label: value === 'auto' ? `Auto (${t('common.recommended')})` : value === 'none' ? t('admin.nodes.form.disableTls') : value.toUpperCase(),
    })), [t]);

  const congestionControlOptions: MobileSelectOption[] = useMemo(() =>
    CONGESTION_CONTROL_VALUES.map((value) => ({
      value,
      label: value === 'bbr' ? `BBR (${t('common.recommended')})` : value.replace('_', ' ').toUpperCase(),
    })), [t]);

  const udpRelayModeOptions: MobileSelectOption[] = useMemo(() =>
    TUIC_UDP_RELAY_VALUES.map((value) => ({
      value,
      label: value.toUpperCase(),
    })), []);

  const fingerprintOptions: MobileSelectOption[] = useMemo(() => [
    { value: '__none__', label: t('admin.nodes.form.disableTls') },
    ...TLS_FINGERPRINT_VALUES.map((value) => ({
      value,
      label: value === 'random' ? t('admin.nodes.form.randomFingerprint') : value.charAt(0).toUpperCase() + value.slice(1),
    })),
  ], [t]);

  useEffect(() => {
    if (node) {
      setFormData({
        name: node.name,
        serverAddress: node.serverAddress,
        agentPort: node.agentPort,
        subscriptionPort: node.subscriptionPort,
        encryptionMethod: node.encryptionMethod,
        region: node.region,
        status: node.status,
        sortOrder: node.sortOrder,
        tags: node.tags,
        tagsInput: node.tags?.join(', ') ?? '',
        plugin: node.plugin,
        pluginOpts: node.pluginOpts,
        transportProtocol: node.transportProtocol,
        host: node.host,
        path: node.path,
        sni: node.sni,
        allowInsecure: node.allowInsecure,
        route: node.route,
        groupSids: node.groupSids ?? [],
        muteNotification: node.muteNotification,
        // VLESS fields
        vlessTransportType: node.vlessTransportType,
        vlessFlow: node.vlessFlow,
        vlessSecurity: node.vlessSecurity,
        vlessSni: node.vlessSni,
        vlessFingerprint: node.vlessFingerprint,
        vlessAllowInsecure: node.vlessAllowInsecure,
        vlessHost: node.vlessHost,
        vlessPath: node.vlessPath,
        vlessServiceName: node.vlessServiceName,
        vlessRealityPublicKey: node.vlessRealityPublicKey,
        vlessRealityShortId: node.vlessRealityShortId,
        vlessRealitySpiderX: node.vlessRealitySpiderX,
        // VMess fields
        vmessAlterId: node.vmessAlterId,
        vmessSecurity: node.vmessSecurity,
        vmessTransportType: node.vmessTransportType,
        vmessHost: node.vmessHost,
        vmessPath: node.vmessPath,
        vmessServiceName: node.vmessServiceName,
        vmessTls: node.vmessTls,
        vmessSni: node.vmessSni,
        vmessAllowInsecure: node.vmessAllowInsecure,
        // Hysteria2 fields
        hysteria2CongestionControl: node.hysteria2CongestionControl,
        hysteria2Obfs: node.hysteria2Obfs,
        hysteria2ObfsPassword: node.hysteria2ObfsPassword,
        hysteria2UpMbps: node.hysteria2UpMbps,
        hysteria2DownMbps: node.hysteria2DownMbps,
        hysteria2Sni: node.hysteria2Sni,
        hysteria2AllowInsecure: node.hysteria2AllowInsecure,
        hysteria2Fingerprint: node.hysteria2Fingerprint,
        // TUIC fields
        tuicCongestionControl: node.tuicCongestionControl,
        tuicUdpRelayMode: node.tuicUdpRelayMode,
        tuicAlpn: node.tuicAlpn,
        tuicSni: node.tuicSni,
        tuicAllowInsecure: node.tuicAllowInsecure,
        tuicDisableSni: node.tuicDisableSni,
      });
      setPluginOptsStr(pluginOptsToString(node.pluginOpts));
      setErrors({});
      setOpenSections(new Set(['basic', 'network']));
    }
  }, [node]);

  const handleClose = (o: boolean) => {
    if (!loading) {
      onOpenChange(o);
    }
  };

  const isShadowsocks = node?.protocol === 'shadowsocks';
  const isTrojan = node?.protocol === 'trojan';
  const isVless = node?.protocol === 'vless';
  const isVmess = node?.protocol === 'vmess';
  const isHysteria2 = node?.protocol === 'hysteria2';
  const isTuic = node?.protocol === 'tuic';

  // Trojan transport fields
  const showWsFields = isTrojan && formData.transportProtocol === 'ws';
  const showGrpcFields = isTrojan && formData.transportProtocol === 'grpc';

  // VLESS transport fields
  const showVlessWsFields = isVless && (formData.vlessTransportType === 'ws' || formData.vlessTransportType === 'h2');
  const showVlessGrpcFields = isVless && formData.vlessTransportType === 'grpc';
  const showVlessRealityFields = isVless && formData.vlessSecurity === 'reality';

  // VMess transport fields
  const showVmessWsFields = isVmess && (formData.vmessTransportType === 'ws' || formData.vmessTransportType === 'http');
  const showVmessGrpcFields = isVmess && formData.vmessTransportType === 'grpc';

  const handleChange = (field: keyof UpdateNodeRequest | 'tagsInput', value: string | number | boolean | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handlePluginOptsChange = (value: string) => {
    setPluginOptsStr(value);
    const parsedOpts = stringToPluginOpts(value);
    setFormData((prev) => ({ ...prev, pluginOpts: parsedOpts }));
  };

  const handleRouteChange = (route: RouteConfig | undefined) => {
    setFormData((prev) => ({ ...prev, route }));
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!node) return;

    const updates: UpdateNodeRequest = {};
    const newErrors: Record<string, string> = {};

    const hasStringChanged = (newValue: string | undefined, oldValue: string | undefined): boolean => {
      const normalizedNew = (newValue || '').trim();
      const normalizedOld = (oldValue || '').trim();
      return normalizedNew !== normalizedOld;
    };

    if (formData.name !== undefined && hasStringChanged(formData.name, node.name)) {
      const trimmedName = formData.name.trim();
      if (!trimmedName) {
        newErrors.name = t('admin.nodes.form.validation.nameRequired');
      } else {
        updates.name = trimmedName;
      }
    }

    if (formData.serverAddress !== undefined && hasStringChanged(formData.serverAddress, node.serverAddress)) {
      updates.serverAddress = formData.serverAddress.trim();
    }

    if (formData.agentPort !== node.agentPort && formData.agentPort !== undefined) {
      if (formData.agentPort < 1 || formData.agentPort > 65535) {
        newErrors.agentPort = t('admin.nodes.form.validation.portRange');
      } else {
        updates.agentPort = formData.agentPort;
      }
    }

    if (formData.subscriptionPort !== node.subscriptionPort && formData.subscriptionPort !== undefined) {
      if (formData.subscriptionPort < 1 || formData.subscriptionPort > 65535) {
        newErrors.subscriptionPort = t('admin.nodes.form.validation.portRange');
      } else {
        updates.subscriptionPort = formData.subscriptionPort;
      }
    }

    if (formData.encryptionMethod !== node.encryptionMethod && formData.encryptionMethod !== undefined) {
      updates.encryptionMethod = formData.encryptionMethod;
    }

    if (isShadowsocks) {
      if (formData.plugin !== undefined && hasStringChanged(formData.plugin, node.plugin)) {
        updates.plugin = formData.plugin.trim() || undefined;
      }
      if (!arePluginOptsEqual(formData.pluginOpts, node.pluginOpts)) {
        updates.pluginOpts = formData.pluginOpts;
      }
    }

    if (formData.region !== undefined && hasStringChanged(formData.region, node.region)) {
      updates.region = formData.region.trim() || undefined;
    }

    if (formData.status !== node.status && formData.status !== undefined) {
      updates.status = formData.status;
    }

    if (formData.sortOrder !== node.sortOrder && formData.sortOrder !== undefined) {
      updates.sortOrder = formData.sortOrder;
    }

    if (isTrojan) {
      if (formData.transportProtocol !== node.transportProtocol && formData.transportProtocol !== undefined) {
        updates.transportProtocol = formData.transportProtocol;
      }
      if (formData.sni !== undefined && hasStringChanged(formData.sni, node.sni)) {
        updates.sni = formData.sni?.trim() || undefined;
      }
      if (formData.host !== undefined && hasStringChanged(formData.host, node.host)) {
        updates.host = formData.host?.trim() || undefined;
      }
      if (formData.path !== undefined && hasStringChanged(formData.path, node.path)) {
        updates.path = formData.path?.trim() || undefined;
      }
      if (formData.allowInsecure !== node.allowInsecure && formData.allowInsecure !== undefined) {
        updates.allowInsecure = formData.allowInsecure;
      }
    }

    // Resource group association - only send if changed
    const originalGroupSids = node.groupSids ?? [];
    const newGroupSids = formData.groupSids ?? [];
    const groupSidsChanged = JSON.stringify([...newGroupSids].sort()) !== JSON.stringify([...originalGroupSids].sort());
    if (groupSidsChanged) {
      updates.groupSids = newGroupSids;
    }

    const newTags = formData.tagsInput
      ? formData.tagsInput.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
      : [];
    const originalTags = node.tags ?? [];
    const tagsChanged = JSON.stringify(newTags.sort()) !== JSON.stringify([...originalTags].sort());
    if (tagsChanged) {
      updates.tags = newTags.length > 0 ? newTags : undefined;
    }

    const routeChanged = JSON.stringify(formData.route) !== JSON.stringify(node.route);
    if (routeChanged) {
      updates.route = formData.route === undefined ? null : formData.route;
    }

    if (formData.muteNotification !== node.muteNotification) {
      updates.muteNotification = formData.muteNotification;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    if (Object.keys(updates).length > 0) {
      setLoading(true);
      try {
        await onSubmit(node.id, updates);
        onOpenChange(false);
      } finally {
        setLoading(false);
      }
    }
  };

  const hasChanges = node && Object.keys(formData).some(
    (key) => formData[key as keyof UpdateNodeRequest] !== node[key as keyof Node]
  );

  const getHasProtocolSettings = () => {
    if (isShadowsocks) {
      return Boolean(formData.plugin || pluginOptsStr);
    }
    if (isTrojan) {
      return Boolean(formData.sni || formData.host || formData.path || formData.allowInsecure);
    }
    if (isVless) {
      return Boolean(formData.vlessSni || formData.vlessHost || formData.vlessPath || formData.vlessFlow);
    }
    if (isVmess) {
      return Boolean(formData.vmessSni || formData.vmessHost || formData.vmessPath);
    }
    if (isHysteria2) {
      return Boolean(formData.hysteria2Sni || formData.hysteria2Obfs || formData.hysteria2UpMbps);
    }
    if (isTuic) {
      return Boolean(formData.tuicSni || formData.tuicAlpn);
    }
    return false;
  };
  const hasProtocolSettings = getHasProtocolSettings();

  if (!node) return null;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t('admin.nodes.form.editNode')}</SheetTitle>
          <SheetDescription>
            {t('admin.nodes.form.editNodeDesc', { name: node.name })}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="py-4 space-y-3">
          {/* Basic Info Section */}
          <MobileSection
            title={t('common.sections.basicInfo')}
            icon={Server}
            isOpen={openSections.has('basic')}
            onToggle={() => toggleSection('basic')}
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <FormFieldLabel label={t('admin.nodes.form.nodeId')} hint={t('admin.nodes.form.protocolCannotChange')} />
                <MobileFormInput value={node.id} disabled className="font-mono bg-muted" />
              </div>

              <div className="space-y-1.5">
                <FormFieldLabel label={t('admin.nodes.form.nodeName')} />
                <MobileFormInput
                  value={formData.name || ''}
                  onChange={(value) => handleChange('name', value)}
                  error={errors.name}
                />
              </div>

              <div className="space-y-1.5">
                <FormFieldLabel label={t('admin.nodes.form.protocolType')} hint={t('admin.nodes.form.protocolCannotChange')} />
                <MobileFormInput
                  value={PROTOCOL_CONFIG[node.protocol]?.name || node.protocol}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-1.5">
                <FormFieldLabel label={t('common.status.label')} />
                <MobileSelect
                  value={formData.status || 'inactive'}
                  onChange={(value) => handleChange('status', value)}
                  options={statusOptions}
                />
              </div>

              {isShadowsocks && (
                <div className="space-y-1.5">
                  <FormFieldLabel label={t('admin.nodes.form.encryptionMethod')} />
                  <MobileSelect
                    value={formData.encryptionMethod || ''}
                    onChange={(value) => handleChange('encryptionMethod', value)}
                    options={SS_ENCRYPTION_METHODS.map((method) => ({
                      value: method,
                      label: method,
                    }))}
                  />
                </div>
              )}

              {isTrojan && (
                <div className="space-y-1.5">
                  <FormFieldLabel label={t('admin.nodes.form.transportProtocol')} />
                  <MobileSelect
                    value={formData.transportProtocol || 'tcp'}
                    onChange={(value) => handleChange('transportProtocol', value)}
                    options={TRANSPORT_PROTOCOLS.map((protocol) => ({
                      value: protocol,
                      label: protocol.toUpperCase(),
                    }))}
                  />
                </div>
              )}

              {isVless && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <FormFieldLabel label={t('admin.nodes.form.transportProtocol')} />
                    <MobileSelect
                      value={formData.vlessTransportType || 'tcp'}
                      onChange={(value) => handleChange('vlessTransportType', value as TransportProtocol)}
                      options={VLESS_TRANSPORT_PROTOCOLS.map((p) => ({
                        value: p,
                        label: p.toUpperCase(),
                      }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FormFieldLabel label={t('admin.nodes.form.securityType')} />
                    <MobileSelect
                      value={formData.vlessSecurity || 'tls'}
                      onChange={(value) => handleChange('vlessSecurity', value as VLESSSecurity)}
                      options={vlessSecurityOptions}
                    />
                  </div>
                </div>
              )}

              {isVmess && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <FormFieldLabel label={t('admin.nodes.form.transportProtocol')} />
                    <MobileSelect
                      value={formData.vmessTransportType || 'tcp'}
                      onChange={(value) => handleChange('vmessTransportType', value as TransportProtocol)}
                      options={VMESS_TRANSPORT_PROTOCOLS.map((p) => ({
                        value: p,
                        label: p.toUpperCase(),
                      }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FormFieldLabel label={t('admin.nodes.form.encryptionMethod')} />
                    <MobileSelect
                      value={formData.vmessSecurity || 'auto'}
                      onChange={(value) => handleChange('vmessSecurity', value as VMessSecurity)}
                      options={vmessSecurityOptions}
                    />
                  </div>
                </div>
              )}

              {isHysteria2 && (
                <div className="space-y-1.5">
                  <FormFieldLabel label={t('admin.nodes.form.congestionControl')} />
                  <MobileSelect
                    value={formData.hysteria2CongestionControl || 'bbr'}
                    onChange={(value) => handleChange('hysteria2CongestionControl', value as CongestionControl)}
                    options={congestionControlOptions}
                  />
                </div>
              )}

              {isTuic && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <FormFieldLabel label={t('admin.nodes.form.congestionControl')} />
                    <MobileSelect
                      value={formData.tuicCongestionControl || 'bbr'}
                      onChange={(value) => handleChange('tuicCongestionControl', value as CongestionControl)}
                      options={congestionControlOptions}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FormFieldLabel label={t('admin.nodes.form.udpRelayMode')} />
                    <MobileSelect
                      value={formData.tuicUdpRelayMode || 'native'}
                      onChange={(value) => handleChange('tuicUdpRelayMode', value as TUICUDPRelayMode)}
                      options={udpRelayModeOptions}
                    />
                  </div>
                </div>
              )}
            </div>
          </MobileSection>

          {/* Network Section */}
          <MobileSection
            title={t('common.sections.networkConfig')}
            icon={Network}
            isOpen={openSections.has('network')}
            onToggle={() => toggleSection('network')}
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <FormFieldLabel label={t('admin.nodes.form.serverAddress')} />
                <MobileFormInput
                  value={formData.serverAddress || ''}
                  onChange={(value) => handleChange('serverAddress', value)}
                  error={errors.serverAddress}
                  className="font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <FormFieldLabel label={t('admin.nodes.form.agentPort')} />
                  <MobileFormInput
                    type="number"
                    min={1}
                    max={65535}
                    value={formData.agentPort ? String(formData.agentPort) : ''}
                    onChange={(value) => handleChange('agentPort', parseInt(value, 10))}
                    error={errors.agentPort}
                    className="font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <FormFieldLabel label={t('admin.nodes.form.subscriptionPort')} />
                  <MobileFormInput
                    type="number"
                    min={1}
                    max={65535}
                    placeholder={t('admin.nodes.form.subscriptionPortPlaceholder')}
                    value={formData.subscriptionPort !== undefined ? String(formData.subscriptionPort) : ''}
                    onChange={(value) => handleChange('subscriptionPort', value ? parseInt(value, 10) : undefined)}
                    error={errors.subscriptionPort}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
          </MobileSection>

          {/* Protocol Settings Section */}
          <MobileSection
            title={`${PROTOCOL_CONFIG[node.protocol]?.name || node.protocol} ${t('admin.nodes.form.config')}`}
            icon={PROTOCOL_CONFIG[node.protocol]?.icon || Shield}
            badge={hasProtocolSettings ? t('admin.nodes.form.configured') : null}
            isOpen={openSections.has('protocol')}
            onToggle={() => toggleSection('protocol')}
          >
            <div className="space-y-4">
              {isShadowsocks && (
                <>
                  <div className="space-y-1.5">
                    <FormFieldLabel label={t('admin.nodes.form.plugin')} hint={t('admin.nodes.form.pluginHint')} />
                    <MobileFormInput
                      placeholder="obfs-local"
                      value={formData.plugin || ''}
                      onChange={(value) => handleChange('plugin', value)}
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <FormFieldLabel label={t('admin.nodes.form.pluginOptions')} hint={t('admin.nodes.form.pluginOptionsHint')} />
                    <MobileFormInput
                      placeholder="obfs=http;obfs-host=www.bing.com"
                      value={pluginOptsStr}
                      onChange={handlePluginOptsChange}
                      className="font-mono"
                    />
                  </div>
                </>
              )}

              {isTrojan && (
                <>
                  <div className="space-y-1.5">
                    <FormFieldLabel label={t('admin.nodes.form.fields.sni')} hint={t('admin.nodes.form.sniHint')} />
                    <MobileFormInput
                      placeholder="example.com"
                      value={formData.sni || ''}
                      onChange={(value) => handleChange('sni', value)}
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <FormFieldLabel label={t('admin.nodes.form.tlsSecurity')} hint={t('admin.nodes.form.tlsSecurityHint')} />
                    <MobileSelect
                      value={formData.allowInsecure ? 'true' : 'false'}
                      onChange={(value) => handleChange('allowInsecure', value === 'true')}
                      options={tlsSecurityOptions}
                    />
                  </div>

                  {showWsFields && (
                    <>
                      <div className="space-y-1.5">
                        <FormFieldLabel label={t('admin.nodes.form.fields.host')} hint={t('admin.nodes.form.hints.wsHostHeader')} />
                        <MobileFormInput
                          placeholder="example.com"
                          value={formData.host || ''}
                          onChange={(value) => handleChange('host', value)}
                          className="font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <FormFieldLabel label={t('admin.nodes.form.fields.path')} hint={t('admin.nodes.form.wsPathHint')} />
                        <MobileFormInput
                          placeholder="/path"
                          value={formData.path || ''}
                          onChange={(value) => handleChange('path', value)}
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
                        value={formData.host || ''}
                        onChange={(value) => handleChange('host', value)}
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
                        value={formData.vlessSni || ''}
                        onChange={(value) => handleChange('vlessSni', value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label={t('admin.nodes.form.tlsVerify')} />
                      <MobileSelect
                        value={formData.vlessAllowInsecure ? 'true' : 'false'}
                        onChange={(value) => handleChange('vlessAllowInsecure', value === 'true')}
                        options={tlsSecurityOptions}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FormFieldLabel label={t('admin.nodes.form.fields.flow')} hint={t('admin.nodes.form.flowHint')} />
                      <MobileFormInput
                        placeholder="xtls-rprx-vision"
                        value={formData.vlessFlow || ''}
                        onChange={(value) => handleChange('vlessFlow', value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label={t('admin.nodes.form.fingerprintHint')} />
                      <MobileSelect
                        value={formData.vlessFingerprint || '__none__'}
                        onChange={(value) => handleChange('vlessFingerprint', value === '__none__' ? '' : value)}
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
                          value={formData.vlessHost || ''}
                          onChange={(value) => handleChange('vlessHost', value)}
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <FormFieldLabel label={t('admin.nodes.form.fields.path')} hint={t('admin.nodes.form.wsH2PathHint')} />
                        <MobileFormInput
                          placeholder="/ws"
                          value={formData.vlessPath || ''}
                          onChange={(value) => handleChange('vlessPath', value)}
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
                        value={formData.vlessServiceName || ''}
                        onChange={(value) => handleChange('vlessServiceName', value)}
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
                            value={formData.vlessRealityPublicKey || ''}
                            onChange={(value) => handleChange('vlessRealityPublicKey', value)}
                            className="font-mono text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <FormFieldLabel label={t('admin.nodes.form.fields.shortId')} />
                          <MobileFormInput
                            placeholder={t('admin.nodes.form.shortIdPlaceholder')}
                            value={formData.vlessRealityShortId || ''}
                            onChange={(value) => handleChange('vlessRealityShortId', value)}
                            className="font-mono"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <FormFieldLabel label={t('admin.nodes.form.fields.spiderX')} hint={t('common.optional')} />
                        <MobileFormInput
                          placeholder="/"
                          value={formData.vlessRealitySpiderX || ''}
                          onChange={(value) => handleChange('vlessRealitySpiderX', value)}
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
                        onChange={(value) => handleChange('vmessAlterId', parseInt(value, 10) || 0)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label={t('admin.nodes.form.fields.tls')} />
                      <MobileSelect
                        value={formData.vmessTls ? 'true' : 'false'}
                        onChange={(value) => handleChange('vmessTls', value === 'true')}
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
                        value={formData.vmessSni || ''}
                        onChange={(value) => handleChange('vmessSni', value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label={t('admin.nodes.form.tlsVerify')} />
                      <MobileSelect
                        value={formData.vmessAllowInsecure ? 'true' : 'false'}
                        onChange={(value) => handleChange('vmessAllowInsecure', value === 'true')}
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
                          value={formData.vmessHost || ''}
                          onChange={(value) => handleChange('vmessHost', value)}
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <FormFieldLabel label={t('admin.nodes.form.fields.path')} hint={t('admin.nodes.form.wsHttpPathHint')} />
                        <MobileFormInput
                          placeholder="/ws"
                          value={formData.vmessPath || ''}
                          onChange={(value) => handleChange('vmessPath', value)}
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
                        value={formData.vmessServiceName || ''}
                        onChange={(value) => handleChange('vmessServiceName', value)}
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
                        value={formData.hysteria2Sni || ''}
                        onChange={(value) => handleChange('hysteria2Sni', value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label={t('admin.nodes.form.tlsVerify')} />
                      <MobileSelect
                        value={formData.hysteria2AllowInsecure ? 'true' : 'false'}
                        onChange={(value) => handleChange('hysteria2AllowInsecure', value === 'true')}
                        options={tlsSecurityOptions}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FormFieldLabel label={t('admin.nodes.form.obfsType')} hint={t('admin.nodes.form.obfsTypeHint')} />
                      <MobileFormInput
                        placeholder="salamander"
                        value={formData.hysteria2Obfs || ''}
                        onChange={(value) => handleChange('hysteria2Obfs', value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label={t('admin.nodes.form.obfsPassword')} />
                      <MobileFormInput
                        placeholder={t('common.placeholders.password')}
                        value={formData.hysteria2ObfsPassword || ''}
                        onChange={(value) => handleChange('hysteria2ObfsPassword', value)}
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
                        onChange={(value) => handleChange('hysteria2UpMbps', value ? parseInt(value, 10) : undefined)}
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
                        onChange={(value) => handleChange('hysteria2DownMbps', value ? parseInt(value, 10) : undefined)}
                        className="font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <FormFieldLabel label={t('admin.nodes.form.fingerprintHint')} />
                    <MobileSelect
                      value={formData.hysteria2Fingerprint || '__none__'}
                      onChange={(value) => handleChange('hysteria2Fingerprint', value === '__none__' ? '' : value)}
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
                        value={formData.tuicSni || ''}
                        onChange={(value) => handleChange('tuicSni', value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label={t('admin.nodes.form.tlsVerify')} />
                      <MobileSelect
                        value={formData.tuicAllowInsecure ? 'true' : 'false'}
                        onChange={(value) => handleChange('tuicAllowInsecure', value === 'true')}
                        options={tlsSecurityOptions}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FormFieldLabel label={t('admin.nodes.form.fields.alpn')} hint={t('admin.nodes.form.alpnHint')} />
                      <MobileFormInput
                        placeholder="h3"
                        value={formData.tuicAlpn || ''}
                        onChange={(value) => handleChange('tuicAlpn', value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label={t('admin.nodes.form.disableSni')} />
                      <MobileSelect
                        value={formData.tuicDisableSni ? 'true' : 'false'}
                        onChange={(value) => handleChange('tuicDisableSni', value === 'true')}
                        options={[
                          { value: 'false', label: t('admin.nodes.form.notDisabled') },
                          { value: 'true', label: t('admin.nodes.form.disableSniOption') },
                        ]}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </MobileSection>

          {/* Other Settings Section */}
          <MobileSection
            title={t('admin.nodes.form.section.otherSettings')}
            icon={Settings}
            isOpen={openSections.has('other')}
            onToggle={() => toggleSection('other')}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <FormFieldLabel label={t('admin.nodes.form.region')} />
                  <MobileFormInput
                    value={formData.region || ''}
                    onChange={(value) => handleChange('region', value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <FormFieldLabel label={t('common.fields.sortOrder')} />
                  <MobileFormInput
                    type="number"
                    value={String(formData.sortOrder ?? 0)}
                    onChange={(value) => handleChange('sortOrder', parseInt(value, 10) || 0)}
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <FormFieldLabel label={t('admin.nodes.form.tags')} hint={t('admin.nodes.form.tagsHint')} />
                <MobileFormInput
                  placeholder={t('admin.nodes.form.tagsPlaceholder')}
                  value={formData.tagsInput ?? ''}
                  onChange={(value) => handleChange('tagsInput', value)}
                />
              </div>

              <div className="space-y-1.5">
                <FormFieldLabel label={t('admin.nodes.form.resourceGroup')} hint={t('admin.nodes.form.resourceGroupSelectHint')} />

                {/* Selected groups chips */}
                {formData.groupSids.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {formData.groupSids.map((sid) => {
                      const group = filteredResourceGroups.find((g) => g.sid === sid);
                      return (
                        <Badge key={sid} variant="secondary" className="gap-1 pr-1">
                          <Layers className="size-3" />
                          {group?.name ?? sid}
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({
                              ...prev,
                              groupSids: prev.groupSids.filter((id) => id !== sid),
                            }))}
                            className="ml-0.5 rounded-full p-1 hover:bg-muted min-w-[28px] min-h-[28px] flex items-center justify-center"
                          >
                            <X className="size-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}

                {/* Group selection list */}
                <div className="ring-1 ring-border rounded-xl max-h-[150px] overflow-y-auto bg-background">
                  {isLoadingGroups || isLoadingPlans ? (
                    <div className="p-3 text-center text-sm text-muted-foreground">{t('common.table.loading')}</div>
                  ) : filteredResourceGroups.length === 0 ? (
                    <div className="p-3 text-center text-sm text-muted-foreground">{t('admin.nodes.detail.noResourceGroups')}</div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {filteredResourceGroups.map((group) => (
                        <label
                          key={group.sid}
                          className="flex items-center gap-3 p-3 active:bg-accent/30 transition-colors min-h-[52px]"
                        >
                          <Checkbox
                            checked={formData.groupSids.includes(group.sid)}
                            onCheckedChange={(checked) => {
                              setFormData((prev) => ({
                                ...prev,
                                groupSids: checked
                                  ? [...prev.groupSids, group.sid]
                                  : prev.groupSids.filter((id) => id !== group.sid),
                              }));
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{group.name}</span>
                              <Badge variant={group.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                                {group.status === 'active' ? t('common.status.active') : t('common.status.inactive')}
                              </Badge>
                            </div>
                            {group.description && <p className="text-xs text-muted-foreground truncate">{group.description}</p>}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <FormFieldLabel label={t('admin.nodes.form.muteNotification')} hint={t('admin.nodes.form.muteNotificationHint')} />
                <div className="flex items-center gap-3 min-h-[52px] px-4 rounded-xl ring-1 ring-border bg-background">
                  <Switch
                    checked={formData.muteNotification ?? false}
                    onCheckedChange={(checked) => handleChange('muteNotification', checked)}
                  >
                    <SwitchThumb />
                  </Switch>
                  <span className="text-sm text-muted-foreground">
                    {formData.muteNotification ? t('admin.nodes.form.muted') : t('admin.nodes.form.unmuted')}
                  </span>
                </div>
              </div>
            </div>
          </MobileSection>

          {/* Route Config Section */}
          <MobileSection
            title={t('admin.nodes.form.section.routeConfig')}
            icon={Route}
            badge={formData.route ? t('admin.nodes.form.configured') : null}
            isOpen={openSections.has('route')}
            onToggle={() => toggleSection('route')}
          >
            <RouteConfigEditor
              value={formData.route ?? undefined}
              onChange={handleRouteChange}
              idPrefix="edit-node-sheet-route"
              nodes={nodes}
              currentNodeId={node?.id}
            />
          </MobileSection>
        </SheetBody>

        <SheetFooter>
          <div className="flex gap-2 w-full">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !hasChanges}
              className={cn(
                'flex-1 flex items-center justify-center',
                'h-11 rounded-xl',
                'bg-primary text-primary-foreground',
                'text-sm font-medium',
                'active:scale-[0.98] active:opacity-80 transition-all',
                'disabled:opacity-50'
              )}
            >
              {loading ? t('common.loading.saving') : t('common.actions.save')}
            </button>
            <button
              type="button"
              onClick={() => handleClose(false)}
              disabled={loading}
              className={cn(
                'flex-1 flex items-center justify-center',
                'h-11 rounded-xl',
                'ring-1 ring-border bg-background text-foreground',
                'text-sm font-medium',
                'active:scale-[0.98] active:opacity-80 transition-all',
                'disabled:opacity-50'
              )}
            >
              {t('common.actions.cancel')}
            </button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
