/**
 * Shared form hook for EditSubscription Dialog/Sheet
 * Manages form state for editing subscription dates and traffic limits
 */

import { useState, useCallback } from 'react';
import type { Subscription } from '@/api/subscription/types';

const BYTES_PER_GB = 1024 * 1024 * 1024;

/**
 * Convert bytes to GB string for display in input
 */
function bytesToGB(bytes: number): string {
  if (!bytes || bytes <= 0) return '';
  return (bytes / BYTES_PER_GB).toFixed(2);
}

/**
 * Convert GB string from input to bytes
 */
function gbToBytes(gb: string): number {
  const val = parseFloat(gb);
  if (isNaN(val) || val <= 0) return 0;
  return Math.round(val * BYTES_PER_GB);
}

/**
 * Format date string (ISO) to YYYY-MM-DD for date input
 */
function toDateInputValue(isoDate: string | undefined): string {
  if (!isoDate) return '';
  try {
    return new Date(isoDate).toISOString().split('T')[0];
  } catch {
    return '';
  }
}

interface UseEditSubscriptionFormParams {
  subscription: Subscription | null;
}

export const useEditSubscriptionForm = ({ subscription }: UseEditSubscriptionFormParams) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dataLimitGB, setDataLimitGB] = useState('');
  const [dataUsedGB, setDataUsedGB] = useState('');

  const initialize = useCallback((sub: Subscription) => {
    setStartDate(toDateInputValue(sub.startDate));
    setEndDate(toDateInputValue(sub.endDate));
    setDataLimitGB(sub.dataLimitBytes > 0 ? bytesToGB(sub.dataLimitBytes) : '');
    setDataUsedGB(bytesToGB(sub.dataUsedBytes));
  }, []);

  const reset = useCallback(() => {
    setStartDate('');
    setEndDate('');
    setDataLimitGB('');
    setDataUsedGB('');
  }, []);

  const validate = useCallback((): string | null => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return 'Start date must be before end date';
    }
    if (dataLimitGB && (isNaN(parseFloat(dataLimitGB)) || parseFloat(dataLimitGB) < 0)) {
      return 'Invalid data limit value';
    }
    if (dataUsedGB && (isNaN(parseFloat(dataUsedGB)) || parseFloat(dataUsedGB) < 0)) {
      return 'Invalid data used value';
    }
    return null;
  }, [startDate, endDate, dataLimitGB, dataUsedGB]);

  /**
   * Build the request payload, only including changed fields
   */
  const buildPayload = useCallback(() => {
    if (!subscription) return {};

    const payload: Record<string, unknown> = {};

    // Check if startDate changed
    const origStart = toDateInputValue(subscription.startDate);
    if (startDate && startDate !== origStart) {
      payload.startDate = new Date(startDate).toISOString();
    }

    // Check if endDate changed
    const origEnd = toDateInputValue(subscription.endDate);
    if (endDate && endDate !== origEnd) {
      payload.endDate = new Date(endDate).toISOString();
    }

    // Check if dataLimitBytes changed
    const origLimitGB = subscription.dataLimitBytes > 0 ? bytesToGB(subscription.dataLimitBytes) : '';
    if (dataLimitGB !== origLimitGB) {
      if (dataLimitGB === '' || dataLimitGB === '0') {
        // Clear override - use null to indicate "use plan default"
        payload.dataLimitBytes = null;
      } else {
        payload.dataLimitBytes = gbToBytes(dataLimitGB);
      }
    }

    // Check if dataUsedBytes changed
    const origUsedGB = bytesToGB(subscription.dataUsedBytes);
    if (dataUsedGB !== origUsedGB) {
      payload.dataUsedBytes = gbToBytes(dataUsedGB);
    }

    return payload;
  }, [subscription, startDate, endDate, dataLimitGB, dataUsedGB]);

  return {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    dataLimitGB,
    setDataLimitGB,
    dataUsedGB,
    setDataUsedGB,
    initialize,
    reset,
    validate,
    buildPayload,
  };
};
