/**
 * Edit Node Sheet Component
 * Mobile-optimized bottom sheet for editing nodes
 */

import { useState, useEffect, useMemo } from 'react';
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
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Separator } from '@/components/common/Separator';
import { Switch, SwitchThumb } from '@/components/common/Switch';
import { Checkbox } from '@/components/common/Checkbox';
import { MobileFormInput, MobileSelect, type MobileSelectOption } from '@/components/common/mobile-form';
import { useResourceGroups } from '@/features/resource-groups/hooks/useResourceGroups';
import { useSubscriptionPlans } from '@/features/subscription-plans/hooks/useSubscriptionPlans';
import { RouteConfigEditor } from './RouteConfigEditor';
import { cn } from '@/lib/utils';
import type { OutboundNodeOption } from './RouteRuleEditor';
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

// Status options for MobileSelect
const STATUS_OPTIONS: MobileSelectOption[] = [
  { value: 'active', label: '激活', color: 'bg-emerald-500' },
  { value: 'inactive', label: '未激活', color: 'bg-gray-400' },
  { value: 'maintenance', label: '维护中', color: 'bg-amber-500' },
];

// TLS security options for MobileSelect
const TLS_SECURITY_OPTIONS: MobileSelectOption[] = [
  { value: 'false', label: '验证证书（安全）' },
  { value: 'true', label: '跳过验证（不安全）' },
];

// VLESS transport protocols
const VLESS_TRANSPORT_PROTOCOLS: TransportProtocol[] = ['tcp', 'ws', 'grpc', 'h2'];

// VLESS security types
const VLESS_SECURITY_OPTIONS: { value: VLESSSecurity; label: string }[] = [
  { value: 'tls', label: 'TLS' },
  { value: 'reality', label: 'Reality' },
  { value: 'none', label: '无' },
];

// VMess transport protocols
const VMESS_TRANSPORT_PROTOCOLS: TransportProtocol[] = ['tcp', 'ws', 'grpc', 'http', 'quic'];

// VMess security types
const VMESS_SECURITY_OPTIONS: { value: VMessSecurity; label: string }[] = [
  { value: 'auto', label: 'Auto (推荐)' },
  { value: 'aes-128-gcm', label: 'AES-128-GCM' },
  { value: 'chacha20-poly1305', label: 'ChaCha20-Poly1305' },
  { value: 'none', label: '无' },
  { value: 'zero', label: 'Zero' },
];

// Congestion control algorithms
const CONGESTION_CONTROL_OPTIONS: { value: CongestionControl; label: string }[] = [
  { value: 'bbr', label: 'BBR (推荐)' },
  { value: 'cubic', label: 'Cubic' },
  { value: 'new_reno', label: 'New Reno' },
];

// TUIC UDP relay modes
const TUIC_UDP_RELAY_MODES: { value: TUICUDPRelayMode; label: string }[] = [
  { value: 'native', label: 'Native' },
  { value: 'quic', label: 'QUIC' },
];

// TLS fingerprint options
const TLS_FINGERPRINT_OPTIONS: MobileSelectOption[] = [
  { value: 'chrome', label: 'Chrome' },
  { value: 'firefox', label: 'Firefox' },
  { value: 'safari', label: 'Safari' },
  { value: 'edge', label: 'Edge' },
  { value: 'random', label: '随机' },
];

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

// Mobile Collapsible Section
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
  <div className="border border-border rounded-xl overflow-hidden bg-card">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 text-left active:bg-accent/30 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'p-2 rounded-lg transition-colors',
          isOpen ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
        )}>
          <Icon className="size-4" strokeWidth={1.5} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          {badge && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {badge}
            </Badge>
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
      <div className="px-4 pb-4">
        <Separator className="mb-4" />
        {children}
      </div>
    </div>
  </div>
);

// Form Field Label with optional hint
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
  <div className="space-y-0.5 px-1">
    <label className="text-sm font-medium">{label}</label>
    {hint && showHint && (
      <p className="text-xs text-muted-foreground">{hint}</p>
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
        groupSids: node.groupIds ?? [],
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
        newErrors.name = '节点名称不能为空';
      } else {
        updates.name = trimmedName;
      }
    }

    if (formData.serverAddress !== undefined && hasStringChanged(formData.serverAddress, node.serverAddress)) {
      updates.serverAddress = formData.serverAddress.trim();
    }

    if (formData.agentPort !== node.agentPort && formData.agentPort !== undefined) {
      if (formData.agentPort < 1 || formData.agentPort > 65535) {
        newErrors.agentPort = '端口必须在1-65535之间';
      } else {
        updates.agentPort = formData.agentPort;
      }
    }

    if (formData.subscriptionPort !== node.subscriptionPort && formData.subscriptionPort !== undefined) {
      if (formData.subscriptionPort < 1 || formData.subscriptionPort > 65535) {
        newErrors.subscriptionPort = '端口必须在1-65535之间';
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
    const originalGroupSids = node.groupIds ?? [];
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
          <SheetTitle className="flex items-center gap-2">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Server className="size-5 text-primary" />
            </div>
            <span>编辑节点</span>
          </SheetTitle>
          <SheetDescription>
            修改节点 {node.name} 的配置
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="py-4 space-y-3">
          {/* Basic Info Section */}
          <MobileSection
            title="基本信息"
            icon={Server}
            isOpen={openSections.has('basic')}
            onToggle={() => toggleSection('basic')}
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <FormFieldLabel label="节点ID" hint="不可修改" />
                <MobileFormInput value={node.id} disabled className="font-mono bg-muted" />
              </div>

              <div className="space-y-1.5">
                <FormFieldLabel label="节点名称" />
                <MobileFormInput
                  value={formData.name || ''}
                  onChange={(value) => handleChange('name', value)}
                  error={errors.name}
                />
              </div>

              <div className="space-y-1.5">
                <FormFieldLabel label="协议类型" hint="创建后不可修改" />
                <MobileFormInput
                  value={PROTOCOL_CONFIG[node.protocol]?.name || node.protocol}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-1.5">
                <FormFieldLabel label="状态" />
                <MobileSelect
                  value={formData.status || 'inactive'}
                  onChange={(value) => handleChange('status', value)}
                  options={STATUS_OPTIONS}
                />
              </div>

              {isShadowsocks && (
                <div className="space-y-1.5">
                  <FormFieldLabel label="加密方法" />
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
                  <FormFieldLabel label="传输协议" />
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
                    <FormFieldLabel label="传输协议" />
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
                    <FormFieldLabel label="安全类型" />
                    <MobileSelect
                      value={formData.vlessSecurity || 'tls'}
                      onChange={(value) => handleChange('vlessSecurity', value as VLESSSecurity)}
                      options={VLESS_SECURITY_OPTIONS}
                    />
                  </div>
                </div>
              )}

              {isVmess && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <FormFieldLabel label="传输协议" />
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
                    <FormFieldLabel label="加密方式" />
                    <MobileSelect
                      value={formData.vmessSecurity || 'auto'}
                      onChange={(value) => handleChange('vmessSecurity', value as VMessSecurity)}
                      options={VMESS_SECURITY_OPTIONS}
                    />
                  </div>
                </div>
              )}

              {isHysteria2 && (
                <div className="space-y-1.5">
                  <FormFieldLabel label="拥塞控制" />
                  <MobileSelect
                    value={formData.hysteria2CongestionControl || 'bbr'}
                    onChange={(value) => handleChange('hysteria2CongestionControl', value as CongestionControl)}
                    options={CONGESTION_CONTROL_OPTIONS}
                  />
                </div>
              )}

              {isTuic && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <FormFieldLabel label="拥塞控制" />
                    <MobileSelect
                      value={formData.tuicCongestionControl || 'bbr'}
                      onChange={(value) => handleChange('tuicCongestionControl', value as CongestionControl)}
                      options={CONGESTION_CONTROL_OPTIONS}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FormFieldLabel label="UDP 中继" />
                    <MobileSelect
                      value={formData.tuicUdpRelayMode || 'native'}
                      onChange={(value) => handleChange('tuicUdpRelayMode', value as TUICUDPRelayMode)}
                      options={TUIC_UDP_RELAY_MODES}
                    />
                  </div>
                </div>
              )}
            </div>
          </MobileSection>

          {/* Network Section */}
          <MobileSection
            title="网络配置"
            icon={Network}
            isOpen={openSections.has('network')}
            onToggle={() => toggleSection('network')}
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <FormFieldLabel label="服务器地址" />
                <MobileFormInput
                  value={formData.serverAddress || ''}
                  onChange={(value) => handleChange('serverAddress', value)}
                  error={errors.serverAddress}
                  className="font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <FormFieldLabel label="代理端口" />
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
                  <FormFieldLabel label="订阅端口" />
                  <MobileFormInput
                    type="number"
                    min={1}
                    max={65535}
                    placeholder="默认使用代理端口"
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
            title={`${PROTOCOL_CONFIG[node.protocol]?.name || node.protocol} 配置`}
            icon={PROTOCOL_CONFIG[node.protocol]?.icon || Shield}
            badge={hasProtocolSettings ? '已配置' : null}
            isOpen={openSections.has('protocol')}
            onToggle={() => toggleSection('protocol')}
          >
            <div className="space-y-4">
              {isShadowsocks && (
                <>
                  <div className="space-y-1.5">
                    <FormFieldLabel label="插件" hint="可选，如 obfs-local, v2ray-plugin" />
                    <MobileFormInput
                      placeholder="obfs-local"
                      value={formData.plugin || ''}
                      onChange={(value) => handleChange('plugin', value)}
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <FormFieldLabel label="插件选项" hint="格式：key1=value1;key2=value2" />
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
                    <FormFieldLabel label="SNI" hint="TLS 服务器名称" />
                    <MobileFormInput
                      placeholder="example.com"
                      value={formData.sni || ''}
                      onChange={(value) => handleChange('sni', value)}
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <FormFieldLabel label="TLS 安全" hint="自签名证书可跳过验证" />
                    <MobileSelect
                      value={formData.allowInsecure ? 'true' : 'false'}
                      onChange={(value) => handleChange('allowInsecure', value === 'true')}
                      options={TLS_SECURITY_OPTIONS}
                    />
                  </div>

                  {showWsFields && (
                    <>
                      <div className="space-y-1.5">
                        <FormFieldLabel label="Host" hint="WebSocket Host Header" />
                        <MobileFormInput
                          placeholder="example.com"
                          value={formData.host || ''}
                          onChange={(value) => handleChange('host', value)}
                          className="font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <FormFieldLabel label="Path" hint="WebSocket 路径" />
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
                      <FormFieldLabel label="Service Name" hint="gRPC 服务名称" />
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
                      <FormFieldLabel label="SNI" hint="TLS 服务器名称" />
                      <MobileFormInput
                        placeholder="example.com"
                        value={formData.vlessSni || ''}
                        onChange={(value) => handleChange('vlessSni', value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label="TLS 验证" />
                      <MobileSelect
                        value={formData.vlessAllowInsecure ? 'true' : 'false'}
                        onChange={(value) => handleChange('vlessAllowInsecure', value === 'true')}
                        options={TLS_SECURITY_OPTIONS}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FormFieldLabel label="Flow" hint="流控" />
                      <MobileFormInput
                        placeholder="xtls-rprx-vision"
                        value={formData.vlessFlow || ''}
                        onChange={(value) => handleChange('vlessFlow', value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label="指纹" />
                      <MobileSelect
                        value={formData.vlessFingerprint || '__none__'}
                        onChange={(value) => handleChange('vlessFingerprint', value === '__none__' ? '' : value)}
                        options={[{ value: '__none__', label: '无' }, ...TLS_FINGERPRINT_OPTIONS]}
                      />
                    </div>
                  </div>

                  {showVlessWsFields && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <FormFieldLabel label="Host" hint="WS/H2 Host" />
                        <MobileFormInput
                          placeholder="example.com"
                          value={formData.vlessHost || ''}
                          onChange={(value) => handleChange('vlessHost', value)}
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <FormFieldLabel label="Path" hint="WS/H2 路径" />
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
                      <FormFieldLabel label="Service Name" hint="gRPC 服务名称" />
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
                          <FormFieldLabel label="Public Key" hint="Reality 公钥" />
                          <MobileFormInput
                            placeholder="公钥"
                            value={formData.vlessRealityPublicKey || ''}
                            onChange={(value) => handleChange('vlessRealityPublicKey', value)}
                            className="font-mono text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <FormFieldLabel label="Short ID" />
                          <MobileFormInput
                            placeholder="短 ID"
                            value={formData.vlessRealityShortId || ''}
                            onChange={(value) => handleChange('vlessRealityShortId', value)}
                            className="font-mono"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <FormFieldLabel label="Spider X" hint="可选" />
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
                      <FormFieldLabel label="Alter ID" hint="通常为 0" />
                      <MobileFormInput
                        type="number"
                        inputMode="numeric"
                        value={String(formData.vmessAlterId ?? 0)}
                        onChange={(value) => handleChange('vmessAlterId', parseInt(value, 10) || 0)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label="TLS" />
                      <MobileSelect
                        value={formData.vmessTls ? 'true' : 'false'}
                        onChange={(value) => handleChange('vmessTls', value === 'true')}
                        options={[
                          { value: 'true', label: '启用 TLS' },
                          { value: 'false', label: '不启用' },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FormFieldLabel label="SNI" hint="TLS 服务器名称" />
                      <MobileFormInput
                        placeholder="example.com"
                        value={formData.vmessSni || ''}
                        onChange={(value) => handleChange('vmessSni', value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label="TLS 验证" />
                      <MobileSelect
                        value={formData.vmessAllowInsecure ? 'true' : 'false'}
                        onChange={(value) => handleChange('vmessAllowInsecure', value === 'true')}
                        options={TLS_SECURITY_OPTIONS}
                      />
                    </div>
                  </div>

                  {showVmessWsFields && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <FormFieldLabel label="Host" hint="WS/HTTP Host" />
                        <MobileFormInput
                          placeholder="example.com"
                          value={formData.vmessHost || ''}
                          onChange={(value) => handleChange('vmessHost', value)}
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <FormFieldLabel label="Path" hint="WS/HTTP 路径" />
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
                      <FormFieldLabel label="Service Name" hint="gRPC 服务名称" />
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
                      <FormFieldLabel label="SNI" hint="TLS 服务器名称" />
                      <MobileFormInput
                        placeholder="example.com"
                        value={formData.hysteria2Sni || ''}
                        onChange={(value) => handleChange('hysteria2Sni', value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label="TLS 验证" />
                      <MobileSelect
                        value={formData.hysteria2AllowInsecure ? 'true' : 'false'}
                        onChange={(value) => handleChange('hysteria2AllowInsecure', value === 'true')}
                        options={TLS_SECURITY_OPTIONS}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FormFieldLabel label="Obfs 类型" hint="混淆" />
                      <MobileFormInput
                        placeholder="salamander"
                        value={formData.hysteria2Obfs || ''}
                        onChange={(value) => handleChange('hysteria2Obfs', value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label="Obfs 密码" />
                      <MobileFormInput
                        placeholder="密码"
                        value={formData.hysteria2ObfsPassword || ''}
                        onChange={(value) => handleChange('hysteria2ObfsPassword', value)}
                        className="font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FormFieldLabel label="上行 (Mbps)" />
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
                      <FormFieldLabel label="下行 (Mbps)" />
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
                    <FormFieldLabel label="指纹" />
                    <MobileSelect
                      value={formData.hysteria2Fingerprint || '__none__'}
                      onChange={(value) => handleChange('hysteria2Fingerprint', value === '__none__' ? '' : value)}
                      options={[{ value: '__none__', label: '无' }, ...TLS_FINGERPRINT_OPTIONS]}
                    />
                  </div>
                </>
              )}

              {/* TUIC Protocol Settings */}
              {isTuic && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FormFieldLabel label="SNI" hint="TLS 服务器名称" />
                      <MobileFormInput
                        placeholder="example.com"
                        value={formData.tuicSni || ''}
                        onChange={(value) => handleChange('tuicSni', value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label="TLS 验证" />
                      <MobileSelect
                        value={formData.tuicAllowInsecure ? 'true' : 'false'}
                        onChange={(value) => handleChange('tuicAllowInsecure', value === 'true')}
                        options={TLS_SECURITY_OPTIONS}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FormFieldLabel label="ALPN" hint="应用层协议" />
                      <MobileFormInput
                        placeholder="h3"
                        value={formData.tuicAlpn || ''}
                        onChange={(value) => handleChange('tuicAlpn', value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FormFieldLabel label="禁用 SNI" />
                      <MobileSelect
                        value={formData.tuicDisableSni ? 'true' : 'false'}
                        onChange={(value) => handleChange('tuicDisableSni', value === 'true')}
                        options={[
                          { value: 'false', label: '不禁用' },
                          { value: 'true', label: '禁用' },
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
            title="其他设置"
            icon={Settings}
            isOpen={openSections.has('other')}
            onToggle={() => toggleSection('other')}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <FormFieldLabel label="地区" />
                  <MobileFormInput
                    value={formData.region || ''}
                    onChange={(value) => handleChange('region', value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <FormFieldLabel label="排序" />
                  <MobileFormInput
                    type="number"
                    value={String(formData.sortOrder ?? 0)}
                    onChange={(value) => handleChange('sortOrder', parseInt(value, 10) || 0)}
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <FormFieldLabel label="标签" hint="多个标签用逗号分隔" />
                <MobileFormInput
                  placeholder="高速, 香港, 优选"
                  value={formData.tagsInput ?? ''}
                  onChange={(value) => handleChange('tagsInput', value)}
                />
              </div>

              <div className="space-y-1.5">
                <FormFieldLabel label="资源组" hint="将节点关联到一个或多个资源组" />

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
                <div className="border rounded-xl max-h-[150px] overflow-y-auto bg-background">
                  {isLoadingGroups || isLoadingPlans ? (
                    <div className="p-3 text-center text-sm text-muted-foreground">加载中...</div>
                  ) : filteredResourceGroups.length === 0 ? (
                    <div className="p-3 text-center text-sm text-muted-foreground">暂无可用资源组</div>
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
                                {group.status === 'active' ? '激活' : '未激活'}
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
                <FormFieldLabel label="静音通知" hint="开启后将不会发送此节点的上线/下线通知" />
                <div className="flex items-center gap-3 min-h-[52px] px-4 rounded-xl border bg-background">
                  <Switch
                    checked={formData.muteNotification ?? false}
                    onCheckedChange={(checked) => handleChange('muteNotification', checked)}
                  >
                    <SwitchThumb />
                  </Switch>
                  <span className="text-sm text-muted-foreground">
                    {formData.muteNotification ? '已静音' : '未静音'}
                  </span>
                </div>
              </div>
            </div>
          </MobileSection>

          {/* Route Config Section */}
          <MobileSection
            title="路由配置"
            icon={Route}
            badge={formData.route ? '已配置' : null}
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
          <Button
            onClick={handleSubmit}
            disabled={loading || !hasChanges}
            className="w-full min-h-[52px] text-base"
          >
            {loading ? '保存中...' : '保存'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleClose(false)}
            disabled={loading}
            className="w-full min-h-[44px]"
          >
            取消
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
