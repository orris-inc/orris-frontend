/**
 * Subscription-side edit forward rule dialog
 * Based on user implementation, only submits changed fields
 * Supports target types: manual address input or node selection (dynamic resolution)
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
import { RadioGroup, RadioGroupItem } from '@/components/common/RadioGroup';
import { AlertCircle, HardDrive } from 'lucide-react';
import type {
  ForwardRule,
  ForwardRuleType,
  UpdateSubscriptionForwardRuleRequest,
  ForwardProtocol,
  IPVersion,
} from '@/api/forward';
import { useUserForwardAgents } from '@/features/user-forward-rules/hooks/useUserForwardAgents';
import { useUserNodes } from '@/features/user-nodes/hooks/useUserNodes';

// Target type for forward rule
type TargetType = 'manual' | 'node';

// Rule type i18n key mapping
const RULE_TYPE_LABEL_KEYS: Record<ForwardRuleType, string> = {
  direct: 'admin.forwardRules.ruleTypeInfo.direct.label',
  entry: 'admin.forwardRules.ruleTypeInfo.entry.label',
  chain: 'admin.forwardRules.ruleTypeInfo.chain.label',
  direct_chain: 'admin.forwardRules.ruleTypeInfo.directChain.label',
  external: 'admin.forwardRules.ruleTypeInfo.external.label',
};

interface EditSubscriptionForwardRuleDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (ruleId: string, data: UpdateSubscriptionForwardRuleRequest) => void;
  rule: ForwardRule | null;
  isUpdating?: boolean;
}

export const EditSubscriptionForwardRuleDialog: React.FC<EditSubscriptionForwardRuleDialogProps> = ({
  open,
  onClose,
  onSubmit,
  rule,
  isUpdating = false,
}) => {
  const { t } = useTranslation();
  const { forwardAgents } = useUserForwardAgents({
    pageSize: 100,
    enabled: open && !!rule,
  });

  // Fetch user's nodes for target node selection
  const { nodes: userNodes, isLoading: isLoadingNodes } = useUserNodes({
    pageSize: 100,
    enabled: open && !!rule,
  });

  // Get current rule's agent name
  const currentAgent = rule ? forwardAgents.find((a) => a.id === rule.agentId) : null;

  const [formData, setFormData] = useState({
    name: '',
    targetAddress: '',
    targetPort: '',
    targetNodeId: '',
    protocol: 'tcp' as ForwardProtocol,
    ipVersion: 'auto' as IPVersion,
    remark: '',
  });

  // Target type: manual address input or node selection
  const [targetType, setTargetType] = useState<TargetType>('manual');
  // Original target type from rule (for detecting changes)
  const [originalTargetType, setOriginalTargetType] = useState<TargetType>('manual');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when dialog opens or rule changes
  useEffect(() => {
    if (open && rule) {
      // Determine target type based on whether targetNodeId is set
      const ruleTargetType: TargetType = rule.targetNodeId ? 'node' : 'manual';
      setFormData({
        name: rule.name,
        targetAddress: rule.targetAddress || '',
        targetPort: rule.targetPort?.toString() || '',
        targetNodeId: rule.targetNodeId || '',
        protocol: rule.protocol,
        ipVersion: rule.ipVersion,
        remark: rule.remark || '',
      });
      setTargetType(ruleTargetType);
      setOriginalTargetType(ruleTargetType);
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
    // Clear all validation errors, re-validate on next submit
    if (Object.keys(errors).length > 0) {
      setErrors({});
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('admin.forwardRules.validation.ruleNameRequired');
    }

    // Target validation based on target type
    if (targetType === 'manual') {
      if (!formData.targetAddress.trim()) {
        newErrors.targetAddress = t('admin.forwardRules.validation.targetAddressRequired');
      }
      if (!formData.targetPort) {
        newErrors.targetPort = t('admin.forwardRules.validation.targetPortRange');
      } else {
        const port = parseInt(formData.targetPort);
        if (isNaN(port) || port < 1 || port > 65535) {
          newErrors.targetPort = t('admin.forwardRules.validation.targetPortRange');
        }
      }
    } else if (targetType === 'node') {
      if (!formData.targetNodeId) {
        newErrors.targetNodeId = t('admin.forwardRules.validation.selectTargetNode');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check for changes
  const hasChanges = useMemo(() => {
    if (!rule) return false;

    // Check if target type changed
    const targetTypeChanged = targetType !== originalTargetType;

    // Check basic field changes
    const basicChanges =
      formData.name !== rule.name ||
      formData.protocol !== rule.protocol ||
      formData.ipVersion !== rule.ipVersion ||
      formData.remark !== (rule.remark || '');

    // Check target changes based on target type
    let targetChanges = false;
    if (targetType === 'manual') {
      targetChanges =
        formData.targetAddress !== (rule.targetAddress || '') ||
        formData.targetPort !== (rule.targetPort?.toString() || '');
    } else if (targetType === 'node') {
      targetChanges = formData.targetNodeId !== (rule.targetNodeId || '');
    }

    return basicChanges || targetTypeChanged || targetChanges;
  }, [formData, rule, targetType, originalTargetType]);

  const handleSubmit = () => {
    if (!validate() || !rule) {
      return;
    }

    // Only submit changed fields
    const updates: UpdateSubscriptionForwardRuleRequest = {};

    if (formData.name.trim() !== rule.name) {
      updates.name = formData.name.trim();
    }
    if (formData.protocol !== rule.protocol) {
      updates.protocol = formData.protocol;
    }
    if (formData.ipVersion !== rule.ipVersion) {
      updates.ipVersion = formData.ipVersion;
    }
    if (formData.remark.trim() !== (rule.remark || '')) {
      updates.remark = formData.remark.trim() || undefined;
    }

    // Handle target changes based on target type
    if (targetType === 'manual') {
      // Switching to manual mode or updating manual values
      if (targetType !== originalTargetType) {
        // Clear targetNodeId when switching to manual
        updates.targetNodeId = '';
      }
      if (formData.targetAddress.trim() !== (rule.targetAddress || '')) {
        updates.targetAddress = formData.targetAddress.trim();
      }
      if (formData.targetPort !== (rule.targetPort?.toString() || '')) {
        updates.targetPort = parseInt(formData.targetPort);
      }
    } else if (targetType === 'node') {
      // Switching to node mode or updating node selection
      if (formData.targetNodeId !== (rule.targetNodeId || '')) {
        updates.targetNodeId = formData.targetNodeId;
      }
    }

    // If any changes, submit update
    if (Object.keys(updates).length > 0) {
      onSubmit(rule.id, updates);
    }
  };

  const isFormValid = () => {
    if (!formData.name.trim()) return false;

    if (targetType === 'manual') {
      return (
        formData.targetAddress.trim() &&
        formData.targetPort &&
        parseInt(formData.targetPort) >= 1 &&
        parseInt(formData.targetPort) <= 65535
      );
    } else if (targetType === 'node') {
      return !!formData.targetNodeId;
    }

    return false;
  };

  // Get available nodes (status is active, but always include currently selected node)
  const availableNodes = userNodes.filter(
    (n) => n.status === 'active' || n.id === formData.targetNodeId
  );

  if (!rule) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="@container sm:max-w-[600px] flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{t('admin.forwardRules.form.editRule')}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
          <div className="space-y-6 py-4">
            {/* Basic info */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('common.sections.basicInfo')}</h3>
              <Separator className="mb-4" />
              <div className="space-y-4">
                {/* Rule name */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-sub-name">
                    {t('admin.forwardRules.form.ruleName')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-sub-name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder={t('admin.forwardRules.form.ruleNamePlaceholder')}
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
                  <Label htmlFor="edit-sub-remark">{t('common.fields.remark')}</Label>
                  <Textarea
                    id="edit-sub-remark"
                    value={formData.remark}
                    onChange={(e) => handleChange('remark', e.target.value)}
                    placeholder={t('admin.forwardRules.form.remarkPlaceholder')}
                    rows={2}
                    disabled={isUpdating}
                  />
                </div>
              </div>
            </div>

            {/* Forward config */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('admin.forwardRules.form.forwardConfig')}</h3>
              <Separator className="mb-4" />
              <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
                {/* Protocol type */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-sub-protocol">{t('common.protocol')}</Label>
                  <Select
                    value={formData.protocol}
                    onValueChange={(value) => handleChange('protocol', value)}
                    disabled={isUpdating}
                  >
                    <SelectTrigger id="edit-sub-protocol">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tcp">TCP</SelectItem>
                      <SelectItem value="udp">UDP</SelectItem>
                      <SelectItem value="both">TCP + UDP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* IP version */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-sub-ipVersion">{t('admin.forwardRules.form.ipVersion')}</Label>
                  <Select
                    value={formData.ipVersion}
                    onValueChange={(value) => handleChange('ipVersion', value)}
                    disabled={isUpdating}
                  >
                    <SelectTrigger id="edit-sub-ipVersion">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">{t('common.auto')}</SelectItem>
                      <SelectItem value="ipv4">IPv4</SelectItem>
                      <SelectItem value="ipv6">IPv6</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Target type selection */}
                <div className="flex flex-col gap-2 @md:col-span-2">
                  <Label>
                    {t('admin.forwardRules.form.targetType')} <span className="text-destructive">*</span>
                  </Label>
                  <RadioGroup
                    value={targetType}
                    onValueChange={(value) => {
                      setTargetType(value as TargetType);
                      // Clear related fields when switching
                      if (value === 'manual') {
                        handleChange('targetNodeId', '');
                      } else {
                        handleChange('targetAddress', '');
                        handleChange('targetPort', '');
                      }
                    }}
                    className="flex gap-4"
                    disabled={isUpdating}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="manual" id="edit-sub-target-manual" />
                      <Label htmlFor="edit-sub-target-manual" className="font-normal cursor-pointer">
                        {t('admin.forwardRules.form.targetTypeManual')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="node" id="edit-sub-target-node" />
                      <Label htmlFor="edit-sub-target-node" className="font-normal cursor-pointer">
                        {t('admin.forwardRules.form.targetTypeNode')}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Manual target address input */}
                {targetType === 'manual' && (
                  <>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="edit-sub-targetAddress">
                        {t('admin.forwardRules.form.targetAddress')} <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="edit-sub-targetAddress"
                        value={formData.targetAddress}
                        onChange={(e) => handleChange('targetAddress', e.target.value)}
                        placeholder={t('admin.forwardRules.form.targetAddressPlaceholder')}
                        error={!!errors.targetAddress}
                        disabled={isUpdating}
                      />
                      {errors.targetAddress && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.targetAddress}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="edit-sub-targetPort">
                        {t('admin.forwardRules.form.targetPort')} <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="edit-sub-targetPort"
                        type="number"
                        value={formData.targetPort}
                        onChange={(e) => handleChange('targetPort', e.target.value)}
                        placeholder="1-65535"
                        error={!!errors.targetPort}
                        disabled={isUpdating}
                      />
                      {errors.targetPort && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.targetPort}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* Select target node */}
                {targetType === 'node' && (
                  <div className="flex flex-col gap-2 @md:col-span-2">
                    <Label htmlFor="edit-sub-targetNodeId">
                      {t('admin.forwardRules.form.targetNode')} <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.targetNodeId}
                      onValueChange={(value) => handleChange('targetNodeId', value)}
                      disabled={isUpdating || isLoadingNodes}
                    >
                      <SelectTrigger
                        id="edit-sub-targetNodeId"
                        className={errors.targetNodeId ? 'border-destructive' : ''}
                      >
                        <SelectValue placeholder={isLoadingNodes ? t('common.table.loading') : t('admin.forwardRules.form.selectTargetNode')} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableNodes.map((node) => (
                          <SelectItem key={node.id} value={node.id}>
                            <div className="flex items-center gap-2">
                              <HardDrive className="h-4 w-4 text-muted-foreground" />
                              <span>{node.name}</span>
                              <span className="text-xs text-muted-foreground font-mono">
                                ({node.serverAddress})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {t('admin.forwardRules.form.targetNodeDynamicHint')}
                    </p>
                    {errors.targetNodeId && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.targetNodeId}
                      </p>
                    )}
                    {!isLoadingNodes && availableNodes.length === 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        {t('subscriptionForwardRules.noAvailableNodes')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Read-only info */}
            <div className="p-3 rounded-xl bg-muted/50">
              <p className="text-xs text-muted-foreground mb-2">{t('subscriptionForwardRules.readOnlyInfo')}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('admin.forwardRules.form.forwardAgent')}:</span>
                  <span>{currentAgent?.name || rule.agentId}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('admin.forwardRules.form.ruleType')}:</span>
                  <span>{t(RULE_TYPE_LABEL_KEYS[rule.ruleType]) || rule.ruleType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('admin.forwardRules.form.listenPort')}:</span>
                  <span className="font-mono">{rule.listenPort || t('subscriptionForwardRules.systemAssigned')}</span>
                </div>
                {/* entry type: show exit agent */}
                {rule.ruleType === 'entry' && rule.exitAgentId && (
                  <div>
                    <span className="text-muted-foreground">{t('admin.forwardRules.form.exitNode')}:</span>
                    <span>
                      {forwardAgents.find((a) => a.id === rule.exitAgentId)?.name || rule.exitAgentId}
                    </span>
                  </div>
                )}
              </div>
              {/* chain/direct_chain type: show intermediate nodes */}
              {(rule.ruleType === 'chain' || rule.ruleType === 'direct_chain') &&
                rule.chainAgentIds &&
                rule.chainAgentIds.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <span className="text-muted-foreground text-sm">{t('admin.forwardRules.form.chainNodes')}:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {rule.chainAgentIds.map((agentId, index) => {
                        const agent = forwardAgents.find((a) => a.id === agentId);
                        const port = rule.chainPortConfig?.[agentId];
                        return (
                          <span
                            key={agentId}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-background text-xs"
                          >
                            <span className="text-muted-foreground">{index + 1}.</span>
                            <span>{agent?.name || agentId}</span>
                            {rule.ruleType === 'direct_chain' && port && (
                              <span className="text-muted-foreground font-mono">:{port}</span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 gap-3">
          <Button onClick={handleSubmit} disabled={!isFormValid() || !hasChanges || isUpdating}>
            {isUpdating ? t('common.loading.saving') : t('common.actions.save')}
          </Button>
          <Button variant="outline" onClick={handleClose} disabled={isUpdating}>
            {t('common.actions.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
