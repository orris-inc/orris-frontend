/**
 * Subscription-side create forward rule dialog
 * Supports four rule types: direct, entry, chain (WS chained forwarding), direct_chain (direct chained forwarding)
 * Supports target types: manual address input or node selection (dynamic resolution)
 * Supports exit agent modes: single exit or multi-exit load balancing
 */

import { useState, useEffect } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/common/RadioGroup';
import { AlertCircle, Server, HardDrive } from 'lucide-react';
import type {
  CreateSubscriptionForwardRuleRequest,
  ForwardProtocol,
  ForwardRuleType,
  IPVersion,
  ExitAgent,
} from '@/api/forward';
import { useUserForwardAgents } from '@/features/user-forward-rules/hooks/useUserForwardAgents';
import { useUserNodes } from '@/features/user-nodes/hooks/useUserNodes';
import { UserSortableChainAgentList } from '@/features/user-forward-rules/components/UserSortableChainAgentList';
import { SubscriptionExitAgentList } from './SubscriptionExitAgentList';

// Target type for forward rule
type TargetType = 'manual' | 'node';

// Exit agent mode (single or multi for load balancing)
type ExitMode = 'single' | 'multi';

interface CreateSubscriptionForwardRuleDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSubscriptionForwardRuleRequest) => void;
  allowedTypes: string[];
  isCreating?: boolean;
}

// Rule type keys for i18n
const RULE_TYPE_KEYS: Record<ForwardRuleType, { labelKey: string; descriptionKey: string }> = {
  direct: { labelKey: 'admin.forwardRules.ruleTypeInfo.direct.label', descriptionKey: 'admin.forwardRules.ruleTypeInfo.direct.description' },
  entry: { labelKey: 'admin.forwardRules.ruleTypeInfo.entry.label', descriptionKey: 'admin.forwardRules.ruleTypeInfo.entry.description' },
  chain: { labelKey: 'admin.forwardRules.ruleTypeInfo.chain.label', descriptionKey: 'admin.forwardRules.ruleTypeInfo.chain.description' },
  direct_chain: { labelKey: 'admin.forwardRules.ruleTypeInfo.directChain.label', descriptionKey: 'admin.forwardRules.ruleTypeInfo.directChain.description' },
  external: { labelKey: 'admin.forwardRules.ruleTypeInfo.external.label', descriptionKey: 'admin.forwardRules.ruleTypeInfo.external.description' },
};

export const CreateSubscriptionForwardRuleDialog: React.FC<
  CreateSubscriptionForwardRuleDialogProps
> = ({ open, onClose, onSubmit, allowedTypes, isCreating = false }) => {
  const { t } = useTranslation();
  const { forwardAgents, isLoading: isLoadingAgents } = useUserForwardAgents({
    pageSize: 100,
    enabled: open,
  });

  // Fetch user's nodes for target node selection
  const { nodes: userNodes, isLoading: isLoadingNodes } = useUserNodes({
    pageSize: 100,
    enabled: open,
  });

  const [formData, setFormData] = useState({
    ruleType: 'direct' as ForwardRuleType,
    agentId: '',
    exitAgentId: '',
    exitAgents: [] as ExitAgent[],
    chainAgentIds: [] as string[],
    chainPortConfig: {} as Record<string, number>,
    name: '',
    listenPort: '',
    targetAddress: '',
    targetPort: '',
    targetNodeId: '',
    sortOrder: '',
    protocol: 'both' as ForwardProtocol,
    ipVersion: 'auto' as IPVersion,
    remark: '',
  });

  // Target type: manual address input or node selection
  const [targetType, setTargetType] = useState<TargetType>('manual');

  // Exit mode: single or multi (load balancing)
  const [exitMode, setExitMode] = useState<ExitMode>('single');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      // Default to first allowed rule type
      const defaultRuleType = (
        allowedTypes.length > 0 ? allowedTypes[0] : 'direct'
      ) as ForwardRuleType;
      setFormData({
        ruleType: defaultRuleType,
        agentId: '',
        exitAgentId: '',
        exitAgents: [],
        chainAgentIds: [],
        chainPortConfig: {},
        name: '',
        listenPort: '',
        targetAddress: '',
        targetPort: '',
        targetNodeId: '',
        sortOrder: '',
        protocol: 'both',
        ipVersion: 'auto',
        remark: '',
      });
      setTargetType('manual');
      setExitMode('single');
      setErrors({});
    }
  }, [open, allowedTypes]);

  // Default to first available agent when agent list is loaded
  useEffect(() => {
    if (open && forwardAgents.length > 0 && !formData.agentId) {
      const enabledAgents = forwardAgents.filter((a) => a.status === 'enabled');
      if (enabledAgents.length > 0) {
        setFormData((prev) => ({ ...prev, agentId: enabledAgents[0].id }));
      }
    }
  }, [open, forwardAgents, formData.agentId]);

  const handleClose = () => {
    if (!isCreating) {
      onClose();
    }
  };

  const handleChange = (field: string, value: string | string[] | Record<string, number>) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // If modifying entry agent, automatically remove it from chain agent list
      if (field === 'agentId' && typeof value === 'string') {
        const currentChainIds = prev.chainAgentIds || [];
        if (currentChainIds.includes(value)) {
          newData.chainAgentIds = currentChainIds.filter((id: string) => id !== value);
          // Also remove port config for this node
          if (prev.chainPortConfig[value]) {
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

  // Handle chain node port config change
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

    if (!formData.agentId) {
      newErrors.agentId = t('admin.forwardRules.validation.selectForwardAgent');
    }

    if (!formData.name.trim()) {
      newErrors.name = t('admin.forwardRules.validation.ruleNameRequired');
    }

    // Listen port is optional, validate if provided
    if (formData.listenPort) {
      const port = parseInt(formData.listenPort);
      if (isNaN(port) || port < 1 || port > 65535) {
        newErrors.listenPort = t('admin.forwardRules.validation.listenPortRange');
      }
    }

    // Validate different fields based on rule type
    if (formData.ruleType === 'entry') {
      // Validate exit agent based on mode
      if (exitMode === 'single') {
        if (!formData.exitAgentId) {
          newErrors.exitAgentId = t('admin.forwardRules.validation.selectExitNode');
        }
      } else {
        if (!formData.exitAgents || formData.exitAgents.length === 0) {
          newErrors.exitAgents = t('admin.forwardRules.validation.selectExitNode');
        }
      }
    } else if (formData.ruleType === 'chain') {
      if (!formData.chainAgentIds || formData.chainAgentIds.length === 0) {
        newErrors.chainAgentIds = t('admin.forwardRules.validation.selectAtLeastOneNode');
      }
    } else if (formData.ruleType === 'direct_chain') {
      if (!formData.chainAgentIds || formData.chainAgentIds.length === 0) {
        newErrors.chainAgentIds = t('admin.forwardRules.validation.selectAtLeastOneNode');
      }
      // Validate that each chain node has a port configured
      if (formData.chainAgentIds && formData.chainAgentIds.length > 0) {
        const missingPorts: string[] = [];
        for (const agentId of formData.chainAgentIds) {
          const port = formData.chainPortConfig[agentId];
          if (!port || port < 1 || port > 65535) {
            const agent = forwardAgents.find((a) => a.id === agentId);
            const agentName = agent ? agent.name : agentId;
            missingPorts.push(agentName);
          }
        }
        if (missingPorts.length > 0) {
          if (missingPorts.length === formData.chainAgentIds.length) {
            newErrors.chainPortConfig = t('admin.forwardRules.validation.configureValidPorts');
          } else {
            newErrors.chainPortConfig = t('admin.forwardRules.validation.configurePortsForNodes', { nodes: missingPorts.join(', ') });
          }
        }
      }
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

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    // Use type assertion to support exitAgents field (backend supports it but type definition may not be updated yet)
    const data = {
      agentId: formData.agentId,
      ruleType: formData.ruleType,
      name: formData.name.trim(),
      listenPort: formData.listenPort ? parseInt(formData.listenPort) : undefined,
      sortOrder: formData.sortOrder ? parseInt(formData.sortOrder) : undefined,
      protocol: formData.protocol,
      ipVersion: formData.ipVersion,
      remark: formData.remark.trim() || undefined,
    } as CreateSubscriptionForwardRuleRequest & { exitAgents?: ExitAgent[] };

    // Add target fields based on target type
    if (targetType === 'manual') {
      data.targetAddress = formData.targetAddress.trim();
      data.targetPort = parseInt(formData.targetPort);
    } else if (targetType === 'node') {
      data.targetNodeId = formData.targetNodeId;
    }

    // Add corresponding fields based on rule type
    if (formData.ruleType === 'entry') {
      // Submit exitAgentId or exitAgents based on mode
      if (exitMode === 'single') {
        data.exitAgentId = formData.exitAgentId;
      } else {
        data.exitAgents = formData.exitAgents;
      }
    } else if (formData.ruleType === 'chain') {
      data.chainAgentIds = formData.chainAgentIds;
    } else if (formData.ruleType === 'direct_chain') {
      data.chainAgentIds = formData.chainAgentIds;
      data.chainPortConfig = formData.chainPortConfig;
    }

    onSubmit(data as CreateSubscriptionForwardRuleRequest);
  };

  const isFormValid = () => {
    // Basic validation
    if (!formData.agentId || !formData.name.trim()) return false;

    // Target validation based on target type
    if (targetType === 'manual') {
      if (!formData.targetAddress.trim() || !formData.targetPort) return false;
      const targetPort = parseInt(formData.targetPort);
      if (isNaN(targetPort) || targetPort < 1 || targetPort > 65535) return false;
    } else if (targetType === 'node') {
      if (!formData.targetNodeId) return false;
    }

    // Validate based on rule type
    if (formData.ruleType === 'entry') {
      // Validate exit agent based on mode
      if (exitMode === 'single') {
        if (!formData.exitAgentId) return false;
      } else {
        if (!formData.exitAgents || formData.exitAgents.length === 0) return false;
      }
    } else if (formData.ruleType === 'chain') {
      if (!formData.chainAgentIds || formData.chainAgentIds.length === 0) return false;
    } else if (formData.ruleType === 'direct_chain') {
      if (!formData.chainAgentIds || formData.chainAgentIds.length === 0) return false;
      // Validate that each chain node has a valid port configured
      const allPortsValid = formData.chainAgentIds.every((id) => {
        const port = formData.chainPortConfig[id];
        return port && port > 0 && port <= 65535;
      });
      if (!allPortsValid) return false;
    }

    return true;
  };

  // Get available nodes (status is active)
  const availableNodes = userNodes.filter((n) => n.status === 'active');

  // Get available exit agents (excluding currently selected entry agent)
  const availableExitAgents = forwardAgents.filter(
    (a) => a.id !== formData.agentId && a.status === 'enabled'
  );

  // Get available chain agents (excluding currently selected entry agent)
  const availableChainAgents = forwardAgents.filter(
    (a) => a.id !== formData.agentId && a.status === 'enabled'
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="@container sm:max-w-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{t('admin.forwardRules.form.createRule')}</DialogTitle>
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
                  <Label htmlFor="sub-name">
                    {t('admin.forwardRules.form.ruleName')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="sub-name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder={t('admin.forwardRules.form.ruleNamePlaceholder')}
                    error={!!errors.name}
                    disabled={isCreating}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Forward agent selection */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="sub-agentId">
                    {t('admin.forwardRules.form.forwardAgent')} <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.agentId}
                    onValueChange={(value) => handleChange('agentId', value)}
                    disabled={isCreating || isLoadingAgents}
                  >
                    <SelectTrigger
                      id="sub-agentId"
                      className={errors.agentId ? 'border-destructive' : ''}
                    >
                      <SelectValue placeholder={isLoadingAgents ? t('common.table.loading') : t('admin.forwardRules.form.selectForwardAgent')} />
                    </SelectTrigger>
                    <SelectContent>
                      {forwardAgents
                        .filter((agent) => agent.status === 'enabled')
                        .map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            <div className="flex items-center gap-2">
                              <Server className="h-4 w-4 text-muted-foreground" />
                              <span>{agent.name}</span>
                              {agent.groups && agent.groups.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  ({agent.groups.map((g) => g.name).join(', ')})
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {errors.agentId && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.agentId}
                    </p>
                  )}
                  {!isLoadingAgents &&
                    forwardAgents.filter((a) => a.status === 'enabled').length === 0 && (
                      <p className="text-xs text-warning">
                        {t('subscriptionForwardRules.noAvailableAgents')}
                      </p>
                    )}
                </div>

                {/* Rule type */}
                {allowedTypes.length > 1 && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="sub-ruleType">{t('admin.forwardRules.form.ruleType')}</Label>
                    <Select
                      value={formData.ruleType}
                      onValueChange={(value) => handleChange('ruleType', value as ForwardRuleType)}
                      disabled={isCreating}
                    >
                      <SelectTrigger id="sub-ruleType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {allowedTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(RULE_TYPE_KEYS[type as ForwardRuleType]?.labelKey) || type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {RULE_TYPE_KEYS[formData.ruleType] && (
                      <p className="text-xs text-muted-foreground">
                        {t(RULE_TYPE_KEYS[formData.ruleType].descriptionKey)}
                      </p>
                    )}
                  </div>
                )}

                {/* If only one type, display as read-only badge */}
                {allowedTypes.length === 1 && (
                  <div className="flex flex-col gap-2">
                    <Label>{t('admin.forwardRules.form.ruleType')}</Label>
                    <div>
                      <Badge variant="secondary">
                        {t(RULE_TYPE_KEYS[formData.ruleType]?.labelKey) || formData.ruleType}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-2">
                        {t(RULE_TYPE_KEYS[formData.ruleType]?.descriptionKey)}
                      </p>
                    </div>
                  </div>
                )}

                {/* entry type: exit agent selection */}
                {formData.ruleType === 'entry' && (
                  <>
                    {/* Exit Mode Selection */}
                    <div className="flex flex-col gap-2">
                      <Label>
                        {t('admin.forwardRules.form.exitNode')} <span className="text-destructive">*</span>
                      </Label>
                      <RadioGroup
                        value={exitMode}
                        onValueChange={(value) => {
                          setExitMode(value as ExitMode);
                          // Clear the other mode's data when switching
                          if (value === 'single') {
                            setFormData((prev) => ({ ...prev, exitAgents: [] }));
                          } else {
                            handleChange('exitAgentId', '');
                          }
                        }}
                        className="flex gap-4"
                        disabled={isCreating}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="single" id="sub-exit-single" />
                          <Label htmlFor="sub-exit-single" className="font-normal cursor-pointer">
                            {t('admin.forwardRules.exitAgents.singleMode')}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="multi" id="sub-exit-multi" />
                          <Label htmlFor="sub-exit-multi" className="font-normal cursor-pointer">
                            {t('admin.forwardRules.exitAgents.multiMode')}
                          </Label>
                        </div>
                      </RadioGroup>
                      <p className="text-xs text-muted-foreground">
                        {t('admin.forwardRules.exitAgents.modeHint')}
                      </p>
                    </div>

                    {/* Single Exit Agent Mode */}
                    {exitMode === 'single' && (
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="sub-exitAgentId">
                          {t('admin.forwardRules.form.exitNode')} <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={formData.exitAgentId}
                          onValueChange={(value) => handleChange('exitAgentId', value)}
                          disabled={isCreating || isLoadingAgents}
                        >
                          <SelectTrigger
                            id="sub-exitAgentId"
                            className={errors.exitAgentId ? 'border-destructive' : ''}
                          >
                            <SelectValue placeholder={t('admin.forwardRules.form.selectExitNode')} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableExitAgents.map((agent) => (
                              <SelectItem key={agent.id} value={agent.id}>
                                <div className="flex items-center gap-2">
                                  <Server className="h-4 w-4 text-muted-foreground" />
                                  <span>{agent.name}</span>
                                  {agent.groups && agent.groups.length > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                      ({agent.groups.map((g) => g.name).join(', ')})
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.exitAgentId && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.exitAgentId}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Multi Exit Agent Mode (Load Balancing) */}
                    {exitMode === 'multi' && (
                      <div className="flex flex-col gap-2">
                        <Label>
                          {t('admin.forwardRules.exitAgents.loadBalancing')} <span className="text-destructive">*</span>
                        </Label>
                        <SubscriptionExitAgentList
                          agents={availableExitAgents}
                          exitAgents={formData.exitAgents}
                          onChange={(exitAgents) =>
                            setFormData((prev) => ({ ...prev, exitAgents }))
                          }
                          hasError={!!errors.exitAgents}
                          idPrefix="sub-create-exit-agent"
                        />
                        {errors.exitAgents && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.exitAgents}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* chain type: intermediate node list */}
                {formData.ruleType === 'chain' && (
                  <div className="flex flex-col gap-2">
                    <Label>
                      {t('admin.forwardRules.form.chainNodes')} <span className="text-destructive">*</span>
                    </Label>
                    <UserSortableChainAgentList
                      agents={availableChainAgents}
                      selectedIds={formData.chainAgentIds}
                      onSelectionChange={(ids: string[]) => handleChange('chainAgentIds', ids)}
                      hasError={!!errors.chainAgentIds}
                      idPrefix="sub-chain-agent"
                    />
                    {errors.chainAgentIds && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.chainAgentIds}
                      </p>
                    )}
                  </div>
                )}

                {/* direct_chain type: intermediate node list (with port config) */}
                {formData.ruleType === 'direct_chain' && (
                  <div className="flex flex-col gap-2">
                    <Label>
                      {t('admin.forwardRules.form.chainNodesWithPort')} <span className="text-destructive">*</span>
                    </Label>
                    <UserSortableChainAgentList
                      agents={availableChainAgents}
                      selectedIds={formData.chainAgentIds}
                      onSelectionChange={(ids: string[]) => {
                        // Sync update chainPortConfig, remove deselected nodes
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
                      hasError={!!errors.chainAgentIds || !!errors.chainPortConfig}
                      idPrefix="sub-direct-chain-agent"
                    />
                    {errors.chainAgentIds && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.chainAgentIds}
                      </p>
                    )}
                    {errors.chainPortConfig && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.chainPortConfig}
                      </p>
                    )}
                  </div>
                )}

                {/* Remark */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="sub-remark">{t('common.fields.remark')}</Label>
                  <Textarea
                    id="sub-remark"
                    value={formData.remark}
                    onChange={(e) => handleChange('remark', e.target.value)}
                    placeholder={t('admin.forwardRules.form.remarkPlaceholder')}
                    rows={2}
                    disabled={isCreating}
                  />
                </div>
              </div>
            </div>

            {/* Forward config */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('admin.forwardRules.form.forwardConfig')}</h3>
              <Separator className="mb-4" />
              <div className="@container grid grid-cols-1 @md:grid-cols-2 gap-4">
                {/* Listen port */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="sub-listenPort">{t('admin.forwardRules.form.listenPort')}</Label>
                  <Input
                    id="sub-listenPort"
                    type="number"
                    value={formData.listenPort}
                    onChange={(e) => handleChange('listenPort', e.target.value)}
                    placeholder={t('admin.forwardRules.form.listenPortAutoHint')}
                    error={!!errors.listenPort}
                    disabled={isCreating}
                  />
                  {errors.listenPort && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.listenPort}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">{t('admin.forwardRules.form.listenPortAutoHint')}</p>
                </div>

                {/* Protocol type */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="sub-protocol">{t('common.protocol')}</Label>
                  <Select
                    value={formData.protocol}
                    onValueChange={(value) => handleChange('protocol', value)}
                    disabled={isCreating}
                  >
                    <SelectTrigger id="sub-protocol">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tcp">TCP</SelectItem>
                      <SelectItem value="udp">UDP</SelectItem>
                      <SelectItem value="both">TCP + UDP</SelectItem>
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
                    disabled={isCreating}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="manual" id="sub-target-manual" />
                      <Label htmlFor="sub-target-manual" className="font-normal cursor-pointer">
                        {t('admin.forwardRules.form.targetTypeManual')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="node" id="sub-target-node" />
                      <Label htmlFor="sub-target-node" className="font-normal cursor-pointer">
                        {t('admin.forwardRules.form.targetTypeNode')}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Manual target address input */}
                {targetType === 'manual' && (
                  <>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="sub-targetAddress">
                        {t('admin.forwardRules.form.targetAddress')} <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="sub-targetAddress"
                        value={formData.targetAddress}
                        onChange={(e) => handleChange('targetAddress', e.target.value)}
                        placeholder={t('admin.forwardRules.form.targetAddressPlaceholder')}
                        error={!!errors.targetAddress}
                        disabled={isCreating}
                      />
                      {errors.targetAddress && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.targetAddress}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="sub-targetPort">
                        {t('admin.forwardRules.form.targetPort')} <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="sub-targetPort"
                        type="number"
                        value={formData.targetPort}
                        onChange={(e) => handleChange('targetPort', e.target.value)}
                        placeholder="1-65535"
                        error={!!errors.targetPort}
                        disabled={isCreating}
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
                    <Label htmlFor="sub-targetNodeId">
                      {t('admin.forwardRules.form.targetNode')} <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.targetNodeId}
                      onValueChange={(value) => handleChange('targetNodeId', value)}
                      disabled={isCreating || isLoadingNodes}
                    >
                      <SelectTrigger
                        id="sub-targetNodeId"
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
                      <p className="text-xs text-warning">
                        {t('subscriptionForwardRules.noAvailableNodes')}
                      </p>
                    )}
                  </div>
                )}

                {/* IP version */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="sub-ipVersion">{t('admin.forwardRules.form.ipVersion')}</Label>
                  <Select
                    value={formData.ipVersion}
                    onValueChange={(value) => handleChange('ipVersion', value)}
                    disabled={isCreating}
                  >
                    <SelectTrigger id="sub-ipVersion">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">{t('common.auto')}</SelectItem>
                      <SelectItem value="ipv4">IPv4</SelectItem>
                      <SelectItem value="ipv6">IPv6</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort order */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="sub-sortOrder">{t('common.fields.sortOrder')}</Label>
                  <Input
                    id="sub-sortOrder"
                    type="number"
                    min={0}
                    value={formData.sortOrder}
                    onChange={(e) => handleChange('sortOrder', e.target.value)}
                    placeholder={t('admin.forwardRules.form.sortOrderPlaceholder')}
                    disabled={isCreating}
                  />
                  <p className="text-xs text-muted-foreground">{t('admin.forwardRules.form.sortSmallFirst')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 gap-3">
          <Button onClick={handleSubmit} disabled={!isFormValid() || isCreating}>
            {isCreating ? t('common.loading.creating') : t('common.actions.create')}
          </Button>
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            {t('common.actions.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
