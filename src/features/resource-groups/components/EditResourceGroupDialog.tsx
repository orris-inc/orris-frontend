/**
 * Edit Resource Group Dialog
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Label } from '@/components/common/Label';
import type { ResourceGroup, UpdateResourceGroupRequest } from '@/api/resource/types';
import type { SubscriptionPlan } from '@/api/subscription/types';

interface EditResourceGroupDialogProps {
  open: boolean;
  resourceGroup: ResourceGroup | null;
  plansMap: Record<string, SubscriptionPlan>;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateResourceGroupRequest) => Promise<void>;
}

interface FormData {
  name: string;
  description: string;
}

export const EditResourceGroupDialog: React.FC<EditResourceGroupDialogProps> = ({
  open,
  resourceGroup,
  plansMap,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (open && resourceGroup) {
      setFormData({
        name: resourceGroup.name,
        description: resourceGroup.description || '',
      });
    }
  }, [open, resourceGroup]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!resourceGroup || !formData.name) {
      return;
    }

    setLoading(true);
    try {
      const submitData: UpdateResourceGroupRequest = {
        name: formData.name,
        description: formData.description || undefined,
      };
      await onSubmit(resourceGroup.sid, submitData);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const plan = resourceGroup ? plansMap[resourceGroup.planId] : null;
  const isValid = formData.name.trim() !== '';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('resourceGroups.editTitle')}</DialogTitle>
          <DialogDescription>
            {t('resourceGroups.editDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Read-only info */}
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">SID</span>
              <span className="font-mono text-xs">{resourceGroup?.sid}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('resourceGroups.associatedPlan')}</span>
              <span>{plan?.name || t('resourceGroups.planPrefix', { id: resourceGroup?.planId })}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">
              {t('common.fields.name')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder={t('resourceGroups.namePlaceholder')}
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">{t('common.fields.description')}</Label>
            <Textarea
              id="description"
              placeholder={t('resourceGroups.descriptionPlaceholder')}
              rows={3}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading || !isValid}>
            {loading ? t('common.loading.saving') : t('common.actions.save')}
          </Button>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.actions.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
