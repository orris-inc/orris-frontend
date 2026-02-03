/**
 * Create Forward Agent Dialog Component
 *
 * Redesigned following CreateNodeDialog patterns:
 * - Card-based collapsible sections with icons
 * - Clear visual hierarchy with header icon
 * - Consistent FormField pattern
 * - getBadgeText function pattern for dynamic badges
 */

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/common/Badge";
import { Separator } from "@/components/common/Separator";
import {
  Server,
  Network,
  Settings,
  ChevronDown,
  AlertCircle,
  FolderTree,
} from "lucide-react";
import { Checkbox } from "@/components/common/Checkbox";
import { ScrollArea } from "@/components/common/ScrollArea";
import { useResourceGroups } from "@/features/resource-groups/hooks/useResourceGroups";
import type {
  CreateForwardAgentRequest,
  BlockedProtocol,
} from "@/api/forward";

// Protocol groups for better organization
const PROTOCOL_GROUPS: {
  labelKey: string;
  protocols: { value: BlockedProtocol; label: string }[];
}[] = [
  {
    labelKey: "admin.forwardAgents.form.protocolGroupProxy",
    protocols: [
      { value: "http_connect", label: "HTTP CONNECT" },
      { value: "socks4", label: "SOCKS4" },
      { value: "socks5", label: "SOCKS5" },
    ],
  },
  {
    labelKey: "admin.forwardAgents.form.protocolGroupApp",
    protocols: [
      { value: "http", label: "HTTP" },
      { value: "tls", label: "TLS" },
      { value: "ssh", label: "SSH" },
      { value: "ftp", label: "FTP" },
    ],
  },
];

interface CreateForwardAgentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateForwardAgentRequest) => Promise<void>;
  /** Initial data for pre-populating the form when copying a node */
  initialData?: Partial<CreateForwardAgentRequest>;
}

// Default form data
const getDefaultFormData = (): CreateForwardAgentRequest => ({
  name: "",
  publicAddress: "",
  tunnelAddress: "",
  remark: "",
  allowedPortRange: "",
  sortOrder: undefined,
  blockedProtocols: [],
  groupSids: [],
});

// Section configuration
interface SectionConfig {
  id: string;
  title: string;
  icon: React.ElementType;
  required?: boolean;
}

// Collapsible Section Component - Following CreateNodeDialog pattern
interface CollapsibleSectionProps {
  config: SectionConfig;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  getBadgeText?: () => string | null;
  requiredLabel: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  config,
  isOpen,
  onToggle,
  children,
  getBadgeText,
  requiredLabel,
}) => {
  const Icon = config.icon;
  const badgeText = getBadgeText?.();

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card transition-all duration-200 hover:border-border/80">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/30 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isOpen ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'} transition-colors`}>
            <Icon className="size-4" strokeWidth={1.5} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{config.title}</span>
            {config.required && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                {requiredLabel}
              </Badge>
            )}
            {badgeText && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {badgeText}
              </Badge>
            )}
          </div>
        </div>
        <div className={`text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="size-4" />
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-4 pt-0">
          <Separator className="mb-4" />
          {children}
        </div>
      </div>
    </div>
  );
};

// Form Field Component - Following CreateNodeDialog pattern
interface FormFieldProps {
  label: React.ReactNode;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  hint,
  className = '',
  children,
}) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <Label className="text-sm font-medium text-foreground flex items-center gap-1">
      {label}
      {required && <span className="text-destructive">*</span>}
    </Label>
    {children}
    {(error || hint) && (
      <p className={`text-xs flex items-center gap-1 ${error ? 'text-destructive' : 'text-muted-foreground'}`}>
        {error && <AlertCircle className="size-3" />}
        {error || hint}
      </p>
    )}
  </div>
);

export const CreateForwardAgentDialog: React.FC<
  CreateForwardAgentDialogProps
> = ({ open, onClose, onSubmit, initialData }) => {
  const { t } = useTranslation();
  const [formData, setFormData] =
    useState<CreateForwardAgentRequest>(getDefaultFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(["basic", "network"])
  );

  // Get resource groups for selection
  const { resourceGroups } = useResourceGroups({
    pageSize: 100,
    filters: { status: "active" },
    enabled: open,
  });

  // Update form data when initialData changes
  useEffect(() => {
    if (open && initialData) {
      setFormData({
        ...getDefaultFormData(),
        ...initialData,
      });
      // Auto-expand all sections when copying
      setOpenSections(new Set(["basic", "network", "advanced"]));
    } else if (open && !initialData) {
      setFormData(getDefaultFormData());
      setOpenSections(new Set(["basic", "network"]));
    }
  }, [open, initialData]);

  const handleClose = () => {
    setFormData(getDefaultFormData());
    setErrors({});
    setOpenSections(new Set(["basic", "network"]));
    onClose();
  };

  const handleChange = (
    field: keyof CreateForwardAgentRequest,
    value: string | number | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSortOrderChange = (value: string) => {
    if (value === "") {
      handleChange("sortOrder", undefined);
    } else {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num >= 0) {
        handleChange("sortOrder", num);
      }
    }
  };

  const handleProtocolToggle = (
    protocol: BlockedProtocol,
    checked: boolean
  ) => {
    const current = formData.blockedProtocols || [];
    const updated = checked
      ? [...current, protocol]
      : current.filter((p) => p !== protocol);
    setFormData((prev) => ({ ...prev, blockedProtocols: updated }));
  };

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

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t("common.validation.required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validate()) {
      // Clean up undefined and empty strings
      const submitData: CreateForwardAgentRequest = {
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

      setIsSubmitting(true);
      try {
        await onSubmit(submitData);
        // Reset form after successful submission
        setFormData(getDefaultFormData());
        setErrors({});
        setOpenSections(new Set(["basic", "network"]));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const isFormValid = formData.name.trim();

  // Check if advanced settings have been configured
  const hasAdvancedSettings = Boolean(
    formData.sortOrder !== undefined ||
      formData.remark?.trim() ||
      (formData.blockedProtocols && formData.blockedProtocols.length > 0) ||
      (formData.groupSids && formData.groupSids.length > 0)
  );

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[640px] flex flex-col max-h-[90vh] p-0">
        {/* Header with icon */}
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Server className="size-5 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                {initialData
                  ? t("admin.forwardAgents.dialog.copyTitle")
                  : t("admin.forwardAgents.dialog.createTitle")}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t("admin.forwardAgents.create.description")}
              </p>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
          <div className="space-y-3">
            {/* Section 1: Basic Information */}
            <CollapsibleSection
              config={{
                id: "basic",
                title: t("common.sections.basicInfo"),
                icon: Server,
                required: true,
              }}
              isOpen={openSections.has("basic")}
              onToggle={() => toggleSection("basic")}
              requiredLabel={t("admin.nodes.form.required")}
            >
              <div className="space-y-4">
                {/* Node Name */}
                <FormField
                  label={t("admin.forwardAgents.form.nodeName")}
                  required
                  error={errors.name}
                  hint={t("admin.forwardAgents.form.nodeNameHint")}
                >
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    error={!!errors.name}
                    autoFocus
                    placeholder={t("admin.forwardAgents.form.nodeNamePlaceholder")}
                    className="h-10"
                  />
                </FormField>
              </div>
            </CollapsibleSection>

            {/* Section 2: Network Configuration */}
            <CollapsibleSection
              config={{
                id: "network",
                title: t("common.sections.networkConfig"),
                icon: Network,
              }}
              isOpen={openSections.has("network")}
              onToggle={() => toggleSection("network")}
              requiredLabel={t("admin.nodes.form.required")}
            >
              <div className="space-y-4">
                {/* Public Address & Tunnel Address - 2 cols */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label={t("admin.forwardAgents.form.publicAddress")}
                    hint={t("admin.forwardAgents.form.publicAddressHint")}
                  >
                    <Input
                      id="publicAddress"
                      value={formData.publicAddress}
                      onChange={(e) => handleChange("publicAddress", e.target.value)}
                      placeholder={t("admin.forwardAgents.form.publicAddressPlaceholder")}
                      className="h-10 font-mono"
                    />
                  </FormField>

                  <FormField
                    label={t("admin.forwardAgents.form.tunnelAddress")}
                    hint={t("admin.forwardAgents.form.tunnelAddressHint")}
                  >
                    <Input
                      id="tunnelAddress"
                      value={formData.tunnelAddress}
                      onChange={(e) => handleChange("tunnelAddress", e.target.value)}
                      placeholder={t("admin.forwardAgents.form.tunnelAddressPlaceholder")}
                      className="h-10 font-mono"
                    />
                  </FormField>
                </div>

                {/* Allowed Port Range */}
                <FormField
                  label={t("admin.forwardAgents.form.portLimit")}
                  hint={t("admin.forwardAgents.form.portLimitHint")}
                >
                  <Input
                    id="allowedPortRange"
                    value={formData.allowedPortRange}
                    onChange={(e) => handleChange("allowedPortRange", e.target.value)}
                    placeholder={t("admin.forwardAgents.form.portLimitPlaceholder")}
                    className="h-10 font-mono"
                  />
                </FormField>
              </div>
            </CollapsibleSection>

            {/* Section 3: Advanced Options */}
            <CollapsibleSection
              config={{
                id: "advanced",
                title: t("common.sections.advancedOptions"),
                icon: Settings,
              }}
              isOpen={openSections.has("advanced")}
              onToggle={() => toggleSection("advanced")}
              getBadgeText={() => hasAdvancedSettings ? t("admin.nodes.form.configured") : null}
              requiredLabel={t("admin.nodes.form.required")}
            >
              <div className="space-y-4">
                {/* Sort Order */}
                <FormField
                  label={t("common.fields.sortOrder")}
                  hint={t("admin.forwardAgents.form.sortOrderHint")}
                  className="max-w-[200px]"
                >
                  <Input
                    id="sortOrder"
                    type="number"
                    min={0}
                    value={formData.sortOrder ?? ""}
                    onChange={(e) => handleSortOrderChange(e.target.value)}
                    placeholder={t("admin.forwardAgents.form.sortOrderPlaceholder")}
                    className="h-10"
                  />
                </FormField>

                {/* Blocked Protocols */}
                <FormField
                  label={t("admin.forwardAgents.form.blockedProtocols")}
                  hint={t("admin.forwardAgents.form.blockedProtocolsHint")}
                >
                  <div className="space-y-3 pt-1">
                    {PROTOCOL_GROUPS.map((group) => (
                      <div key={group.labelKey}>
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          {t(group.labelKey)}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {group.protocols.map((protocol) => {
                            const isSelected =
                              formData.blockedProtocols?.includes(protocol.value) || false;
                            return (
                              <button
                                key={protocol.value}
                                type="button"
                                onClick={() => handleProtocolToggle(protocol.value, !isSelected)}
                                className={`px-3 py-1.5 text-sm rounded-md border transition-all duration-150 cursor-pointer ${
                                  isSelected
                                    ? "bg-destructive/10 border-destructive/50 text-destructive font-medium"
                                    : "bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border/80"
                                }`}
                              >
                                {protocol.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </FormField>

                {/* Resource Groups */}
                {resourceGroups.length > 0 && (
                  <FormField
                    label={
                      <span className="flex items-center gap-1.5">
                        <FolderTree className="size-4" />
                        {t("admin.forwardAgents.form.bindResourceGroups")}
                      </span>
                    }
                    hint={
                      formData.groupSids && formData.groupSids.length > 0
                        ? t("admin.forwardAgents.form.selectedGroupsCount", { count: formData.groupSids.length })
                        : t("admin.forwardAgents.form.bindResourceGroupsHint")
                    }
                  >
                    <div className="border rounded-lg overflow-hidden">
                      <ScrollArea className="h-[120px]">
                        <div className="divide-y divide-border">
                          {resourceGroups.map((group) => {
                            const isSelected = formData.groupSids?.includes(group.sid) ?? false;
                            return (
                              <label
                                key={group.sid}
                                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                                  isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'
                                }`}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleGroupToggle(group.sid)}
                                />
                                <span className="text-sm font-medium truncate flex-1">
                                  {group.name}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  </FormField>
                )}

                {/* Remark */}
                <FormField label={t("common.fields.remark")}>
                  <Textarea
                    id="remark"
                    rows={2}
                    value={formData.remark}
                    onChange={(e) => handleChange("remark", e.target.value)}
                    placeholder={t("admin.forwardAgents.form.remarkPlaceholder")}
                    className="resize-none"
                  />
                </FormField>
              </div>
            </CollapsibleSection>
          </div>
        </div>

        <Separator />

        {/* Footer */}
        <DialogFooter className="flex-shrink-0 px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <p className="text-xs text-muted-foreground">
              <span className="text-destructive">*</span> {t("admin.nodes.form.requiredFieldsNote")}
            </p>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                className="h-9 px-6"
              >
                {isSubmitting
                  ? t("common.loading.creating")
                  : t("common.actions.create")}
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="h-9 px-4"
              >
                {t("common.actions.cancel")}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
