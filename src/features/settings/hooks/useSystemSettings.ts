/**
 * System Settings Hook
 * Manages system configuration state and operations
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  getSystemSettings,
  updateSystemSettings,
  type SystemSettingsResponse,
  type UpdateSystemSettingsRequest,
} from '@/api/admin';

export function useSystemSettings() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const {
    data: settings,
    isLoading,
    refetch,
  } = useQuery<SystemSettingsResponse>({
    queryKey: ['admin', 'settings', 'system'],
    queryFn: getSystemSettings,
  });

  const updateMutation = useMutation({
    mutationFn: updateSystemSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'system'] });
      toast.success(t('admin.settings.system.updateSuccess'));
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(t('admin.settings.system.updateError'));
    },
  });

  const update = async (data: UpdateSystemSettingsRequest) => {
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
