/**
 * Shared form hook for creating forward agents.
 * Extracts form state, validation, handlers, and computed values
 * from CreateForwardAgentDialog and CreateForwardAgentSheet.
 */

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type {
  CreateForwardAgentRequest,
  BlockedProtocol,
} from "@/api/forward";
export { PROTOCOL_GROUPS } from "../constants";

// Extended form data type to include expiration fields
export interface CreateForwardAgentFormData extends CreateForwardAgentRequest {
  expiresAt?: string;
  costLabel?: string;
}

// Extended request type for submission with expiration fields
export type CreateForwardAgentRequestWithExpiration = CreateForwardAgentFormData;

// Default form data
const getDefaultFormData = (): CreateForwardAgentFormData => ({
  name: "",
  publicAddress: "",
  tunnelAddress: "",
  remark: "",
  allowedPortRange: "",
  sortOrder: undefined,
  blockedProtocols: [],
  groupSids: [],
  expiresAt: undefined,
  costLabel: undefined,
});

interface UseCreateForwardAgentFormOptions {
  open: boolean;
  initialData?: Partial<CreateForwardAgentFormData>;
}

export function useCreateForwardAgentForm({
  open,
  initialData,
}: UseCreateForwardAgentFormOptions) {
  const { t } = useTranslation();
  const [formData, setFormData] =
    useState<CreateForwardAgentFormData>(getDefaultFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset/populate form when open state or initialData changes
  useEffect(() => {
    if (open && initialData) {
      setFormData({
        ...getDefaultFormData(),
        ...initialData,
      });
    } else if (open && !initialData) {
      setFormData(getDefaultFormData());
    }
  }, [open, initialData]);

  const handleChange = useCallback(
    (
      field: keyof CreateForwardAgentFormData,
      value: string | number | undefined
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear error for this field
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

    if (!formData.name.trim()) {
      newErrors.name = t("common.validation.required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.name, t]);

  const buildSubmitData =
    useCallback((): CreateForwardAgentRequestWithExpiration => {
      const submitData: CreateForwardAgentRequestWithExpiration = {
        name: formData.name.trim(),
      };

      if (formData.publicAddress?.trim()) {
        submitData.publicAddress = formData.publicAddress.trim();
      }

      if (formData.tunnelAddress?.trim()) {
        submitData.tunnelAddress = formData.tunnelAddress.trim();
      }

      if (formData.remark?.trim()) {
        submitData.remark = formData.remark.trim();
      }

      if (formData.allowedPortRange?.trim()) {
        submitData.allowedPortRange = formData.allowedPortRange.trim();
      }

      if (formData.sortOrder !== undefined) {
        submitData.sortOrder = formData.sortOrder;
      }

      if (formData.blockedProtocols && formData.blockedProtocols.length > 0) {
        submitData.blockedProtocols = formData.blockedProtocols;
      }

      if (formData.groupSids && formData.groupSids.length > 0) {
        submitData.groupSids = formData.groupSids;
      }

      // Include expiration fields
      if (formData.expiresAt) {
        submitData.expiresAt = formData.expiresAt;
      }

      if (formData.costLabel) {
        submitData.costLabel = formData.costLabel;
      }

      return submitData;
    }, [formData]);

  const reset = useCallback(() => {
    setFormData(getDefaultFormData());
    setErrors({});
  }, []);

  const isFormValid = Boolean(formData.name.trim());

  // Check if advanced settings have been configured
  const hasAdvancedSettings = Boolean(
    formData.sortOrder !== undefined ||
      formData.remark?.trim() ||
      (formData.blockedProtocols && formData.blockedProtocols.length > 0) ||
      (formData.groupSids && formData.groupSids.length > 0) ||
      formData.expiresAt ||
      formData.costLabel !== undefined
  );

  return {
    formData,
    errors,
    isFormValid,
    hasAdvancedSettings,
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
