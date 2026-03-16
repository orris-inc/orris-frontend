/**
 * Shared form hook for Create Forward Rule Dialog/Sheet
 * Manages form state, validation, computed values, and submit data building
 * Does NOT manage loading/submitting state or call onSubmit/onClose
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { isPortInAllowedRange } from '@/shared/utils/port-utils';
import type {
  CreateForwardRuleRequest,
  ForwardAgent,
  ForwardRuleType,
  ForwardProtocol,
  IPVersion,
  TunnelType,
  ExitAgent,
  LoadBalanceStrategy,
  AddressPreference,
} from '@/api/forward';
import type { Node, RouteConfig } from '@/api/node';
import type { ResourceGroup } from '@/api/resource/types';
import type { SubscriptionPlan } from '@/api/subscription/types';

// ============================================================================
// Types
// ============================================================================

export type TargetType = 'manual' | 'node';
export type ExitMode = 'single' | 'multi';

export interface CreateForwardRuleFormData {
  agentId: string;
  ruleType: ForwardRuleType;
  exitAgentId: string;
  exitAgents: ExitAgent[];
  loadBalanceStrategy: LoadBalanceStrategy;
  chainAgentIds: string[];
  chainPortConfig: Record<string, number>;
  tunnelType: TunnelType;
  tunnelHops: number | undefined;
  name: string;
  listenPort: number;
  targetAddress: string;
  targetPort: number;
  targetNodeId: string;
  bindIp: string;
  trafficMultiplier: number | undefined;
  sortOrder: number | undefined;
  protocol: ForwardProtocol;
  ipVersion: IPVersion;
  remark: string;
  groupSids: string[];
  serverAddress: string;
  externalSource: string;
  externalRuleId: string;
  route: RouteConfig | undefined;
  addressPreference: AddressPreference;
}

export interface UseCreateForwardRuleFormOptions {
  open: boolean;
  agents: ForwardAgent[];
  nodes?: Node[];
  initialData?: Partial<CreateForwardRuleRequest> & {
    targetType?: 'manual' | 'node';
  };
  resourceGroups?: ResourceGroup[];
  plansMap?: Record<string, SubscriptionPlan>;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_FORM_DATA: CreateForwardRuleFormData = {
  agentId: '',
  ruleType: 'direct',
  exitAgentId: '',
  exitAgents: [],
  loadBalanceStrategy: 'failover',
  chainAgentIds: [],
  chainPortConfig: {},
  tunnelType: 'ws',
  tunnelHops: undefined,
  name: '',
  listenPort: 0,
  targetAddress: '',
  targetPort: 0,
  targetNodeId: '',
  bindIp: '',
  trafficMultiplier: undefined,
  sortOrder: undefined,
  protocol: 'both',
  ipVersion: 'auto',
  remark: '',
  groupSids: [],
  serverAddress: '',
  externalSource: '',
  externalRuleId: '',
  route: undefined,
  addressPreference: 'auto',
};

// Rule type keys for translation lookup
export const RULE_TYPE_KEYS: Record<ForwardRuleType, string> = {
  direct: 'direct',
  entry: 'entry',
  chain: 'chain',
  direct_chain: 'directChain',
  external: 'external',
};

// ============================================================================
// Hook
// ============================================================================

export function useCreateForwardRuleForm({
  open,
  agents,
  nodes = [],
  initialData,
  resourceGroups = [],
  plansMap = {},
}: UseCreateForwardRuleFormOptions) {
  const { t } = useTranslation();

  // Form state
  const [formData, setFormData] = useState<CreateForwardRuleFormData>(DEFAULT_FORM_DATA);
  const [targetType, setTargetType] = useState<TargetType>('manual');
  const [exitMode, setExitMode] = useState<ExitMode>('single');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form or populate with initial data when dialog/sheet opens
  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          agentId: initialData.agentId || '',
          ruleType: initialData.ruleType || 'direct',
          exitAgentId: initialData.exitAgentId || '',
          exitAgents: initialData.exitAgents || [],
          loadBalanceStrategy: initialData.loadBalanceStrategy || 'failover',
          chainAgentIds: initialData.chainAgentIds || [],
          chainPortConfig: initialData.chainPortConfig || {},
          tunnelType: initialData.tunnelType || 'ws',
          tunnelHops: initialData.tunnelHops,
          name: initialData.name || '',
          listenPort: initialData.listenPort || 0,
          targetAddress: initialData.targetAddress || '',
          targetPort: initialData.targetPort || 0,
          targetNodeId: initialData.targetNodeId || '',
          bindIp: initialData.bindIp || '',
          trafficMultiplier: initialData.trafficMultiplier,
          sortOrder: initialData.sortOrder,
          protocol: initialData.protocol || 'both',
          ipVersion: initialData.ipVersion || 'auto',
          remark: initialData.remark || '',
          groupSids: initialData.groupSids || [],
          serverAddress:
            (initialData as Record<string, unknown>).serverAddress as string || '',
          externalSource:
            (initialData as Record<string, unknown>).externalSource as string || '',
          externalRuleId:
            (initialData as Record<string, unknown>).externalRuleId as string || '',
          route: initialData.route,
          addressPreference: (initialData as Record<string, unknown>).addressPreference as AddressPreference || 'auto',
        });
        setTargetType(
          initialData.targetType || (initialData.targetNodeId ? 'node' : 'manual'),
        );
        setExitMode(
          initialData.exitAgents && initialData.exitAgents.length > 0 ? 'multi' : 'single',
        );
      } else {
        setFormData({ ...DEFAULT_FORM_DATA });
        setTargetType('manual');
        setExitMode('single');
      }
      setErrors({});
    }
  }, [open, initialData]);

  // Handle field change with auto-cleanup of chain conflicts
  const handleChange = useCallback(
    (field: string, value: string | number | string[] | undefined) => {
      setFormData((prev) => {
        const newData = { ...prev, [field]: value };

        // Remove entry agent from chain list if selected as entry
        if (field === 'agentId' && typeof value === 'string') {
          const currentChainIds = prev.chainAgentIds || [];
          if (currentChainIds.includes(value)) {
            newData.chainAgentIds = currentChainIds.filter((id: string) => id !== value);
            if (prev.chainPortConfig[value]) {
              const newPortConfig = { ...prev.chainPortConfig };
              delete newPortConfig[value];
              newData.chainPortConfig = newPortConfig;
            }
          }
        }

        return newData;
      });

      if (Object.keys(errors).length > 0) {
        setErrors({});
      }
    },
    [errors],
  );

  // Handle chain node port configuration change
  const handleChainPortChange = useCallback((agentId: string, port: number) => {
    setFormData((prev) => ({
      ...prev,
      chainPortConfig: {
        ...prev.chainPortConfig,
        [agentId]: port,
      },
    }));
  }, []);

  // Handle resource group toggle
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

  // Handle exit mode change
  const handleExitModeChange = useCallback(
    (mode: ExitMode) => {
      setExitMode(mode);
      if (mode === 'single') {
        setFormData((prev) => ({ ...prev, exitAgents: [] }));
      } else {
        handleChange('exitAgentId', '');
      }
    },
    [handleChange],
  );

  // Handle target type change
  const handleTargetTypeChange = useCallback(
    (type: TargetType) => {
      setTargetType(type);
      if (type === 'manual') {
        handleChange('targetNodeId', '');
      } else {
        handleChange('targetAddress', '');
        handleChange('targetPort', 0);
      }
    },
    [handleChange],
  );

  // Handle exit agents change (for multi mode)
  const handleExitAgentsChange = useCallback((exitAgents: ExitAgent[]) => {
    setFormData((prev) => ({ ...prev, exitAgents }));
  }, []);

  // Handle load balance strategy change
  const handleLoadBalanceStrategyChange = useCallback((strategy: LoadBalanceStrategy) => {
    setFormData((prev) => ({ ...prev, loadBalanceStrategy: strategy }));
  }, []);

  // Handle route config change
  const handleRouteChange = useCallback((route: RouteConfig | undefined) => {
    setFormData((prev) => ({ ...prev, route }));
  }, []);

  // Handle chain selection change with port config cleanup
  const handleChainSelectionChange = useCallback(
    (ids: string[]) => {
      const newPortConfig = { ...formData.chainPortConfig };
      Object.keys(newPortConfig).forEach((id) => {
        if (!ids.includes(id)) {
          delete newPortConfig[id];
        }
      });
      setFormData((prev) => ({
        ...prev,
        chainAgentIds: ids,
        chainPortConfig: newPortConfig,
      }));
    },
    [formData.chainPortConfig],
  );

  // Computed: available agents (enabled or already selected)
  const availableAgentsForSelect = useMemo(
    () =>
      agents.filter(
        (a) =>
          a.status === 'enabled' ||
          a.id === formData.agentId ||
          a.id === formData.exitAgentId ||
          formData.chainAgentIds.includes(a.id),
      ),
    [agents, formData.agentId, formData.exitAgentId, formData.chainAgentIds],
  );

  // Computed: exit agents exclude current entry agent
  const availableExitAgents = useMemo(
    () => availableAgentsForSelect.filter((a) => a.id !== formData.agentId),
    [availableAgentsForSelect, formData.agentId],
  );

  // Computed: chain agents exclude current entry agent
  const availableChainAgents = useMemo(
    () => availableAgentsForSelect.filter((a) => a.id !== formData.agentId),
    [availableAgentsForSelect, formData.agentId],
  );

  // Computed: available nodes (active or already selected)
  const availableNodes = useMemo(
    () => nodes.filter((n) => n.status === 'active' || n.id === formData.targetNodeId),
    [nodes, formData.targetNodeId],
  );

  // Computed: available resource groups (active, node/hybrid plan type)
  const availableResourceGroups = useMemo(
    () =>
      resourceGroups.filter((group) => {
        const plan = plansMap[group.planId];
        return (
          group.status === 'active' &&
          plan &&
          (plan.planType === 'node' || plan.planType === 'hybrid')
        );
      }),
    [resourceGroups, plansMap],
  );

  // Computed: selected agent reference
  const selectedAgent = useMemo(
    () => agents.find((a) => a.id === formData.agentId),
    [agents, formData.agentId],
  );

  // Computed: selected exit agent reference
  const selectedExitAgent = useMemo(
    () => agents.find((a) => a.id === formData.exitAgentId),
    [agents, formData.exitAgentId],
  );

  // Validation
  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    // External rule type has different validation
    if (formData.ruleType === 'external') {
      if (!formData.name.trim()) {
        newErrors.name = t('admin.forwardRules.validation.ruleNameRequired');
      }
      if (!formData.serverAddress.trim()) {
        newErrors.serverAddress = t('admin.forwardRules.validation.serverAddressRequired');
      }
      if (!formData.listenPort || formData.listenPort < 1 || formData.listenPort > 65535) {
        newErrors.listenPort = t('admin.forwardRules.validation.listenPortRange');
      }
      if (!formData.targetNodeId) {
        newErrors.targetNodeId = t('admin.forwardRules.validation.selectTargetNode');
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    if (!formData.agentId) {
      newErrors.agentId = t('admin.forwardRules.validation.selectForwardAgent');
    }
    if (!formData.name.trim()) {
      newErrors.name = t('admin.forwardRules.validation.ruleNameRequired');
    }
    if (!formData.protocol) {
      newErrors.protocol = t('admin.forwardRules.validation.protocolRequired');
    }

    const currentAgent = agents.find((a) => a.id === formData.agentId);

    // Listen port validation (shared across direct, entry, chain, direct_chain)
    if (formData.listenPort && (formData.listenPort < 1 || formData.listenPort > 65535)) {
      newErrors.listenPort = t('admin.forwardRules.validation.listenPortRange');
    } else if (
      formData.listenPort &&
      currentAgent?.allowedPortRange &&
      !isPortInAllowedRange(formData.listenPort, currentAgent.allowedPortRange)
    ) {
      newErrors.listenPort = t('admin.forwardRules.validation.portNotInRange', {
        port: formData.listenPort,
        range: currentAgent.allowedPortRange,
      });
    }

    // Entry type: exit agent validation
    if (formData.ruleType === 'entry') {
      if (exitMode === 'single') {
        if (!formData.exitAgentId) {
          newErrors.exitAgentId = t('admin.forwardRules.validation.selectExitNode');
        }
      } else {
        if (!formData.exitAgents || formData.exitAgents.length === 0) {
          newErrors.exitAgents = t('admin.forwardRules.validation.selectExitNode');
        }
      }
    }

    // Chain/direct_chain: chain agents validation
    if (
      (formData.ruleType === 'chain' || formData.ruleType === 'direct_chain') &&
      (!formData.chainAgentIds || formData.chainAgentIds.length === 0)
    ) {
      newErrors.chainAgentIds = t('admin.forwardRules.validation.selectAtLeastOneNode');
    }

    // Chain type with tunnelHops: port config validation for direct hops
    if (
      formData.ruleType === 'chain' &&
      formData.tunnelHops !== undefined &&
      formData.tunnelHops >= 0 &&
      formData.tunnelHops < formData.chainAgentIds.length
    ) {
      const missingPorts: string[] = [];
      for (let i = formData.tunnelHops; i < formData.chainAgentIds.length; i++) {
        const agentId = formData.chainAgentIds[i];
        const port = formData.chainPortConfig[agentId];
        if (!port || port < 1 || port > 65535) {
          const agent = agents.find((a) => a.id === agentId);
          missingPorts.push(agent ? agent.name : agentId);
        }
      }
      if (missingPorts.length > 0) {
        newErrors.chainPortConfig = t(
          'admin.forwardRules.validation.configurePortsForNodes',
          { nodes: missingPorts.join(', ') },
        );
      }
    }

    // Direct_chain type: all chain nodes need port config
    if (formData.ruleType === 'direct_chain' && formData.chainAgentIds.length > 0) {
      const missingPorts: string[] = [];
      for (const agentId of formData.chainAgentIds) {
        const port = formData.chainPortConfig[agentId];
        if (!port || port < 1 || port > 65535) {
          const agent = agents.find((a) => a.id === agentId);
          missingPorts.push(agent ? agent.name : agentId);
        }
      }
      if (missingPorts.length > 0) {
        if (missingPorts.length === formData.chainAgentIds.length) {
          newErrors.chainPortConfig = t('admin.forwardRules.validation.configureValidPorts');
        } else {
          newErrors.chainPortConfig = t(
            'admin.forwardRules.validation.configurePortsForNodes',
            { nodes: missingPorts.join(', ') },
          );
        }
      }
    }

    // Target validation (shared across direct, entry, chain, direct_chain)
    if (
      formData.ruleType === 'direct' ||
      formData.ruleType === 'entry' ||
      formData.ruleType === 'chain' ||
      formData.ruleType === 'direct_chain'
    ) {
      if (targetType === 'manual') {
        if (!formData.targetAddress.trim()) {
          newErrors.targetAddress = t('admin.forwardRules.validation.targetAddressRequired');
        }
        if (!formData.targetPort || formData.targetPort < 1 || formData.targetPort > 65535) {
          newErrors.targetPort = t('admin.forwardRules.validation.targetPortRange');
        }
      } else if (targetType === 'node') {
        if (!formData.targetNodeId) {
          newErrors.targetNodeId = t('admin.forwardRules.validation.selectTargetNode');
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, targetType, exitMode, agents, t]);

  // Quick validity check (no error messages, for button disabled state)
  const isFormValid = useMemo(() => {
    if (formData.ruleType === 'external') {
      return (
        formData.name.trim() !== '' &&
        formData.serverAddress.trim() !== '' &&
        formData.listenPort > 0 &&
        formData.listenPort <= 65535 &&
        !!formData.targetNodeId
      );
    }

    if (!formData.agentId || !formData.name.trim() || !formData.protocol) return false;

    // Entry type: exit agent check
    if (formData.ruleType === 'entry') {
      if (exitMode === 'single') {
        if (!formData.exitAgentId) return false;
      } else {
        if (!formData.exitAgents || formData.exitAgents.length === 0) return false;
      }
    }

    // Chain/direct_chain: chain agents check
    if (
      (formData.ruleType === 'chain' || formData.ruleType === 'direct_chain') &&
      formData.chainAgentIds.length === 0
    ) {
      return false;
    }

    // Chain type with tunnelHops: port config check
    if (
      formData.ruleType === 'chain' &&
      formData.tunnelHops !== undefined &&
      formData.tunnelHops >= 0 &&
      formData.tunnelHops < formData.chainAgentIds.length
    ) {
      for (let i = formData.tunnelHops; i < formData.chainAgentIds.length; i++) {
        const agentId = formData.chainAgentIds[i];
        const port = formData.chainPortConfig[agentId];
        if (!port || port <= 0 || port > 65535) return false;
      }
    }

    // Direct_chain: all ports required
    if (formData.ruleType === 'direct_chain') {
      const allPortsValid = formData.chainAgentIds.every((id) => {
        const port = formData.chainPortConfig[id];
        return port && port > 0 && port <= 65535;
      });
      if (!allPortsValid) return false;
    }

    // Target check for non-external types
    if (
      formData.ruleType === 'direct' ||
      formData.ruleType === 'entry' ||
      formData.ruleType === 'chain' ||
      formData.ruleType === 'direct_chain'
    ) {
      if (targetType === 'manual') {
        return formData.targetAddress.trim() !== '' && formData.targetPort > 0;
      } else {
        return !!formData.targetNodeId;
      }
    }

    return false;
  }, [formData, targetType, exitMode]);

  // Build submit data from current form state
  const buildSubmitData = useCallback((): CreateForwardRuleRequest => {
    // External rule type
    if (formData.ruleType === 'external') {
      return {
        ruleType: formData.ruleType,
        name: formData.name.trim(),
        serverAddress: formData.serverAddress.trim(),
        listenPort: formData.listenPort,
        targetNodeId: formData.targetNodeId,
        externalSource: formData.externalSource?.trim() || undefined,
        externalRuleId: formData.externalRuleId?.trim() || undefined,
        sortOrder:
          formData.sortOrder !== undefined && formData.sortOrder !== null && formData.sortOrder >= 0
            ? formData.sortOrder
            : undefined,
        remark: formData.remark?.trim() || undefined,
        groupSids: formData.groupSids && formData.groupSids.length > 0 ? formData.groupSids : undefined,
      };
    }

    // Base fields for non-external types
    const submitData: CreateForwardRuleRequest = {
      agentId: formData.agentId,
      ruleType: formData.ruleType,
      name: formData.name.trim(),
      protocol: formData.protocol,
      ipVersion: formData.ipVersion,
    };

    // Listen port (optional, 0 = auto-assign)
    if (formData.listenPort) {
      submitData.listenPort = formData.listenPort;
    }

    // Rule type specific fields
    if (formData.ruleType === 'entry') {
      if (exitMode === 'single') {
        submitData.exitAgentId = formData.exitAgentId;
      } else {
        submitData.exitAgents = formData.exitAgents;
        submitData.loadBalanceStrategy = formData.loadBalanceStrategy;
      }
      submitData.tunnelType = formData.tunnelType;
    } else if (formData.ruleType === 'chain') {
      submitData.chainAgentIds = formData.chainAgentIds;
      submitData.tunnelType = formData.tunnelType;
      if (formData.tunnelHops !== undefined && formData.tunnelHops !== null && formData.tunnelHops >= 0) {
        submitData.tunnelHops = formData.tunnelHops;
        if (
          formData.tunnelHops < formData.chainAgentIds.length &&
          Object.keys(formData.chainPortConfig).length > 0
        ) {
          submitData.chainPortConfig = formData.chainPortConfig;
        }
      }
    } else if (formData.ruleType === 'direct_chain') {
      submitData.chainAgentIds = formData.chainAgentIds;
      submitData.chainPortConfig = formData.chainPortConfig;
    }

    // Target configuration
    if (targetType === 'manual') {
      submitData.targetAddress = formData.targetAddress.trim();
      submitData.targetPort = formData.targetPort;
    } else {
      submitData.targetNodeId = formData.targetNodeId;
    }

    // Optional advanced fields
    if (formData.bindIp?.trim()) {
      submitData.bindIp = formData.bindIp.trim();
    }
    if (
      formData.trafficMultiplier !== undefined &&
      formData.trafficMultiplier !== null &&
      formData.trafficMultiplier > 0
    ) {
      submitData.trafficMultiplier = formData.trafficMultiplier;
    }
    if (
      formData.sortOrder !== undefined &&
      formData.sortOrder !== null &&
      formData.sortOrder >= 0
    ) {
      submitData.sortOrder = formData.sortOrder;
    }
    if (formData.remark?.trim()) {
      submitData.remark = formData.remark.trim();
    }
    if (formData.groupSids && formData.groupSids.length > 0) {
      submitData.groupSids = formData.groupSids;
    }
    if (formData.route) {
      submitData.route = formData.route;
    }
    if (formData.addressPreference && formData.addressPreference !== 'auto') {
      submitData.addressPreference = formData.addressPreference;
    }

    return submitData;
  }, [formData, targetType, exitMode]);

  // Reset form to defaults
  const reset = useCallback(() => {
    setFormData({ ...DEFAULT_FORM_DATA });
    setTargetType('manual');
    setExitMode('single');
    setErrors({});
  }, []);

  return {
    // Form state
    formData,
    setFormData,
    targetType,
    setTargetType,
    exitMode,
    setExitMode,
    errors,

    // Handlers
    handleChange,
    handleChainPortChange,
    handleGroupToggle,
    handleExitModeChange,
    handleTargetTypeChange,
    handleExitAgentsChange,
    handleLoadBalanceStrategyChange,
    handleChainSelectionChange,
    handleRouteChange,

    // Computed values
    availableAgentsForSelect,
    availableExitAgents,
    availableChainAgents,
    availableNodes,
    availableResourceGroups,
    selectedAgent,
    selectedExitAgent,

    // Actions
    validate,
    buildSubmitData,
    isFormValid,
    reset,
  };
}
