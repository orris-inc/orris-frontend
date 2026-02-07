/**
 * OAuth Settings Hook
 * Manages OAuth provider configuration state and operations
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '@/shared/stores/notification-store';
import {
  getOAuthSettings,
  updateOAuthSettings,
  type OAuthSettingsResponse,
  type UpdateOAuthSettingsRequest,
} from '@/api/admin';

export function useOAuthSettings() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotificationStore();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const {
    data: settings,
    isLoading,
    refetch,
  } = useQuery<OAuthSettingsResponse>({
    queryKey: ['admin', 'settings', 'oauth'],
    queryFn: getOAuthSettings,
  });

  const updateMutation = useMutation({
    mutationFn: updateOAuthSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'oauth'] });
      showSuccess(t('admin.settings.oauth.updateSuccess'));
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      showError(t('admin.settings.oauth.updateError'));
    },
  });

  const update = async (data: UpdateOAuthSettingsRequest) => {
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
