/**
 * Edit Forward Rule Dialog Component
 * Supports targetNodeId (dynamic node address resolution)
 */

import { useState, useEffect } from "react";
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
import { Info } from "lucide-react";
import { SortableChainAgentList } from "./SortableChainAgentList";
import type {
  ForwardRule,
  UpdateForwardRuleRequest,
  IPVersion,
  ForwardAgent,
  TunnelType,
} from "@/api/forward";
import type { Node } from "@/api/node";

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

// Rule type label mapping
const RULE_TYPE_LABELS: Record<string, string> = {
  direct: "直连转发",
  entry: "入口节点",
  chain: "隧道链式转发",
  direct_chain: "直连链式转发",
};

interface EditForwardRuleDialogProps {
  open: boolean;
  rule: ForwardRule | null;
  onClose: () => void;
  onSubmit: (id: number | string, data: UpdateForwardRuleRequest) => void;
  nodes?: Node[];
  agents?: ForwardAgent[];
}

export const EditForwardRuleDialog: React.FC<EditForwardRuleDialogProps> = ({
  open,
  rule,
  onClose,
  onSubmit,
  nodes = [],
  agents = [],
}) => {
  const [formData, setFormData] = useState<
    UpdateForwardRuleRequest & {
      chainAgentIds?: string[];
      chainPortConfig?: Record<string, number>;
      trafficMultiplier?: number;
      sortOrder?: number;
      tunnelType?: TunnelType;
      tunnelHops?: number;
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
      newErrors.name = "规则名称不能为空";
    }

    // Get selected agent for port range validation
    const selectedAgent = agents.find((a) => a.id === formData.agentId);

    // listenPort is optional (0 or empty = auto-assign from agent's allowed range)
    if (
      formData.listenPort &&
      (formData.listenPort < 1 || formData.listenPort > 65535)
    ) {
      newErrors.listenPort = "监听端口必须在1-65535之间";
    } else if (
      formData.listenPort &&
      selectedAgent?.allowedPortRange &&
      !isPortInAllowedRange(formData.listenPort, selectedAgent.allowedPortRange)
    ) {
      newErrors.listenPort = `端口 ${formData.listenPort} 不在允许范围 [${selectedAgent.allowedPortRange}] 内`;
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
          newErrors.targetAddress = "目标地址不能为空";
        }
        if (
          formData.targetPort !== undefined &&
          (formData.targetPort < 1 || formData.targetPort > 65535)
        ) {
          newErrors.targetPort = "目标端口必须在1-65535之间";
        }
      } else if (targetType === "node") {
        if (!formData.targetNodeId) {
          newErrors.targetNodeId = "请选择目标节点";
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
          newErrors.chainPortConfig =
            "请为每个节点配置有效的监听端口（1-65535）";
        } else {
          newErrors.chainPortConfig = `请为以下节点配置有效端口：${missingPorts.join("、")}`;
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
            newErrors.chainPortConfig =
              "请为直连节点配置有效的监听端口（1-65535）";
          } else {
            newErrors.chainPortConfig = `请为以下节点配置有效端口：${missingPorts.join("、")}`;
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
      if (formData.protocol !== rule.protocol)
        updates.protocol = formData.protocol;
      if (formData.listenPort !== rule.listenPort)
        updates.listenPort = formData.listenPort;
      if (formData.ipVersion !== rule.ipVersion)
        updates.ipVersion = formData.ipVersion;
      if (formData.bindIp !== rule.bindIp) updates.bindIp = formData.bindIp;
      if (formData.remark !== rule.remark) updates.remark = formData.remark;

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
      <DialogContent className="sm:max-w-[700px] flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>编辑转发规则</DialogTitle>
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
                <span className="text-sm font-medium">基本信息（只读）</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="rule_id">规则ID</Label>
                    <Input id="rule_id" value={rule.id} disabled />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="rule_type">规则类型</Label>
                    <Input
                      id="rule_type"
                      value={RULE_TYPE_LABELS[rule.ruleType] || rule.ruleType}
                      disabled
                    />
                  </div>

                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label htmlFor="created_at">创建时间</Label>
                    <Input
                      id="created_at"
                      value={new Date(rule.createdAt).toLocaleString("zh-CN")}
                      disabled
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Editable Fields */}
            <AccordionItem value="editable" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <span className="text-sm font-medium">可编辑信息</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
                  {/* Rule Name */}
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label htmlFor="name">规则名称</Label>
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

                  {/* Entry Agent */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="agentId">入口代理</Label>
                    <Select
                      value={formData.agentId || ""}
                      onValueChange={(value) => handleChange("agentId", value)}
                    >
                      <SelectTrigger id="agentId">
                        <SelectValue placeholder="选择入口代理" />
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
                              端口限制: {selectedAgent.allowedPortRange}
                            </span>
                          </div>
                        ) : null;
                      })()}
                  </div>

                  {/* entry type: Exit Agent */}
                  {rule.ruleType === "entry" && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="exitAgentId">出口代理</Label>
                      <Select
                        value={formData.exitAgentId || ""}
                        onValueChange={(value) =>
                          handleChange("exitAgentId", value)
                        }
                      >
                        <SelectTrigger id="exitAgentId">
                          <SelectValue placeholder="选择出口代理" />
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
                                端口限制: {selectedAgent.allowedPortRange}
                              </span>
                            </div>
                          ) : null;
                        })()}
                    </div>
                  )}

                  {/* Tunnel Type - entry and chain types */}
                  {(rule.ruleType === "entry" || rule.ruleType === "chain") && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="tunnelType">隧道类型</Label>
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
                          ? "通过 TLS 建立隧道连接"
                          : "通过 WebSocket 建立隧道连接"}
                      </p>
                    </div>
                  )}

                  {/* Tunnel Hops - chain type only */}
                  {rule.ruleType === "chain" && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="tunnelHops">隧道跳数（可选）</Label>
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
                        placeholder="留空表示全程隧道"
                      />
                      <p className="text-xs text-muted-foreground">
                        设置后，前 N 跳使用隧道，后续节点使用直连
                      </p>
                    </div>
                  )}

                  {/* chain type: Chain Agents */}
                  {rule.ruleType === "chain" && (
                    <div className="flex flex-col gap-2 sm:col-span-2">
                      <Label>
                        中间节点
                        {formData.tunnelHops !== undefined &&
                          formData.tunnelHops >= 0 &&
                          formData.tunnelHops <
                            (formData.chainAgentIds?.length || 0) &&
                          "及端口"}
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
                            混合链模式：前 {formData.tunnelHops}{" "}
                            跳使用隧道，后续节点使用直连
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
                    <div className="flex flex-col gap-2 sm:col-span-2">
                      <Label>中间节点及端口</Label>
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

                  {/* Protocol Type */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="protocol">协议类型</Label>
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

                  {/* IP Version */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="ipVersion">IP 版本</Label>
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
                        <SelectItem value="auto">自动</SelectItem>
                        <SelectItem value="ipv4">IPv4</SelectItem>
                        <SelectItem value="ipv6">IPv6</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      目标地址解析时优先使用的 IP 版本
                    </p>
                  </div>

                  {/* Listen Port */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="listenPort">监听端口</Label>
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
                      placeholder="留空自动分配"
                    />
                    {errors.listenPort && (
                      <p className="text-xs text-destructive">
                        {errors.listenPort}
                      </p>
                    )}
                  </div>

                  {/* Target Configuration - Display for direct, entry, chain and direct_chain types */}
                  {rule &&
                    (rule.ruleType === "direct" ||
                      rule.ruleType === "entry" ||
                      rule.ruleType === "chain" ||
                      rule.ruleType === "direct_chain") && (
                      <>
                        {/* Target Type Selection */}
                        <div className="flex flex-col gap-2 sm:col-span-2">
                          <Label>目标类型</Label>
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
                                手动输入地址
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
                                选择节点（动态解析）
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        {/* Manual Target Address Input */}
                        {targetType === "manual" && (
                          <>
                            <div className="flex flex-col gap-2">
                              <Label htmlFor="targetAddress">目标地址</Label>
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
                              <Label htmlFor="targetPort">目标端口</Label>
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
                          <div className="flex flex-col gap-2 sm:col-span-2">
                            <Label htmlFor="targetNodeId">目标节点</Label>
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
                                <SelectValue placeholder="选择目标节点" />
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
                              选择节点后，目标地址将动态解析为节点的服务器地址
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

                  {/* Bind IP */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="bindIp">绑定 IP</Label>
                    <Input
                      id="bindIp"
                      value={formData.bindIp || ""}
                      onChange={(e) => handleChange("bindIp", e.target.value)}
                      placeholder="可选：出站连接绑定的本地 IP"
                    />
                    <p className="text-xs text-muted-foreground">
                      指定出站连接使用的本地 IP 地址
                    </p>
                  </div>

                  {/* Traffic Multiplier */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="trafficMultiplier">流量倍率（可选）</Label>
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
                      placeholder="留空表示不修改"
                    />
                    <p className="text-xs text-muted-foreground">
                      当前: {rule.effectiveTrafficMultiplier}x (
                      {rule.isAutoMultiplier ? "自动计算" : "自定义"})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      修改此值会影响后续流量统计
                    </p>
                  </div>

                  {/* Sort Order */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="sortOrder">排序顺序</Label>
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
                      数字越小越靠前
                    </p>
                  </div>

                  {/* Remark */}
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label htmlFor="remark">备注</Label>
                    <Textarea
                      id="remark"
                      rows={3}
                      value={formData.remark || ""}
                      onChange={(e) => handleChange("remark", e.target.value)}
                      className="resize-none"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <DialogFooter className="flex-shrink-0 mt-6 gap-3">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!hasChanges}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
