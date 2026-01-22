/**
 * Create Resource Group Sheet Component
 * Mobile-optimized bottom sheet for creating new resource groups
 * Features: Large touch targets, plan selection, description textarea
 */

import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FolderPlus, Layers, FileText } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  type CreateSheetProps,
} from '@/components/common/sheet';
import { Button } from '@/components/common/Button';
import { MobileFormInput, MobileSelect, type MobileSelectOption } from '@/components/common/mobile-form';
import type { CreateResourceGroupRequest } from '@/api/resource/types';
import type { SubscriptionPlan } from '@/api/subscription/types';

interface CreateResourceGroupSheetProps extends CreateSheetProps<CreateResourceGroupRequest> {
  /** Available subscription plans for selection */
  plans: SubscriptionPlan[];
}

interface FormErrors {
  name?: string;
  planId?: string;
}

export const CreateResourceGroupSheet: React.FC<CreateResourceGroupSheetProps> = ({
  open,
  onOpenChange,
  onSubmit,
  plans,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [planId, setPlanId] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  // Build plan options for MobileSelect
  const planOptions: MobileSelectOption[] = plans.map((plan) => ({
    value: plan.id.toString(),
    label: `${plan.name} (${plan.slug})`,
  }));

  // Validation functions
  const validateName = useCallback((value: string): string | undefined => {
    if (!value.trim()) return t('resourceGroups.nameRequired');
    if (value.trim().length > 100) return t('resourceGroups.nameTooLong');
    return undefined;
  }, [t]);

  const validatePlanId = useCallback((value: string): string | undefined => {
    if (!value) return t('resourceGroups.selectPlanRequired');
    return undefined;
  }, [t]);

  // Handle blur for inline validation
  const handleBlur = useCallback((field: keyof FormErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const validators = { name: validateName, planId: validatePlanId };
    const values = { name, planId };
    setErrors((prev) => ({ ...prev, [field]: validators[field](values[field]) }));
  }, [name, planId, validateName, validatePlanId]);

  // Validate all fields
  const validateAll = useCallback((): boolean => {
    const newErrors: FormErrors = {
      name: validateName(name),
      planId: validatePlanId(planId),
    };
    setErrors(newErrors);
    setTouched({ name: true, planId: true });
    return !newErrors.name && !newErrors.planId;
  }, [name, planId, validateName, validatePlanId]);

  // Reset form
  const resetForm = useCallback(() => {
    setName('');
    setPlanId('');
    setDescription('');
    setErrors({});
    setTouched({});
  }, []);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, resetForm]);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!loading && !open) {
      resetForm();
      onOpenChange(false);
    }
  }, [loading, resetForm, onOpenChange]);

  const handleSubmit = useCallback(async () => {
    if (!validateAll()) return;

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        planId,
        description: description.trim() || undefined,
      });
      resetForm();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }, [validateAll, name, planId, description, onSubmit, resetForm, onOpenChange]);

  // Form validity check
  const isFormValid = name.trim() && planId;

  return (
    <Sheet open={open} onOpenChange={(o) => !loading && handleOpenChange(o)}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FolderPlus className="size-5 text-primary" />
            </div>
            <span>{t('resourceGroups.createTitle')}</span>
          </SheetTitle>
          <SheetDescription>
            {t('resourceGroups.createDescription')}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-6 py-4">
          {/* Name Field */}
          <div className="space-y-1.5">
            <label htmlFor="mobile-rg-name" className="text-sm font-medium px-1">
              {t('resourceGroups.name')} <span className="text-destructive">*</span>
            </label>
            <MobileFormInput
              id="mobile-rg-name"
              value={name}
              onChange={(v) => {
                setName(v);
                if (touched.name) setErrors((prev) => ({ ...prev, name: validateName(v) }));
              }}
              onBlur={() => handleBlur('name')}
              placeholder={t('resourceGroups.namePlaceholder')}
              icon={<Layers className="size-5" />}
              error={touched.name ? errors.name : undefined}
              disabled={loading}
            />
          </div>

          {/* Plan Selection Field */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium px-1">
              {t('resourceGroups.associatedPlan')} <span className="text-destructive">*</span>
            </label>
            <MobileSelect
              value={planId}
              onChange={(v) => {
                setPlanId(v);
                if (touched.planId) setErrors((prev) => ({ ...prev, planId: validatePlanId(v) }));
              }}
              options={planOptions}
              placeholder={t('resourceGroups.selectPlan')}
              disabled={loading}
            />
            {touched.planId && errors.planId && (
              <p className="text-sm text-destructive px-1">{errors.planId}</p>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-1.5">
            <label htmlFor="mobile-rg-description" className="text-sm font-medium px-1">
              {t('resourceGroups.description')}
            </label>
            <div className="relative">
              <div className="absolute left-4 top-4 text-muted-foreground">
                <FileText className="size-5" />
              </div>
              <textarea
                id="mobile-rg-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('resourceGroups.descriptionPlaceholder')}
                rows={3}
                disabled={loading}
                className="w-full min-h-[100px] py-3 pl-12 pr-4 text-base rounded-xl border bg-background placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
            </div>
          </div>
        </SheetBody>

        <SheetFooter>
          {/* Primary action - full width on mobile */}
          <Button
            onClick={handleSubmit}
            disabled={loading || !isFormValid}
            className="w-full min-h-[48px] text-base"
          >
            {loading ? t('resourceGroups.creating') : t('resourceGroups.createResourceGroup')}
          </Button>

          {/* Secondary action */}
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
            className="w-full min-h-[44px]"
          >
            {t('resourceGroups.cancel')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
