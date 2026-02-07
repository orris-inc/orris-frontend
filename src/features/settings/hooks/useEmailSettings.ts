/**
 * Email Settings Hook
 * Manages SMTP email configuration state and operations
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '@/shared/stores/notification-store';
import {
  getEmailSettings,
  updateEmailSettings,
  testEmailConnection,
  type EmailSettingsResponse,
  type UpdateEmailSettingsRequest,
  type EmailTestRequest,
  type EmailTestResponse,
} from '@/api/admin';

export function useEmailSettings() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotificationStore();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<EmailTestResponse | null>(null);

  const {
    data: settings,
    isLoading,
    refetch,
  } = useQuery<EmailSettingsResponse>({
    queryKey: ['admin', 'settings', 'email'],
    queryFn: getEmailSettings,
  });

  const updateMutation = useMutation({
    mutationFn: updateEmailSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'email'] });
      showSuccess(t('admin.settings.email.updateSuccess'));
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      showError(t('admin.settings.email.updateError'));
    },
  });

  const testMutation = useMutation({
    mutationFn: (data: EmailTestRequest) => testEmailConnection(data),
    onSuccess: (result) => {
      setTestResult(result);
      if (result.success) {
        showSuccess(t('admin.settings.email.testSuccess'));
      } else {
        showError(result.error || t('admin.settings.email.testFailed'));
      }
    },
    onError: (err: Error) => {
      setTestResult({ success: false, error: err.message });
      showError(t('admin.settings.email.testFailed'));
    },
  });

  const update = async (data: UpdateEmailSettingsRequest) => {
    await updateMutation.mutateAsync(data);
  };

  const test = async (recipientEmail: string) => {
    setTestResult(null);
    return testMutation.mutateAsync({ recipientEmail });
  };

  return {
    settings,
    isLoading,
    error,
    update,
    isUpdating: updateMutation.isPending,
    test,
    isTesting: testMutation.isPending,
    testResult,
    refetch,
  };
}
