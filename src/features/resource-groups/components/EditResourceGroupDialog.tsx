/**
 * Edit Resource Group Dialog
 */

import { useState } from 'react';
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
import { useEditResourceGroupForm } from '../hooks/useEditResourceGroupForm';
import type { ResourceGroup, UpdateResourceGroupRequest } from '@/api/resource/types';
import type { SubscriptionPlan } from '@/api/subscription/types';

interface EditResourceGroupDialogProps {
  open: boolean;
  resourceGroup: ResourceGroup | null;
  plansMap: Record<string, SubscriptionPlan>;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateResourceGroupRequest) => Promise<void>;
}

export const EditResourceGroupDialog: React.FC<EditResourceGroupDialogProps> = ({
  open,
  resourceGroup,
  plansMap,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const form = useEditResourceGroupForm({ resourceGroup });

  const handleSubmit = async () => {
    if (!form.validate()) return;
    const result = form.buildSubmitData();
    if (!result) return;

    setLoading(true);
    try {
      await onSubmit(result.sid, result.data);
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
          <div className="rounded-lg bg-muted p-3 space-y-2">
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
              value={form.name}
              onChange={(e) => form.handleNameChange(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">{t('common.fields.description')}</Label>
            <Textarea
              id="description"
              placeholder={t('resourceGroups.descriptionPlaceholder')}
              rows={3}
              value={form.description}
              onChange={(e) => form.handleDescriptionChange(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading || !form.hasChanges}>
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
