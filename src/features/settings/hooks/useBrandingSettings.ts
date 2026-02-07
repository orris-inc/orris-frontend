/**
 * Branding Settings Hook
 * Manages branding configuration (app name, logo, favicon)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '@/shared/stores/notification-store';
import {
  getBrandingSettings,
  updateBrandingSettings,
  uploadBrandingImage,
  type BrandingSettingsResponse,
  type UpdateBrandingSettingsRequest,
  type BrandingUploadResponse,
} from '@/api/setting';

export function useBrandingSettings() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotificationStore();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const {
    data: settings,
    isLoading,
    refetch,
  } = useQuery<BrandingSettingsResponse>({
    queryKey: ['admin', 'settings', 'branding'],
    queryFn: getBrandingSettings,
  });

  const updateMutation = useMutation({
    mutationFn: updateBrandingSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'branding'] });
      showSuccess(t('admin.settings.branding.updateSuccess'));
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      showError(t('admin.settings.branding.updateError'));
    },
  });

  const uploadMutation = useMutation({
    mutationFn: uploadBrandingImage,
    onSuccess: () => {
      showSuccess(t('admin.settings.branding.uploadSuccess'));
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      showError(t('admin.settings.branding.uploadError'));
    },
  });

  const update = async (data: UpdateBrandingSettingsRequest) => {
    await updateMutation.mutateAsync(data);
  };

  const upload = async (file: File): Promise<BrandingUploadResponse> => {
    return await uploadMutation.mutateAsync(file);
  };

  return {
    settings,
    isLoading,
    error,
    update,
    isUpdating: updateMutation.isPending,
    upload,
    isUploading: uploadMutation.isPending,
    refetch,
  };
}
