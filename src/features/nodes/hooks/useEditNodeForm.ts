/**
 * Shared form hook for EditNodeDialog and EditNodeSheet
 * Manages form state, change detection, validation, and submit data building for node editing
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { hasStringChanged } from '@/shared/utils/form-utils';
import { pluginOptsToString, stringToPluginOpts, arePluginOptsEqual } from '../utils/plugin-utils';
import type {
  Node,
  UpdateNodeRequest,
  RouteConfig,
  DnsConfig,
} from '@/api/node';

// Extended form data type with UI-only fields
export interface EditNodeFormData extends Omit<UpdateNodeRequest, 'groupSids'> {
  tagsInput: string;
  groupSids: string[];
}

export function useEditNodeForm() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<EditNodeFormData>({ tagsInput: '', groupSids: [] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pluginOptsStr, setPluginOptsStr] = useState<string>('');

  // Initialize form from existing node data
  const initializeForm = useCallback((node: Node) => {
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
      // DNS configuration
      dns: node.dns,
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
      // AnyTLS fields
      anytlsSni: node.anytlsSni,
      anytlsAllowInsecure: node.anytlsAllowInsecure,
      anytlsFingerprint: node.anytlsFingerprint,
      anytlsIdleSessionCheckInterval: node.anytlsIdleSessionCheckInterval,
      anytlsIdleSessionTimeout: node.anytlsIdleSessionTimeout,
      anytlsMinIdleSession: node.anytlsMinIdleSession,
      // Expiration fields
      expiresAt: node.expiresAt,
      costLabel: node.costLabel,
    });
    setPluginOptsStr(pluginOptsToString(node.pluginOpts));
    setErrors({});
  }, []);

  // Reset form
  const reset = useCallback(() => {
    setFormData({ tagsInput: '', groupSids: [] });
    setErrors({});
    setPluginOptsStr('');
  }, []);

  // Generic field change handler
  const handleChange = useCallback((field: string, value: string | number | boolean | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // Plugin options change handler (parses string to object and updates both)
  const handlePluginOptsChange = useCallback((value: string) => {
    setPluginOptsStr(value);
    const parsedOpts = stringToPluginOpts(value);
    setFormData((prev) => ({ ...prev, pluginOpts: parsedOpts }));
    setErrors((prev) => {
      if (!prev.pluginOpts) return prev;
      const newErrors = { ...prev };
      delete newErrors.pluginOpts;
      return newErrors;
    });
  }, []);

  // Route change handler
  const handleRouteChange = useCallback((route: RouteConfig | undefined) => {
    setFormData((prev) => ({ ...prev, route }));
  }, []);

  // DNS change handler
  const handleDnsChange = useCallback((dns: DnsConfig | undefined) => {
    setFormData((prev) => ({ ...prev, dns }));
  }, []);

  // Cost label change handler
  const handleCostLabelChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, costLabel: value || undefined }));
    setErrors((prev) => {
      if (!prev.costLabel) return prev;
      const newErrors = { ...prev };
      delete newErrors.costLabel;
      return newErrors;
    });
  }, []);

  // Build update data with change detection
  const buildSubmitData = useCallback((node: Node): { updates: UpdateNodeRequest; errors: Record<string, string> } => {
    const updates: UpdateNodeRequest = {};
    const newErrors: Record<string, string> = {};

    const isShadowsocks = node.protocol === 'shadowsocks';
    const isTrojan = node.protocol === 'trojan';
    const isVless = node.protocol === 'vless';
    const isVmess = node.protocol === 'vmess';
    const isHysteria2 = node.protocol === 'hysteria2';
    const isTuic = node.protocol === 'tuic';
    const isAnytls = node.protocol === 'anytls';

    // Name
    if (formData.name !== undefined && hasStringChanged(formData.name, node.name)) {
      const trimmedName = formData.name.trim();
      if (!trimmedName) {
        newErrors.name = t('admin.nodes.form.validation.nameRequired');
      } else {
        updates.name = trimmedName;
      }
    }

    // Server address
    if (formData.serverAddress !== undefined && hasStringChanged(formData.serverAddress, node.serverAddress)) {
      updates.serverAddress = formData.serverAddress.trim();
    }

    // Agent port
    if (formData.agentPort !== node.agentPort && formData.agentPort !== undefined) {
      if (formData.agentPort < 1 || formData.agentPort > 65535) {
        newErrors.agentPort = t('admin.nodes.form.validation.portRange');
      } else {
        updates.agentPort = formData.agentPort;
      }
    }

    // Subscription port
    if (formData.subscriptionPort !== node.subscriptionPort && formData.subscriptionPort !== undefined) {
      if (formData.subscriptionPort < 1 || formData.subscriptionPort > 65535) {
        newErrors.subscriptionPort = t('admin.nodes.form.validation.portRange');
      } else {
        updates.subscriptionPort = formData.subscriptionPort;
      }
    }

    // Encryption method
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

    // Region
    if (formData.region !== undefined && hasStringChanged(formData.region, node.region)) {
      updates.region = formData.region.trim() || undefined;
    }

    // Status
    if (formData.status !== node.status && formData.status !== undefined) {
      updates.status = formData.status;
    }

    // Sort order
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

    // AnyTLS related fields
    if (isAnytls) {
      if (hasStringChanged(formData.anytlsSni, node.anytlsSni)) {
        updates.anytlsSni = formData.anytlsSni?.trim() || undefined;
      }
      if (formData.anytlsAllowInsecure !== node.anytlsAllowInsecure) {
        updates.anytlsAllowInsecure = formData.anytlsAllowInsecure;
      }
      if (hasStringChanged(formData.anytlsFingerprint, node.anytlsFingerprint)) {
        updates.anytlsFingerprint = formData.anytlsFingerprint?.trim() || undefined;
      }
      if (hasStringChanged(formData.anytlsIdleSessionCheckInterval, node.anytlsIdleSessionCheckInterval)) {
        updates.anytlsIdleSessionCheckInterval = formData.anytlsIdleSessionCheckInterval?.trim() || undefined;
      }
      if (hasStringChanged(formData.anytlsIdleSessionTimeout, node.anytlsIdleSessionTimeout)) {
        updates.anytlsIdleSessionTimeout = formData.anytlsIdleSessionTimeout?.trim() || undefined;
      }
      if (formData.anytlsMinIdleSession !== node.anytlsMinIdleSession) {
        updates.anytlsMinIdleSession = formData.anytlsMinIdleSession;
      }
    }

    // Resource group association
    const originalGroupSids = node.groupSids ?? [];
    const newGroupSids = formData.groupSids ?? [];
    const groupSidsChanged = JSON.stringify([...newGroupSids].sort()) !== JSON.stringify([...originalGroupSids].sort());
    if (groupSidsChanged) {
      updates.groupSids = newGroupSids;
    }

    // Tags
    const newTags = formData.tagsInput
      ? formData.tagsInput.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
      : [];
    const originalTags = node.tags ?? [];
    const tagsChanged = JSON.stringify(newTags.sort()) !== JSON.stringify([...originalTags].sort());
    if (tagsChanged) {
      updates.tags = newTags.length > 0 ? newTags : undefined;
    }

    // Route configuration
    const routeChanged = JSON.stringify(formData.route) !== JSON.stringify(node.route);
    if (routeChanged) {
      if (formData.route === undefined) {
        updates.clearRoute = true;
      } else {
        updates.route = formData.route;
      }
    }

    // DNS configuration
    const dnsChanged = JSON.stringify(formData.dns) !== JSON.stringify(node.dns);
    if (dnsChanged) {
      if (formData.dns === undefined) {
        updates.clearDns = true;
      } else {
        updates.dns = formData.dns;
      }
    }

    // Mute notification
    if (formData.muteNotification !== node.muteNotification) {
      updates.muteNotification = formData.muteNotification;
    }

    // Expiration time
    if (formData.expiresAt !== node.expiresAt) {
      updates.expiresAt = formData.expiresAt || "";
    }

    // Cost label
    if (formData.costLabel !== node.costLabel) {
      updates.costLabel = formData.costLabel || "";
    }

    return { updates, errors: newErrors };
  }, [formData, t]);

  // Validate and build - returns null if validation fails
  const validateAndBuild = useCallback((node: Node): UpdateNodeRequest | null => {
    const { updates, errors: newErrors } = buildSubmitData(node);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return null;
    }

    setErrors({});
    return Object.keys(updates).length > 0 ? updates : null;
  }, [buildSubmitData]);

  // Check for changes relative to the original node
  const getHasChanges = useCallback((node: Node | null): boolean => {
    if (!node) return false;
    return Object.keys(formData).some(
      (key) => formData[key as keyof UpdateNodeRequest] !== node[key as keyof Node]
    );
  }, [formData]);

  // Protocol settings badge check
  const getHasProtocolSettings = useCallback((protocol: string | undefined): boolean => {
    if (protocol === 'shadowsocks') return Boolean(formData.plugin || pluginOptsStr);
    if (protocol === 'trojan') return Boolean(formData.sni || formData.host || formData.path || formData.allowInsecure);
    if (protocol === 'vless') return Boolean(formData.vlessSni || formData.vlessHost || formData.vlessPath || formData.vlessFlow);
    if (protocol === 'vmess') return Boolean(formData.vmessSni || formData.vmessHost || formData.vmessPath);
    if (protocol === 'hysteria2') return Boolean(formData.hysteria2Sni || formData.hysteria2Obfs || formData.hysteria2UpMbps);
    if (protocol === 'tuic') return Boolean(formData.tuicSni || formData.tuicAlpn);
    if (protocol === 'anytls') return Boolean(formData.anytlsSni || formData.anytlsFingerprint);
    return false;
  }, [formData, pluginOptsStr]);

  return {
    // Form state
    formData,
    setFormData,
    errors,
    setErrors,
    pluginOptsStr,

    // Handlers
    handleChange,
    handlePluginOptsChange,
    handleRouteChange,
    handleDnsChange,
    handleCostLabelChange,
    initializeForm,
    reset,

    // Validation and submission
    validateAndBuild,
    buildSubmitData,
    getHasChanges,
    getHasProtocolSettings,
  };
}
