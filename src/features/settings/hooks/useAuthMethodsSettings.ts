/**
 * Auth Methods Settings Hook
 * Manages authentication methods configuration (password, passkey, OAuth toggles)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '@/shared/stores/notification-store';
import {
  getAuthMethodsSettings,
  updateAuthMethodsSettings,
  type AuthMethodsSettingsResponse,
  type UpdateAuthMethodsSettingsRequest,
} from '@/api/setting';

export function useAuthMethodsSettings() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotificationStore();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const {
    data: settings,
    isLoading,
    refetch,
  } = useQuery<AuthMethodsSettingsResponse>({
    queryKey: ['admin', 'settings', 'auth'],
    queryFn: getAuthMethodsSettings,
  });

  const updateMutation = useMutation({
    mutationFn: updateAuthMethodsSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'auth'] });
      showSuccess(t('admin.settings.authMethods.updateSuccess'));
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      showError(t('admin.settings.authMethods.updateError'));
    },
  });

  const update = async (data: UpdateAuthMethodsSettingsRequest) => {
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
