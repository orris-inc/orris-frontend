/**
 * Shared form logic for CreateResourceGroupDialog and CreateResourceGroupSheet
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { CreateResourceGroupRequest } from '@/api/resource/types';

interface UseCreateResourceGroupFormParams {
  open: boolean;
}

export function useCreateResourceGroupForm({ open }: UseCreateResourceGroupFormParams) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [planId, setPlanId] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ name?: string; planId?: string }>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Reset form when dialog/sheet opens
  useEffect(() => {
    if (open) {
      setName('');
      setPlanId('');
      setDescription('');
      setErrors({});
      setTouched({});
    }
  }, [open]);

  // Validation
  const validateName = useCallback((value: string): string | undefined => {
    if (!value.trim()) return t('resourceGroups.nameRequired');
    if (value.trim().length > 100) return t('resourceGroups.nameTooLong');
    return undefined;
  }, [t]);

  const validatePlanId = useCallback((value: string): string | undefined => {
    if (!value) return t('resourceGroups.selectPlanRequired');
    return undefined;
  }, [t]);

  const handleNameChange = useCallback((value: string) => {
    setName(value);
    if (touched.name) {
      setErrors((prev) => ({ ...prev, name: validateName(value) }));
    }
  }, [touched.name, validateName]);

  const handlePlanIdChange = useCallback((value: string) => {
    setPlanId(value);
    if (touched.planId) {
      setErrors((prev) => ({ ...prev, planId: validatePlanId(value) }));
    }
  }, [touched.planId, validatePlanId]);

  const handleDescriptionChange = useCallback((value: string) => {
    setDescription(value);
  }, []);

  const handleBlur = useCallback((field: 'name' | 'planId') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const validators = { name: validateName, planId: validatePlanId };
    const values = { name, planId };
    setErrors((prev) => ({ ...prev, [field]: validators[field](values[field]) }));
  }, [name, planId, validateName, validatePlanId]);

  const validate = useCallback((): boolean => {
    const newErrors = {
      name: validateName(name),
      planId: validatePlanId(planId),
    };
    setErrors(newErrors);
    setTouched({ name: true, planId: true });
    return !newErrors.name && !newErrors.planId;
  }, [name, planId, validateName, validatePlanId]);

  const buildSubmitData = useCallback((): CreateResourceGroupRequest => ({
    name: name.trim(),
    planId,
    description: description.trim() || undefined,
  }), [name, planId, description]);

  const reset = useCallback(() => {
    setName('');
    setPlanId('');
    setDescription('');
    setErrors({});
    setTouched({});
  }, []);

  const isFormValid = !!(name.trim() && planId);

  return {
    name,
    planId,
    description,
    errors,
    touched,

    handleNameChange,
    handlePlanIdChange,
    handleDescriptionChange,
    handleBlur,

    validate,
    buildSubmitData,
    isFormValid,
    reset,
  };
}
