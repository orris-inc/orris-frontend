/**
 * Create Forward Agent Dialog Component
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
import { cn } from "@/lib/utils";
import type { CreateForwardAgentRequest, BlockedProtocol } from "@/api/forward";

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
});

export const CreateForwardAgentDialog: React.FC<
  CreateForwardAgentDialogProps
> = ({ open, onClose, onSubmit, initialData }) => {
  const { t } = useTranslation();
  const [formData, setFormData] =
    useState<CreateForwardAgentRequest>(getDefaultFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when initialData changes
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

  const handleClose = () => {
    setFormData(getDefaultFormData());
    setErrors({});
    onClose();
  };

  const handleChange = (
    field: keyof CreateForwardAgentRequest,
    value: string | number | undefined,
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

  const handleProtocolToggle = (protocol: BlockedProtocol, checked: boolean) => {
    const current = formData.blockedProtocols || [];
    const updated = checked
      ? [...current, protocol]
      : current.filter((p) => p !== protocol);
    setFormData((prev) => ({ ...prev, blockedProtocols: updated }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('common.validation.required');
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

      setIsSubmitting(true);
      try {
        await onSubmit(submitData);
        // Reset form after successful submission
        setFormData(getDefaultFormData());
        setErrors({});
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const isFormValid = formData.name.trim();

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? t('admin.forwardAgents.dialog.copyTitle') : t('admin.forwardAgents.dialog.createTitle')}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4">
          {/* Node Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">
              {t('admin.forwardAgents.form.nodeName')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              error={!!errors.name}
              autoFocus
              placeholder={t('admin.forwardAgents.form.nodeNamePlaceholder')}
            />
            <p className="text-xs text-muted-foreground">
              {errors.name || t('admin.forwardAgents.form.nodeNameRequired')}
            </p>
          </div>

          {/* Public Address */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="publicAddress">{t('admin.forwardAgents.form.publicAddress')}</Label>
            <Input
              id="publicAddress"
              value={formData.publicAddress}
              onChange={(e) => handleChange("publicAddress", e.target.value)}
              placeholder={t('admin.forwardAgents.form.publicAddressPlaceholder')}
            />
            <p className="text-xs text-muted-foreground">
              {t('admin.forwardAgents.form.publicAddressHint')}
            </p>
          </div>

          {/* Tunnel Address */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="tunnelAddress">{t('admin.forwardAgents.form.tunnelAddress')}</Label>
            <Input
              id="tunnelAddress"
              value={formData.tunnelAddress}
              onChange={(e) => handleChange("tunnelAddress", e.target.value)}
              placeholder={t('admin.forwardAgents.form.tunnelAddressPlaceholder')}
            />
            <p className="text-xs text-muted-foreground">
              {t('admin.forwardAgents.form.tunnelAddressHint')}
            </p>
          </div>

          {/* Allowed Port Range */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="allowedPortRange">{t('admin.forwardAgents.form.portLimit')}</Label>
            <Input
              id="allowedPortRange"
              value={formData.allowedPortRange}
              onChange={(e) => handleChange("allowedPortRange", e.target.value)}
              placeholder={t('admin.forwardAgents.form.portLimitPlaceholder')}
            />
            <p className="text-xs text-muted-foreground">
              {t('admin.forwardAgents.form.portLimitHint')}
            </p>
          </div>

          {/* Sort Order */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="sortOrder">{t('admin.forwardAgents.form.sortOrder')}</Label>
            <Input
              id="sortOrder"
              type="number"
              min={0}
              value={formData.sortOrder ?? ""}
              onChange={(e) => handleSortOrderChange(e.target.value)}
              placeholder={t('admin.forwardAgents.form.sortOrderPlaceholder')}
            />
            <p className="text-xs text-muted-foreground">
              {t('admin.forwardAgents.form.sortOrderHint')}
            </p>
          </div>

          {/* Blocked Protocols */}
          <div className="flex flex-col gap-3">
            <Label>{t('admin.forwardAgents.form.blockedProtocols')}</Label>
            <div className="space-y-3">
              {PROTOCOL_GROUPS.map((group) => (
                <div key={group.labelKey}>
                  <p className="text-xs text-muted-foreground mb-2">
                    {t(group.labelKey)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.protocols.map((protocol) => {
                      const isSelected =
                        formData.blockedProtocols?.includes(protocol.value) ||
                        false;
                      return (
                        <button
                          key={protocol.value}
                          type="button"
                          onClick={() =>
                            handleProtocolToggle(protocol.value, !isSelected)
                          }
                          className={cn(
                            "px-3 py-1.5 text-sm rounded-md border transition-colors cursor-pointer",
                            isSelected
                              ? "bg-destructive/10 border-destructive/50 text-destructive"
                              : "bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          {protocol.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('admin.forwardAgents.form.blockedProtocolsHint')}
            </p>
          </div>

          {/* Remark */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="remark">{t('admin.forwardAgents.form.remark')}</Label>
            <Textarea
              id="remark"
              rows={3}
              value={formData.remark}
              onChange={(e) => handleChange("remark", e.target.value)}
              placeholder={t('admin.forwardAgents.form.remarkPlaceholder')}
            />
            <p className="text-xs text-muted-foreground">{t('admin.forwardAgents.form.remarkHint')}</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            {t('common.actions.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? t('admin.forwardAgents.form.creating') : t('admin.forwardAgents.form.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
