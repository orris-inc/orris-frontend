/**
 * 订阅管理 Hook（管理员功能）
 */

import { useState, useCallback } from 'react';
import { getSubscriptions, updateSubscriptionStatus } from '../api/subscriptions-api';
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
   * 更新订阅状态
   * @param id 订阅ID
   * @param status 新状态: active | cancelled | renewed
   * @param reason 取消原因（status为cancelled时必填）
   * @param immediate 是否立即生效（仅用于取消）
   */
  const changeStatus = useCallback(async (
    id: number,
    status: 'active' | 'cancelled' | 'renewed',
    reason?: string,
    immediate?: boolean
  ) => {
    try {
      await updateSubscriptionStatus(id, { status, reason, immediate });
      const messages = {
        active: '订阅已激活',
        cancelled: '订阅已取消',
        renewed: '订阅已续费',
      };
      showSuccess(messages[status]);
      // 刷新列表
      await fetchSubscriptions(page, pageSize);
      return true;
    } catch (error) {
      console.error('更新订阅状态失败:', error);
      showError('更新订阅状态失败');
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
    changeStatus,
  };
};
