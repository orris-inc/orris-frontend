/**
 * Create Resource Group Dialog
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import type { CreateResourceGroupRequest } from '@/api/resource/types';
import type { SubscriptionPlan } from '@/api/subscription/types';

interface CreateResourceGroupDialogProps {
  open: boolean;
  plans: SubscriptionPlan[];
  onClose: () => void;
  onSubmit: (data: CreateResourceGroupRequest) => Promise<void>;
}

interface FormData {
  name: string;
  planId: string;
  description: string;
}

const getDefaultFormData = (): FormData => ({
  name: '',
  planId: '',
  description: '',
});

export const CreateResourceGroupDialog: React.FC<CreateResourceGroupDialogProps> = ({
  open,
  plans,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>(getDefaultFormData());
  const [loading, setLoading] = useState(false);

  // Reset form
  useEffect(() => {
    if (open) {
      setFormData(getDefaultFormData());
    }
  }, [open]);

  const handleChange = (field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.planId) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: formData.name,
        planId: formData.planId,
        description: formData.description || undefined,
      });
      onClose();
      setFormData(getDefaultFormData());
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const isValid = formData.name.trim() !== '' && formData.planId !== '';

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
              {t('resourceGroups.name')} <span className="text-destructive">*</span>
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
            <Label htmlFor="planId">
              {t('resourceGroups.associatedPlan')} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.planId}
              onValueChange={(value) => handleChange('planId', value)}
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
            <Label htmlFor="description">{t('resourceGroups.description')}</Label>
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
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('resourceGroups.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !isValid}>
            {loading ? t('resourceGroups.creating') : t('resourceGroups.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
