/**
 * Edit Forward Rule Dialog Component
 * Supports targetNodeId (dynamic node address resolution)
 */

import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { formatDateTime } from '@/shared/utils/date-utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/common/Dialog";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Textarea } from "@/components/common/Textarea";
import { Label } from "@/components/common/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common/Select";
import { RadioGroup, RadioGroupItem } from "@/components/common/RadioGroup";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/common/Accordion";
import { Badge } from "@/components/common/Badge";
import { Checkbox } from "@/components/common/Checkbox";
import { ScrollArea } from "@/components/common/ScrollArea";
import { Info, FolderTree } from "lucide-react";
import { SortableChainAgentList } from "./SortableChainAgentList";
import type {
  ForwardRule,
  UpdateForwardRuleRequest,
  IPVersion,
  ForwardAgent,
  TunnelType,
} from "@/api/forward";
import type { Node } from "@/api/node";
import type { ResourceGroup } from "@/api/resource/types";
import type { SubscriptionPlan } from "@/api/subscription/types";

type ForwardProtocol = "tcp" | "udp" | "both";
type TargetType = "manual" | "node";

/**
 * Check if a port is within the allowed port range
 * @param port - Port number to check
 * @param allowedPortRange - Allowed port range string (e.g., "80,443,8000-9000")
 * @returns true if port is allowed, false otherwise
 */
const isPortInAllowedRange = (
  port: number,
  allowedPortRange: string | undefined,
): boolean => {
  // If no restriction, all ports are allowed
  if (!allowedPortRange || allowedPortRange.trim() === "") {
    return true;
  }

  const parts = allowedPortRange.split(",").map((p) => p.trim());
  for (const part of parts) {
    if (part.includes("-")) {
      // Range format: "8000-9000"
      const [start, end] = part.split("-").map((n) => parseInt(n.trim(), 10));
      if (!isNaN(start) && !isNaN(end) && port >= start && port <= end) {
        return true;
      }
    } else {
      // Single port: "80"
      const singlePort = parseInt(part, 10);
      if (!isNaN(singlePort) && port === singlePort) {
        return true;
      }
    }
  }
  return false;
};

// Rule type keys for translation lookup
const RULE_TYPE_KEYS: Record<string, string> = {
  direct: "direct",
  entry: "entry",
  chain: "chain",
  direct_chain: "directChain",
  external: "external",
};

interface EditForwardRuleDialogProps {
  open: boolean;
  rule: ForwardRule | null;
  onClose: () => void;
  onSubmit: (id: number | string, data: UpdateForwardRuleRequest) => void;
  nodes?: Node[];
  agents?: ForwardAgent[];
  /** Resource groups for binding (only node/hybrid plan groups can bind rules) */
  resourceGroups?: ResourceGroup[];
  /** Subscription plans map for filtering resource groups by plan type */
  plansMap?: Record<string, SubscriptionPlan>;
}

export const EditForwardRuleDialog: React.FC<EditForwardRuleDialogProps> = ({
  open,
  rule,
  onClose,
  onSubmit,
  nodes = [],
  agents = [],
  resourceGroups = [],
  plansMap = {},
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<
    UpdateForwardRuleRequest & {
      chainAgentIds?: string[];
      chainPortConfig?: Record<string, number>;
      trafficMultiplier?: number;
      sortOrder?: number;
      tunnelType?: TunnelType;
      tunnelHops?: number;
      groupSids?: string[];
      // External rule fields
      serverAddress?: string;
      externalSource?: string;
      externalRuleId?: string;
    }
  >({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [targetType, setTargetType] = useState<TargetType>("manual");

  useEffect(() => {
    if (rule) {
      // Filter out entry agent from chain nodes
      const chainAgentIds = (rule.chainAgentIds || []).filter(
        (id) => id !== rule.agentId,
      );
      const chainPortConfig = { ...(rule.chainPortConfig || {}) };
      // Also remove port configuration for entry agent
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
        chainAgentIds,
        chainPortConfig,
        trafficMultiplier: rule.trafficMultiplier,
        sortOrder: rule.sortOrder,
        tunnelType: rule.tunnelType,
        tunnelHops: rule.tunnelHops,
        groupSids: rule.groupSids || [],
        // External rule fields
        serverAddress: rule.serverAddress,
        externalSource: rule.externalSource,
        externalRuleId: rule.externalRuleId,
      });
      // Determine target type based on rule data
      setTargetType(rule.targetNodeId ? "node" : "manual");
      setErrors({});
    }
  }, [rule]);

  // Get available node list (status is active, but always include currently selected node)
  const availableNodes = nodes.filter(
    (n) => n.status === "active" || n.id === formData.targetNodeId,
  );

  // Get available agent list (status is enabled, but always include currently selected agents)
  const availableAgents = agents.filter(
    (a) =>
      a.status === "enabled" ||
      a.id === formData.agentId ||
      a.id === formData.exitAgentId ||
      (formData.chainAgentIds || []).includes(a.id),
  );

  // Get available exit agents (exclude current entry agent)
  const availableExitAgents = availableAgents.filter(
    (a) => a.id !== formData.agentId,
  );

  // Get available chain agents (exclude current entry agent)
  const availableChainAgents = availableAgents.filter(
    (a) => a.id !== formData.agentId,
  );

  // Get available resource groups (only node/hybrid plan groups can bind forward rules)
  const availableResourceGroups = useMemo(() => {
    return resourceGroups.filter((group) => {
      const plan = plansMap[group.planId];
      // Only active groups with node or hybrid plan type can bind forward rules
      return group.status === "active" && plan && (plan.planType === "node" || plan.planType === "hybrid");
    });
  }, [resourceGroups, plansMap]);

  // Handle resource group selection toggle
  const handleGroupToggle = (groupSid: string) => {
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
  };

  // Handle chain node port configuration change
  const handleChainPortChange = (agentId: string, port: number) => {
    setFormData((prev) => ({
      ...prev,
      chainPortConfig: {
        ...(prev.chainPortConfig || {}),
        [agentId]: port,
      },
    }));
  };

  const handleChange = (
    field: keyof (UpdateForwardRuleRequest & { chainAgentIds?: string[] }),
    value: string | number | ForwardProtocol | string[] | undefined,
  ) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // If modifying entry agent, automatically remove it from chain node list
      if (field === "agentId" && typeof value === "string") {
        const currentChainIds = prev.chainAgentIds || [];
        if (currentChainIds.includes(value)) {
          newData.chainAgentIds = currentChainIds.filter((id) => id !== value);
          // Also remove port configuration for this node
          if (prev.chainPortConfig?.[value]) {
            const newPortConfig = { ...prev.chainPortConfig };
            delete newPortConfig[value];
            newData.chainPortConfig = newPortConfig;
          }
        }
      }

      return newData;
    });

    // Clear all validation errors, re-validate on next submit
    if (Object.keys(errors).length > 0) {
      setErrors({});
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (formData.name !== undefined && !formData.name.trim()) {
      newErrors.name = t('admin.forwardRules.validation.ruleNameRequired');
    }

    // External type has different validation
    if (rule?.ruleType === "external") {
      if (formData.serverAddress !== undefined && !formData.serverAddress.trim()) {
        newErrors.serverAddress = t('admin.forwardRules.validation.serverAddressRequired');
      }
      if (formData.listenPort && (formData.listenPort < 1 || formData.listenPort > 65535)) {
        newErrors.listenPort = t('admin.forwardRules.validation.listenPortRange');
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    // Get selected agent for port range validation
    const selectedAgent = agents.find((a) => a.id === formData.agentId);

    // listenPort is optional (0 or empty = auto-assign from agent's allowed range)
    if (
      formData.listenPort &&
      (formData.listenPort < 1 || formData.listenPort > 65535)
    ) {
      newErrors.listenPort = t('admin.forwardRules.validation.listenPortRange');
    } else if (
      formData.listenPort &&
      selectedAgent?.allowedPortRange &&
      !isPortInAllowedRange(formData.listenPort, selectedAgent.allowedPortRange)
    ) {
      newErrors.listenPort = t('admin.forwardRules.validation.portNotInRange', { port: formData.listenPort, range: selectedAgent.allowedPortRange });
    }

    // direct, entry, chain and direct_chain types need target validation
    if (
      rule &&
      (rule.ruleType === "direct" ||
        rule.ruleType === "entry" ||
        rule.ruleType === "chain" ||
        rule.ruleType === "direct_chain")
    ) {
      if (targetType === "manual") {
        if (
          formData.targetAddress !== undefined &&
          !formData.targetAddress.trim()
        ) {
          newErrors.targetAddress = t('admin.forwardRules.validation.targetAddressRequired');
        }
        if (
          formData.targetPort !== undefined &&
          (formData.targetPort < 1 || formData.targetPort > 65535)
        ) {
          newErrors.targetPort = t('admin.forwardRules.validation.targetPortRange');
        }
      } else if (targetType === "node") {
        if (!formData.targetNodeId) {
          newErrors.targetNodeId = t('admin.forwardRules.validation.selectTargetNode');
        }
      }
    }

    // direct_chain type needs to validate port configuration for all nodes
    if (rule && rule.ruleType === "direct_chain") {
      const chainIds = formData.chainAgentIds || [];
      const missingPorts: string[] = [];

      for (const agentId of chainIds) {
        const port = formData.chainPortConfig?.[agentId];
        if (!port || port < 1 || port > 65535) {
          const agent = agents.find((a) => a.id === agentId);
          const agentName = agent ? agent.name : agentId;
          missingPorts.push(agentName);
        }
      }

      if (missingPorts.length > 0) {
        if (missingPorts.length === chainIds.length) {
          newErrors.chainPortConfig = t('admin.forwardRules.validation.configureValidPorts');
        } else {
          newErrors.chainPortConfig = t('admin.forwardRules.validation.configurePortsForNodes', { nodes: missingPorts.join(", ") });
        }
      }
    }

    // chain type with tunnelHops needs to validate port configuration for nodes after tunnelHops
    if (
      rule &&
      rule.ruleType === "chain" &&
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
            const agentName = agent ? agent.name : agentId;
            missingPorts.push(agentName);
          }
        }

        if (missingPorts.length > 0) {
          const totalNodes = chainIds.length - formData.tunnelHops;
          if (missingPorts.length === totalNodes) {
            newErrors.chainPortConfig = t('admin.forwardRules.validation.configureValidPortsForDirectNodes');
          } else {
            newErrors.chainPortConfig = t('admin.forwardRules.validation.configurePortsForNodes', { nodes: missingPorts.join(", ") });
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (rule && validate()) {
      // Only submit changed fields
      const updates: UpdateForwardRuleRequest = {};

      if (formData.name !== rule.name) updates.name = formData.name;
      if (formData.remark !== rule.remark) updates.remark = formData.remark;

      // External type has different fields
      if (rule.ruleType === "external") {
        if (formData.listenPort !== rule.listenPort)
          updates.listenPort = formData.listenPort;
        if (formData.serverAddress !== rule.serverAddress)
          (updates as Record<string, unknown>).serverAddress = formData.serverAddress;
        if (formData.targetNodeId !== rule.targetNodeId)
          updates.targetNodeId = formData.targetNodeId || undefined;
        if (formData.externalSource !== rule.externalSource)
          (updates as Record<string, unknown>).externalSource = formData.externalSource;
        if (formData.externalRuleId !== rule.externalRuleId)
          (updates as Record<string, unknown>).externalRuleId = formData.externalRuleId;
        if (formData.sortOrder !== rule.sortOrder && formData.sortOrder !== undefined)
          updates.sortOrder = formData.sortOrder;
        // Handle resource groups
        const currentGroups = formData.groupSids || [];
        const originalGroups = rule.groupSids || [];
        const hasGroupsChange =
          currentGroups.length !== originalGroups.length ||
          currentGroups.some((sid) => !originalGroups.includes(sid)) ||
          originalGroups.some((sid) => !currentGroups.includes(sid));
        if (hasGroupsChange) {
          updates.groupSids = currentGroups;
        }
        // Submit update if there are any changes
        if (Object.keys(updates).length > 0) {
          onSubmit(rule.id, updates);
        }
        return;
      }

      if (formData.protocol !== rule.protocol)
        updates.protocol = formData.protocol;
      if (formData.listenPort !== rule.listenPort)
        updates.listenPort = formData.listenPort;
      if (formData.ipVersion !== rule.ipVersion)
        updates.ipVersion = formData.ipVersion;
      if (formData.bindIp !== rule.bindIp) updates.bindIp = formData.bindIp;

      // Handle agent configuration
      if (formData.agentId !== rule.agentId) updates.agentId = formData.agentId;

      // entry type: exit agent
      if (
        rule.ruleType === "entry" &&
        formData.exitAgentId !== rule.exitAgentId
      ) {
        updates.exitAgentId = formData.exitAgentId;
      }

      // entry and chain types: tunnel type
      if (
        (rule.ruleType === "entry" || rule.ruleType === "chain") &&
        formData.tunnelType !== rule.tunnelType
      ) {
        updates.tunnelType = formData.tunnelType;
      }

      // chain type: tunnel hops
      if (
        rule.ruleType === "chain" &&
        formData.tunnelHops !== rule.tunnelHops
      ) {
        updates.tunnelHops = formData.tunnelHops;
      }

      // chain and direct_chain types: chain agents
      if (rule.ruleType === "chain" || rule.ruleType === "direct_chain") {
        const currentIds = formData.chainAgentIds || [];
        const originalIds = rule.chainAgentIds || [];
        const hasChainChange =
          currentIds.length !== originalIds.length ||
          currentIds.some((id, index) => id !== originalIds[index]);
        if (hasChainChange) {
          updates.chainAgentIds = currentIds;
        }

        // direct_chain type or chain type with tunnelHops: port configuration
        if (
          rule.ruleType === "direct_chain" ||
          (rule.ruleType === "chain" &&
            formData.tunnelHops !== undefined &&
            formData.tunnelHops >= 0)
        ) {
          const currentPortConfig = formData.chainPortConfig || {};
          const originalPortConfig = rule.chainPortConfig || {};
          const hasPortConfigChange =
            Object.keys(currentPortConfig).length !==
              Object.keys(originalPortConfig).length ||
            Object.entries(currentPortConfig).some(
              ([id, port]) => originalPortConfig[id] !== port,
            );
          if (hasPortConfigChange) {
            updates.chainPortConfig = currentPortConfig;
          }
        }
      }

      // Handle target configuration (manual input or node selection) - direct, entry, chain and direct_chain types
      if (
        rule.ruleType === "direct" ||
        rule.ruleType === "entry" ||
        rule.ruleType === "chain" ||
        rule.ruleType === "direct_chain"
      ) {
        if (targetType === "manual") {
          // Manual address input
          if (formData.targetAddress !== rule.targetAddress)
            updates.targetAddress = formData.targetAddress;
          if (formData.targetPort !== rule.targetPort)
            updates.targetPort = formData.targetPort;
          // If switching from node to manual, clear targetNodeId
          if (rule.targetNodeId) updates.targetNodeId = undefined;
        } else {
          // Node selection
          if (formData.targetNodeId !== rule.targetNodeId)
            updates.targetNodeId = formData.targetNodeId;
          // If switching from manual to node, clear address and port
          if (rule.targetAddress) updates.targetAddress = undefined;
          if (rule.targetPort) updates.targetPort = undefined;
        }
      }

      // Handle traffic multiplier
      if (formData.trafficMultiplier !== rule.trafficMultiplier) {
        updates.trafficMultiplier = formData.trafficMultiplier;
      }

      // Handle sort order
      if (
        formData.sortOrder !== rule.sortOrder &&
        formData.sortOrder !== undefined
      ) {
        updates.sortOrder = formData.sortOrder;
      }

      // Handle resource groups - compare arrays
      const currentGroups = formData.groupSids || [];
      const originalGroups = rule.groupSids || [];
      const hasGroupsChange =
        currentGroups.length !== originalGroups.length ||
        currentGroups.some((sid) => !originalGroups.includes(sid)) ||
        originalGroups.some((sid) => !currentGroups.includes(sid));
      if (hasGroupsChange) {
        updates.groupSids = currentGroups;
      }

      // Submit update if there are any changes
      if (Object.keys(updates).length > 0) {
        onSubmit(rule.id, updates);
      }
    }
  };

  // Check if there are any changes
  const hasChanges =
    rule &&
    Object.keys(formData).some(
      (key) =>
        formData[key as keyof UpdateForwardRuleRequest] !==
        rule[key as keyof ForwardRule],
    );

  if (!rule) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="@container sm:max-w-[700px] flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{t('admin.forwardRules.form.editRule')}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
          <Accordion
            type="multiple"
            defaultValue={["editable"]}
            className="space-y-2"
          >
            {/* Basic Information (Read-only) */}
            <AccordionItem value="basic" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <span className="text-sm font-medium">{t('admin.forwardRules.form.basicInfoReadonly')}</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4 pb-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="rule_id">{t('admin.forwardRules.form.ruleId')}</Label>
                    <Input id="rule_id" value={rule.id} disabled />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="rule_type">{t('admin.forwardRules.form.ruleType')}</Label>
                    <Input
                      id="rule_type"
                      value={t(`admin.forwardRules.ruleTypeInfo.${RULE_TYPE_KEYS[rule.ruleType] || rule.ruleType}.label`)}
                      disabled
                    />
                  </div>

                  <div className="flex flex-col gap-2 @sm:col-span-2">
                    <Label htmlFor="created_at">{t('admin.forwardRules.form.createdTime')}</Label>
                    <Input
                      id="created_at"
                      value={formatDateTime(rule.createdAt)}
                      disabled
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Editable Fields */}
            <AccordionItem value="editable" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <span className="text-sm font-medium">{t('common.sections.editableInfo')}</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4 pb-4">
                  {/* Rule Name */}
                  <div className="flex flex-col gap-2 @sm:col-span-2">
                    <Label htmlFor="name">{t('admin.forwardRules.form.ruleName')}</Label>
                    <Input
                      id="name"
                      value={formData.name || ""}
                      onChange={(e) => handleChange("name", e.target.value)}
                      error={!!errors.name}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive">{errors.name}</p>
                    )}
                  </div>

                  {/* External type: Server Address */}
                  {rule.ruleType === "external" && (
                    <>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="serverAddress">{t('admin.forwardRules.form.serverAddress')}</Label>
                        <Input
                          id="serverAddress"
                          value={formData.serverAddress || ""}
                          onChange={(e) => handleChange("serverAddress" as keyof UpdateForwardRuleRequest, e.target.value)}
                          error={!!errors.serverAddress}
                          placeholder={t('admin.forwardRules.form.serverAddressPlaceholder')}
                        />
                        {errors.serverAddress && (
                          <p className="text-xs text-destructive">{errors.serverAddress}</p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="listenPort">{t('admin.forwardRules.form.listenPort')}</Label>
                        <Input
                          id="listenPort"
                          type="number"
                          min={1}
                          max={65535}
                          value={formData.listenPort || ""}
                          onChange={(e) =>
                            handleChange(
                              "listenPort",
                              parseInt(e.target.value, 10) || 0,
                            )
                          }
                          error={!!errors.listenPort}
                          placeholder="1-65535"
                        />
                        {errors.listenPort && (
                          <p className="text-xs text-destructive">{errors.listenPort}</p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="editExternalTargetNodeId">{t('admin.forwardRules.form.targetNode')}</Label>
                        <Select
                          value={formData.targetNodeId || ""}
                          onValueChange={(value) =>
                            handleChange("targetNodeId", value)
                          }
                        >
                          <SelectTrigger id="editExternalTargetNodeId">
                            <SelectValue placeholder={t('admin.forwardRules.form.selectTargetNodeOptional')} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableNodes.map((node) => (
                              <SelectItem key={node.id} value={node.id}>
                                {node.name} ({node.serverAddress})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {t('admin.forwardRules.form.targetNodeHint')}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="externalSource">{t('admin.forwardRules.form.externalSource')}</Label>
                        <Input
                          id="externalSource"
                          value={formData.externalSource || ""}
                          onChange={(e) => handleChange("externalSource" as keyof UpdateForwardRuleRequest, e.target.value)}
                          placeholder={t('admin.forwardRules.form.externalSourcePlaceholder')}
                        />
                        <p className="text-xs text-muted-foreground">
                          {t('admin.forwardRules.form.externalSourceHint')}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="externalRuleId">{t('admin.forwardRules.form.externalRuleId')}</Label>
                        <Input
                          id="externalRuleId"
                          value={formData.externalRuleId || ""}
                          onChange={(e) => handleChange("externalRuleId" as keyof UpdateForwardRuleRequest, e.target.value)}
                          placeholder={t('admin.forwardRules.form.externalRuleIdPlaceholder')}
                        />
                        <p className="text-xs text-muted-foreground">
                          {t('admin.forwardRules.form.externalRuleIdHint')}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Entry Agent - hidden for external type */}
                  {rule.ruleType !== "external" && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="agentId">{t('admin.forwardRules.form.entryAgent')}</Label>
                    <Select
                      value={formData.agentId || ""}
                      onValueChange={(value) => handleChange("agentId", value)}
                    >
                      <SelectTrigger id="agentId">
                        <SelectValue placeholder={t('admin.forwardRules.form.selectEntryAgent')} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableAgents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            <span className="flex items-center gap-2">
                              {agent.name}
                              {agent.allowedPortRange && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400"
                                >
                                  {agent.allowedPortRange}
                                </Badge>
                              )}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.agentId &&
                      (() => {
                        const selectedAgent = agents.find(
                          (a) => a.id === formData.agentId,
                        );
                        return selectedAgent?.allowedPortRange ? (
                          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-2.5 py-1.5">
                            <Info className="size-3.5 shrink-0" />
                            <span>
                              {t('admin.forwardRules.form.portRestriction', { range: selectedAgent.allowedPortRange })}
                            </span>
                          </div>
                        ) : null;
                      })()}
                  </div>
                  )}

                  {/* entry type: Exit Agent */}
                  {rule.ruleType === "entry" && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="exitAgentId">{t('admin.forwardRules.form.exitAgent')}</Label>
                      <Select
                        value={formData.exitAgentId || ""}
                        onValueChange={(value) =>
                          handleChange("exitAgentId", value)
                        }
                      >
                        <SelectTrigger id="exitAgentId">
                          <SelectValue placeholder={t('admin.forwardRules.form.selectExitAgent')} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableExitAgents.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              <span className="flex items-center gap-2">
                                {agent.name}
                                {agent.allowedPortRange && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400"
                                  >
                                    {agent.allowedPortRange}
                                  </Badge>
                                )}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.exitAgentId &&
                        (() => {
                          const selectedAgent = agents.find(
                            (a) => a.id === formData.exitAgentId,
                          );
                          return selectedAgent?.allowedPortRange ? (
                            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-2.5 py-1.5">
                              <Info className="size-3.5 shrink-0" />
                              <span>
                                {t('admin.forwardRules.form.portRestriction', { range: selectedAgent.allowedPortRange })}
                              </span>
                            </div>
                          ) : null;
                        })()}
                    </div>
                  )}

                  {/* Tunnel Type - entry and chain types */}
                  {(rule.ruleType === "entry" || rule.ruleType === "chain") && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="tunnelType">{t('admin.forwardRules.form.tunnelType')}</Label>
                      <Select
                        value={formData.tunnelType || "ws"}
                        onValueChange={(value) =>
                          handleChange("tunnelType", value as TunnelType)
                        }
                      >
                        <SelectTrigger id="tunnelType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ws">WebSocket</SelectItem>
                          <SelectItem value="tls">TLS</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {formData.tunnelType === "tls"
                          ? t('admin.forwardRules.form.tunnelTypeTlsHint')
                          : t('admin.forwardRules.form.tunnelTypeWsHint')}
                      </p>
                    </div>
                  )}

                  {/* Tunnel Hops - chain type only */}
                  {rule.ruleType === "chain" && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="tunnelHops">{t('admin.forwardRules.form.tunnelHops')}</Label>
                      <Input
                        id="tunnelHops"
                        type="number"
                        min={0}
                        value={formData.tunnelHops ?? ""}
                        onChange={(e) => {
                          const value =
                            e.target.value === ""
                              ? undefined
                              : parseInt(e.target.value, 10);
                          handleChange("tunnelHops", value);
                        }}
                        placeholder={t('admin.forwardRules.form.tunnelHopsPlaceholder')}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('admin.forwardRules.form.tunnelHopsHint')}
                      </p>
                    </div>
                  )}

                  {/* chain type: Chain Agents */}
                  {rule.ruleType === "chain" && (
                    <div className="flex flex-col gap-2 @sm:col-span-2">
                      <Label>
                        {formData.tunnelHops !== undefined &&
                          formData.tunnelHops >= 0 &&
                          formData.tunnelHops <
                            (formData.chainAgentIds?.length || 0)
                          ? t('admin.forwardRules.form.chainNodesWithPort')
                          : t('admin.forwardRules.form.chainNodes')}
                      </Label>
                      <SortableChainAgentList
                        agents={availableChainAgents}
                        selectedIds={formData.chainAgentIds || []}
                        onSelectionChange={(ids) => {
                          // Synchronously update chainPortConfig when tunnelHops is set
                          if (
                            formData.tunnelHops !== undefined &&
                            formData.tunnelHops >= 0
                          ) {
                            const newPortConfig = {
                              ...(formData.chainPortConfig || {}),
                            };
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
                          } else {
                            handleChange("chainAgentIds", ids);
                          }
                        }}
                        showPortConfig={
                          formData.tunnelHops !== undefined &&
                          formData.tunnelHops >= 0 &&
                          formData.tunnelHops <
                            (formData.chainAgentIds?.length || 0)
                        }
                        portConfigStartIndex={formData.tunnelHops ?? 0}
                        portConfig={formData.chainPortConfig || {}}
                        onPortConfigChange={handleChainPortChange}
                        hasError={!!errors.chainPortConfig}
                        idPrefix="edit-chain-agent"
                      />
                      {formData.tunnelHops !== undefined &&
                        formData.tunnelHops >= 0 &&
                        formData.tunnelHops <
                          (formData.chainAgentIds?.length || 0) && (
                          <p className="text-xs text-muted-foreground">
                            {t('admin.forwardRules.form.hybridChainHint', { count: formData.tunnelHops })}
                          </p>
                        )}
                      {errors.chainPortConfig && (
                        <p className="text-xs text-destructive">
                          {errors.chainPortConfig}
                        </p>
                      )}
                    </div>
                  )}

                  {/* direct_chain type: Chain Agents (with port configuration) */}
                  {rule.ruleType === "direct_chain" && (
                    <div className="flex flex-col gap-2 @sm:col-span-2">
                      <Label>{t('admin.forwardRules.form.chainNodesWithPort')}</Label>
                      <SortableChainAgentList
                        agents={availableChainAgents}
                        selectedIds={formData.chainAgentIds || []}
                        onSelectionChange={(ids) => {
                          // Synchronously update chainPortConfig, remove deselected nodes
                          const newPortConfig = {
                            ...(formData.chainPortConfig || {}),
                          };
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
                        }}
                        showPortConfig
                        portConfig={formData.chainPortConfig || {}}
                        onPortConfigChange={handleChainPortChange}
                        hasError={!!errors.chainPortConfig}
                        idPrefix="edit-direct-chain-agent"
                      />
                      {errors.chainPortConfig && (
                        <p className="text-xs text-destructive">
                          {errors.chainPortConfig}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Protocol Type - hidden for external type */}
                  {rule.ruleType !== "external" && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="protocol">{t('common.protocol')}</Label>
                      <Select
                        value={formData.protocol || "tcp"}
                        onValueChange={(value) =>
                          handleChange("protocol", value as ForwardProtocol)
                        }
                      >
                        <SelectTrigger id="protocol">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tcp">TCP</SelectItem>
                          <SelectItem value="udp">UDP</SelectItem>
                          <SelectItem value="both">TCP/UDP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* IP Version - hidden for external type */}
                  {rule.ruleType !== "external" && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="ipVersion">{t('admin.forwardRules.form.ipVersion')}</Label>
                      <Select
                        value={formData.ipVersion || "auto"}
                        onValueChange={(value) =>
                          handleChange("ipVersion", value as IPVersion)
                        }
                      >
                        <SelectTrigger id="ipVersion">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">{t('common.auto')}</SelectItem>
                          <SelectItem value="ipv4">IPv4</SelectItem>
                          <SelectItem value="ipv6">IPv6</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {t('admin.forwardRules.form.ipVersionHint')}
                      </p>
                    </div>
                  )}

                  {/* Listen Port - hidden for external type (already shown above) */}
                  {rule.ruleType !== "external" && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="listenPort">{t('admin.forwardRules.form.listenPort')}</Label>
                      <Input
                        id="listenPort"
                        type="number"
                        min={0}
                        max={65535}
                        value={formData.listenPort || ""}
                        onChange={(e) =>
                          handleChange(
                            "listenPort",
                            parseInt(e.target.value, 10) || 0,
                          )
                        }
                        error={!!errors.listenPort}
                        placeholder={t('admin.forwardRules.form.listenPortAutoHint')}
                      />
                      {errors.listenPort && (
                        <p className="text-xs text-destructive">
                          {errors.listenPort}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Target Configuration - Display for direct, entry, chain and direct_chain types */}
                  {rule &&
                    (rule.ruleType === "direct" ||
                      rule.ruleType === "entry" ||
                      rule.ruleType === "chain" ||
                      rule.ruleType === "direct_chain") && (
                      <>
                        {/* Target Type Selection */}
                        <div className="flex flex-col gap-2 @sm:col-span-2">
                          <Label>{t('admin.forwardRules.form.targetType')}</Label>
                          <RadioGroup
                            value={targetType}
                            onValueChange={(value) => {
                              setTargetType(value as TargetType);
                              // Clear related fields when switching
                              if (value === "manual") {
                                handleChange("targetNodeId", "");
                              } else {
                                handleChange("targetAddress", "");
                                handleChange("targetPort", 0);
                              }
                            }}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="manual"
                                id="edit-target-manual"
                              />
                              <Label
                                htmlFor="edit-target-manual"
                                className="font-normal cursor-pointer"
                              >
                                {t('admin.forwardRules.form.targetTypeManual')}
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="node"
                                id="edit-target-node"
                              />
                              <Label
                                htmlFor="edit-target-node"
                                className="font-normal cursor-pointer"
                              >
                                {t('admin.forwardRules.form.targetTypeNode')}
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        {/* Manual Target Address Input */}
                        {targetType === "manual" && (
                          <>
                            <div className="flex flex-col gap-2">
                              <Label htmlFor="targetAddress">{t('admin.forwardRules.form.targetAddress')}</Label>
                              <Input
                                id="targetAddress"
                                value={formData.targetAddress || ""}
                                onChange={(e) =>
                                  handleChange("targetAddress", e.target.value)
                                }
                                error={!!errors.targetAddress}
                              />
                              {errors.targetAddress && (
                                <p className="text-xs text-destructive">
                                  {errors.targetAddress}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col gap-2">
                              <Label htmlFor="targetPort">{t('admin.forwardRules.form.targetPort')}</Label>
                              <Input
                                id="targetPort"
                                type="number"
                                min={1}
                                max={65535}
                                value={formData.targetPort || ""}
                                onChange={(e) =>
                                  handleChange(
                                    "targetPort",
                                    parseInt(e.target.value, 10),
                                  )
                                }
                                error={!!errors.targetPort}
                              />
                              {errors.targetPort && (
                                <p className="text-xs text-destructive">
                                  {errors.targetPort}
                                </p>
                              )}
                            </div>
                          </>
                        )}

                        {/* Select Target Node */}
                        {targetType === "node" && (
                          <div className="flex flex-col gap-2 @sm:col-span-2">
                            <Label htmlFor="targetNodeId">{t('admin.forwardRules.form.targetNode')}</Label>
                            <Select
                              value={formData.targetNodeId || ""}
                              onValueChange={(value) =>
                                handleChange("targetNodeId", value)
                              }
                            >
                              <SelectTrigger
                                id="targetNodeId"
                                className={
                                  errors.targetNodeId
                                    ? "border-destructive"
                                    : ""
                                }
                              >
                                <SelectValue placeholder={t('admin.forwardRules.form.selectTargetNode')} />
                              </SelectTrigger>
                              <SelectContent>
                                {availableNodes.map((node) => (
                                  <SelectItem key={node.id} value={node.id}>
                                    {node.name} ({node.serverAddress})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              {t('admin.forwardRules.form.targetNodeDynamicHint')}
                            </p>
                            {errors.targetNodeId && (
                              <p className="text-xs text-destructive">
                                {errors.targetNodeId}
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    )}

                  {/* Bind IP - hidden for external type */}
                  {rule.ruleType !== "external" && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="bindIp">{t('admin.forwardRules.form.bindIp')}</Label>
                      <Input
                        id="bindIp"
                        value={formData.bindIp || ""}
                        onChange={(e) => handleChange("bindIp", e.target.value)}
                        placeholder={t('admin.forwardRules.form.bindIpPlaceholder')}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('admin.forwardRules.form.bindIpHint')}
                      </p>
                    </div>
                  )}

                  {/* Traffic Multiplier - hidden for external type */}
                  {rule.ruleType !== "external" && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="trafficMultiplier">{t('admin.forwardRules.form.trafficMultiplier')}</Label>
                      <Input
                        id="trafficMultiplier"
                        type="number"
                        min={0}
                        max={1000000}
                        step={0.01}
                        value={formData.trafficMultiplier ?? ""}
                        onChange={(e) =>
                          handleChange(
                            "trafficMultiplier",
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          )
                        }
                        placeholder={t('admin.forwardRules.form.trafficMultiplierNotModify')}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('admin.forwardRules.form.trafficMultiplierCurrent', { value: rule.effectiveTrafficMultiplier, type: rule.isAutoMultiplier ? t('admin.forwardRules.form.multiplierAuto') : t('admin.forwardRules.form.multiplierCustom') })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('admin.forwardRules.form.trafficMultiplierUpdateHint')}
                      </p>
                    </div>
                  )}

                  {/* Sort Order */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="sortOrder">{t('common.fields.sortOrder')}</Label>
                    <Input
                      id="sortOrder"
                      type="number"
                      value={formData.sortOrder ?? 0}
                      onChange={(e) =>
                        handleChange(
                          "sortOrder",
                          parseInt(e.target.value, 10) || 0,
                        )
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('admin.forwardRules.form.sortSmallFirst')}
                    </p>
                  </div>

                  {/* Remark */}
                  <div className="flex flex-col gap-1.5 @sm:col-span-2">
                    <Label htmlFor="remark">{t('common.fields.remark')}</Label>
                    <Textarea
                      id="remark"
                      rows={3}
                      value={formData.remark || ""}
                      onChange={(e) => handleChange("remark", e.target.value)}
                      className="resize-none"
                    />
                  </div>

                  {/* Resource Groups Selection */}
                  {availableResourceGroups.length > 0 && (
                    <div className="flex flex-col gap-2 @sm:col-span-2">
                      <Label className="flex items-center gap-1.5">
                        <FolderTree className="size-4" />
                        {t('admin.forwardRules.form.bindResourceGroupsEdit')}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t('admin.forwardRules.form.bindResourceGroupsHint')}
                      </p>
                      <div className="border rounded-lg overflow-hidden">
                        <ScrollArea className="h-[120px]">
                          <div className="divide-y">
                            {availableResourceGroups.map((group) => {
                              const plan = plansMap[group.planId];
                              const isSelected = formData.groupSids?.includes(group.sid) ?? false;
                              return (
                                <label
                                  key={group.sid}
                                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                                    isSelected
                                      ? "bg-primary/10"
                                      : "hover:bg-muted/50"
                                  }`}
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => handleGroupToggle(group.sid)}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{group.name}</p>
                                    {plan && (
                                      <p className="text-xs text-muted-foreground truncate">
                                        {plan.name}
                                      </p>
                                    )}
                                  </div>
                                  {plan && (
                                    <Badge variant="outline" className="text-[10px] flex-shrink-0">
                                      {plan.planType === "node" ? t('admin.forwardRules.form.planTypeNode') : t('common.planType.hybrid')}
                                    </Badge>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </div>
                      {formData.groupSids && formData.groupSids.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {t('admin.forwardRules.form.selectedGroupsCount', { count: formData.groupSids.length })}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <DialogFooter className="flex-shrink-0 mt-6 gap-3">
          <Button variant="outline" onClick={onClose}>
            {t('common.actions.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!hasChanges}>
            {t('common.actions.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
