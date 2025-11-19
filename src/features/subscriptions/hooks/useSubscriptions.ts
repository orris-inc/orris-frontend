/**
 * 订阅管理 Hook（管理员功能）
 */

import { useState, useCallback } from 'react';
import { getSubscriptions, activateSubscription } from '../api/subscriptions-api';
import type { Subscription, SubscriptionListParams } from '../types/subscriptions.types';
import { useNotificationStore } from '@/shared/stores/notification-store';

export const useSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const { showSuccess, showError } = useNotificationStore();

  /**
   * 获取订阅列表
   */
  const fetchSubscriptions = useCallback(async (
    pageNum: number = page,
    size: number = pageSize,
    params?: Omit<SubscriptionListParams, 'page' | 'page_size'>
  ) => {
    setLoading(true);
    try {
      const response = await getSubscriptions({
        page: pageNum,
        page_size: size,
        ...params,
      });
      setSubscriptions(response.items);
      setTotal(response.total);
      setPage(pageNum);
      setPageSize(size);
    } catch (error) {
      console.error('获取订阅列表失败:', error);
      showError('获取订阅列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, showError]);

  /**
   * 激活订阅
   */
  const activate = useCallback(async (id: number) => {
    try {
      await activateSubscription(id);
      showSuccess('订阅已激活');
      // 刷新列表
      await fetchSubscriptions(page, pageSize);
      return true;
    } catch (error) {
      console.error('激活订阅失败:', error);
      showError('激活订阅失败');
      return false;
    }
  }, [page, pageSize, fetchSubscriptions, showSuccess, showError]);

  return {
    subscriptions,
    loading,
    total,
    page,
    pageSize,
    fetchSubscriptions,
    activate,
  };
};
