/**
 * Create Forward Rule Dialog Component
 * Supports four rule types: direct, entry, chain (WS chain forwarding), direct_chain (direct chain forwarding)
 * Supports target types: manual address input or node selection (dynamic resolution)
 *
 * Redesigned with Tailwind Application UI stacked form layout
 * - Compact sections with subtle dividers
 * - Collapsible advanced options
 * - Responsive grid layout (6-column base)
 */

import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
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
import { Badge } from "@/components/common/Badge";
import { Checkbox } from "@/components/common/Checkbox";
import { ScrollArea } from "@/components/common/ScrollArea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/common/Collapsible";
import { Info, FolderTree, ChevronDown } from "lucide-react";
import { SortableChainAgentList } from "./SortableChainAgentList";
import type {
  CreateForwardRuleRequest,
  ForwardAgent,
  ForwardRuleType,
  ForwardProtocol,
  IPVersion,
  TunnelType,
} from "@/api/forward";
import type { Node } from "@/api/node";
import type { ResourceGroup } from "@/api/resource/types";
import type { SubscriptionPlan } from "@/api/subscription/types";

// Target type
type TargetType = "manual" | "node";

interface CreateForwardRuleDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateForwardRuleRequest) => void;
  agents: ForwardAgent[];
  nodes?: Node[];
  /** Initial data for pre-populating the form when copying a rule */
  initialData?: Partial<CreateForwardRuleRequest> & {
    targetType?: "manual" | "node";
  };
  /** Resource groups for binding (only node/hybrid plan groups can bind rules) */
  resourceGroups?: ResourceGroup[];
  /** Subscription plans map for filtering resource groups by plan type */
  plansMap?: Record<string, SubscriptionPlan>;
}

/**
 * Check if a port is within the allowed port range
 */
const isPortInAllowedRange = (
  port: number,
  allowedPortRange: string | undefined,
): boolean => {
  if (!allowedPortRange || allowedPortRange.trim() === "") {
    return true;
  }

  const parts = allowedPortRange.split(",").map((p) => p.trim());
  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map((n) => parseInt(n.trim(), 10));
      if (!isNaN(start) && !isNaN(end) && port >= start && port <= end) {
        return true;
      }
    } else {
      const singlePort = parseInt(part, 10);
      if (!isNaN(singlePort) && port === singlePort) {
        return true;
      }
    }
  }
  return false;
};

// Rule type keys for translation lookup
const RULE_TYPE_KEYS: Record<ForwardRuleType, string> = {
  direct: "direct",
  entry: "entry",
  chain: "chain",
  direct_chain: "directChain",
  external: "external",
};

/**
 * Form Section Component - Tailwind Application UI style
 * Clean, minimal section with lightweight divider
 */
const FormSection = ({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <fieldset className={className}>
    <legend className="sr-only">{title}</legend>
    <div className="flex items-center gap-3 mb-4">
      <h3 className="text-sm font-semibold text-foreground whitespace-nowrap">
        {title}
      </h3>
      <div className="h-px flex-1 bg-border" aria-hidden="true" />
    </div>
    {description && (
      <p className="text-xs text-muted-foreground -mt-2 mb-4">{description}</p>
    )}
    {children}
  </fieldset>
);

/**
 * Form Field Component with consistent styling
 * Uses grid span classes for responsive layout
 */
const FormField = ({
  label,
  required,
  error,
  hint,
  children,
  className = "",
}: {
  label: React.ReactNode;
  required?: boolean;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <Label className="text-sm font-medium text-foreground">
      {label}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </Label>
    {children}
    {error && <p className="text-xs text-destructive">{error}</p>}
    {hint && !error && (
      <p className="text-xs text-muted-foreground">{hint}</p>
    )}
  </div>
);

export const CreateForwardRuleDialog: React.FC<CreateForwardRuleDialogProps> = ({
  open,
  onClose,
  onSubmit,
  agents,
  nodes = [],
  initialData,
  resourceGroups = [],
  plansMap = {},
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    agentId: "",
    ruleType: "direct" as ForwardRuleType,
    exitAgentId: "",
    chainAgentIds: [] as string[],
    chainPortConfig: {} as Record<string, number>,
    tunnelType: "ws" as TunnelType,
    tunnelHops: undefined as number | undefined,
    name: "",
    listenPort: 0,
    targetAddress: "",
    targetPort: 0,
    targetNodeId: "",
    bindIp: "",
    trafficMultiplier: undefined as number | undefined,
    sortOrder: undefined as number | undefined,
    protocol: "tcp" as ForwardProtocol,
    ipVersion: "auto" as IPVersion,
    remark: "",
    groupSids: [] as string[],
    serverAddress: "",
    externalSource: "",
    externalRuleId: "",
  });
  const [targetType, setTargetType] = useState<TargetType>("manual");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Reset form or use initial data when dialog opens
  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          agentId: initialData.agentId || "",
          ruleType: initialData.ruleType || "direct",
          exitAgentId: initialData.exitAgentId || "",
          chainAgentIds: initialData.chainAgentIds || [],
          chainPortConfig: initialData.chainPortConfig || {},
          tunnelType: initialData.tunnelType || "ws",
          tunnelHops: initialData.tunnelHops,
          name: initialData.name || "",
          listenPort: initialData.listenPort || 0,
          targetAddress: initialData.targetAddress || "",
          targetPort: initialData.targetPort || 0,
          targetNodeId: initialData.targetNodeId || "",
          bindIp: initialData.bindIp || "",
          trafficMultiplier: initialData.trafficMultiplier,
          sortOrder: initialData.sortOrder,
          protocol: initialData.protocol || "tcp",
          ipVersion: initialData.ipVersion || "auto",
          remark: initialData.remark || "",
          groupSids: initialData.groupSids || [],
          serverAddress:
            (initialData as Record<string, unknown>).serverAddress as string ||
            "",
          externalSource:
            (initialData as Record<string, unknown>).externalSource as string ||
            "",
          externalRuleId:
            (initialData as Record<string, unknown>).externalRuleId as string ||
            "",
        });
        setTargetType(
          initialData.targetType ||
            (initialData.targetNodeId ? "node" : "manual"),
        );
      } else {
        setFormData({
          agentId: "",
          ruleType: "direct",
          exitAgentId: "",
          chainAgentIds: [],
          chainPortConfig: {},
          tunnelType: "ws",
          tunnelHops: undefined,
          name: "",
          listenPort: 0,
          targetAddress: "",
          targetPort: 0,
          targetNodeId: "",
          bindIp: "",
          trafficMultiplier: undefined,
          sortOrder: undefined,
          protocol: "tcp",
          ipVersion: "auto",
          remark: "",
          groupSids: [],
          serverAddress: "",
          externalSource: "",
          externalRuleId: "",
        });
        setTargetType("manual");
      }
      setErrors({});
    }
  }, [open, initialData]);

  const handleClose = () => {
    onClose();
  };

  const handleChange = (
    field: string,
    value: string | number | string[] | undefined,
  ) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      if (field === "agentId" && typeof value === "string") {
        const currentChainIds = prev.chainAgentIds || [];
        if (currentChainIds.includes(value)) {
          newData.chainAgentIds = currentChainIds.filter(
            (id: string) => id !== value,
          );
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
  };

  const handleChainPortChange = (agentId: string, port: number) => {
    setFormData((prev) => ({
      ...prev,
      chainPortConfig: {
        ...prev.chainPortConfig,
        [agentId]: port,
      },
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (formData.ruleType === "external") {
      if (!formData.name.trim()) {
        newErrors.name = t("admin.forwardRules.validation.ruleNameRequired");
      }
      if (!formData.serverAddress.trim()) {
        newErrors.serverAddress = t(
          "admin.forwardRules.validation.serverAddressRequired",
        );
      }
      if (
        !formData.listenPort ||
        formData.listenPort < 1 ||
        formData.listenPort > 65535
      ) {
        newErrors.listenPort = t(
          "admin.forwardRules.validation.listenPortRange",
        );
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    if (!formData.agentId) {
      newErrors.agentId = t("admin.forwardRules.validation.selectForwardAgent");
    }

    if (!formData.name.trim()) {
      newErrors.name = t("admin.forwardRules.validation.ruleNameRequired");
    }

    if (!formData.protocol) {
      newErrors.protocol = t("admin.forwardRules.validation.protocolRequired");
    }

    const selectedAgent = agents.find((a) => a.id === formData.agentId);

    if (formData.ruleType === "direct") {
      if (
        formData.listenPort &&
        (formData.listenPort < 1 || formData.listenPort > 65535)
      ) {
        newErrors.listenPort = t(
          "admin.forwardRules.validation.listenPortRange",
        );
      } else if (
        formData.listenPort &&
        selectedAgent?.allowedPortRange &&
        !isPortInAllowedRange(formData.listenPort, selectedAgent.allowedPortRange)
      ) {
        newErrors.listenPort = t(
          "admin.forwardRules.validation.portNotInRange",
          { port: formData.listenPort, range: selectedAgent.allowedPortRange },
        );
      }
      if (targetType === "manual") {
        if (!formData.targetAddress.trim()) {
          newErrors.targetAddress = t(
            "admin.forwardRules.validation.targetAddressRequired",
          );
        }
        if (
          !formData.targetPort ||
          formData.targetPort < 1 ||
          formData.targetPort > 65535
        ) {
          newErrors.targetPort = t(
            "admin.forwardRules.validation.targetPortRange",
          );
        }
      } else if (targetType === "node") {
        if (!formData.targetNodeId) {
          newErrors.targetNodeId = t(
            "admin.forwardRules.validation.selectTargetNode",
          );
        }
      }
    } else if (formData.ruleType === "entry") {
      if (
        formData.listenPort &&
        (formData.listenPort < 1 || formData.listenPort > 65535)
      ) {
        newErrors.listenPort = t(
          "admin.forwardRules.validation.listenPortRange",
        );
      } else if (
        formData.listenPort &&
        selectedAgent?.allowedPortRange &&
        !isPortInAllowedRange(formData.listenPort, selectedAgent.allowedPortRange)
      ) {
        newErrors.listenPort = t(
          "admin.forwardRules.validation.portNotInRange",
          { port: formData.listenPort, range: selectedAgent.allowedPortRange },
        );
      }
      if (!formData.exitAgentId) {
        newErrors.exitAgentId = t(
          "admin.forwardRules.validation.selectExitNode",
        );
      }
      if (targetType === "manual") {
        if (!formData.targetAddress.trim()) {
          newErrors.targetAddress = t(
            "admin.forwardRules.validation.targetAddressRequired",
          );
        }
        if (
          !formData.targetPort ||
          formData.targetPort < 1 ||
          formData.targetPort > 65535
        ) {
          newErrors.targetPort = t(
            "admin.forwardRules.validation.targetPortRange",
          );
        }
      } else if (targetType === "node") {
        if (!formData.targetNodeId) {
          newErrors.targetNodeId = t(
            "admin.forwardRules.validation.selectTargetNode",
          );
        }
      }
    } else if (formData.ruleType === "chain") {
      if (
        formData.listenPort &&
        (formData.listenPort < 1 || formData.listenPort > 65535)
      ) {
        newErrors.listenPort = t(
          "admin.forwardRules.validation.listenPortRange",
        );
      } else if (
        formData.listenPort &&
        selectedAgent?.allowedPortRange &&
        !isPortInAllowedRange(formData.listenPort, selectedAgent.allowedPortRange)
      ) {
        newErrors.listenPort = t(
          "admin.forwardRules.validation.portNotInRange",
          { port: formData.listenPort, range: selectedAgent.allowedPortRange },
        );
      }
      if (!formData.chainAgentIds || formData.chainAgentIds.length === 0) {
        newErrors.chainAgentIds = t(
          "admin.forwardRules.validation.selectAtLeastOneNode",
        );
      }
      if (
        formData.tunnelHops !== undefined &&
        formData.tunnelHops >= 0 &&
        formData.tunnelHops < formData.chainAgentIds.length
      ) {
        const missingPorts: string[] = [];
        for (
          let i = formData.tunnelHops;
          i < formData.chainAgentIds.length;
          i++
        ) {
          const agentId = formData.chainAgentIds[i];
          const port = formData.chainPortConfig[agentId];
          if (!port || port < 1 || port > 65535) {
            const agent = agents.find((a) => a.id === agentId);
            const agentName = agent ? agent.name : agentId;
            missingPorts.push(agentName);
          }
        }
        if (missingPorts.length > 0) {
          newErrors.chainPortConfig = t(
            "admin.forwardRules.validation.configurePortsForNodes",
            { nodes: missingPorts.join(", ") },
          );
        }
      }
      if (targetType === "manual") {
        if (!formData.targetAddress.trim()) {
          newErrors.targetAddress = t(
            "admin.forwardRules.validation.targetAddressRequired",
          );
        }
        if (
          !formData.targetPort ||
          formData.targetPort < 1 ||
          formData.targetPort > 65535
        ) {
          newErrors.targetPort = t(
            "admin.forwardRules.validation.targetPortRange",
          );
        }
      } else if (targetType === "node") {
        if (!formData.targetNodeId) {
          newErrors.targetNodeId = t(
            "admin.forwardRules.validation.selectTargetNode",
          );
        }
      }
    } else if (formData.ruleType === "direct_chain") {
      if (
        formData.listenPort &&
        (formData.listenPort < 1 || formData.listenPort > 65535)
      ) {
        newErrors.listenPort = t(
          "admin.forwardRules.validation.listenPortRange",
        );
      } else if (
        formData.listenPort &&
        selectedAgent?.allowedPortRange &&
        !isPortInAllowedRange(formData.listenPort, selectedAgent.allowedPortRange)
      ) {
        newErrors.listenPort = t(
          "admin.forwardRules.validation.portNotInRange",
          { port: formData.listenPort, range: selectedAgent.allowedPortRange },
        );
      }
      if (!formData.chainAgentIds || formData.chainAgentIds.length === 0) {
        newErrors.chainAgentIds = t(
          "admin.forwardRules.validation.selectAtLeastOneNode",
        );
      }
      const missingPorts: string[] = [];
      for (const agentId of formData.chainAgentIds) {
        const port = formData.chainPortConfig[agentId];
        if (!port || port < 1 || port > 65535) {
          const agent = agents.find((a) => a.id === agentId);
          const agentName = agent ? agent.name : agentId;
          missingPorts.push(agentName);
        }
      }
      if (missingPorts.length > 0) {
        if (missingPorts.length === formData.chainAgentIds.length) {
          newErrors.chainPortConfig = t(
            "admin.forwardRules.validation.configureValidPorts",
          );
        } else {
          newErrors.chainPortConfig = t(
            "admin.forwardRules.validation.configurePortsForNodes",
            { nodes: missingPorts.join(", ") },
          );
        }
      }
      if (targetType === "manual") {
        if (!formData.targetAddress.trim()) {
          newErrors.targetAddress = t(
            "admin.forwardRules.validation.targetAddressRequired",
          );
        }
        if (
          !formData.targetPort ||
          formData.targetPort < 1 ||
          formData.targetPort > 65535
        ) {
          newErrors.targetPort = t(
            "admin.forwardRules.validation.targetPortRange",
          );
        }
      } else if (targetType === "node") {
        if (!formData.targetNodeId) {
          newErrors.targetNodeId = t(
            "admin.forwardRules.validation.selectTargetNode",
          );
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      if (formData.ruleType === "external") {
        const submitData = {
          ruleType: formData.ruleType,
          name: formData.name.trim(),
          serverAddress: formData.serverAddress.trim(),
          listenPort: formData.listenPort,
          ...(formData.targetNodeId && { targetNodeId: formData.targetNodeId }),
          ...(formData.externalSource?.trim() && {
            externalSource: formData.externalSource.trim(),
          }),
          ...(formData.externalRuleId?.trim() && {
            externalRuleId: formData.externalRuleId.trim(),
          }),
          ...(formData.sortOrder !== undefined &&
            formData.sortOrder !== null &&
            formData.sortOrder >= 0 && { sortOrder: formData.sortOrder }),
          ...(formData.remark?.trim() && { remark: formData.remark.trim() }),
          ...(formData.groupSids &&
            formData.groupSids.length > 0 && { groupSids: formData.groupSids }),
        } as unknown as CreateForwardRuleRequest;

        onSubmit(submitData);
        handleClose();
        return;
      }

      const submitData: CreateForwardRuleRequest = {
        agentId: formData.agentId,
        ruleType: formData.ruleType,
        name: formData.name.trim(),
        protocol: formData.protocol,
        ipVersion: formData.ipVersion,
      };

      if (formData.ruleType === "direct") {
        submitData.listenPort = formData.listenPort;
        if (targetType === "manual") {
          submitData.targetAddress = formData.targetAddress.trim();
          submitData.targetPort = formData.targetPort;
        } else {
          submitData.targetNodeId = formData.targetNodeId;
        }
      } else if (formData.ruleType === "entry") {
        submitData.listenPort = formData.listenPort;
        submitData.exitAgentId = formData.exitAgentId;
        submitData.tunnelType = formData.tunnelType;
        if (targetType === "manual") {
          submitData.targetAddress = formData.targetAddress.trim();
          submitData.targetPort = formData.targetPort;
        } else {
          submitData.targetNodeId = formData.targetNodeId;
        }
      } else if (formData.ruleType === "chain") {
        submitData.listenPort = formData.listenPort;
        submitData.chainAgentIds = formData.chainAgentIds;
        submitData.tunnelType = formData.tunnelType;
        if (
          formData.tunnelHops !== undefined &&
          formData.tunnelHops !== null &&
          formData.tunnelHops >= 0
        ) {
          submitData.tunnelHops = formData.tunnelHops;
          if (
            formData.tunnelHops < formData.chainAgentIds.length &&
            Object.keys(formData.chainPortConfig).length > 0
          ) {
            submitData.chainPortConfig = formData.chainPortConfig;
          }
        }
        if (targetType === "manual") {
          submitData.targetAddress = formData.targetAddress.trim();
          submitData.targetPort = formData.targetPort;
        } else {
          submitData.targetNodeId = formData.targetNodeId;
        }
      } else if (formData.ruleType === "direct_chain") {
        submitData.listenPort = formData.listenPort;
        submitData.chainAgentIds = formData.chainAgentIds;
        submitData.chainPortConfig = formData.chainPortConfig;
        if (targetType === "manual") {
          submitData.targetAddress = formData.targetAddress.trim();
          submitData.targetPort = formData.targetPort;
        } else {
          submitData.targetNodeId = formData.targetNodeId;
        }
      }

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

      onSubmit(submitData);
      handleClose();
    }
  };

  const isFormValid = () => {
    if (formData.ruleType === "external") {
      return (
        formData.name.trim() !== "" &&
        formData.serverAddress.trim() !== "" &&
        formData.listenPort > 0 &&
        formData.listenPort <= 65535
      );
    }

    if (!formData.agentId || !formData.name.trim() || !formData.protocol)
      return false;

    if (formData.ruleType === "direct") {
      if (targetType === "manual") {
        return formData.targetAddress.trim() !== "" && formData.targetPort > 0;
      } else {
        return !!formData.targetNodeId;
      }
    } else if (formData.ruleType === "entry") {
      if (formData.exitAgentId === "") return false;
      if (targetType === "manual") {
        return formData.targetAddress.trim() !== "" && formData.targetPort > 0;
      } else {
        return !!formData.targetNodeId;
      }
    } else if (formData.ruleType === "chain") {
      if (formData.chainAgentIds.length === 0) return false;
      if (
        formData.tunnelHops !== undefined &&
        formData.tunnelHops >= 0 &&
        formData.tunnelHops < formData.chainAgentIds.length
      ) {
        for (
          let i = formData.tunnelHops;
          i < formData.chainAgentIds.length;
          i++
        ) {
          const agentId = formData.chainAgentIds[i];
          const port = formData.chainPortConfig[agentId];
          if (!port || port <= 0 || port > 65535) return false;
        }
      }
      if (targetType === "manual") {
        return formData.targetAddress.trim() !== "" && formData.targetPort > 0;
      } else {
        return !!formData.targetNodeId;
      }
    } else if (formData.ruleType === "direct_chain") {
      if (formData.chainAgentIds.length === 0) return false;
      const allPortsValid = formData.chainAgentIds.every((id) => {
        const port = formData.chainPortConfig[id];
        return port && port > 0 && port <= 65535;
      });
      if (!allPortsValid) return false;
      if (targetType === "manual") {
        return formData.targetAddress.trim() !== "" && formData.targetPort > 0;
      } else {
        return !!formData.targetNodeId;
      }
    }
    return false;
  };

  const availableNodes = nodes.filter(
    (n) => n.status === "active" || n.id === formData.targetNodeId,
  );

  const availableAgentsForSelect = agents.filter(
    (a) =>
      a.status === "enabled" ||
      a.id === formData.agentId ||
      a.id === formData.exitAgentId ||
      formData.chainAgentIds.includes(a.id),
  );

  const availableExitAgents = availableAgentsForSelect.filter(
    (a) => a.id !== formData.agentId,
  );

  const availableChainAgents = availableAgentsForSelect.filter(
    (a) => a.id !== formData.agentId,
  );

  const availableResourceGroups = useMemo(() => {
    return resourceGroups.filter((group) => {
      const plan = plansMap[group.planId];
      return (
        group.status === "active" &&
        plan &&
        (plan.planType === "node" || plan.planType === "hybrid")
      );
    });
  }, [resourceGroups, plansMap]);

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

  const selectedAgent = agents.find((a) => a.id === formData.agentId);
  const selectedExitAgent = agents.find((a) => a.id === formData.exitAgentId);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-2xl flex flex-col max-h-[90vh] p-0">
        <DialogHeader className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-border sm:px-6">
          <DialogTitle className="text-lg font-semibold">
            {initialData
              ? t("admin.forwardRules.form.copyRule")
              : t("admin.forwardRules.form.createRule")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="space-y-6">
            {/* Section 1: Basic Information */}
            <FormSection title={t("common.sections.basicInfo")}>
              <div className="grid grid-cols-6 gap-x-4 gap-y-4">
                {/* Rule Name - 4 cols on desktop */}
                <FormField
                  label={t("admin.forwardRules.form.ruleName")}
                  required
                  error={errors.name}
                  className="col-span-6 sm:col-span-4"
                >
                  <Input
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    error={!!errors.name}
                    placeholder={t(
                      "admin.forwardRules.form.ruleNamePlaceholder",
                    )}
                  />
                </FormField>

                {/* Rule Type - 2 cols on desktop */}
                <FormField
                  label={t("admin.forwardRules.form.ruleType")}
                  required
                  className="col-span-6 sm:col-span-2"
                >
                  <Select
                    value={formData.ruleType}
                    onValueChange={(value) =>
                      handleChange("ruleType", value as ForwardRuleType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(RULE_TYPE_KEYS) as ForwardRuleType[]).map(
                        (type) => (
                          <SelectItem key={type} value={type}>
                            {t(
                              `admin.forwardRules.ruleTypeInfo.${RULE_TYPE_KEYS[type]}.label`,
                            )}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </FormField>

                {/* Rule Type Description - full width */}
                <p className="col-span-6 text-xs text-muted-foreground -mt-2">
                  {t(
                    `admin.forwardRules.ruleTypeInfo.${RULE_TYPE_KEYS[formData.ruleType]}.description`,
                  )}
                </p>
              </div>
            </FormSection>

            {/* Section 2: Forward Agent & Protocol (hidden for external) */}
            {formData.ruleType !== "external" && (
              <FormSection title={t("admin.forwardRules.form.forwardAgent")}>
                <div className="grid grid-cols-6 gap-x-4 gap-y-4">
                  {/* Forward Agent - 3 cols */}
                  <FormField
                    label={t("admin.forwardRules.form.forwardAgent")}
                    required
                    error={errors.agentId}
                    className="col-span-6 sm:col-span-3"
                  >
                    <Select
                      value={formData.agentId}
                      onValueChange={(value) => handleChange("agentId", value)}
                    >
                      <SelectTrigger
                        className={errors.agentId ? "border-destructive" : ""}
                      >
                        <SelectValue
                          placeholder={t(
                            "admin.forwardRules.form.selectForwardAgent",
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableAgentsForSelect.map((agent) => (
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
                  </FormField>

                  {/* Listen Port - 1.5 cols */}
                  <FormField
                    label={t("admin.forwardRules.form.listenPort")}
                    error={errors.listenPort}
                    className="col-span-3 sm:col-span-2"
                  >
                    <Input
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
                      placeholder={t(
                        "common.auto",
                      )}
                    />
                  </FormField>

                  {/* Protocol - 1.5 cols */}
                  <FormField
                    label={t("common.protocol")}
                    required
                    className="col-span-3 sm:col-span-1"
                  >
                    <Select
                      value={formData.protocol}
                      onValueChange={(value) =>
                        handleChange("protocol", value as ForwardProtocol)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tcp">TCP</SelectItem>
                        <SelectItem value="udp">UDP</SelectItem>
                        <SelectItem value="both">TCP/UDP</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  {/* Port Range Warning */}
                  {selectedAgent?.allowedPortRange && (
                    <div className="col-span-6 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-2.5 py-1.5 -mt-2">
                      <Info className="size-3.5 shrink-0" />
                      <span>
                        {t("admin.forwardRules.form.portRestriction", {
                          range: selectedAgent.allowedPortRange,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </FormSection>
            )}

            {/* Section 3: Forwarding Configuration (type-specific) */}
            <FormSection title={t("admin.forwardRules.form.forwardConfig")}>
              <div className="grid grid-cols-6 gap-x-4 gap-y-4">
                {/* External type fields */}
                {formData.ruleType === "external" && (
                  <>
                    <FormField
                      label={t("admin.forwardRules.form.serverAddress")}
                      required
                      error={errors.serverAddress}
                      className="col-span-6 sm:col-span-4"
                    >
                      <Input
                        value={formData.serverAddress}
                        onChange={(e) =>
                          handleChange("serverAddress", e.target.value)
                        }
                        error={!!errors.serverAddress}
                        placeholder={t(
                          "admin.forwardRules.form.serverAddressPlaceholder",
                        )}
                      />
                    </FormField>

                    <FormField
                      label={t("admin.forwardRules.form.listenPort")}
                      required
                      error={errors.listenPort}
                      className="col-span-6 sm:col-span-2"
                    >
                      <Input
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
                    </FormField>

                    <FormField
                      label={t("admin.forwardRules.form.targetNode")}
                      hint={t("admin.forwardRules.form.targetNodeHint")}
                      className="col-span-6 sm:col-span-3"
                    >
                      <Select
                        value={formData.targetNodeId}
                        onValueChange={(value) =>
                          handleChange("targetNodeId", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              "admin.forwardRules.form.selectTargetNodeOptional",
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {availableNodes.map((node) => (
                            <SelectItem key={node.id} value={node.id}>
                              {node.name} ({node.serverAddress})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField
                      label={t("admin.forwardRules.form.externalSource")}
                      hint={t("admin.forwardRules.form.externalSourceHint")}
                      className="col-span-6 sm:col-span-3"
                    >
                      <Input
                        value={formData.externalSource}
                        onChange={(e) =>
                          handleChange("externalSource", e.target.value)
                        }
                        placeholder={t(
                          "admin.forwardRules.form.externalSourcePlaceholder",
                        )}
                      />
                    </FormField>
                  </>
                )}

                {/* Entry type: Exit Agent + Tunnel Type */}
                {formData.ruleType === "entry" && (
                  <>
                    <FormField
                      label={t("admin.forwardRules.form.exitNode")}
                      required
                      error={errors.exitAgentId}
                      className="col-span-6 sm:col-span-4"
                    >
                      <Select
                        value={formData.exitAgentId}
                        onValueChange={(value) =>
                          handleChange("exitAgentId", value)
                        }
                      >
                        <SelectTrigger
                          className={
                            errors.exitAgentId ? "border-destructive" : ""
                          }
                        >
                          <SelectValue
                            placeholder={t(
                              "admin.forwardRules.form.selectExitNode",
                            )}
                          />
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
                    </FormField>

                    <FormField
                      label={t("admin.forwardRules.form.tunnelType")}
                      className="col-span-6 sm:col-span-2"
                    >
                      <Select
                        value={formData.tunnelType}
                        onValueChange={(value) =>
                          handleChange("tunnelType", value as TunnelType)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ws">WebSocket</SelectItem>
                          <SelectItem value="tls">TLS</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>

                    {selectedExitAgent?.allowedPortRange && (
                      <div className="col-span-6 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-2.5 py-1.5 -mt-2">
                        <Info className="size-3.5 shrink-0" />
                        <span>
                          {t("admin.forwardRules.form.portRestriction", {
                            range: selectedExitAgent.allowedPortRange,
                          })}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* Chain type: Tunnel settings + Intermediate Nodes */}
                {formData.ruleType === "chain" && (
                  <>
                    <FormField
                      label={t("admin.forwardRules.form.tunnelType")}
                      className="col-span-3 sm:col-span-2"
                    >
                      <Select
                        value={formData.tunnelType}
                        onValueChange={(value) =>
                          handleChange("tunnelType", value as TunnelType)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ws">WebSocket</SelectItem>
                          <SelectItem value="tls">TLS</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField
                      label={t("admin.forwardRules.form.tunnelHops")}
                      hint={t("admin.forwardRules.form.tunnelHopsHint")}
                      className="col-span-3 sm:col-span-2"
                    >
                      <Input
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
                        placeholder={t(
                          "admin.forwardRules.form.tunnelHopsPlaceholder",
                        )}
                      />
                    </FormField>

                    <FormField
                      label={t("admin.forwardRules.form.chainNodes")}
                      required
                      error={errors.chainAgentIds || errors.chainPortConfig}
                      className="col-span-6"
                    >
                      <SortableChainAgentList
                        agents={availableChainAgents}
                        selectedIds={formData.chainAgentIds}
                        onSelectionChange={(ids) => {
                          if (
                            formData.tunnelHops !== undefined &&
                            formData.tunnelHops >= 0
                          ) {
                            const newPortConfig = {
                              ...formData.chainPortConfig,
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
                          formData.tunnelHops < formData.chainAgentIds.length
                        }
                        portConfigStartIndex={formData.tunnelHops ?? 0}
                        portConfig={formData.chainPortConfig}
                        onPortConfigChange={handleChainPortChange}
                        hasError={
                          !!errors.chainAgentIds || !!errors.chainPortConfig
                        }
                        idPrefix="chain-agent"
                      />
                    </FormField>
                  </>
                )}

                {/* direct_chain type: Intermediate Nodes with port */}
                {formData.ruleType === "direct_chain" && (
                  <FormField
                    label={t("admin.forwardRules.form.chainNodesWithPort")}
                    required
                    error={errors.chainAgentIds || errors.chainPortConfig}
                    className="col-span-6"
                  >
                    <SortableChainAgentList
                      agents={availableChainAgents}
                      selectedIds={formData.chainAgentIds}
                      onSelectionChange={(ids) => {
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
                      }}
                      showPortConfig
                      portConfig={formData.chainPortConfig}
                      onPortConfigChange={handleChainPortChange}
                      hasError={
                        !!errors.chainAgentIds || !!errors.chainPortConfig
                      }
                      idPrefix="direct-chain-agent"
                    />
                  </FormField>
                )}

                {/* Target Configuration - for non-external types */}
                {(formData.ruleType === "direct" ||
                  formData.ruleType === "entry" ||
                  formData.ruleType === "chain" ||
                  formData.ruleType === "direct_chain") && (
                  <>
                    {/* Target Type Radio */}
                    <div className="col-span-6">
                      <Label className="text-sm font-medium text-foreground mb-3 block">
                        {t("admin.forwardRules.form.targetType")}
                        <span className="text-destructive ml-0.5">*</span>
                      </Label>
                      <RadioGroup
                        value={targetType}
                        onValueChange={(value) => {
                          setTargetType(value as TargetType);
                          if (value === "manual") {
                            handleChange("targetNodeId", "");
                          } else {
                            handleChange("targetAddress", "");
                            handleChange("targetPort", 0);
                          }
                        }}
                        className="flex gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="manual" id="target-manual" />
                          <Label
                            htmlFor="target-manual"
                            className="font-normal cursor-pointer"
                          >
                            {t("admin.forwardRules.form.targetTypeManual")}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="node" id="target-node" />
                          <Label
                            htmlFor="target-node"
                            className="font-normal cursor-pointer"
                          >
                            {t("admin.forwardRules.form.targetTypeNode")}
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Manual Target */}
                    {targetType === "manual" && (
                      <>
                        <FormField
                          label={t("admin.forwardRules.form.targetAddress")}
                          required
                          error={errors.targetAddress}
                          className="col-span-6 sm:col-span-4"
                        >
                          <Input
                            placeholder={t(
                              "admin.forwardRules.form.targetAddressPlaceholder",
                            )}
                            value={formData.targetAddress}
                            onChange={(e) =>
                              handleChange("targetAddress", e.target.value)
                            }
                            error={!!errors.targetAddress}
                          />
                        </FormField>

                        <FormField
                          label={t("admin.forwardRules.form.targetPort")}
                          required
                          error={errors.targetPort}
                          className="col-span-6 sm:col-span-2"
                        >
                          <Input
                            type="number"
                            min={1}
                            max={65535}
                            value={formData.targetPort || ""}
                            onChange={(e) =>
                              handleChange(
                                "targetPort",
                                parseInt(e.target.value, 10) || 0,
                              )
                            }
                            error={!!errors.targetPort}
                            placeholder="1-65535"
                          />
                        </FormField>
                      </>
                    )}

                    {/* Node Target */}
                    {targetType === "node" && (
                      <FormField
                        label={t("admin.forwardRules.form.targetNode")}
                        required
                        error={errors.targetNodeId}
                        hint={t(
                          "admin.forwardRules.form.targetNodeDynamicHint",
                        )}
                        className="col-span-6"
                      >
                        <Select
                          value={formData.targetNodeId}
                          onValueChange={(value) =>
                            handleChange("targetNodeId", value)
                          }
                        >
                          <SelectTrigger
                            className={
                              errors.targetNodeId ? "border-destructive" : ""
                            }
                          >
                            <SelectValue
                              placeholder={t(
                                "admin.forwardRules.form.selectTargetNode",
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {availableNodes.map((node) => (
                              <SelectItem key={node.id} value={node.id}>
                                {node.name} ({node.serverAddress})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>
                    )}
                  </>
                )}
              </div>
            </FormSection>

            {/* Section 4: Advanced Options (Collapsible) */}
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-3 w-full text-left group"
                >
                  <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                    {t("common.sections.advancedOptions")}
                  </span>
                  <div className="h-px flex-1 bg-border" aria-hidden="true" />
                  <ChevronDown
                    className={`size-4 text-muted-foreground transition-transform duration-200 ${
                      advancedOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <div className="grid grid-cols-6 gap-x-4 gap-y-4">
                  {/* IP Version */}
                  {formData.ruleType !== "external" && (
                    <FormField
                      label={t("admin.forwardRules.form.ipVersion")}
                      hint={t("admin.forwardRules.form.ipVersionHint")}
                      className="col-span-6 sm:col-span-2"
                    >
                      <Select
                        value={formData.ipVersion}
                        onValueChange={(value) =>
                          handleChange("ipVersion", value as IPVersion)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">
                            {t("common.auto")}
                          </SelectItem>
                          <SelectItem value="ipv4">IPv4</SelectItem>
                          <SelectItem value="ipv6">IPv6</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>
                  )}

                  {/* Bind IP */}
                  {formData.ruleType !== "external" && (
                    <FormField
                      label={t("admin.forwardRules.form.bindIp")}
                      hint={t("admin.forwardRules.form.bindIpHint")}
                      className="col-span-6 sm:col-span-2"
                    >
                      <Input
                        value={formData.bindIp}
                        onChange={(e) =>
                          handleChange("bindIp", e.target.value)
                        }
                        placeholder={t(
                          "admin.forwardRules.form.bindIpPlaceholder",
                        )}
                      />
                    </FormField>
                  )}

                  {/* Traffic Multiplier */}
                  {formData.ruleType !== "external" && (
                    <FormField
                      label={t("admin.forwardRules.form.trafficMultiplier")}
                      hint={t("admin.forwardRules.form.trafficMultiplierHint")}
                      className="col-span-3 sm:col-span-1"
                    >
                      <Input
                        type="number"
                        min={0}
                        max={1000000}
                        step={0.01}
                        value={formData.trafficMultiplier ?? ""}
                        onChange={(e) => {
                          const value =
                            e.target.value === ""
                              ? undefined
                              : parseFloat(e.target.value);
                          handleChange("trafficMultiplier", value);
                        }}
                        placeholder="1.0"
                      />
                    </FormField>
                  )}

                  {/* Sort Order */}
                  <FormField
                    label={t("common.fields.sortOrder")}
                    hint={t("admin.forwardRules.form.sortOrderHint")}
                    className="col-span-3 sm:col-span-1"
                  >
                    <Input
                      type="number"
                      min={0}
                      value={formData.sortOrder ?? ""}
                      onChange={(e) => {
                        const value =
                          e.target.value === ""
                            ? undefined
                            : parseInt(e.target.value, 10);
                        handleChange("sortOrder", value);
                      }}
                      placeholder="0"
                    />
                  </FormField>

                  {/* External Rule ID (for external type) */}
                  {formData.ruleType === "external" && (
                    <FormField
                      label={t("admin.forwardRules.form.externalRuleId")}
                      hint={t("admin.forwardRules.form.externalRuleIdHint")}
                      className="col-span-6 sm:col-span-3"
                    >
                      <Input
                        value={formData.externalRuleId}
                        onChange={(e) =>
                          handleChange("externalRuleId", e.target.value)
                        }
                        placeholder={t(
                          "admin.forwardRules.form.externalRuleIdPlaceholder",
                        )}
                      />
                    </FormField>
                  )}

                  {/* Remark */}
                  <FormField
                    label={t("common.fields.remark")}
                    className="col-span-6"
                  >
                    <Textarea
                      rows={2}
                      value={formData.remark}
                      onChange={(e) => handleChange("remark", e.target.value)}
                      placeholder={t(
                        "admin.forwardRules.form.remarkPlaceholder",
                      )}
                      className="resize-none"
                    />
                  </FormField>

                  {/* Resource Groups Selection */}
                  {availableResourceGroups.length > 0 && (
                    <FormField
                      label={
                        <span className="flex items-center gap-1.5">
                          <FolderTree className="size-4" />
                          {t("admin.forwardRules.form.bindResourceGroups")}
                        </span>
                      }
                      hint={
                        formData.groupSids && formData.groupSids.length > 0
                          ? t("admin.forwardRules.form.selectedGroupsCount", {
                              count: formData.groupSids.length,
                            })
                          : t("admin.forwardRules.form.bindResourceGroupsHint")
                      }
                      className="col-span-6"
                    >
                      <div className="border rounded-lg overflow-hidden">
                        <ScrollArea className="h-[100px]">
                          <div className="divide-y divide-border">
                            {availableResourceGroups.map((group) => {
                              const plan = plansMap[group.planId];
                              const isSelected =
                                formData.groupSids?.includes(group.sid) ??
                                false;
                              return (
                                <label
                                  key={group.sid}
                                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                                    isSelected
                                      ? "bg-primary/5"
                                      : "hover:bg-muted/50"
                                  }`}
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() =>
                                      handleGroupToggle(group.sid)
                                    }
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {group.name}
                                    </p>
                                    {plan && (
                                      <p className="text-xs text-muted-foreground truncate">
                                        {plan.name}
                                      </p>
                                    )}
                                  </div>
                                  {plan && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] flex-shrink-0"
                                    >
                                      {plan.planType === "node"
                                        ? t(
                                            "admin.forwardRules.form.planTypeNode",
                                          )
                                        : t(
                                            "common.planType.hybrid",
                                          )}
                                    </Badge>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </div>
                    </FormField>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 px-5 py-4 border-t border-border bg-muted/30 sm:px-6">
          <div className="flex gap-3 justify-end w-full">
            <Button variant="outline" onClick={handleClose}>
              {t("common.actions.cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={!isFormValid()}>
              {t("common.actions.create")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
