/**
 * Shared form hook for CreateNodeDialog and CreateNodeSheet
 * Manages form state, validation, and submit data building for node creation
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  CreateNodeRequest,
  RouteConfig,
  DnsConfig,
} from '@/api/node';

// Extended form data type with UI-only fields
export type CreateNodeFormData = CreateNodeRequest & {
  tagsInput: string;
  expiresAt?: string;
  costLabel?: string;
};

// Default form data factory
const getDefaultFormData = (): CreateNodeFormData => ({
  name: '',
  protocol: 'shadowsocks',
  serverAddress: '',
  agentPort: 8388,
  subscriptionPort: undefined,
  encryptionMethod: 'aes-256-gcm',
  region: '',
  sortOrder: 0,
  tags: [],
  tagsInput: '',
  groupSids: [],
  plugin: undefined,
  pluginOpts: undefined,
  transportProtocol: 'tcp',
  host: '',
  path: '',
  sni: '',
  allowInsecure: false,
  route: undefined,
  dns: undefined,
  // VLESS fields
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
  // VMess fields
  vmessAlterId: 0,
  vmessSecurity: 'auto',
  vmessTransportType: 'tcp',
  vmessHost: '',
  vmessPath: '',
  vmessServiceName: '',
  vmessTls: true,
  vmessSni: '',
  vmessAllowInsecure: false,
  // Hysteria2 fields
  hysteria2CongestionControl: 'bbr',
  hysteria2Obfs: '',
  hysteria2ObfsPassword: '',
  hysteria2UpMbps: undefined,
  hysteria2DownMbps: undefined,
  hysteria2Sni: '',
  hysteria2AllowInsecure: false,
  hysteria2Fingerprint: '',
  // TUIC fields
  tuicCongestionControl: 'bbr',
  tuicUdpRelayMode: 'native',
  tuicAlpn: '',
  tuicSni: '',
  tuicAllowInsecure: false,
  tuicDisableSni: false,
  // AnyTLS fields
  anytlsSni: '',
  anytlsAllowInsecure: false,
  anytlsFingerprint: '',
  anytlsIdleSessionCheckInterval: '',
  anytlsIdleSessionTimeout: '',
  anytlsMinIdleSession: undefined,
  // Expiration fields
  expiresAt: undefined,
  costLabel: undefined,
});

export interface UseCreateNodeFormOptions {
  initialData?: Partial<CreateNodeRequest>;
}

export function useCreateNodeForm(_options?: UseCreateNodeFormOptions) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CreateNodeFormData>(getDefaultFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pluginOptsString, setPluginOptsString] = useState<string>('');

  // Protocol flags
  const isShadowsocks = formData.protocol === 'shadowsocks';
  const isTrojan = formData.protocol === 'trojan';
  const isVless = formData.protocol === 'vless';
  const isVmess = formData.protocol === 'vmess';
  const isHysteria2 = formData.protocol === 'hysteria2';
  const isTuic = formData.protocol === 'tuic';
  const isAnytls = formData.protocol === 'anytls';

  // Transport field visibility flags
  const showWsFields = isTrojan && formData.transportProtocol === 'ws';
  const showGrpcFields = isTrojan && formData.transportProtocol === 'grpc';
  const showVlessWsFields = isVless && (formData.vlessTransportType === 'ws' || formData.vlessTransportType === 'h2');
  const showVlessGrpcFields = isVless && formData.vlessTransportType === 'grpc';
  const showVlessRealityFields = isVless && formData.vlessSecurity === 'reality';
  const showVmessWsFields = isVmess && (formData.vmessTransportType === 'ws' || formData.vmessTransportType === 'http');
  const showVmessGrpcFields = isVmess && formData.vmessTransportType === 'grpc';

  // Initialize form from initialData (for copy node scenario)
  const initializeForm = useCallback((initialData?: Partial<CreateNodeRequest>) => {
    if (initialData) {
      const tagsInput = initialData.tags?.join(', ') ?? '';
      setFormData({
        ...getDefaultFormData(),
        ...initialData,
        tagsInput,
      });
      if (initialData.pluginOpts) {
        const optsStr = Object.entries(initialData.pluginOpts)
          .map(([key, value]) => `${key}=${value}`)
          .join(';');
        setPluginOptsString(optsStr);
      } else {
        setPluginOptsString('');
      }
    } else {
      setFormData(getDefaultFormData());
      setPluginOptsString('');
    }
    setErrors({});
  }, []);

  // Reset form to default state
  const reset = useCallback(() => {
    setFormData(getDefaultFormData());
    setErrors({});
    setPluginOptsString('');
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

  // Group toggle handler
  const handleGroupToggle = useCallback((groupSid: string) => {
    setFormData((prev) => {
      const currentGroups = prev.groupSids || [];
      const isSelected = currentGroups.includes(groupSid);
      return {
        ...prev,
        groupSids: isSelected
          ? currentGroups.filter((sid) => sid !== groupSid)
          : [...currentGroups, groupSid],
      };
    });
  }, []);

  // Plugin options string setter (exposed for UI binding)
  const handlePluginOptsChange = useCallback((value: string) => {
    setPluginOptsString(value);
  }, []);

  // Validation
  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('admin.nodes.form.validation.nameRequired');
    }

    if (!formData.agentPort || formData.agentPort < 1 || formData.agentPort > 65535) {
      newErrors.agentPort = t('admin.nodes.form.validation.portRange');
    }

    if (formData.subscriptionPort !== undefined && (formData.subscriptionPort < 1 || formData.subscriptionPort > 65535)) {
      newErrors.subscriptionPort = t('admin.nodes.form.validation.portRange');
    }

    if (!formData.protocol) {
      newErrors.protocol = t('admin.nodes.form.validation.protocolRequired');
    }

    if (formData.protocol === 'shadowsocks' && !formData.encryptionMethod) {
      newErrors.encryptionMethod = t('admin.nodes.form.validation.encryptionRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  // Build submit data from form state
  const buildSubmitData = useCallback((): CreateNodeRequest & { expiresAt?: string; costLabel?: string } => {
    const submitData: CreateNodeRequest = {
      name: formData.name.trim(),
      protocol: formData.protocol,
      serverAddress: formData.serverAddress?.trim(),
      agentPort: formData.agentPort,
      subscriptionPort: formData.subscriptionPort,
    };

    // Shadowsocks
    if (isShadowsocks && formData.encryptionMethod) {
      submitData.encryptionMethod = formData.encryptionMethod;
    }

    if (isShadowsocks) {
      const trimmedPlugin = formData.plugin?.trim();
      if (trimmedPlugin) {
        submitData.plugin = trimmedPlugin;
      }

      const trimmedPluginOpts = pluginOptsString.trim();
      if (trimmedPluginOpts) {
        try {
          const pluginOptsObj: Record<string, string> = {};
          const pairs = trimmedPluginOpts.split(';');
          for (const pair of pairs) {
            const [key, value] = pair.split('=').map(s => s.trim());
            if (key && value) {
              pluginOptsObj[key] = value;
            }
          }
          if (Object.keys(pluginOptsObj).length > 0) {
            submitData.pluginOpts = pluginOptsObj;
          }
        } catch {
          // Plugin options parsing failed, skip
        }
      }
    }

    // Trojan
    if (isTrojan) {
      submitData.transportProtocol = formData.transportProtocol;
      if (formData.sni?.trim()) {
        submitData.sni = formData.sni.trim();
      }
      if (formData.allowInsecure) {
        submitData.allowInsecure = formData.allowInsecure;
      }
      if (showWsFields) {
        if (formData.host?.trim()) {
          submitData.host = formData.host.trim();
        }
        if (formData.path?.trim()) {
          submitData.path = formData.path.trim();
        }
      }
      if (showGrpcFields && formData.host?.trim()) {
        submitData.host = formData.host.trim();
      }
    }

    // VLESS
    if (isVless) {
      submitData.vlessTransportType = formData.vlessTransportType;
      submitData.vlessSecurity = formData.vlessSecurity;
      if (formData.vlessFlow?.trim()) {
        submitData.vlessFlow = formData.vlessFlow.trim();
      }
      if (formData.vlessSni?.trim()) {
        submitData.vlessSni = formData.vlessSni.trim();
      }
      if (formData.vlessFingerprint?.trim()) {
        submitData.vlessFingerprint = formData.vlessFingerprint.trim();
      }
      if (formData.vlessAllowInsecure) {
        submitData.vlessAllowInsecure = formData.vlessAllowInsecure;
      }
      if (showVlessWsFields) {
        if (formData.vlessHost?.trim()) {
          submitData.vlessHost = formData.vlessHost.trim();
        }
        if (formData.vlessPath?.trim()) {
          submitData.vlessPath = formData.vlessPath.trim();
        }
      }
      if (showVlessGrpcFields && formData.vlessServiceName?.trim()) {
        submitData.vlessServiceName = formData.vlessServiceName.trim();
      }
      if (showVlessRealityFields) {
        if (formData.vlessRealityPublicKey?.trim()) {
          submitData.vlessRealityPublicKey = formData.vlessRealityPublicKey.trim();
        }
        if (formData.vlessRealityShortId?.trim()) {
          submitData.vlessRealityShortId = formData.vlessRealityShortId.trim();
        }
        if (formData.vlessRealitySpiderX?.trim()) {
          submitData.vlessRealitySpiderX = formData.vlessRealitySpiderX.trim();
        }
      }
    }

    // VMess
    if (isVmess) {
      submitData.vmessTransportType = formData.vmessTransportType;
      submitData.vmessSecurity = formData.vmessSecurity;
      submitData.vmessAlterId = formData.vmessAlterId ?? 0;
      submitData.vmessTls = formData.vmessTls ?? true;
      if (formData.vmessSni?.trim()) {
        submitData.vmessSni = formData.vmessSni.trim();
      }
      if (formData.vmessAllowInsecure) {
        submitData.vmessAllowInsecure = formData.vmessAllowInsecure;
      }
      if (showVmessWsFields) {
        if (formData.vmessHost?.trim()) {
          submitData.vmessHost = formData.vmessHost.trim();
        }
        if (formData.vmessPath?.trim()) {
          submitData.vmessPath = formData.vmessPath.trim();
        }
      }
      if (showVmessGrpcFields && formData.vmessServiceName?.trim()) {
        submitData.vmessServiceName = formData.vmessServiceName.trim();
      }
    }

    // Hysteria2
    if (isHysteria2) {
      submitData.hysteria2CongestionControl = formData.hysteria2CongestionControl;
      if (formData.hysteria2Obfs?.trim()) {
        submitData.hysteria2Obfs = formData.hysteria2Obfs.trim();
      }
      if (formData.hysteria2ObfsPassword?.trim()) {
        submitData.hysteria2ObfsPassword = formData.hysteria2ObfsPassword.trim();
      }
      if (formData.hysteria2UpMbps) {
        submitData.hysteria2UpMbps = formData.hysteria2UpMbps;
      }
      if (formData.hysteria2DownMbps) {
        submitData.hysteria2DownMbps = formData.hysteria2DownMbps;
      }
      if (formData.hysteria2Sni?.trim()) {
        submitData.hysteria2Sni = formData.hysteria2Sni.trim();
      }
      if (formData.hysteria2AllowInsecure) {
        submitData.hysteria2AllowInsecure = formData.hysteria2AllowInsecure;
      }
      if (formData.hysteria2Fingerprint?.trim()) {
        submitData.hysteria2Fingerprint = formData.hysteria2Fingerprint.trim();
      }
    }

    // TUIC
    if (isTuic) {
      submitData.tuicCongestionControl = formData.tuicCongestionControl;
      submitData.tuicUdpRelayMode = formData.tuicUdpRelayMode;
      if (formData.tuicAlpn?.trim()) {
        submitData.tuicAlpn = formData.tuicAlpn.trim();
      }
      if (formData.tuicSni?.trim()) {
        submitData.tuicSni = formData.tuicSni.trim();
      }
      if (formData.tuicAllowInsecure) {
        submitData.tuicAllowInsecure = formData.tuicAllowInsecure;
      }
      if (formData.tuicDisableSni) {
        submitData.tuicDisableSni = formData.tuicDisableSni;
      }
    }

    // AnyTLS
    if (isAnytls) {
      if (formData.anytlsSni?.trim()) {
        submitData.anytlsSni = formData.anytlsSni.trim();
      }
      if (formData.anytlsAllowInsecure) {
        submitData.anytlsAllowInsecure = formData.anytlsAllowInsecure;
      }
      if (formData.anytlsFingerprint?.trim()) {
        submitData.anytlsFingerprint = formData.anytlsFingerprint.trim();
      }
      if (formData.anytlsIdleSessionCheckInterval?.trim()) {
        submitData.anytlsIdleSessionCheckInterval = formData.anytlsIdleSessionCheckInterval.trim();
      }
      if (formData.anytlsIdleSessionTimeout?.trim()) {
        submitData.anytlsIdleSessionTimeout = formData.anytlsIdleSessionTimeout.trim();
      }
      if (formData.anytlsMinIdleSession !== undefined) {
        submitData.anytlsMinIdleSession = formData.anytlsMinIdleSession;
      }
    }

    // Common optional fields
    if (formData.region?.trim()) {
      submitData.region = formData.region.trim();
    }
    if (formData.sortOrder !== undefined) {
      submitData.sortOrder = formData.sortOrder;
    }

    if (formData.tagsInput?.trim()) {
      const tags = formData.tagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
      if (tags.length > 0) {
        submitData.tags = tags;
      }
    }

    if (formData.route) {
      submitData.route = formData.route;
    }

    if (formData.dns) {
      submitData.dns = formData.dns;
    }

    if (formData.groupSids && formData.groupSids.length > 0) {
      submitData.groupSids = formData.groupSids;
    }

    // Expiration fields
    const extendedSubmitData = submitData as CreateNodeRequest & { expiresAt?: string; costLabel?: string };
    if (formData.expiresAt) {
      extendedSubmitData.expiresAt = formData.expiresAt;
    }
    if (formData.costLabel) {
      extendedSubmitData.costLabel = formData.costLabel;
    }

    return extendedSubmitData;
  }, [formData, pluginOptsString, isShadowsocks, isTrojan, isVless, isVmess, isHysteria2, isTuic, isAnytls, showWsFields, showGrpcFields, showVlessWsFields, showVlessGrpcFields, showVlessRealityFields, showVmessWsFields, showVmessGrpcFields]);

  // Form validity check
  const isFormValid = Boolean(
    formData.name.trim() &&
    formData.protocol &&
    formData.agentPort &&
    (!isShadowsocks || formData.encryptionMethod)
  );

  // Protocol settings badge check
  const getHasProtocolSettings = useCallback(() => {
    if (isShadowsocks) return Boolean(formData.plugin || pluginOptsString);
    if (isTrojan) return Boolean(formData.sni || formData.host || formData.path || formData.allowInsecure);
    if (isVless) return Boolean(formData.vlessSni || formData.vlessHost || formData.vlessPath || formData.vlessFlow);
    if (isVmess) return Boolean(formData.vmessSni || formData.vmessHost || formData.vmessPath);
    if (isHysteria2) return Boolean(formData.hysteria2Sni || formData.hysteria2Obfs || formData.hysteria2UpMbps);
    if (isTuic) return Boolean(formData.tuicSni || formData.tuicAlpn);
    if (isAnytls) return Boolean(formData.anytlsSni || formData.anytlsFingerprint);
    return false;
  }, [formData, pluginOptsString, isShadowsocks, isTrojan, isVless, isVmess, isHysteria2, isTuic, isAnytls]);

  const hasProtocolSettings = getHasProtocolSettings();

  const hasOtherSettings = Boolean(
    formData.region || formData.tagsInput || formData.sortOrder ||
    (formData.groupSids && formData.groupSids.length > 0) ||
    formData.expiresAt || formData.costLabel
  );

  return {
    // Form state
    formData,
    setFormData,
    errors,
    setErrors,
    pluginOptsString,

    // Protocol flags
    isShadowsocks,
    isTrojan,
    isVless,
    isVmess,
    isHysteria2,
    isTuic,
    isAnytls,

    // Transport visibility flags
    showWsFields,
    showGrpcFields,
    showVlessWsFields,
    showVlessGrpcFields,
    showVlessRealityFields,
    showVmessWsFields,
    showVmessGrpcFields,

    // Handlers
    handleChange,
    handleRouteChange,
    handleDnsChange,
    handleCostLabelChange,
    handleGroupToggle,
    handlePluginOptsChange,
    initializeForm,
    reset,

    // Validation and submission
    validate,
    buildSubmitData,
    isFormValid,
    hasProtocolSettings,
    hasOtherSettings,
  };
}
