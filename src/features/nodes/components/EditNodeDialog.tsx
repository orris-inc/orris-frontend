/**
 * Edit node dialog component
 */

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '@/shared/utils/date-utils';
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
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/common/Accordion';
import { Badge } from '@/components/common/Badge';
import { Switch, SwitchThumb } from '@/components/common/Switch';
import { Checkbox } from '@/components/common/Checkbox';
import { Layers, X } from 'lucide-react';
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
import { useResourceGroups } from '@/features/resource-groups/hooks/useResourceGroups';
import { useSubscriptionPlans } from '@/features/subscription-plans/hooks/useSubscriptionPlans';
import { RouteConfigEditor } from './RouteConfigEditor';
import type { OutboundNodeOption } from '../utils/route-rule-utils';

interface EditNodeDialogProps {
  open: boolean;
  node: Node | null;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateNodeRequest) => void;
  /** Available nodes for route outbound selection */
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

// VLESS transport protocols
const VLESS_TRANSPORT_PROTOCOLS: TransportProtocol[] = ['tcp', 'ws', 'grpc', 'h2'];

// VLESS security types
const VLESS_SECURITY_OPTIONS: VLESSSecurity[] = ['none', 'tls', 'reality'];

// VMess security types
const VMESS_SECURITY_OPTIONS: VMessSecurity[] = ['auto', 'aes-128-gcm', 'chacha20-poly1305', 'none', 'zero'];

// VMess transport protocols
const VMESS_TRANSPORT_PROTOCOLS: TransportProtocol[] = ['tcp', 'ws', 'grpc', 'http', 'quic'];

// Congestion control algorithms
const CONGESTION_CONTROL_OPTIONS: CongestionControl[] = ['cubic', 'bbr', 'new_reno'];

// TUIC UDP relay modes
const TUIC_UDP_RELAY_MODES: TUICUDPRelayMode[] = ['native', 'quic'];

// TLS fingerprint options
const TLS_FINGERPRINT_OPTIONS = ['chrome', 'firefox', 'safari', 'edge', 'random'] as const;

// Protocol display names
const PROTOCOL_NAMES: Record<NodeProtocol, string> = {
  shadowsocks: 'Shadowsocks',
  trojan: 'Trojan',
  vless: 'VLESS',
  vmess: 'VMess',
  hysteria2: 'Hysteria2',
  tuic: 'TUIC',
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
    const value = valueParts.join('=').trim(); // Support '=' in values

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
  // Both are empty
  if ((!opts1 || Object.keys(opts1).length === 0) &&
      (!opts2 || Object.keys(opts2).length === 0)) {
    return true;
  }

  // One is empty, one is not
  if (!opts1 || !opts2) return false;

  const keys1 = Object.keys(opts1);
  const keys2 = Object.keys(opts2);

  if (keys1.length !== keys2.length) return false;

  return keys1.every(key => opts1[key] === opts2[key]);
};


export const EditNodeDialog: React.FC<EditNodeDialogProps> = ({
  open,
  node,
  onClose,
  onSubmit,
  nodes = [],
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>({ tagsInput: '', groupSids: [] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pluginOptsStr, setPluginOptsStr] = useState<string>('');

  // Fetch resource groups list
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
        // Shadowsocks plugin related fields
        plugin: node.plugin,
        pluginOpts: node.pluginOpts,
        // Trojan related fields
        transportProtocol: node.transportProtocol,
        host: node.host,
        path: node.path,
        sni: node.sni,
        allowInsecure: node.allowInsecure,
        // Route configuration
        route: node.route,
        // Resource groups
        groupSids: node.groupSids ?? [],
        // Notification setting
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
    }
  }, [node]);

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
    if (errors.pluginOpts) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.pluginOpts;
        return newErrors;
      });
    }
  };

  const handleRouteChange = (route: RouteConfig | undefined) => {
    setFormData((prev) => ({ ...prev, route }));
  };

  const handleSubmit = () => {
    if (!node) return;

    // Build update object to submit
    const updates: UpdateNodeRequest = {};
    const newErrors: Record<string, string> = {};

    // Helper function: normalize strings for comparison (compare after trim, treat empty string and undefined as same)
    const hasStringChanged = (newValue: string | undefined, oldValue: string | undefined): boolean => {
      const normalizedNew = (newValue || '').trim();
      const normalizedOld = (oldValue || '').trim();
      return normalizedNew !== normalizedOld;
    };

    // Only process changed fields
    if (formData.name !== undefined && hasStringChanged(formData.name, node.name)) {
      const trimmedName = formData.name.trim();
      if (!trimmedName) {
        newErrors.name = t('admin.nodes.form.validation.nameRequired');
      } else {
        updates.name = trimmedName;
      }
    }

    if (formData.serverAddress !== undefined && hasStringChanged(formData.serverAddress, node.serverAddress)) {
      // Backend supports empty server address, allow empty string
      const trimmedAddress = formData.serverAddress.trim();
      updates.serverAddress = trimmedAddress;
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

    // Shadowsocks plugin fields
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

    // Trojan related fields
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

    // VLESS related fields
    if (isVless) {
      if (formData.vlessTransportType !== node.vlessTransportType) {
        updates.vlessTransportType = formData.vlessTransportType;
      }
      if (formData.vlessSecurity !== node.vlessSecurity) {
        updates.vlessSecurity = formData.vlessSecurity;
      }
      if (hasStringChanged(formData.vlessFlow, node.vlessFlow)) {
        updates.vlessFlow = formData.vlessFlow?.trim() || undefined;
      }
      if (hasStringChanged(formData.vlessSni, node.vlessSni)) {
        updates.vlessSni = formData.vlessSni?.trim() || undefined;
      }
      if (hasStringChanged(formData.vlessFingerprint, node.vlessFingerprint)) {
        updates.vlessFingerprint = formData.vlessFingerprint?.trim() || undefined;
      }
      if (formData.vlessAllowInsecure !== node.vlessAllowInsecure) {
        updates.vlessAllowInsecure = formData.vlessAllowInsecure;
      }
      if (hasStringChanged(formData.vlessHost, node.vlessHost)) {
        updates.vlessHost = formData.vlessHost?.trim() || undefined;
      }
      if (hasStringChanged(formData.vlessPath, node.vlessPath)) {
        updates.vlessPath = formData.vlessPath?.trim() || undefined;
      }
      if (hasStringChanged(formData.vlessServiceName, node.vlessServiceName)) {
        updates.vlessServiceName = formData.vlessServiceName?.trim() || undefined;
      }
      if (hasStringChanged(formData.vlessRealityPublicKey, node.vlessRealityPublicKey)) {
        updates.vlessRealityPublicKey = formData.vlessRealityPublicKey?.trim() || undefined;
      }
      if (hasStringChanged(formData.vlessRealityShortId, node.vlessRealityShortId)) {
        updates.vlessRealityShortId = formData.vlessRealityShortId?.trim() || undefined;
      }
      if (hasStringChanged(formData.vlessRealitySpiderX, node.vlessRealitySpiderX)) {
        updates.vlessRealitySpiderX = formData.vlessRealitySpiderX?.trim() || undefined;
      }
    }

    // VMess related fields
    if (isVmess) {
      if (formData.vmessTransportType !== node.vmessTransportType) {
        updates.vmessTransportType = formData.vmessTransportType;
      }
      if (formData.vmessSecurity !== node.vmessSecurity) {
        updates.vmessSecurity = formData.vmessSecurity;
      }
      if (formData.vmessAlterId !== node.vmessAlterId) {
        updates.vmessAlterId = formData.vmessAlterId;
      }
      if (formData.vmessTls !== node.vmessTls) {
        updates.vmessTls = formData.vmessTls;
      }
      if (hasStringChanged(formData.vmessSni, node.vmessSni)) {
        updates.vmessSni = formData.vmessSni?.trim() || undefined;
      }
      if (formData.vmessAllowInsecure !== node.vmessAllowInsecure) {
        updates.vmessAllowInsecure = formData.vmessAllowInsecure;
      }
      if (hasStringChanged(formData.vmessHost, node.vmessHost)) {
        updates.vmessHost = formData.vmessHost?.trim() || undefined;
      }
      if (hasStringChanged(formData.vmessPath, node.vmessPath)) {
        updates.vmessPath = formData.vmessPath?.trim() || undefined;
      }
      if (hasStringChanged(formData.vmessServiceName, node.vmessServiceName)) {
        updates.vmessServiceName = formData.vmessServiceName?.trim() || undefined;
      }
    }

    // Hysteria2 related fields
    if (isHysteria2) {
      if (formData.hysteria2CongestionControl !== node.hysteria2CongestionControl) {
        updates.hysteria2CongestionControl = formData.hysteria2CongestionControl;
      }
      if (hasStringChanged(formData.hysteria2Obfs, node.hysteria2Obfs)) {
        updates.hysteria2Obfs = formData.hysteria2Obfs?.trim() || undefined;
      }
      if (hasStringChanged(formData.hysteria2ObfsPassword, node.hysteria2ObfsPassword)) {
        updates.hysteria2ObfsPassword = formData.hysteria2ObfsPassword?.trim() || undefined;
      }
      if (formData.hysteria2UpMbps !== node.hysteria2UpMbps) {
        updates.hysteria2UpMbps = formData.hysteria2UpMbps;
      }
      if (formData.hysteria2DownMbps !== node.hysteria2DownMbps) {
        updates.hysteria2DownMbps = formData.hysteria2DownMbps;
      }
      if (hasStringChanged(formData.hysteria2Sni, node.hysteria2Sni)) {
        updates.hysteria2Sni = formData.hysteria2Sni?.trim() || undefined;
      }
      if (formData.hysteria2AllowInsecure !== node.hysteria2AllowInsecure) {
        updates.hysteria2AllowInsecure = formData.hysteria2AllowInsecure;
      }
      if (hasStringChanged(formData.hysteria2Fingerprint, node.hysteria2Fingerprint)) {
        updates.hysteria2Fingerprint = formData.hysteria2Fingerprint?.trim() || undefined;
      }
    }

    // TUIC related fields
    if (isTuic) {
      if (formData.tuicCongestionControl !== node.tuicCongestionControl) {
        updates.tuicCongestionControl = formData.tuicCongestionControl;
      }
      if (formData.tuicUdpRelayMode !== node.tuicUdpRelayMode) {
        updates.tuicUdpRelayMode = formData.tuicUdpRelayMode;
      }
      if (hasStringChanged(formData.tuicAlpn, node.tuicAlpn)) {
        updates.tuicAlpn = formData.tuicAlpn?.trim() || undefined;
      }
      if (hasStringChanged(formData.tuicSni, node.tuicSni)) {
        updates.tuicSni = formData.tuicSni?.trim() || undefined;
      }
      if (formData.tuicAllowInsecure !== node.tuicAllowInsecure) {
        updates.tuicAllowInsecure = formData.tuicAllowInsecure;
      }
      if (formData.tuicDisableSni !== node.tuicDisableSni) {
        updates.tuicDisableSni = formData.tuicDisableSni;
      }
    }

    // Resource group association - only send if changed
    const originalGroupSids = node.groupSids ?? [];
    const newGroupSids = formData.groupSids ?? [];
    const groupSidsChanged = JSON.stringify([...newGroupSids].sort()) !== JSON.stringify([...originalGroupSids].sort());
    if (groupSidsChanged) {
      updates.groupSids = newGroupSids;
    }

    // Tags - parse tagsInput and compare with original
    const newTags = formData.tagsInput
      ? formData.tagsInput.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
      : [];
    const originalTags = node.tags ?? [];
    const tagsChanged = JSON.stringify(newTags.sort()) !== JSON.stringify([...originalTags].sort());
    if (tagsChanged) {
      updates.tags = newTags.length > 0 ? newTags : undefined;
    }

    // Route configuration - compare JSON to detect changes
    const routeChanged = JSON.stringify(formData.route) !== JSON.stringify(node.route);
    if (routeChanged) {
      // Use null to clear route, undefined means no change
      updates.route = formData.route === undefined ? null : formData.route;
    }

    // Mute notification setting
    if (formData.muteNotification !== node.muteNotification) {
      updates.muteNotification = formData.muteNotification;
    }

    // If there are validation errors, display and prevent submission
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear errors and submit
    setErrors({});
    if (Object.keys(updates).length > 0) {
      onSubmit(node.id, updates);
    }
  };

  // Check if there are changes
  const hasChanges = node && Object.keys(formData).some(
    (key) => formData[key as keyof UpdateNodeRequest] !== node[key as keyof Node]
  );

  // Check if protocol settings are configured
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
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{t('admin.nodes.form.editNode')}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
          <Accordion
            type="multiple"
            defaultValue={['basic', 'network']}
            className="w-full"
          >
            {/* Basic Info */}
            <AccordionItem value="basic" className="border rounded-md px-3 mb-2">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{t('common.sections.basicInfo')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="@container">
                <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
                  {/* Node ID (readonly) */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="node_id">{t('admin.nodes.form.nodeId')}</Label>
                    <Input id="node_id" value={node.id} disabled />
                  </div>

                  {/* Created At (readonly) */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="createdAt">{t('common.fields.createdAt')}</Label>
                    <Input
                      id="createdAt"
                      value={formatDateTime(node.createdAt)}
                      disabled
                    />
                  </div>

                  {/* Node Name */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="name">{t('admin.nodes.form.nodeName')}</Label>
                    <Input
                      id="name"
                      value={formData.name || ''}
                      onChange={(e) => handleChange('name', e.target.value)}
                      error={!!errors.name}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive">{errors.name}</p>
                    )}
                  </div>

                  {/* Protocol Type (readonly) */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="protocol">{t('admin.nodes.form.protocolType')}</Label>
                    <Input
                      id="protocol"
                      value={PROTOCOL_NAMES[node.protocol]}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">{t('admin.nodes.form.protocolCannotChange')}</p>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="status">{t('common.status.label')}</Label>
                    <Select
                      value={formData.status || 'inactive'}
                      onValueChange={(value) => handleChange('status', value)}
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">{t('common.status.active')}</SelectItem>
                        <SelectItem value="inactive">{t('common.status.inactive')}</SelectItem>
                        <SelectItem value="maintenance">{t('common.status.maintenance')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Shadowsocks Encryption Method */}
                  {isShadowsocks && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="encryptionMethod">{t('admin.nodes.form.encryptionMethod')}</Label>
                      <Select
                        value={formData.encryptionMethod || ''}
                        onValueChange={(value) => handleChange('encryptionMethod', value)}
                      >
                        <SelectTrigger id="encryptionMethod">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SS_ENCRYPTION_METHODS.map((method) => (
                            <SelectItem key={method} value={method}>
                              {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Trojan Transport Protocol */}
                  {isTrojan && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="transportProtocol">{t('admin.nodes.form.transportProtocol')}</Label>
                      <Select
                        value={formData.transportProtocol || 'tcp'}
                        onValueChange={(value) => handleChange('transportProtocol', value)}
                      >
                        <SelectTrigger id="transportProtocol">
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
                    </div>
                  )}

                  {/* VLESS Basic Config */}
                  {isVless && (
                    <>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="vlessTransportType">{t('admin.nodes.form.transportProtocol')}</Label>
                        <Select
                          value={formData.vlessTransportType || 'tcp'}
                          onValueChange={(value) => handleChange('vlessTransportType', value as TransportProtocol)}
                        >
                          <SelectTrigger id="vlessTransportType">
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
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="vlessSecurity">{t('admin.nodes.form.securityType')}</Label>
                        <Select
                          value={formData.vlessSecurity || 'tls'}
                          onValueChange={(value) => handleChange('vlessSecurity', value as VLESSSecurity)}
                        >
                          <SelectTrigger id="vlessSecurity">
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
                      </div>
                    </>
                  )}

                  {/* VMess Basic Config */}
                  {isVmess && (
                    <>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="vmessTransportType">{t('admin.nodes.form.transportProtocol')}</Label>
                        <Select
                          value={formData.vmessTransportType || 'tcp'}
                          onValueChange={(value) => handleChange('vmessTransportType', value as TransportProtocol)}
                        >
                          <SelectTrigger id="vmessTransportType">
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
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="vmessSecurity">{t('admin.nodes.form.encryptionMethod')}</Label>
                        <Select
                          value={formData.vmessSecurity || 'auto'}
                          onValueChange={(value) => handleChange('vmessSecurity', value as VMessSecurity)}
                        >
                          <SelectTrigger id="vmessSecurity">
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
                      </div>
                    </>
                  )}

                  {/* Hysteria2 Basic Config */}
                  {isHysteria2 && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="hysteria2CongestionControl">{t('admin.nodes.form.congestionControl')}</Label>
                      <Select
                        value={formData.hysteria2CongestionControl || 'bbr'}
                        onValueChange={(value) => handleChange('hysteria2CongestionControl', value as CongestionControl)}
                      >
                        <SelectTrigger id="hysteria2CongestionControl">
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
                    </div>
                  )}

                  {/* TUIC Basic Config */}
                  {isTuic && (
                    <>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="tuicCongestionControl">{t('admin.nodes.form.congestionControl')}</Label>
                        <Select
                          value={formData.tuicCongestionControl || 'bbr'}
                          onValueChange={(value) => handleChange('tuicCongestionControl', value as CongestionControl)}
                        >
                          <SelectTrigger id="tuicCongestionControl">
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
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="tuicUdpRelayMode">{t('admin.nodes.form.udpRelayMode')}</Label>
                        <Select
                          value={formData.tuicUdpRelayMode || 'native'}
                          onValueChange={(value) => handleChange('tuicUdpRelayMode', value as TUICUDPRelayMode)}
                        >
                          <SelectTrigger id="tuicUdpRelayMode">
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
                      </div>
                    </>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Network Config */}
            <AccordionItem value="network" className="border rounded-md px-3 mb-2">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{t('common.sections.networkConfig')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="@container">
                <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
                  {/* Server Address */}
                  <div className="flex flex-col gap-2 @md:col-span-2">
                    <Label htmlFor="serverAddress">{t('admin.nodes.form.serverAddress')}</Label>
                    <Input
                      id="serverAddress"
                      value={formData.serverAddress || ''}
                      onChange={(e) => handleChange('serverAddress', e.target.value)}
                      error={!!errors.serverAddress}
                    />
                    {errors.serverAddress && (
                      <p className="text-xs text-destructive">{errors.serverAddress}</p>
                    )}
                  </div>

                  {/* Agent Port */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="agentPort">{t('admin.nodes.form.agentPort')}</Label>
                    <Input
                      id="agentPort"
                      type="number"
                      min={1}
                      max={65535}
                      value={formData.agentPort || ''}
                      onChange={(e) => handleChange('agentPort', parseInt(e.target.value, 10))}
                      error={!!errors.agentPort}
                    />
                    {errors.agentPort && (
                      <p className="text-xs text-destructive">{errors.agentPort}</p>
                    )}
                  </div>

                  {/* Subscription Port */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="subscriptionPort">{t('admin.nodes.form.subscriptionPort')}</Label>
                    <Input
                      id="subscriptionPort"
                      type="number"
                      min={1}
                      max={65535}
                      placeholder={t('admin.nodes.form.subscriptionPortPlaceholder')}
                      value={formData.subscriptionPort ?? ''}
                      onChange={(e) => handleChange('subscriptionPort', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                      error={!!errors.subscriptionPort}
                    />
                    {errors.subscriptionPort && (
                      <p className="text-xs text-destructive">{errors.subscriptionPort}</p>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Protocol Config */}
            <AccordionItem value="protocol" className="border rounded-md px-3 mb-2">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {PROTOCOL_NAMES[node.protocol]} {t('admin.nodes.form.config')}
                  </span>
                  {hasProtocolSettings && (
                    <Badge variant="secondary" className="text-xs">{t('admin.nodes.form.configured')}</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="@container">
                <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
                  {/* Shadowsocks Plugin */}
                  {isShadowsocks && (
                    <>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="plugin">{t('admin.nodes.form.plugin')}</Label>
                        <Input
                          id="plugin"
                          placeholder={t('admin.nodes.form.placeholders.plugin')}
                          value={formData.plugin || ''}
                          onChange={(e) => handleChange('plugin', e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          {t('admin.nodes.form.pluginHint')}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 @md:col-span-2">
                        <Label htmlFor="pluginOpts">{t('admin.nodes.form.pluginOptions')}</Label>
                        <Input
                          id="pluginOpts"
                          placeholder={t('admin.nodes.form.placeholders.pluginOpts')}
                          value={pluginOptsStr}
                          onChange={(e) => handlePluginOptsChange(e.target.value)}
                          error={!!errors.pluginOpts}
                        />
                        {errors.pluginOpts && (
                          <p className="text-xs text-destructive">{errors.pluginOpts}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {t('admin.nodes.form.pluginOptionsHint')}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Trojan Config */}
                  {isTrojan && (
                    <>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="sni">{t('admin.nodes.form.fields.sni')}</Label>
                        <Input
                          id="sni"
                          placeholder={t('admin.nodes.form.placeholders.sni')}
                          value={formData.sni || ''}
                          onChange={(e) => handleChange('sni', e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">{t('common.optional')}</p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="allowInsecure">{t('admin.nodes.form.tlsSecurity')}</Label>
                        <Select
                          value={formData.allowInsecure ? 'true' : 'false'}
                          onValueChange={(value) => handleChange('allowInsecure', value === 'true')}
                        >
                          <SelectTrigger id="allowInsecure">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="false">{t('admin.nodes.form.verifyCert')}</SelectItem>
                            <SelectItem value="true">{t('admin.nodes.form.skipVerify')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">{t('admin.nodes.form.tlsSecurityHint')}</p>
                      </div>

                      {/* WebSocket Config */}
                      {showWsFields && (
                        <>
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="host">{t('admin.nodes.form.fields.host')}</Label>
                            <Input
                              id="host"
                              placeholder={t('admin.nodes.form.placeholders.wsHost')}
                              value={formData.host || ''}
                              onChange={(e) => handleChange('host', e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">{t('common.optional')}</p>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Label htmlFor="path">{t('admin.nodes.form.fields.path')}</Label>
                            <Input
                              id="path"
                              placeholder={t('admin.nodes.form.placeholders.path')}
                              value={formData.path || ''}
                              onChange={(e) => handleChange('path', e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">{t('common.optional')}</p>
                          </div>
                        </>
                      )}

                      {/* gRPC Config */}
                      {showGrpcFields && (
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="grpcHost">{t('admin.nodes.form.fields.serviceName')}</Label>
                          <Input
                            id="grpcHost"
                            placeholder={t('admin.nodes.form.placeholders.grpcServiceName')}
                            value={formData.host || ''}
                            onChange={(e) => handleChange('host', e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">{t('common.optional')}</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* VLESS Config */}
                  {isVless && (
                    <>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="vlessSni">{t('admin.nodes.form.fields.sni')}</Label>
                        <Input
                          id="vlessSni"
                          placeholder={t('admin.nodes.form.placeholders.sni')}
                          value={formData.vlessSni || ''}
                          onChange={(e) => handleChange('vlessSni', e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">{t('common.optional')}</p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="vlessAllowInsecure">{t('admin.nodes.form.tlsSecurity')}</Label>
                        <Select
                          value={formData.vlessAllowInsecure ? 'true' : 'false'}
                          onValueChange={(value) => handleChange('vlessAllowInsecure', value === 'true')}
                        >
                          <SelectTrigger id="vlessAllowInsecure">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="false">{t('admin.nodes.form.verifyCert')}</SelectItem>
                            <SelectItem value="true">{t('admin.nodes.form.skipVerify')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="vlessFlow">{t('admin.nodes.form.fields.flow')}</Label>
                        <Input
                          id="vlessFlow"
                          placeholder={t('admin.nodes.form.placeholders.vlessFlow')}
                          value={formData.vlessFlow || ''}
                          onChange={(e) => handleChange('vlessFlow', e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">{t('common.optional')}</p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="vlessFingerprint">{t('admin.nodes.form.fields.fingerprint')}</Label>
                        <Select
                          value={formData.vlessFingerprint || ''}
                          onValueChange={(value) => handleChange('vlessFingerprint', value)}
                        >
                          <SelectTrigger id="vlessFingerprint">
                            <SelectValue placeholder={t('admin.nodes.form.selectFingerprint')} />
                          </SelectTrigger>
                          <SelectContent>
                            {TLS_FINGERPRINT_OPTIONS.map((fp) => (
                              <SelectItem key={fp} value={fp}>
                                {fp}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {showVlessWsFields && (
                        <>
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="vlessHost">{t('admin.nodes.form.fields.host')}</Label>
                            <Input
                              id="vlessHost"
                              placeholder={t('admin.nodes.form.placeholders.wsH2Host')}
                              value={formData.vlessHost || ''}
                              onChange={(e) => handleChange('vlessHost', e.target.value)}
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <Label htmlFor="vlessPath">{t('admin.nodes.form.fields.path')}</Label>
                            <Input
                              id="vlessPath"
                              placeholder={t('admin.nodes.form.placeholders.path')}
                              value={formData.vlessPath || ''}
                              onChange={(e) => handleChange('vlessPath', e.target.value)}
                            />
                          </div>
                        </>
                      )}

                      {showVlessGrpcFields && (
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="vlessServiceName">{t('admin.nodes.form.fields.serviceName')}</Label>
                          <Input
                            id="vlessServiceName"
                            placeholder={t('admin.nodes.form.placeholders.grpcServiceName')}
                            value={formData.vlessServiceName || ''}
                            onChange={(e) => handleChange('vlessServiceName', e.target.value)}
                          />
                        </div>
                      )}

                      {showVlessRealityFields && (
                        <>
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="vlessRealityPublicKey">{t('admin.nodes.form.fields.realityPublicKey')}</Label>
                            <Input
                              id="vlessRealityPublicKey"
                              placeholder={t('admin.nodes.form.publicKeyPlaceholder')}
                              value={formData.vlessRealityPublicKey || ''}
                              onChange={(e) => handleChange('vlessRealityPublicKey', e.target.value)}
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <Label htmlFor="vlessRealityShortId">{t('admin.nodes.form.fields.realityShortId')}</Label>
                            <Input
                              id="vlessRealityShortId"
                              placeholder={t('admin.nodes.form.shortIdPlaceholder')}
                              value={formData.vlessRealityShortId || ''}
                              onChange={(e) => handleChange('vlessRealityShortId', e.target.value)}
                            />
                          </div>

                          <div className="flex flex-col gap-2 @md:col-span-2">
                            <Label htmlFor="vlessRealitySpiderX">{t('admin.nodes.form.fields.realitySpiderX')}</Label>
                            <Input
                              id="vlessRealitySpiderX"
                              placeholder="/"
                              value={formData.vlessRealitySpiderX || ''}
                              onChange={(e) => handleChange('vlessRealitySpiderX', e.target.value)}
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {/* VMess Config */}
                  {isVmess && (
                    <>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="vmessAlterId">{t('admin.nodes.form.fields.alterId')}</Label>
                        <Input
                          id="vmessAlterId"
                          type="number"
                          min={0}
                          value={formData.vmessAlterId ?? 0}
                          onChange={(e) => handleChange('vmessAlterId', parseInt(e.target.value, 10) || 0)}
                        />
                        <p className="text-xs text-muted-foreground">{t('admin.nodes.form.alterIdHint')}</p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="vmessTls">{t('admin.nodes.form.fields.tls')}</Label>
                        <Select
                          value={formData.vmessTls ? 'true' : 'false'}
                          onValueChange={(value) => handleChange('vmessTls', value === 'true')}
                        >
                          <SelectTrigger id="vmessTls">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">{t('admin.nodes.form.enableTls')}</SelectItem>
                            <SelectItem value="false">{t('admin.nodes.form.disableTls')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="vmessSni">{t('admin.nodes.form.fields.sni')}</Label>
                        <Input
                          id="vmessSni"
                          placeholder={t('admin.nodes.form.placeholders.sni')}
                          value={formData.vmessSni || ''}
                          onChange={(e) => handleChange('vmessSni', e.target.value)}
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="vmessAllowInsecure">{t('admin.nodes.form.tlsSecurity')}</Label>
                        <Select
                          value={formData.vmessAllowInsecure ? 'true' : 'false'}
                          onValueChange={(value) => handleChange('vmessAllowInsecure', value === 'true')}
                        >
                          <SelectTrigger id="vmessAllowInsecure">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="false">{t('admin.nodes.form.verifyCert')}</SelectItem>
                            <SelectItem value="true">{t('admin.nodes.form.skipVerify')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {showVmessWsFields && (
                        <>
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="vmessHost">{t('admin.nodes.form.fields.host')}</Label>
                            <Input
                              id="vmessHost"
                              placeholder={t('admin.nodes.form.placeholders.wsHttpHost')}
                              value={formData.vmessHost || ''}
                              onChange={(e) => handleChange('vmessHost', e.target.value)}
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <Label htmlFor="vmessPath">{t('admin.nodes.form.fields.path')}</Label>
                            <Input
                              id="vmessPath"
                              placeholder={t('admin.nodes.form.placeholders.path')}
                              value={formData.vmessPath || ''}
                              onChange={(e) => handleChange('vmessPath', e.target.value)}
                            />
                          </div>
                        </>
                      )}

                      {showVmessGrpcFields && (
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="vmessServiceName">{t('admin.nodes.form.fields.serviceName')}</Label>
                          <Input
                            id="vmessServiceName"
                            placeholder={t('admin.nodes.form.placeholders.grpcServiceName')}
                            value={formData.vmessServiceName || ''}
                            onChange={(e) => handleChange('vmessServiceName', e.target.value)}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* Hysteria2 Config */}
                  {isHysteria2 && (
                    <>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="hysteria2Sni">{t('admin.nodes.form.fields.sni')}</Label>
                        <Input
                          id="hysteria2Sni"
                          placeholder={t('admin.nodes.form.placeholders.sni')}
                          value={formData.hysteria2Sni || ''}
                          onChange={(e) => handleChange('hysteria2Sni', e.target.value)}
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="hysteria2AllowInsecure">{t('admin.nodes.form.tlsSecurity')}</Label>
                        <Select
                          value={formData.hysteria2AllowInsecure ? 'true' : 'false'}
                          onValueChange={(value) => handleChange('hysteria2AllowInsecure', value === 'true')}
                        >
                          <SelectTrigger id="hysteria2AllowInsecure">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="false">{t('admin.nodes.form.verifyCert')}</SelectItem>
                            <SelectItem value="true">{t('admin.nodes.form.skipVerify')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="hysteria2Obfs">{t('admin.nodes.form.obfsType')}</Label>
                        <Input
                          id="hysteria2Obfs"
                          placeholder={t('admin.nodes.form.placeholders.hysteria2Obfs')}
                          value={formData.hysteria2Obfs || ''}
                          onChange={(e) => handleChange('hysteria2Obfs', e.target.value)}
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="hysteria2ObfsPassword">{t('admin.nodes.form.obfsPassword')}</Label>
                        <Input
                          id="hysteria2ObfsPassword"
                          placeholder={t('common.placeholders.password')}
                          value={formData.hysteria2ObfsPassword || ''}
                          onChange={(e) => handleChange('hysteria2ObfsPassword', e.target.value)}
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="hysteria2UpMbps">{t('admin.nodes.form.upBandwidth')}</Label>
                        <Input
                          id="hysteria2UpMbps"
                          type="number"
                          min={0}
                          placeholder={t('admin.nodes.form.placeholders.bandwidth')}
                          value={formData.hysteria2UpMbps ?? ''}
                          onChange={(e) => handleChange('hysteria2UpMbps', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="hysteria2DownMbps">{t('admin.nodes.form.downBandwidth')}</Label>
                        <Input
                          id="hysteria2DownMbps"
                          type="number"
                          min={0}
                          placeholder={t('admin.nodes.form.placeholders.bandwidth')}
                          value={formData.hysteria2DownMbps ?? ''}
                          onChange={(e) => handleChange('hysteria2DownMbps', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                        />
                      </div>

                      <div className="flex flex-col gap-2 @md:col-span-2">
                        <Label htmlFor="hysteria2Fingerprint">{t('admin.nodes.form.fields.fingerprint')}</Label>
                        <Select
                          value={formData.hysteria2Fingerprint || ''}
                          onValueChange={(value) => handleChange('hysteria2Fingerprint', value)}
                        >
                          <SelectTrigger id="hysteria2Fingerprint">
                            <SelectValue placeholder={t('admin.nodes.form.selectFingerprint')} />
                          </SelectTrigger>
                          <SelectContent>
                            {TLS_FINGERPRINT_OPTIONS.map((fp) => (
                              <SelectItem key={fp} value={fp}>
                                {fp}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {/* TUIC Config */}
                  {isTuic && (
                    <>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="tuicSni">{t('admin.nodes.form.fields.sni')}</Label>
                        <Input
                          id="tuicSni"
                          placeholder={t('admin.nodes.form.placeholders.sni')}
                          value={formData.tuicSni || ''}
                          onChange={(e) => handleChange('tuicSni', e.target.value)}
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="tuicAllowInsecure">{t('admin.nodes.form.tlsSecurity')}</Label>
                        <Select
                          value={formData.tuicAllowInsecure ? 'true' : 'false'}
                          onValueChange={(value) => handleChange('tuicAllowInsecure', value === 'true')}
                        >
                          <SelectTrigger id="tuicAllowInsecure">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="false">{t('admin.nodes.form.verifyCert')}</SelectItem>
                            <SelectItem value="true">{t('admin.nodes.form.skipVerify')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="tuicAlpn">{t('admin.nodes.form.fields.alpn')}</Label>
                        <Input
                          id="tuicAlpn"
                          placeholder={t('admin.nodes.form.placeholders.alpn')}
                          value={formData.tuicAlpn || ''}
                          onChange={(e) => handleChange('tuicAlpn', e.target.value)}
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="tuicDisableSni">{t('admin.nodes.form.disableSni')}</Label>
                        <Select
                          value={formData.tuicDisableSni ? 'true' : 'false'}
                          onValueChange={(value) => handleChange('tuicDisableSni', value === 'true')}
                        >
                          <SelectTrigger id="tuicDisableSni">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="false">{t('admin.nodes.form.notDisabled')}</SelectItem>
                            <SelectItem value="true">{t('admin.nodes.form.disableSniOption')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Other Settings */}
            <AccordionItem value="other" className="border rounded-md px-3 mb-2">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{t('admin.nodes.form.section.otherSettings')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="@container">
                <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
                  {/* Region */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="region">{t('admin.nodes.form.region')}</Label>
                    <Input
                      id="region"
                      value={formData.region || ''}
                      onChange={(e) => handleChange('region', e.target.value)}
                    />
                  </div>

                  {/* Sort Order */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="sortOrder">{t('common.fields.sortOrder')}</Label>
                    <Input
                      id="sortOrder"
                      type="number"
                      value={formData.sortOrder ?? 0}
                      onChange={(e) => handleChange('sortOrder', parseInt(e.target.value, 10) || 0)}
                    />
                    <p className="text-xs text-muted-foreground">{t('admin.nodes.form.sortOrderHint')}</p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-col gap-2 @md:col-span-2">
                    <Label htmlFor="tagsInput">{t('admin.nodes.form.tags')}</Label>
                    <Input
                      id="tagsInput"
                      placeholder={t('admin.nodes.form.tagsPlaceholder')}
                      value={formData.tagsInput ?? ''}
                      onChange={(e) => handleChange('tagsInput', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('admin.nodes.form.tagsHint')}
                    </p>
                  </div>

                  {/* Resource Groups (multi-select) */}
                  <div className="flex flex-col gap-2 @md:col-span-2">
                    <Label>{t('admin.nodes.form.resourceGroup')}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t('admin.nodes.form.resourceGroupSelectHint')}
                    </p>

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
                                className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                              >
                                <X className="size-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}

                    {/* Group selection list */}
                    <div className="border rounded-lg max-h-[120px] overflow-y-auto">
                      {isLoadingGroups || isLoadingPlans ? (
                        <div className="p-3 text-center text-sm text-muted-foreground">{t('common.table.loading')}</div>
                      ) : filteredResourceGroups.length === 0 ? (
                        <div className="p-3 text-center text-sm text-muted-foreground">{t('admin.nodes.detail.noResourceGroups')}</div>
                      ) : (
                        <div className="divide-y">
                          {filteredResourceGroups.map((group) => (
                            <label
                              key={group.sid}
                              className="flex items-center gap-3 p-2.5 hover:bg-muted/50 cursor-pointer transition-colors"
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

                  {/* Mute Notification */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="muteNotification">{t('admin.nodes.form.muteNotification')}</Label>
                    <div className="flex items-center gap-3">
                      <Switch
                        id="muteNotification"
                        checked={formData.muteNotification ?? false}
                        onCheckedChange={(checked) => handleChange('muteNotification', checked)}
                      >
                        <SwitchThumb />
                      </Switch>
                      <span className="text-sm text-muted-foreground">
                        {formData.muteNotification ? t('admin.nodes.form.muted') : t('admin.nodes.form.unmuted')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('admin.nodes.form.muteNotificationHint')}
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Route Config */}
            <AccordionItem value="route" className="border rounded-md px-3 mb-2">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{t('admin.nodes.form.section.routeConfig')}</span>
                  {formData.route && (
                    <Badge variant="secondary" className="text-xs">{t('admin.nodes.form.configured')}</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <RouteConfigEditor
                  value={formData.route ?? undefined}
                  onChange={handleRouteChange}
                  idPrefix="edit-node-route"
                  nodes={nodes}
                  currentNodeId={node?.id}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button onClick={handleSubmit} disabled={!hasChanges}>
            {t('common.actions.save')}
          </Button>
          <Button variant="outline" onClick={onClose}>
            {t('common.actions.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
