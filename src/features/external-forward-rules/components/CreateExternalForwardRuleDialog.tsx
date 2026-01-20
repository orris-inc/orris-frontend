/**
 * Create External Forward Rule Dialog
 * Dialog for creating new external forward rules
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
import { AlertCircle, Server } from 'lucide-react';
import type { CreateExternalForwardRuleRequest } from '@/api/externalforward/types';
import { useUserNodes } from '@/features/user-nodes/hooks/useUserNodes';

interface CreateExternalForwardRuleDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateExternalForwardRuleRequest) => void;
  isCreating?: boolean;
}

export const CreateExternalForwardRuleDialog: React.FC<CreateExternalForwardRuleDialogProps> = ({
  open,
  onClose,
  onSubmit,
  isCreating = false,
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
    externalSource: '',
    externalRuleId: '',
    remark: '',
    sortOrder: '',
    nodeId: '', // Node for direct routing
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        serverAddress: '',
        listenPort: '',
        externalSource: '',
        externalRuleId: '',
        remark: '',
        sortOrder: '',
        nodeId: '',
      });
      setErrors({});
    }
  }, [open]);

  const handleClose = () => {
    if (!isCreating) {
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

    if (!formData.externalSource.trim()) {
      newErrors.externalSource = t('externalForwardRules.validation.externalSourceRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    const data: CreateExternalForwardRuleRequest = {
      name: formData.name.trim(),
      serverAddress: formData.serverAddress.trim(),
      listenPort: parseInt(formData.listenPort),
      externalSource: formData.externalSource.trim(),
      externalRuleId: formData.externalRuleId.trim() || undefined,
      remark: formData.remark.trim() || undefined,
      sortOrder: formData.sortOrder ? parseInt(formData.sortOrder) : undefined,
      nodeId: formData.nodeId || undefined,
    };

    onSubmit(data);
  };

  const isFormValid = () => {
    if (!formData.name.trim() || !formData.serverAddress.trim() || !formData.listenPort || !formData.externalSource.trim()) {
      return false;
    }
    const port = parseInt(formData.listenPort);
    if (isNaN(port) || port < 1 || port > 65535) {
      return false;
    }
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{t('externalForwardRules.createDialog.title')}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
          <div className="space-y-6 py-4">
            {/* Basic info */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {t('externalForwardRules.createDialog.basicInfo')}
              </h3>
              <Separator className="mb-4" />
              <div className="space-y-4">
                {/* Rule name */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="efr-name">
                    {t('externalForwardRules.form.name')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="efr-name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder={t('externalForwardRules.form.namePlaceholder')}
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

                {/* External source */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="efr-externalSource">
                    {t('externalForwardRules.form.externalSource')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="efr-externalSource"
                    value={formData.externalSource}
                    onChange={(e) => handleChange('externalSource', e.target.value)}
                    placeholder={t('externalForwardRules.form.externalSourcePlaceholder')}
                    error={!!errors.externalSource}
                    disabled={isCreating}
                  />
                  {errors.externalSource && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.externalSource}
                    </p>
                  )}
                </div>

                {/* External rule ID */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="efr-externalRuleId">{t('externalForwardRules.form.externalRuleId')}</Label>
                  <Input
                    id="efr-externalRuleId"
                    value={formData.externalRuleId}
                    onChange={(e) => handleChange('externalRuleId', e.target.value)}
                    placeholder={t('externalForwardRules.form.externalRuleIdPlaceholder')}
                    disabled={isCreating}
                  />
                </div>

                {/* Remark */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="efr-remark">{t('externalForwardRules.form.remark')}</Label>
                  <Textarea
                    id="efr-remark"
                    value={formData.remark}
                    onChange={(e) => handleChange('remark', e.target.value)}
                    placeholder={t('externalForwardRules.form.remarkPlaceholder')}
                    rows={2}
                    disabled={isCreating}
                  />
                </div>
              </div>
            </div>

            {/* Server config */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {t('externalForwardRules.createDialog.serverConfig')}
              </h3>
              <Separator className="mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Server address */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="efr-serverAddress">
                    {t('externalForwardRules.form.serverAddress')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="efr-serverAddress"
                    value={formData.serverAddress}
                    onChange={(e) => handleChange('serverAddress', e.target.value)}
                    placeholder={t('externalForwardRules.form.serverAddressPlaceholder')}
                    error={!!errors.serverAddress}
                    disabled={isCreating}
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
                  <Label htmlFor="efr-listenPort">
                    {t('externalForwardRules.form.listenPort')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="efr-listenPort"
                    type="number"
                    value={formData.listenPort}
                    onChange={(e) => handleChange('listenPort', e.target.value)}
                    placeholder="1-65535"
                    error={!!errors.listenPort}
                    disabled={isCreating}
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
                  <Label htmlFor="efr-sortOrder">{t('externalForwardRules.form.sortOrder')}</Label>
                  <Input
                    id="efr-sortOrder"
                    type="number"
                    min={0}
                    value={formData.sortOrder}
                    onChange={(e) => handleChange('sortOrder', e.target.value)}
                    placeholder={t('externalForwardRules.form.sortOrderPlaceholder')}
                    disabled={isCreating}
                  />
                  <p className="text-xs text-muted-foreground">{t('externalForwardRules.form.sortOrderHint')}</p>
                </div>
              </div>
            </div>

            {/* Node selection for direct routing */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {t('externalForwardRules.createDialog.nodeRouting')}
              </h3>
              <Separator className="mb-4" />
              <p className="text-xs text-muted-foreground mb-3">
                {t('externalForwardRules.createDialog.nodeRoutingHint')}
              </p>
              <div className="flex flex-col gap-2">
                <Label htmlFor="efr-nodeId">
                  {t('externalForwardRules.form.nodeId')}
                </Label>
                <Select
                  value={formData.nodeId || '__none__'}
                  onValueChange={(value) => handleChange('nodeId', value === '__none__' ? '' : value)}
                  disabled={isCreating || isLoadingNodes}
                >
                  <SelectTrigger id="efr-nodeId">
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
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            {t('common.actions.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid() || isCreating}>
            {isCreating ? t('externalForwardRules.createDialog.creating') : t('common.actions.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
