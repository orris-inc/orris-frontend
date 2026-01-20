/**
 * Edit External Forward Rule Dialog
 * Dialog for editing external forward rules
 * Only submits changed fields
 */

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Label } from '@/components/common/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { Separator } from '@/components/common/Separator';
import { Badge } from '@/components/common/Badge';
import { AlertCircle, Server } from 'lucide-react';
import type {
  ExternalForwardRule,
  UpdateExternalForwardRuleRequest,
} from '@/api/externalforward/types';
import { useUserNodes } from '@/features/user-nodes/hooks/useUserNodes';

interface EditExternalForwardRuleDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (ruleId: string, data: UpdateExternalForwardRuleRequest) => void;
  rule: ExternalForwardRule | null;
  isUpdating?: boolean;
}

export const EditExternalForwardRuleDialog: React.FC<EditExternalForwardRuleDialogProps> = ({
  open,
  onClose,
  onSubmit,
  rule,
  isUpdating = false,
}) => {
  const { t } = useTranslation();

  // Fetch user-accessible nodes for selection
  const { nodes, isLoading: isLoadingNodes } = useUserNodes({
    pageSize: 100, // Fetch all available nodes
    enabled: open,
    filters: { status: 'active' }, // Only show active nodes
  });

  const [formData, setFormData] = useState({
    name: '',
    serverAddress: '',
    listenPort: '',
    remark: '',
    sortOrder: '',
    nodeId: '', // Node for direct routing
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when dialog opens or rule changes
  useEffect(() => {
    if (open && rule) {
      setFormData({
        name: rule.name,
        serverAddress: rule.serverAddress,
        listenPort: rule.listenPort.toString(),
        remark: rule.remark || '',
        sortOrder: rule.sortOrder?.toString() || '',
        nodeId: rule.nodeId || '',
      });
      setErrors({});
    }
  }, [open, rule]);

  const handleClose = () => {
    if (!isUpdating) {
      onClose();
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (Object.keys(errors).length > 0) {
      setErrors({});
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('externalForwardRules.validation.nameRequired');
    }

    if (!formData.serverAddress.trim()) {
      newErrors.serverAddress = t('externalForwardRules.validation.serverAddressRequired');
    }

    if (!formData.listenPort) {
      newErrors.listenPort = t('externalForwardRules.validation.listenPortRequired');
    } else {
      const port = parseInt(formData.listenPort);
      if (isNaN(port) || port < 1 || port > 65535) {
        newErrors.listenPort = t('externalForwardRules.validation.portRange');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check for changes
  const hasChanges = useMemo(() => {
    if (!rule) return false;

    return (
      formData.name !== rule.name ||
      formData.serverAddress !== rule.serverAddress ||
      formData.listenPort !== rule.listenPort.toString() ||
      formData.remark !== (rule.remark || '') ||
      formData.sortOrder !== (rule.sortOrder?.toString() || '') ||
      formData.nodeId !== (rule.nodeId || '')
    );
  }, [formData, rule]);

  const handleSubmit = () => {
    if (!validate() || !rule) {
      return;
    }

    // Only submit changed fields
    const updates: UpdateExternalForwardRuleRequest = {};

    if (formData.name.trim() !== rule.name) {
      updates.name = formData.name.trim();
    }
    if (formData.serverAddress.trim() !== rule.serverAddress) {
      updates.serverAddress = formData.serverAddress.trim();
    }
    if (formData.listenPort !== rule.listenPort.toString()) {
      updates.listenPort = parseInt(formData.listenPort);
    }
    if (formData.remark.trim() !== (rule.remark || '')) {
      updates.remark = formData.remark.trim() || undefined;
    }
    if (formData.sortOrder !== (rule.sortOrder?.toString() || '')) {
      updates.sortOrder = formData.sortOrder ? parseInt(formData.sortOrder) : undefined;
    }

    // Check nodeId changes - empty string clears the node
    if (formData.nodeId !== (rule.nodeId || '')) {
      updates.nodeId = formData.nodeId; // Empty string means clear
    }

    // If any changes, submit update
    if (Object.keys(updates).length > 0) {
      onSubmit(rule.id, updates);
    }
  };

  const isFormValid = () => {
    if (!formData.name.trim() || !formData.serverAddress.trim() || !formData.listenPort) {
      return false;
    }
    const port = parseInt(formData.listenPort);
    if (isNaN(port) || port < 1 || port > 65535) {
      return false;
    }
    return true;
  };

  if (!rule) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{t('externalForwardRules.editDialog.title')}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
          <div className="space-y-6 py-4">
            {/* Basic info */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {t('externalForwardRules.editDialog.basicInfo')}
              </h3>
              <Separator className="mb-4" />
              <div className="space-y-4">
                {/* Rule name */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-efr-name">
                    {t('externalForwardRules.form.name')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-efr-name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder={t('externalForwardRules.form.namePlaceholder')}
                    error={!!errors.name}
                    disabled={isUpdating}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Remark */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-efr-remark">{t('externalForwardRules.form.remark')}</Label>
                  <Textarea
                    id="edit-efr-remark"
                    value={formData.remark}
                    onChange={(e) => handleChange('remark', e.target.value)}
                    placeholder={t('externalForwardRules.form.remarkPlaceholder')}
                    rows={2}
                    disabled={isUpdating}
                  />
                </div>
              </div>
            </div>

            {/* Server config */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {t('externalForwardRules.editDialog.serverConfig')}
              </h3>
              <Separator className="mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Server address */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-efr-serverAddress">
                    {t('externalForwardRules.form.serverAddress')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-efr-serverAddress"
                    value={formData.serverAddress}
                    onChange={(e) => handleChange('serverAddress', e.target.value)}
                    placeholder={t('externalForwardRules.form.serverAddressPlaceholder')}
                    error={!!errors.serverAddress}
                    disabled={isUpdating}
                  />
                  {errors.serverAddress && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.serverAddress}
                    </p>
                  )}
                </div>

                {/* Listen port */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-efr-listenPort">
                    {t('externalForwardRules.form.listenPort')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-efr-listenPort"
                    type="number"
                    value={formData.listenPort}
                    onChange={(e) => handleChange('listenPort', e.target.value)}
                    placeholder="1-65535"
                    error={!!errors.listenPort}
                    disabled={isUpdating}
                  />
                  {errors.listenPort && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.listenPort}
                    </p>
                  )}
                </div>

                {/* Sort order */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-efr-sortOrder">{t('externalForwardRules.form.sortOrder')}</Label>
                  <Input
                    id="edit-efr-sortOrder"
                    type="number"
                    min={0}
                    value={formData.sortOrder}
                    onChange={(e) => handleChange('sortOrder', e.target.value)}
                    placeholder={t('externalForwardRules.form.sortOrderPlaceholder')}
                    disabled={isUpdating}
                  />
                  <p className="text-xs text-muted-foreground">{t('externalForwardRules.form.sortOrderHint')}</p>
                </div>
              </div>
            </div>

            {/* Node selection for direct routing */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {t('externalForwardRules.editDialog.nodeRouting')}
              </h3>
              <Separator className="mb-4" />
              <p className="text-xs text-muted-foreground mb-3">
                {t('externalForwardRules.editDialog.nodeRoutingHint')}
              </p>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-efr-nodeId">
                  {t('externalForwardRules.form.nodeId')}
                </Label>
                <Select
                  value={formData.nodeId || '__none__'}
                  onValueChange={(value) => handleChange('nodeId', value === '__none__' ? '' : value)}
                  disabled={isUpdating || isLoadingNodes}
                >
                  <SelectTrigger id="edit-efr-nodeId">
                    <SelectValue placeholder={t('externalForwardRules.form.nodeIdPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      <span className="text-muted-foreground">{t('externalForwardRules.form.noNode')}</span>
                    </SelectItem>
                    {nodes.map((node) => (
                      <SelectItem key={node.id} value={node.id}>
                        <div className="flex items-center gap-2">
                          <Server className="size-3.5 text-muted-foreground" />
                          <span>{node.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Show current node info if assigned */}
              {rule.nodeServerAddress && (
                <div className="mt-3 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-2">{t('externalForwardRules.editDialog.currentNodeInfo')}</p>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t('externalForwardRules.columns.nodeServerAddress')}:</span>{' '}
                      <span className="font-mono">{rule.nodeServerAddress}</span>
                    </div>
                    {rule.nodePublicIpv4 && (
                      <div>
                        <span className="text-muted-foreground">IPv4:</span>{' '}
                        <span className="font-mono">{rule.nodePublicIpv4}</span>
                      </div>
                    )}
                    {rule.nodePublicIpv6 && (
                      <div>
                        <span className="text-muted-foreground">IPv6:</span>{' '}
                        <span className="font-mono">{rule.nodePublicIpv6}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Read-only info */}
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-2">{t('externalForwardRules.editDialog.readOnlyInfo')}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('externalForwardRules.columns.externalSource')}:</span>{' '}
                  <Badge variant="outline">{rule.externalSource}</Badge>
                </div>
                {rule.externalRuleId && (
                  <div>
                    <span className="text-muted-foreground">{t('externalForwardRules.columns.externalRuleId')}:</span>{' '}
                    <span className="font-mono text-xs">{rule.externalRuleId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isUpdating}>
            {t('common.actions.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid() || !hasChanges || isUpdating}>
            {isUpdating ? t('externalForwardRules.editDialog.saving') : t('common.actions.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
