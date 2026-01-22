/**
 * Edit Resource Group Sheet Component
 * Mobile-optimized bottom sheet for editing resource group information
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/shared/utils/date-utils';
import { FolderEdit, Layers, FileText } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  type EditSheetProps,
} from '@/components/common/sheet';
import { Button } from '@/components/common/Button';
import { Separator } from '@/components/common/Separator';
import { TruncatedId } from '@/components/admin';
import { MobileFormInput } from '@/components/common/mobile-form';
import type { ResourceGroup, UpdateResourceGroupRequest } from '@/api/resource/types';
import type { SubscriptionPlan } from '@/api/subscription/types';

interface EditResourceGroupSheetProps extends EditSheetProps<ResourceGroup, UpdateResourceGroupRequest> {
  plansMap: Record<string, SubscriptionPlan>;
}

interface FormErrors {
  name?: string;
}

export const EditResourceGroupSheet: React.FC<EditResourceGroupSheetProps> = ({
  open,
  onOpenChange,
  entity: resourceGroup,
  plansMap,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  // Initialize form when resourceGroup changes
  useEffect(() => {
    if (resourceGroup) {
      setName(resourceGroup.name);
      setDescription(resourceGroup.description || '');
      setErrors({});
      setTouched({});
    }
  }, [resourceGroup]);

  // Validation functions
  const validateName = useCallback((value: string): string | undefined => {
    if (!value.trim()) return t('resourceGroups.nameRequired');
    if (value.trim().length > 100) return t('resourceGroups.nameTooLong');
    return undefined;
  }, [t]);

  const handleBlur = useCallback((field: 'name') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const validators = { name: validateName };
    const values = { name };
    setErrors((prev) => ({ ...prev, [field]: validators[field](values[field]) }));
  }, [name, validateName]);

  const validate = useCallback((): boolean => {
    const newErrors = {
      name: validateName(name),
    };
    setErrors(newErrors);
    return !newErrors.name;
  }, [name, validateName]);

  const handleOpenChange = useCallback((o: boolean) => {
    if (!loading) {
      onOpenChange(o);
    }
  }, [loading, onOpenChange]);

  const handleSubmit = useCallback(async () => {
    if (!resourceGroup || !validate()) return;

    setLoading(true);
    try {
      const submitData: UpdateResourceGroupRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
      };
      await onSubmit(resourceGroup.sid, submitData);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }, [resourceGroup, name, description, validate, onSubmit, onOpenChange]);

  // Check for changes
  const hasChanges = resourceGroup && (
    name !== resourceGroup.name ||
    description !== (resourceGroup.description || '')
  );

  if (!resourceGroup) return null;

  const plan = plansMap[resourceGroup.planId];

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <FolderEdit className="size-5 text-blue-500" />
            </div>
            <span>{t('resourceGroups.editTitle')}</span>
          </SheetTitle>
          <SheetDescription>
            {t('resourceGroups.editSheet.description', { name: resourceGroup.name })}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-6 py-4">
          {/* Read-only Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground px-1">{t('resourceGroups.editSheet.basicInfo')}</h4>
            <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">SID</span>
                <TruncatedId id={resourceGroup.sid} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('resourceGroups.editSheet.associatedPlan')}</span>
                <span className="text-sm font-medium">
                  {plan?.name || t('resourceGroups.planPrefix', { id: resourceGroup.planId })}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('resourceGroups.editSheet.createdAt')}</span>
                <span className="text-sm">
                  {formatDate(resourceGroup.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground px-1">{t('resourceGroups.editSheet.editableInfo')}</h4>

            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="edit-rg-name" className="text-sm font-medium px-1">
                {t('resourceGroups.name')} <span className="text-destructive">*</span>
              </label>
              <MobileFormInput
                id="edit-rg-name"
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

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="edit-rg-description" className="text-sm font-medium px-1">
                {t('resourceGroups.description')}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-4 text-muted-foreground">
                  <FileText className="size-5" />
                </div>
                <textarea
                  id="edit-rg-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('resourceGroups.descriptionPlaceholder')}
                  rows={3}
                  disabled={loading}
                  className="w-full min-h-[100px] py-3 pl-12 pr-4 text-base rounded-xl border bg-background placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                />
              </div>
            </div>
          </div>
        </SheetBody>

        <SheetFooter>
          <Button
            onClick={handleSubmit}
            disabled={loading || !hasChanges}
            className="w-full min-h-[48px] text-base"
          >
            {loading ? t('resourceGroups.saving') : t('resourceGroups.saveChanges')}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
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
