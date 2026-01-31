/**
 * Legal Settings Hook
 * Manages legal configuration (terms of service, privacy policy URLs)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  getLegalSettings,
  updateLegalSettings,
  type LegalSettingsResponse,
  type UpdateLegalSettingsRequest,
} from '@/api/setting';

export function useLegalSettings() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const {
    data: settings,
    isLoading,
    refetch,
  } = useQuery<LegalSettingsResponse>({
    queryKey: ['admin', 'settings', 'legal'],
    queryFn: getLegalSettings,
  });

  const updateMutation = useMutation({
    mutationFn: updateLegalSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'legal'] });
      toast.success(t('admin.settings.legal.updateSuccess'));
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(t('admin.settings.legal.updateError'));
    },
  });

  const update = async (data: UpdateLegalSettingsRequest) => {
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
