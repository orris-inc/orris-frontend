/**
 * Registration Settings Hook
 * Manages registration configuration (open registration, email verification)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '@/shared/stores/notification-store';
import {
  getRegistrationSettings,
  updateRegistrationSettings,
  type RegistrationSettingsResponse,
  type UpdateRegistrationSettingsRequest,
} from '@/api/setting';

export function useRegistrationSettings() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotificationStore();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const {
    data: settings,
    isLoading,
    refetch,
  } = useQuery<RegistrationSettingsResponse>({
    queryKey: ['admin', 'settings', 'registration'],
    queryFn: getRegistrationSettings,
  });

  const updateMutation = useMutation({
    mutationFn: updateRegistrationSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'registration'] });
      showSuccess(t('admin.settings.registration.updateSuccess'));
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      showError(t('admin.settings.registration.updateError'));
    },
  });

  const update = async (data: UpdateRegistrationSettingsRequest) => {
    await updateMutation.mutateAsync(data);
  };

  return {
    settings,
    isLoading,
    error,
    update,
    isUpdating: updateMutation.isPending,
    refetch,
  };
}
