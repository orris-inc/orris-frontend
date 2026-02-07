/**
 * Shared form hook for editing forward agents.
 * Extracts form state, validation, handlers, and computed values
 * from EditForwardAgentDialog and EditForwardAgentSheet.
 */

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type {
  ForwardAgent,
  UpdateForwardAgentRequest,
  BlockedProtocol,
} from "@/api/forward";
export { PROTOCOL_GROUPS } from "../constants";

interface UseEditForwardAgentFormOptions {
  entity: ForwardAgent | null;
}

export function useEditForwardAgentForm({
  entity: agent,
}: UseEditForwardAgentFormOptions) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<UpdateForwardAgentRequest>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync form data when agent changes
  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name,
        publicAddress: agent.publicAddress,
        tunnelAddress: agent.tunnelAddress,
        remark: agent.remark,
        allowedPortRange: agent.allowedPortRange,
        sortOrder: agent.sortOrder,
        blockedProtocols: agent.blockedProtocols || [],
        groupSids: agent.groupSids || [],
        muteNotification: agent.muteNotification,
        expiresAt: agent.expiresAt,
        costLabel: agent.costLabel,
      });
      setErrors({});
    }
  }, [agent]);

  const handleChange = useCallback(
    (
      field: keyof UpdateForwardAgentRequest,
      value: string | number | boolean | undefined
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => {
        if (prev[field]) {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        }
        return prev;
      });
    },
    []
  );

  const handleSortOrderChange = useCallback(
    (value: string) => {
      if (value === "") {
        handleChange("sortOrder", undefined);
      } else {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= 0) {
          handleChange("sortOrder", num);
        }
      }
    },
    [handleChange]
  );

  const handleCostLabelChange = useCallback(
    (value: string) => {
      handleChange("costLabel", value || undefined);
    },
    [handleChange]
  );

  const handleProtocolToggle = useCallback(
    (protocol: BlockedProtocol, checked: boolean) => {
      setFormData((prev) => {
        const current = prev.blockedProtocols || [];
        const updated = checked
          ? [...current, protocol]
          : current.filter((p) => p !== protocol);
        return { ...prev, blockedProtocols: updated };
      });
    },
    []
  );

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

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (formData.name !== undefined && !formData.name.trim()) {
      newErrors.name = t("admin.forwardAgents.edit.validation.nameRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.name, t]);

  const buildSubmitData = useCallback((): UpdateForwardAgentRequest | null => {
    if (!agent) return null;

    const updates: UpdateForwardAgentRequest = {};

    if (formData.name !== agent.name) updates.name = formData.name;
    if (formData.publicAddress !== agent.publicAddress)
      updates.publicAddress = formData.publicAddress;
    if (formData.tunnelAddress !== agent.tunnelAddress)
      updates.tunnelAddress = formData.tunnelAddress;
    if (formData.remark !== agent.remark) updates.remark = formData.remark;
    if (formData.allowedPortRange !== agent.allowedPortRange)
      updates.allowedPortRange = formData.allowedPortRange;
    if (formData.sortOrder !== agent.sortOrder)
      updates.sortOrder = formData.sortOrder;

    // Compare blocked protocols arrays
    const currentProtocols = agent.blockedProtocols || [];
    const newProtocols = formData.blockedProtocols || [];
    const protocolsChanged =
      currentProtocols.length !== newProtocols.length ||
      currentProtocols.some((p) => !newProtocols.includes(p)) ||
      newProtocols.some((p) => !currentProtocols.includes(p));
    if (protocolsChanged) {
      updates.blockedProtocols = newProtocols;
    }

    // Compare resource groups arrays
    const currentGroups = agent.groupSids || [];
    const newGroups = formData.groupSids || [];
    const groupsChanged =
      currentGroups.length !== newGroups.length ||
      currentGroups.some((g) => !newGroups.includes(g)) ||
      newGroups.some((g) => !currentGroups.includes(g));
    if (groupsChanged) {
      updates.groupSids = newGroups;
    }

    // Mute notification setting
    if (formData.muteNotification !== agent.muteNotification) {
      updates.muteNotification = formData.muteNotification;
    }

    // Expiration time - empty string to clear, undefined to keep unchanged
    if (formData.expiresAt !== agent.expiresAt) {
      updates.expiresAt = formData.expiresAt || ""; // Empty string to clear
    }

    // Cost label - empty string to clear, undefined to keep unchanged
    if (formData.costLabel !== agent.costLabel) {
      updates.costLabel = formData.costLabel || ""; // Empty string to clear
    }

    return updates;
  }, [formData, agent]);

  const reset = useCallback(() => {
    setFormData({});
    setErrors({});
  }, []);

  // Check for changes
  const hasChanges = Boolean(
    agent &&
      Object.keys(formData).some(
        (key) =>
          formData[key as keyof UpdateForwardAgentRequest] !==
          agent[key as keyof ForwardAgent]
      )
  );

  return {
    formData,
    errors,
    hasChanges,
    handleChange,
    handleSortOrderChange,
    handleCostLabelChange,
    handleProtocolToggle,
    handleGroupToggle,
    validate,
    buildSubmitData,
    reset,
  };
}
