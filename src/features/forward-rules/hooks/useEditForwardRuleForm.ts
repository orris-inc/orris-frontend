/**
 * Shared form hook for Edit Forward Rule Dialog/Sheet
 * Manages form state, validation, computed values, and change detection
 * Does NOT manage loading/submitting state or call onSubmit/onClose
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { isPortInAllowedRange } from '@/shared/utils/port-utils';
import type {
  ForwardRule,
  UpdateForwardRuleRequest,
  ForwardAgent,
  ForwardProtocol,
  TunnelType,
  ExitAgent,
  LoadBalanceStrategy,
} from '@/api/forward';
import type { Node, RouteConfig } from '@/api/node';
import type { ResourceGroup } from '@/api/resource/types';
import type { SubscriptionPlan } from '@/api/subscription/types';

// ============================================================================
// Types
// ============================================================================

export type TargetType = 'manual' | 'node';
export type ExitMode = 'single' | 'multi';

export interface EditForwardRuleFormData extends UpdateForwardRuleRequest {
  chainAgentIds?: string[];
  chainPortConfig?: Record<string, number>;
  trafficMultiplier?: number;
  sortOrder?: number;
  tunnelType?: TunnelType;
  tunnelHops?: number;
  groupSids?: string[];
  exitAgents?: ExitAgent[];
  loadBalanceStrategy?: LoadBalanceStrategy;
  serverAddress?: string;
  externalSource?: string;
  externalRuleId?: string;
  route?: RouteConfig;
}

export interface UseEditForwardRuleFormOptions {
  rule: ForwardRule | null;
  agents?: ForwardAgent[];
  nodes?: Node[];
  resourceGroups?: ResourceGroup[];
  plansMap?: Record<string, SubscriptionPlan>;
}

// ============================================================================
// Hook
// ============================================================================

export function useEditForwardRuleForm({
  rule,
  agents = [],
  nodes = [],
  resourceGroups = [],
  plansMap = {},
}: UseEditForwardRuleFormOptions) {
  const { t } = useTranslation();

  // Form state
  const [formData, setFormData] = useState<EditForwardRuleFormData>({});
  const [targetType, setTargetType] = useState<TargetType>('manual');
  const [exitMode, setExitMode] = useState<ExitMode>('single');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form from rule data
  useEffect(() => {
    if (rule) {
      // Filter out entry agent from chain nodes
      const chainAgentIds = (rule.chainAgentIds || []).filter((id) => id !== rule.agentId);
      const chainPortConfig = { ...(rule.chainPortConfig || {}) };
      if (chainPortConfig[rule.agentId]) {
        delete chainPortConfig[rule.agentId];
      }

      setFormData({
        name: rule.name,
        protocol: rule.protocol,
        listenPort: rule.listenPort,
        targetAddress: rule.targetAddress,
        targetPort: rule.targetPort,
        targetNodeId: rule.targetNodeId,
        bindIp: rule.bindIp,
        ipVersion: rule.ipVersion,
        remark: rule.remark,
        agentId: rule.agentId,
        exitAgentId: rule.exitAgentId,
        exitAgents: rule.exitAgents || [],
        loadBalanceStrategy: rule.loadBalanceStrategy || 'failover',
        chainAgentIds,
        chainPortConfig,
        trafficMultiplier: rule.trafficMultiplier,
        sortOrder: rule.sortOrder,
        tunnelType: rule.tunnelType,
        tunnelHops: rule.tunnelHops,
        groupSids: rule.groupSids || [],
        serverAddress: rule.serverAddress,
        externalSource: rule.externalSource,
        externalRuleId: rule.externalRuleId,
        route: rule.route,
      });
      setTargetType(rule.targetNodeId ? 'node' : 'manual');
      setExitMode(rule.exitAgents && rule.exitAgents.length > 0 ? 'multi' : 'single');
      setErrors({});
    }
  }, [rule]);

  // Handle field change with auto-cleanup of chain conflicts
  const handleChange = useCallback(
    (
      field: keyof (UpdateForwardRuleRequest & { chainAgentIds?: string[] }),
      value: string | number | ForwardProtocol | string[] | undefined,
    ) => {
      setFormData((prev) => {
        const newData = { ...prev, [field]: value };

        // Remove entry agent from chain list if selected as entry
        if (field === 'agentId' && typeof value === 'string') {
          const currentChainIds = prev.chainAgentIds || [];
          if (currentChainIds.includes(value)) {
            newData.chainAgentIds = currentChainIds.filter((id) => id !== value);
            if (prev.chainPortConfig?.[value]) {
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
        ...(prev.chainPortConfig || {}),
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
      const newPortConfig = { ...(formData.chainPortConfig || {}) };
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
  const availableAgents = useMemo(
    () =>
      agents.filter(
        (a) =>
          a.status === 'enabled' ||
          a.id === formData.agentId ||
          a.id === formData.exitAgentId ||
          (formData.chainAgentIds || []).includes(a.id),
      ),
    [agents, formData.agentId, formData.exitAgentId, formData.chainAgentIds],
  );

  // Computed: exit agents exclude current entry agent
  const availableExitAgents = useMemo(
    () => availableAgents.filter((a) => a.id !== formData.agentId),
    [availableAgents, formData.agentId],
  );

  // Computed: chain agents exclude current entry agent
  const availableChainAgents = useMemo(
    () => availableAgents.filter((a) => a.id !== formData.agentId),
    [availableAgents, formData.agentId],
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

  // Validation
  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (formData.name !== undefined && !formData.name.trim()) {
      newErrors.name = t('admin.forwardRules.validation.ruleNameRequired');
    }

    // External type has different validation
    if (rule?.ruleType === 'external') {
      if (formData.serverAddress !== undefined && !formData.serverAddress.trim()) {
        newErrors.serverAddress = t('admin.forwardRules.validation.serverAddressRequired');
      }
      if (formData.listenPort && (formData.listenPort < 1 || formData.listenPort > 65535)) {
        newErrors.listenPort = t('admin.forwardRules.validation.listenPortRange');
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    const currentAgent = agents.find((a) => a.id === formData.agentId);

    // Listen port validation
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

    // Target validation for direct, entry, chain, direct_chain
    if (
      rule &&
      (rule.ruleType === 'direct' ||
        rule.ruleType === 'entry' ||
        rule.ruleType === 'chain' ||
        rule.ruleType === 'direct_chain')
    ) {
      if (targetType === 'manual') {
        if (formData.targetAddress !== undefined && !formData.targetAddress.trim()) {
          newErrors.targetAddress = t('admin.forwardRules.validation.targetAddressRequired');
        }
        if (
          formData.targetPort !== undefined &&
          (formData.targetPort < 1 || formData.targetPort > 65535)
        ) {
          newErrors.targetPort = t('admin.forwardRules.validation.targetPortRange');
        }
      } else if (targetType === 'node') {
        if (!formData.targetNodeId) {
          newErrors.targetNodeId = t('admin.forwardRules.validation.selectTargetNode');
        }
      }
    }

    // direct_chain: validate port config for all chain nodes
    if (rule && rule.ruleType === 'direct_chain') {
      const chainIds = formData.chainAgentIds || [];
      const missingPorts: string[] = [];
      for (const agentId of chainIds) {
        const port = formData.chainPortConfig?.[agentId];
        if (!port || port < 1 || port > 65535) {
          const agent = agents.find((a) => a.id === agentId);
          missingPorts.push(agent ? agent.name : agentId);
        }
      }
      if (missingPorts.length > 0) {
        if (missingPorts.length === chainIds.length) {
          newErrors.chainPortConfig = t('admin.forwardRules.validation.configureValidPorts');
        } else {
          newErrors.chainPortConfig = t(
            'admin.forwardRules.validation.configurePortsForNodes',
            { nodes: missingPorts.join(', ') },
          );
        }
      }
    }

    // chain type with tunnelHops: validate port config for direct hops
    if (
      rule &&
      rule.ruleType === 'chain' &&
      formData.tunnelHops !== undefined &&
      formData.tunnelHops >= 0
    ) {
      const chainIds = formData.chainAgentIds || [];
      if (formData.tunnelHops < chainIds.length) {
        const missingPorts: string[] = [];
        for (let i = formData.tunnelHops; i < chainIds.length; i++) {
          const agentId = chainIds[i];
          const port = formData.chainPortConfig?.[agentId];
          if (!port || port < 1 || port > 65535) {
            const agent = agents.find((a) => a.id === agentId);
            missingPorts.push(agent ? agent.name : agentId);
          }
        }
        if (missingPorts.length > 0) {
          const totalNodes = chainIds.length - formData.tunnelHops;
          if (missingPorts.length === totalNodes) {
            newErrors.chainPortConfig = t(
              'admin.forwardRules.validation.configureValidPortsForDirectNodes',
            );
          } else {
            newErrors.chainPortConfig = t(
              'admin.forwardRules.validation.configurePortsForNodes',
              { nodes: missingPorts.join(', ') },
            );
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, rule, targetType, agents, t]);

  // Build submit data (only changed fields) from current form state
  const buildSubmitData = useCallback((): UpdateForwardRuleRequest => {
    if (!rule) return {};

    const updates: UpdateForwardRuleRequest = {};

    if (formData.name !== rule.name) updates.name = formData.name;
    if (formData.remark !== rule.remark) updates.remark = formData.remark;

    // External type has different fields
    if (rule.ruleType === 'external') {
      if (formData.listenPort !== rule.listenPort) updates.listenPort = formData.listenPort;
      if (formData.serverAddress !== rule.serverAddress) {
        (updates as Record<string, unknown>).serverAddress = formData.serverAddress;
      }
      if (formData.targetNodeId !== rule.targetNodeId) {
        updates.targetNodeId = formData.targetNodeId || undefined;
      }
      if (formData.externalSource !== rule.externalSource) {
        (updates as Record<string, unknown>).externalSource = formData.externalSource;
      }
      if (formData.externalRuleId !== rule.externalRuleId) {
        (updates as Record<string, unknown>).externalRuleId = formData.externalRuleId;
      }
      if (formData.sortOrder !== rule.sortOrder && formData.sortOrder !== undefined) {
        updates.sortOrder = formData.sortOrder;
      }
      // Resource groups
      const currentGroups = formData.groupSids || [];
      const originalGroups = rule.groupSids || [];
      const hasGroupsChange =
        currentGroups.length !== originalGroups.length ||
        currentGroups.some((sid) => !originalGroups.includes(sid)) ||
        originalGroups.some((sid) => !currentGroups.includes(sid));
      if (hasGroupsChange) updates.groupSids = currentGroups;

      return updates;
    }

    // Non-external fields
    if (formData.protocol !== rule.protocol) updates.protocol = formData.protocol;
    if (formData.listenPort !== rule.listenPort) updates.listenPort = formData.listenPort;
    if (formData.ipVersion !== rule.ipVersion) updates.ipVersion = formData.ipVersion;
    if (formData.bindIp !== rule.bindIp) updates.bindIp = formData.bindIp;
    if (formData.agentId !== rule.agentId) updates.agentId = formData.agentId;

    // Entry type: exit agent(s)
    if (rule.ruleType === 'entry') {
      if (exitMode === 'single') {
        if (formData.exitAgentId !== rule.exitAgentId) {
          updates.exitAgentId = formData.exitAgentId;
        }
        // If switching from multi to single, clear exitAgents
        if (rule.exitAgents && rule.exitAgents.length > 0) {
          updates.exitAgents = [];
          updates.loadBalanceStrategy = undefined;
        }
      } else {
        // Multi mode
        const currentAgents = formData.exitAgents || [];
        const originalAgents = rule.exitAgents || [];
        const hasExitAgentsChange =
          currentAgents.length !== originalAgents.length ||
          currentAgents.some(
            (ea, i) =>
              !originalAgents[i] ||
              ea.agentId !== originalAgents[i].agentId ||
              ea.weight !== originalAgents[i].weight,
          );
        if (hasExitAgentsChange) {
          updates.exitAgents = currentAgents;
        }
        if (formData.loadBalanceStrategy !== rule.loadBalanceStrategy) {
          updates.loadBalanceStrategy = formData.loadBalanceStrategy;
        }
        // If switching from single to multi, clear exitAgentId
        if (rule.exitAgentId) {
          updates.exitAgentId = undefined;
        }
      }
    }

    // Entry and chain: tunnel type
    if (
      (rule.ruleType === 'entry' || rule.ruleType === 'chain') &&
      formData.tunnelType !== rule.tunnelType
    ) {
      updates.tunnelType = formData.tunnelType;
    }

    // Chain: tunnel hops
    if (rule.ruleType === 'chain' && formData.tunnelHops !== rule.tunnelHops) {
      updates.tunnelHops = formData.tunnelHops;
    }

    // Chain and direct_chain: chain agents and port config
    if (rule.ruleType === 'chain' || rule.ruleType === 'direct_chain') {
      const currentIds = formData.chainAgentIds || [];
      const originalIds = rule.chainAgentIds || [];
      const hasChainChange =
        currentIds.length !== originalIds.length ||
        currentIds.some((id, index) => id !== originalIds[index]);
      if (hasChainChange) {
        updates.chainAgentIds = currentIds;
      }

      if (
        rule.ruleType === 'direct_chain' ||
        (rule.ruleType === 'chain' && formData.tunnelHops !== undefined && formData.tunnelHops >= 0)
      ) {
        const currentPortConfig = formData.chainPortConfig || {};
        const originalPortConfig = rule.chainPortConfig || {};
        const hasPortConfigChange =
          Object.keys(currentPortConfig).length !== Object.keys(originalPortConfig).length ||
          Object.entries(currentPortConfig).some(([id, port]) => originalPortConfig[id] !== port);
        if (hasPortConfigChange) {
          updates.chainPortConfig = currentPortConfig;
        }
      }
    }

    // Target configuration
    if (
      rule.ruleType === 'direct' ||
      rule.ruleType === 'entry' ||
      rule.ruleType === 'chain' ||
      rule.ruleType === 'direct_chain'
    ) {
      if (targetType === 'manual') {
        if (formData.targetAddress !== rule.targetAddress) {
          updates.targetAddress = formData.targetAddress;
        }
        if (formData.targetPort !== rule.targetPort) {
          updates.targetPort = formData.targetPort;
        }
        // If switching from node to manual, clear targetNodeId
        if (rule.targetNodeId) updates.targetNodeId = undefined;
      } else {
        if (formData.targetNodeId !== rule.targetNodeId) {
          updates.targetNodeId = formData.targetNodeId;
        }
        // If switching from manual to node, clear address and port
        if (rule.targetAddress) updates.targetAddress = undefined;
        if (rule.targetPort) updates.targetPort = undefined;
      }
    }

    // Traffic multiplier
    if (formData.trafficMultiplier !== rule.trafficMultiplier) {
      updates.trafficMultiplier = formData.trafficMultiplier;
    }

    // Sort order
    if (formData.sortOrder !== rule.sortOrder && formData.sortOrder !== undefined) {
      updates.sortOrder = formData.sortOrder;
    }

    // Resource groups
    const currentGroups = formData.groupSids || [];
    const originalGroups = rule.groupSids || [];
    const hasGroupsChange =
      currentGroups.length !== originalGroups.length ||
      currentGroups.some((sid) => !originalGroups.includes(sid)) ||
      originalGroups.some((sid) => !currentGroups.includes(sid));
    if (hasGroupsChange) {
      updates.groupSids = currentGroups;
    }

    // Route config
    const hasRouteChange = JSON.stringify(formData.route) !== JSON.stringify(rule.route);
    if (hasRouteChange) {
      if (formData.route) {
        updates.route = formData.route;
      } else if (rule.route) {
        updates.clearRoute = true;
      }
    }

    return updates;
  }, [formData, rule, targetType, exitMode]);

  // Check if form has any changes compared to original rule
  const hasChanges = useMemo(() => {
    if (!rule) return false;
    const updates = buildSubmitData();
    return Object.keys(updates).length > 0;
  }, [rule, buildSubmitData]);

  // Reset form to rule data
  const reset = useCallback(() => {
    if (rule) {
      const chainAgentIds = (rule.chainAgentIds || []).filter((id) => id !== rule.agentId);
      const chainPortConfig = { ...(rule.chainPortConfig || {}) };
      if (chainPortConfig[rule.agentId]) delete chainPortConfig[rule.agentId];

      setFormData({
        name: rule.name,
        protocol: rule.protocol,
        listenPort: rule.listenPort,
        targetAddress: rule.targetAddress,
        targetPort: rule.targetPort,
        targetNodeId: rule.targetNodeId,
        bindIp: rule.bindIp,
        ipVersion: rule.ipVersion,
        remark: rule.remark,
        agentId: rule.agentId,
        exitAgentId: rule.exitAgentId,
        exitAgents: rule.exitAgents || [],
        loadBalanceStrategy: rule.loadBalanceStrategy || 'failover',
        chainAgentIds,
        chainPortConfig,
        trafficMultiplier: rule.trafficMultiplier,
        sortOrder: rule.sortOrder,
        tunnelType: rule.tunnelType,
        tunnelHops: rule.tunnelHops,
        groupSids: rule.groupSids || [],
        serverAddress: rule.serverAddress,
        externalSource: rule.externalSource,
        externalRuleId: rule.externalRuleId,
        route: rule.route,
      });
      setTargetType(rule.targetNodeId ? 'node' : 'manual');
      setExitMode(rule.exitAgents && rule.exitAgents.length > 0 ? 'multi' : 'single');
      setErrors({});
    }
  }, [rule]);

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
    availableAgents,
    availableExitAgents,
    availableChainAgents,
    availableNodes,
    availableResourceGroups,
    selectedAgent,

    // Actions
    validate,
    buildSubmitData,
    hasChanges,
    reset,
  };
}
