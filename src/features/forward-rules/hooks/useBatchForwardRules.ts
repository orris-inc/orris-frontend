/**
 * useBatchForwardRules Hook
 * Batch operations for forward rules with selection state management
 * Supports both admin and user APIs
 */

import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { handleApiError } from '@/shared/lib/axios';
import { queryKeys } from '@/shared/lib/query-client';
import {
  // Admin APIs
  batchCreateForwardRules,
  batchDeleteForwardRules,
  batchToggleForwardRulesStatus,
  batchUpdateForwardRules,
  // User APIs
  batchCreateUserForwardRules,
  batchDeleteUserForwardRules,
  batchToggleUserForwardRulesStatus,
  batchUpdateUserForwardRules,
  // Types
  type BatchOperationResult,
  type BatchUpdateItem,
  type CreateForwardRuleRequest,
} from '@/api/forward';

const userForwardRulesQueryKeys = {
  all: ['userForwardRules'] as const,
  lists: () => [...userForwardRulesQueryKeys.all, 'list'] as const,
  usage: () => [...userForwardRulesQueryKeys.all, 'usage'] as const,
};

interface UseBatchForwardRulesOptions {
  /** Use admin APIs (default: false, uses user APIs) */
  isAdmin?: boolean;
}

/**
 * Hook for batch forward rule operations with selection state management
 *
 * Features:
 * - Selection state management (selectedIds, toggleSelect, toggleSelectAll, clearSelection)
 * - Select mode for mobile (enterSelectMode, exitSelectMode)
 * - Batch operations (delete, enable, disable, update)
 * - Automatic cache invalidation after operations
 *
 * @example
 * ```typescript
 * // Admin usage
 * const batch = useBatchForwardRules({ isAdmin: true });
 *
 * // User usage
 * const batch = useBatchForwardRules();
 *
 * // Select rules
 * batch.toggleSelect('fr_xxx');
 * batch.toggleSelectAll(['fr_xxx', 'fr_yyy', 'fr_zzz']);
 *
 * // Batch operations
 * const result = await batch.batchDelete();
 * const result = await batch.batchEnable();
 * const result = await batch.batchDisable();
 * const result = await batch.batchUpdate([
 *   { ruleId: 'fr_xxx', name: 'New Name' },
 *   { ruleId: 'fr_yyy', sortOrder: 100 }
 * ]);
 * ```
 */
export const useBatchForwardRules = (options: UseBatchForwardRulesOptions = {}) => {
  const { isAdmin = false } = options;
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();
  const { t } = useTranslation();

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Computed values
  const selectedCount = useMemo(() => selectedIds.size, [selectedIds]);
  const selectedIdsArray = useMemo(() => Array.from(selectedIds), [selectedIds]);

  // Selection actions
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback((allIds: string[]) => {
    setSelectedIds((prev) => {
      const allSelected = allIds.every((id) => prev.has(id));
      if (allSelected) {
        // Deselect all
        return new Set();
      } else {
        // Select all
        return new Set(allIds);
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const enterSelectMode = useCallback(() => {
    setIsSelectMode(true);
  }, []);

  const exitSelectMode = useCallback(() => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  // Helper to invalidate queries after batch operations
  const invalidateQueries = useCallback(() => {
    if (isAdmin) {
      queryClient.invalidateQueries({ queryKey: queryKeys.forwardRules.lists() });
    } else {
      queryClient.invalidateQueries({ queryKey: userForwardRulesQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userForwardRulesQueryKeys.usage() });
    }
  }, [queryClient, isAdmin]);

  // Helper to format batch result message
  const formatResultMessage = useCallback(
    (result: BatchOperationResult, operation: string): string => {
      const succeededCount = result.succeeded.length;
      const failedCount = result.failed?.length ?? 0;

      if (failedCount === 0) {
        return t('messages.batchOperationSuccess', { operation, count: succeededCount });
      } else if (succeededCount === 0) {
        return t('messages.batchOperationFailed', { operation, count: failedCount });
      } else {
        return t('messages.batchOperationPartial', { operation, succeeded: succeededCount, failed: failedCount });
      }
    },
    [t]
  );

  // Batch delete mutation
  const batchDeleteMutation = useMutation({
    mutationFn: async () => {
      if (selectedIds.size === 0) {
        throw new Error('No rules selected');
      }
      const ruleIds = Array.from(selectedIds);
      if (isAdmin) {
        return batchDeleteForwardRules({ ruleIds });
      } else {
        return batchDeleteUserForwardRules({ ruleIds });
      }
    },
    onSuccess: (result) => {
      const message = formatResultMessage(result, t('common.operations.delete'));
      if (result.failed?.length) {
        showError(message);
      } else {
        showSuccess(message);
      }
      clearSelection();
      invalidateQueries();
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Batch enable mutation
  const batchEnableMutation = useMutation({
    mutationFn: async () => {
      if (selectedIds.size === 0) {
        throw new Error('No rules selected');
      }
      const ruleIds = Array.from(selectedIds);
      if (isAdmin) {
        return batchToggleForwardRulesStatus({ ruleIds, status: 'enabled' });
      } else {
        return batchToggleUserForwardRulesStatus({ ruleIds, status: 'enabled' });
      }
    },
    onSuccess: (result) => {
      const message = formatResultMessage(result, t('common.operations.enable'));
      if (result.failed?.length) {
        showError(message);
      } else {
        showSuccess(message);
      }
      clearSelection();
      invalidateQueries();
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Batch disable mutation
  const batchDisableMutation = useMutation({
    mutationFn: async () => {
      if (selectedIds.size === 0) {
        throw new Error('No rules selected');
      }
      const ruleIds = Array.from(selectedIds);
      if (isAdmin) {
        return batchToggleForwardRulesStatus({ ruleIds, status: 'disabled' });
      } else {
        return batchToggleUserForwardRulesStatus({ ruleIds, status: 'disabled' });
      }
    },
    onSuccess: (result) => {
      const message = formatResultMessage(result, t('common.operations.disable'));
      if (result.failed?.length) {
        showError(message);
      } else {
        showSuccess(message);
      }
      clearSelection();
      invalidateQueries();
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Batch update mutation
  const batchUpdateMutation = useMutation({
    mutationFn: async (updates: BatchUpdateItem[]) => {
      if (updates.length === 0) {
        throw new Error('No updates provided');
      }
      if (isAdmin) {
        return batchUpdateForwardRules({ updates });
      } else {
        return batchUpdateUserForwardRules({ updates });
      }
    },
    onSuccess: (result) => {
      const message = formatResultMessage(result, t('common.operations.update'));
      if (result.failed?.length) {
        showError(message);
      } else {
        showSuccess(message);
      }
      invalidateQueries();
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  // Batch create mutation
  const batchCreateMutation = useMutation({
    mutationFn: async (rules: CreateForwardRuleRequest[]) => {
      if (rules.length === 0) {
        throw new Error('No rules provided');
      }
      if (rules.length > 100) {
        throw new Error('Maximum 100 rules per batch');
      }
      if (isAdmin) {
        return batchCreateForwardRules({ rules });
      } else {
        return batchCreateUserForwardRules({ rules });
      }
    },
    onSuccess: (result) => {
      const succeededCount = result.succeeded.length;
      const failedCount = result.failed?.length ?? 0;
      const operation = t('common.operations.create');
      let message: string;
      if (failedCount === 0) {
        message = t('messages.batchOperationSuccess', { operation, count: succeededCount });
      } else if (succeededCount === 0) {
        message = t('messages.batchOperationFailed', { operation, count: failedCount });
      } else {
        message = t('messages.batchOperationPartial', { operation, succeeded: succeededCount, failed: failedCount });
      }
      if (failedCount > 0) {
        showError(message);
      } else {
        showSuccess(message);
      }
      invalidateQueries();
    },
    onError: (error) => {
      showError(handleApiError(error));
    },
  });

  return {
    // Selection state
    selectedIds,
    selectedIdsArray,
    selectedCount,
    isSelectMode,

    // Selection actions
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    enterSelectMode,
    exitSelectMode,

    // Batch operations - return the result for dialog display
    batchCreate: (rules: CreateForwardRuleRequest[]) => batchCreateMutation.mutateAsync(rules),
    batchDelete: () => batchDeleteMutation.mutateAsync(),
    batchEnable: () => batchEnableMutation.mutateAsync(),
    batchDisable: () => batchDisableMutation.mutateAsync(),
    batchUpdate: (updates: BatchUpdateItem[]) => batchUpdateMutation.mutateAsync(updates),

    // Mutation states
    isCreating: batchCreateMutation.isPending,
    isDeleting: batchDeleteMutation.isPending,
    isEnabling: batchEnableMutation.isPending,
    isDisabling: batchDisableMutation.isPending,
    isUpdating: batchUpdateMutation.isPending,
    isProcessing:
      batchCreateMutation.isPending ||
      batchDeleteMutation.isPending ||
      batchEnableMutation.isPending ||
      batchDisableMutation.isPending ||
      batchUpdateMutation.isPending,

    // Last operation results (for result dialog)
    lastCreateResult: batchCreateMutation.data,
    lastDeleteResult: batchDeleteMutation.data,
    lastEnableResult: batchEnableMutation.data,
    lastDisableResult: batchDisableMutation.data,
    lastUpdateResult: batchUpdateMutation.data,
  };
};
