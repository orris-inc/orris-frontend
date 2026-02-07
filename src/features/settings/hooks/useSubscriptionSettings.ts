/**
 * Subscription Settings Hook
 * Manages subscription display configuration state and operations
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '@/shared/stores/notification-store';
import {
  getSubscriptionSettings,
  updateSubscriptionSettings,
  type SubscriptionSettingsResponse,
  type UpdateSubscriptionSettingsRequest,
} from '@/api/setting';

export function useSubscriptionSettings() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotificationStore();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const {
    data: settings,
    isLoading,
    refetch,
  } = useQuery<SubscriptionSettingsResponse>({
    queryKey: ['admin', 'settings', 'subscription'],
    queryFn: getSubscriptionSettings,
  });

  const updateMutation = useMutation({
    mutationFn: updateSubscriptionSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'subscription'] });
      showSuccess(t('admin.settings.subscription.updateSuccess'));
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      showError(t('admin.settings.subscription.updateError'));
    },
  });

  const update = async (data: UpdateSubscriptionSettingsRequest) => {
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
