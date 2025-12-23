import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { extractErrorMessage } from '@/shared/utils/error-messages';
import {
  getBindingStatus,
  unbindTelegram,
  updatePreferences,
  type BindingStatusResponse,
} from '@/api/telegram';

const TELEGRAM_BINDING_KEY = ['telegram', 'binding'];

/**
 * Check if error is a 404 (feature not configured on backend)
 */
const isNotFoundError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return error.response?.status === 404;
  }
  return false;
};

/**
 * Hook for managing Telegram binding state and operations
 */
export const useTelegramBinding = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  // Query: Get binding status
  const {
    data: bindingStatus,
    isLoading,
    error,
    refetch,
  } = useQuery<BindingStatusResponse>({
    queryKey: TELEGRAM_BINDING_KEY,
    queryFn: getBindingStatus,
    retry: (failureCount, error) => {
      // Don't retry on 404 (feature not configured)
      if (isNotFoundError(error)) return false;
      return failureCount < 3;
    },
  });

  // Check if Telegram feature is not configured on backend
  const isNotConfigured = isNotFoundError(error);

  // Mutation: Unbind
  const unbindMutation = useMutation({
    mutationFn: unbindTelegram,
    onSuccess: () => {
      showSuccess('已解除 Telegram 绑定');
      queryClient.invalidateQueries({ queryKey: TELEGRAM_BINDING_KEY });
    },
    onError: (error) => {
      showError(extractErrorMessage(error));
    },
  });

  // Mutation: Update preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: updatePreferences,
    onSuccess: () => {
      showSuccess('通知偏好已更新');
      queryClient.invalidateQueries({ queryKey: TELEGRAM_BINDING_KEY });
    },
    onError: (error) => {
      showError(extractErrorMessage(error));
    },
  });

  return {
    bindingStatus,
    isLoading,
    isNotConfigured,
    isBound: bindingStatus?.isBound ?? false,
    binding: bindingStatus?.binding,
    verifyCode: bindingStatus?.verifyCode,
    refetch,
    unbind: unbindMutation.mutateAsync,
    updatePreferences: updatePreferencesMutation.mutateAsync,
    isUnbinding: unbindMutation.isPending,
    isUpdating: updatePreferencesMutation.isPending,
  };
};
