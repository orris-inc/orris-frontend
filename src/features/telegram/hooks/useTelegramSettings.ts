import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotificationStore } from "@/shared/stores/notification-store";
import { extractErrorMessage } from "@/shared/utils/error-messages";
import {
  getTelegramConfig,
  updateTelegramConfig,
  testTelegramConnection,
  type TelegramConfigResponse,
  type UpdateTelegramConfigRequest,
  type TelegramTestResult,
} from "@/api/admin";

const TELEGRAM_CONFIG_KEY = ["admin", "settings", "telegram", "config"];

/**
 * Hook for managing Telegram bot configuration
 */
export const useTelegramSettings = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  // Query: Get Telegram config
  const {
    data: config,
    isLoading,
    error,
    refetch,
  } = useQuery<TelegramConfigResponse>({
    queryKey: TELEGRAM_CONFIG_KEY,
    queryFn: getTelegramConfig,
  });

  // Mutation: Update config
  const updateMutation = useMutation({
    mutationFn: (data: UpdateTelegramConfigRequest) => updateTelegramConfig(data),
    onSuccess: () => {
      showSuccess("Telegram 配置已更新");
      queryClient.invalidateQueries({ queryKey: TELEGRAM_CONFIG_KEY });
    },
    onError: (err) => {
      showError(extractErrorMessage(err));
    },
  });

  // Mutation: Test connection
  const testMutation = useMutation({
    mutationFn: testTelegramConnection,
    onSuccess: (result: TelegramTestResult) => {
      if (result.success) {
        showSuccess(`连接成功！Bot: @${result.botUsername}`);
      } else {
        showError(result.error || "连接测试失败");
      }
    },
    onError: (err) => {
      showError(extractErrorMessage(err));
    },
  });

  return {
    config,
    isLoading,
    error,
    refetch,
    updateConfig: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    testConnection: testMutation.mutateAsync,
    isTesting: testMutation.isPending,
    testResult: testMutation.data,
  };
};
