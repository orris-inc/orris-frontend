/**
 * Create Resource Group Dialog
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { useCreateResourceGroupForm } from '../hooks/useCreateResourceGroupForm';
import type { CreateResourceGroupRequest } from '@/api/resource/types';
import type { SubscriptionPlan } from '@/api/subscription/types';

interface CreateResourceGroupDialogProps {
  open: boolean;
  plans: SubscriptionPlan[];
  onClose: () => void;
  onSubmit: (data: CreateResourceGroupRequest) => Promise<void>;
}

export const CreateResourceGroupDialog: React.FC<CreateResourceGroupDialogProps> = ({
  open,
  plans,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const form = useCreateResourceGroupForm({ open });

  const handleSubmit = async () => {
    if (!form.validate()) return;

    setLoading(true);
    try {
      await onSubmit(form.buildSubmitData());
      onClose();
      form.reset();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('resourceGroups.createTitle')}</DialogTitle>
          <DialogDescription>
            {t('resourceGroups.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
            <Label htmlFor="planId">
              {t('resourceGroups.associatedPlan')} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.planId}
              onValueChange={form.handlePlanIdChange}
              disabled={loading}
            >
              <SelectTrigger id="planId">
                <SelectValue placeholder={t('resourceGroups.selectPlan')} />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id.toString()}>
                    {plan.name}
                    <span className="ml-2 text-muted-foreground">({plan.slug})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <Button onClick={handleSubmit} disabled={loading || !form.isFormValid}>
            {loading ? t('common.loading.creating') : t('common.actions.create')}
          </Button>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.actions.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
