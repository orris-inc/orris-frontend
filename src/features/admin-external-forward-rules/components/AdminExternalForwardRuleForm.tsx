/**
 * Admin External Forward Rule Form
 * Shared form component for creating and editing external forward rules
 *
 * Tailwind CSS v4 Best Practices:
 * - Desktop-first approach (use max-* for mobile overrides)
 * - Fluid spacing with CSS variables (--spacing-fluid-*)
 * - Container queries (@container) for component-level responsiveness
 * - Min 44px touch targets for mobile
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
import { Checkbox } from '@/components/common/Checkbox';
import { AlertCircle, X, Layers, Server, FileText, User, Globe } from 'lucide-react';
import type {
  AdminExternalForwardRule,
  AdminCreateExternalForwardRuleRequest,
  AdminUpdateExternalForwardRuleRequest,
} from '@/api/admin/types';
import { useResourceGroups } from '@/features/resource-groups/hooks/useResourceGroups';
import { useNodes } from '@/features/nodes/hooks/useNodes';

// ============================================================================
// Types
// ============================================================================

interface FormData {
  name: string;
  serverAddress: string;
  listenPort: string;
  externalSource: string;
  externalRuleId: string;
  remark: string;
  sortOrder: string;
  groupIds: string[];
  nodeId: string;
}

interface BaseFormProps {
  isSubmitting?: boolean;
  renderFooter: (props: {
    onSubmit: () => void;
    onCancel: () => void;
    isValid: boolean;
    hasChanges: boolean;
    isSubmitting: boolean;
  }) => React.ReactNode;
  onCancel: () => void;
}

interface CreateFormProps extends BaseFormProps {
  mode: 'create';
  onSubmit: (data: AdminCreateExternalForwardRuleRequest) => void;
}

interface EditFormProps extends BaseFormProps {
  mode: 'edit';
  rule: AdminExternalForwardRule;
  onSubmit: (ruleId: string, data: AdminUpdateExternalForwardRuleRequest) => void;
}

export type AdminExternalForwardRuleFormProps = CreateFormProps | EditFormProps;

// ============================================================================
// Component
// ============================================================================

export const AdminExternalForwardRuleForm: React.FC<AdminExternalForwardRuleFormProps> = (props) => {
  const { mode, onCancel, isSubmitting = false, renderFooter } = props;
  const { t } = useTranslation();

  const rule = mode === 'edit' ? props.rule : null;

  const { resourceGroups, isLoading: isLoadingGroups } = useResourceGroups({
    pageSize: 100,
    enabled: mode === 'create',
  });

  const { nodes, isLoading: isLoadingNodes } = useNodes({
    pageSize: 100,
    enabled: true,
    filters: { status: 'active' },
  });

  const initialFormData: FormData = useMemo(() => {
    if (mode === 'edit' && rule) {
      return {
        name: rule.name,
        serverAddress: rule.serverAddress,
        listenPort: rule.listenPort.toString(),
        externalSource: rule.externalSource || '',
        externalRuleId: rule.externalRuleId || '',
        remark: rule.remark || '',
        sortOrder: rule.sortOrder?.toString() || '',
        groupIds: rule.groupIds || [],
        nodeId: rule.nodeSid || '',
      };
    }
    return {
      name: '',
      serverAddress: '',
      listenPort: '',
      externalSource: '',
      externalRuleId: '',
      remark: '',
      sortOrder: '',
      groupIds: [],
      nodeId: '',
    };
  }, [mode, rule]);

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData(initialFormData);
    setErrors({});
  }, [initialFormData]);

  const handleChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (Object.keys(prev).length > 0 ? {} : prev));
  }, []);

  const handleGroupToggle = useCallback((groupId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      groupIds: checked
        ? [...prev.groupIds, groupId]
        : prev.groupIds.filter((id) => id !== groupId),
    }));
  }, []);

  const handleRemoveGroup = useCallback((groupId: string) => {
    setFormData((prev) => ({
      ...prev,
      groupIds: prev.groupIds.filter((id) => id !== groupId),
    }));
  }, []);

  const validate = useCallback(() => {
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
    if (mode === 'create' && !formData.externalSource.trim()) {
      newErrors.externalSource = t('admin.externalForwardRules.validation.externalSourceRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, mode, t]);

  const handleSubmit = useCallback(() => {
    if (!validate()) return;

    if (mode === 'create') {
      const request: AdminCreateExternalForwardRuleRequest = {
        name: formData.name.trim(),
        serverAddress: formData.serverAddress.trim(),
        listenPort: parseInt(formData.listenPort),
        externalSource: formData.externalSource.trim(),
      };

      if (formData.externalRuleId.trim()) request.externalRuleId = formData.externalRuleId.trim();
      if (formData.remark.trim()) request.remark = formData.remark.trim();
      if (formData.sortOrder) request.sortOrder = parseInt(formData.sortOrder);
      if (formData.groupIds.length > 0) request.groupIds = formData.groupIds;
      if (formData.nodeId) request.nodeId = formData.nodeId;

      props.onSubmit(request);
    } else if (rule) {
      const updates: AdminUpdateExternalForwardRuleRequest = {};

      if (formData.name.trim() !== rule.name) updates.name = formData.name.trim();
      if (formData.serverAddress.trim() !== rule.serverAddress) updates.serverAddress = formData.serverAddress.trim();
      if (formData.listenPort !== rule.listenPort.toString()) updates.listenPort = parseInt(formData.listenPort);
      if (formData.remark.trim() !== (rule.remark || '')) updates.remark = formData.remark.trim() || undefined;
      if (formData.sortOrder !== (rule.sortOrder?.toString() || '')) updates.sortOrder = formData.sortOrder ? parseInt(formData.sortOrder) : undefined;
      if (formData.nodeId !== (rule.nodeSid || '')) updates.nodeId = formData.nodeId;

      if (Object.keys(updates).length > 0) {
        props.onSubmit(rule.id, updates);
      }
    }
  }, [formData, mode, props, rule, validate]);

  const isFormValid = useMemo(() => {
    if (!formData.name.trim() || !formData.serverAddress.trim() || !formData.listenPort) return false;
    if (mode === 'create' && !formData.externalSource.trim()) return false;
    const port = parseInt(formData.listenPort);
    return !(isNaN(port) || port < 1 || port > 65535);
  }, [formData, mode]);

  const hasChanges = useMemo(() => {
    if (mode !== 'edit' || !rule) return true;
    return (
      formData.name !== rule.name ||
      formData.serverAddress !== rule.serverAddress ||
      formData.listenPort !== rule.listenPort.toString() ||
      formData.remark !== (rule.remark || '') ||
      formData.sortOrder !== (rule.sortOrder?.toString() || '') ||
      formData.nodeId !== (rule.nodeSid || '')
    );
  }, [formData, rule, mode]);

  const selectedGroups = resourceGroups.filter((g) => formData.groupIds.includes(g.sid));

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      {/* Form Content - Container query enabled */}
      <div className="@container space-y-[--spacing-fluid-md]">
        {/* Section: Basic Info */}
        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            {t(mode === 'create' ? 'admin.externalForwardRules.createDialog.basicInfo' : 'admin.externalForwardRules.editDialog.basicInfo')}
          </h3>
          <Separator className="mb-3" />

          {/* Desktop: 2-col grid | Mobile: stack */}
          <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="efr-name" className="text-sm">
                {t('externalForwardRules.form.name')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="efr-name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder={t('externalForwardRules.form.namePlaceholder')}
                error={!!errors.name}
                disabled={isSubmitting}
                className="h-9 max-md:h-11"
              />
              {errors.name && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* External Source (create only) */}
            {mode === 'create' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="efr-externalSource" className="text-sm">
                  {t('admin.externalForwardRules.form.externalSource')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="efr-externalSource"
                  value={formData.externalSource}
                  onChange={(e) => handleChange('externalSource', e.target.value)}
                  placeholder={t('admin.externalForwardRules.form.externalSourcePlaceholder')}
                  error={!!errors.externalSource}
                  disabled={isSubmitting}
                  className="h-9 max-md:h-11"
                />
                {errors.externalSource && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    {errors.externalSource}
                  </p>
                )}
              </div>
            )}

            {/* External Rule ID (create only) */}
            {mode === 'create' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="efr-externalRuleId" className="text-sm">
                  {t('admin.externalForwardRules.form.externalRuleId')}
                </Label>
                <Input
                  id="efr-externalRuleId"
                  value={formData.externalRuleId}
                  onChange={(e) => handleChange('externalRuleId', e.target.value)}
                  placeholder={t('admin.externalForwardRules.form.externalRuleIdPlaceholder')}
                  disabled={isSubmitting}
                  className="h-9 max-md:h-11"
                />
              </div>
            )}

            {/* Remark - full width */}
            <div className="flex flex-col gap-1.5 col-span-2 max-md:col-span-1">
              <Label htmlFor="efr-remark" className="text-sm">{t('externalForwardRules.form.remark')}</Label>
              <Textarea
                id="efr-remark"
                value={formData.remark}
                onChange={(e) => handleChange('remark', e.target.value)}
                placeholder={t('externalForwardRules.form.remarkPlaceholder')}
                rows={2}
                disabled={isSubmitting}
                className="min-h-[60px]"
              />
            </div>
          </div>
        </section>

        {/* Section: Server Config */}
        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            {t(mode === 'create' ? 'admin.externalForwardRules.createDialog.serverConfig' : 'admin.externalForwardRules.editDialog.serverConfig')}
          </h3>
          <Separator className="mb-3" />

          {/* Desktop: 3-col [2fr 1fr 1fr] | Mobile: stack */}
          <div className="grid grid-cols-[2fr_1fr_1fr] gap-3 max-md:grid-cols-1">
            {/* Server Address */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="efr-serverAddress" className="text-sm">
                {t('externalForwardRules.form.serverAddress')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="efr-serverAddress"
                value={formData.serverAddress}
                onChange={(e) => handleChange('serverAddress', e.target.value)}
                placeholder={t('externalForwardRules.form.serverAddressPlaceholder')}
                error={!!errors.serverAddress}
                disabled={isSubmitting}
                className="h-9 max-md:h-11"
              />
              {errors.serverAddress && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  {errors.serverAddress}
                </p>
              )}
            </div>

            {/* Port */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="efr-listenPort" className="text-sm">
                {t('externalForwardRules.form.listenPort')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="efr-listenPort"
                type="number"
                value={formData.listenPort}
                onChange={(e) => handleChange('listenPort', e.target.value)}
                placeholder="1-65535"
                error={!!errors.listenPort}
                disabled={isSubmitting}
                className="h-9 max-md:h-11"
              />
              {errors.listenPort && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  {errors.listenPort}
                </p>
              )}
            </div>

            {/* Sort Order */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="efr-sortOrder" className="text-sm">{t('externalForwardRules.form.sortOrder')}</Label>
              <Input
                id="efr-sortOrder"
                type="number"
                min={0}
                value={formData.sortOrder}
                onChange={(e) => handleChange('sortOrder', e.target.value)}
                placeholder="0"
                disabled={isSubmitting}
                className="h-9 max-md:h-11"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">{t('externalForwardRules.form.sortOrderHint')}</p>
        </section>

        {/* Section: Node Routing */}
        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            {t(mode === 'create' ? 'admin.externalForwardRules.createDialog.nodeRouting' : 'admin.externalForwardRules.editDialog.nodeRouting')}
          </h3>
          <Separator className="mb-3" />
          <p className="text-xs text-muted-foreground mb-2">
            {t(mode === 'create' ? 'admin.externalForwardRules.createDialog.nodeRoutingHint' : 'admin.externalForwardRules.editDialog.nodeRoutingHint')}
          </p>

          <div className="max-w-xs max-md:max-w-full">
            <Select
              value={formData.nodeId || '__none__'}
              onValueChange={(value) => handleChange('nodeId', value === '__none__' ? '' : value)}
              disabled={isSubmitting || isLoadingNodes}
            >
              <SelectTrigger className="h-9 max-md:h-11">
                <SelectValue placeholder={t('admin.externalForwardRules.form.nodeIdPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">
                  <span className="text-muted-foreground">{t('admin.externalForwardRules.form.noNode')}</span>
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

          {/* Current node info (edit mode) */}
          {mode === 'edit' && rule?.nodeServerAddress && (
            <div className="mt-3 p-3 rounded-lg bg-muted/50 text-sm">
              <p className="text-xs text-muted-foreground mb-1.5">{t('admin.externalForwardRules.editDialog.currentNodeInfo')}</p>
              <div className="space-y-0.5 font-mono text-xs">
                <div className="break-all">
                  <span className="text-muted-foreground">{t('admin.externalForwardRules.columns.nodeServerAddress')}:</span> {rule.nodeServerAddress}
                </div>
                {rule.nodePublicIpv4 && <div><span className="text-muted-foreground">IPv4:</span> {rule.nodePublicIpv4}</div>}
                {rule.nodePublicIpv6 && <div className="break-all"><span className="text-muted-foreground">IPv6:</span> {rule.nodePublicIpv6}</div>}
              </div>
            </div>
          )}
        </section>

        {/* Section: Resource Groups (create only) */}
        {mode === 'create' && (
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              {t('admin.externalForwardRules.createDialog.resourceGroups')}
            </h3>
            <Separator className="mb-3" />
            <p className="text-xs text-muted-foreground mb-2">
              {t('admin.externalForwardRules.createDialog.resourceGroupsHint')}
            </p>

            {/* Selected groups chips */}
            {selectedGroups.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedGroups.map((group) => (
                  <Badge key={group.sid} variant="secondary" className="gap-1 pr-1">
                    <Layers className="size-3" />
                    {group.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveGroup(group.sid)}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-muted min-w-[22px] min-h-[22px] max-md:min-w-[44px] max-md:min-h-[44px] flex items-center justify-center"
                      disabled={isSubmitting}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Group selection list */}
            <div className="border rounded-lg max-h-[120px] overflow-y-auto">
              {isLoadingGroups ? (
                <div className="p-3 text-center text-sm text-muted-foreground">{t('common.loading')}...</div>
              ) : resourceGroups.length === 0 ? (
                <div className="p-3 text-center text-sm text-muted-foreground">{t('admin.externalForwardRules.createDialog.noResourceGroups')}</div>
              ) : (
                <div className="divide-y">
                  {resourceGroups.map((group) => (
                    <label
                      key={group.sid}
                      className="flex items-center gap-3 p-2.5 hover:bg-muted/50 cursor-pointer transition-colors min-h-[44px]"
                    >
                      <Checkbox
                        checked={formData.groupIds.includes(group.sid)}
                        onCheckedChange={(checked) => handleGroupToggle(group.sid, !!checked)}
                        disabled={isSubmitting}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{group.name}</span>
                          <Badge variant={group.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                            {group.status === 'active' ? t('common.status.active') : t('common.status.inactive')}
                          </Badge>
                        </div>
                        {group.description && <p className="text-xs text-muted-foreground truncate">{group.description}</p>}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Section: Read-only info (edit mode) */}
        {mode === 'edit' && rule && (
          <section className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-2">{t('admin.externalForwardRules.editDialog.readOnlyInfo')}</p>
            <div className="space-y-1.5 text-sm">
              {(rule.subscriptionId != null || rule.userId != null) ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <FileText className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">{t('admin.externalForwardRules.columns.subscriptionId')}:</span>
                    <span className="font-mono text-xs truncate">{rule.subscriptionId ?? '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">{t('admin.externalForwardRules.columns.userId')}:</span>
                    <span className="font-mono text-xs truncate">{rule.userId ?? '-'}</span>
                  </div>
                </>
              ) : (
                <Badge variant="outline" className="text-xs">{t('admin.externalForwardRules.adminCreated')}</Badge>
              )}
              <div className="flex items-center gap-1.5">
                <Globe className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{t('admin.externalForwardRules.columns.externalSource')}:</span>
                <Badge variant="outline">{rule.externalSource}</Badge>
              </div>
              {rule.externalRuleId && (
                <div className="break-all">
                  <span className="text-muted-foreground">{t('admin.externalForwardRules.columns.externalRuleId')}:</span>{' '}
                  <span className="font-mono text-xs">{rule.externalRuleId}</span>
                </div>
              )}
              {rule.groupIds && rule.groupIds.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Layers className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{t('admin.externalForwardRules.columns.resourceGroups')}:</span>
                  <span className="text-xs">{rule.groupIds.length} {t('admin.externalForwardRules.groupCount')}</span>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Footer Actions */}
      {renderFooter({
        onSubmit: handleSubmit,
        onCancel,
        isValid: isFormValid,
        hasChanges,
        isSubmitting,
      })}
    </>
  );
};
