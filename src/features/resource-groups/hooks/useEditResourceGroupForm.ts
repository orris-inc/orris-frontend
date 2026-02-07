/**
 * Shared form logic for EditResourceGroupDialog and EditResourceGroupSheet
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { ResourceGroup, UpdateResourceGroupRequest } from '@/api/resource/types';

interface UseEditResourceGroupFormParams {
  resourceGroup: ResourceGroup | null;
}

export function useEditResourceGroupForm({ resourceGroup }: UseEditResourceGroupFormParams) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Initialize form when resourceGroup changes
  useEffect(() => {
    if (resourceGroup) {
      setName(resourceGroup.name);
      setDescription(resourceGroup.description || '');
      setErrors({});
      setTouched({});
    }
  }, [resourceGroup]);

  // Validation
  const validateName = useCallback((value: string): string | undefined => {
    if (!value.trim()) return t('resourceGroups.nameRequired');
    if (value.trim().length > 100) return t('resourceGroups.nameTooLong');
    return undefined;
  }, [t]);

  const handleNameChange = useCallback((value: string) => {
    setName(value);
    if (touched.name) {
      setErrors((prev) => ({ ...prev, name: validateName(value) }));
    }
  }, [touched.name, validateName]);

  const handleDescriptionChange = useCallback((value: string) => {
    setDescription(value);
  }, []);

  const handleBlur = useCallback((field: 'name') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateName(name) }));
  }, [name, validateName]);

  const validate = useCallback((): boolean => {
    const newErrors = { name: validateName(name) };
    setErrors(newErrors);
    return !newErrors.name;
  }, [name, validateName]);

  const buildSubmitData = useCallback((): { sid: string; data: UpdateResourceGroupRequest } | null => {
    if (!resourceGroup) return null;

    const data: UpdateResourceGroupRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
    };
    return { sid: resourceGroup.sid, data };
  }, [resourceGroup, name, description]);

  const hasChanges = !!(resourceGroup && (
    name !== resourceGroup.name ||
    description !== (resourceGroup.description || '')
  ));

  const isFormValid = !!name.trim();

  return {
    name,
    description,
    errors,
    touched,

    handleNameChange,
    handleDescriptionChange,
    handleBlur,

    validate,
    buildSubmitData,
    hasChanges,
    isFormValid,
  };
}
