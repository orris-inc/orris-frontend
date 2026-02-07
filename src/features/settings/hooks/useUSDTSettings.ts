/**
 * USDT Settings Hook
 * Manages USDT payment configuration state and operations
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '@/shared/stores/notification-store';
import {
  getUSDTSettings,
  updateUSDTSettings,
  type USDTSettingsResponse,
  type UpdateUSDTSettingsRequest,
} from '@/api/setting';

export function useUSDTSettings() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotificationStore();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const {
    data: settings,
    isLoading,
    refetch,
  } = useQuery<USDTSettingsResponse>({
    queryKey: ['admin', 'settings', 'usdt'],
    queryFn: getUSDTSettings,
  });

  const updateMutation = useMutation({
    mutationFn: updateUSDTSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'usdt'] });
      showSuccess(t('admin.settings.usdt.updateSuccess'));
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      showError(t('admin.settings.usdt.updateError'));
    },
  });

  const update = async (data: UpdateUSDTSettingsRequest) => {
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
