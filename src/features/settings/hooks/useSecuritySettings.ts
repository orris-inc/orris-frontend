/**
 * Security Settings Hook
 * Manages security configuration (password policy, session, login protection)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '@/shared/stores/notification-store';
import {
  getSecuritySettings,
  updateSecuritySettings,
  type SecuritySettingsResponse,
  type UpdateSecuritySettingsRequest,
} from '@/api/setting';

export function useSecuritySettings() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotificationStore();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const {
    data: settings,
    isLoading,
    refetch,
  } = useQuery<SecuritySettingsResponse>({
    queryKey: ['admin', 'settings', 'security'],
    queryFn: getSecuritySettings,
  });

  const updateMutation = useMutation({
    mutationFn: updateSecuritySettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'security'] });
      showSuccess(t('admin.settings.security.updateSuccess'));
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      showError(t('admin.settings.security.updateError'));
    },
  });

  const update = async (data: UpdateSecuritySettingsRequest) => {
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
